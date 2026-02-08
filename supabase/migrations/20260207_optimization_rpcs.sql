-- ==========================================
-- OPTIMIZACIÓN DE ANALÍTICAS Y JERARQUÍA
-- Migración v14 (FINAL - JSON Maps & Date Filters)
-- Date: 2026-02-07
-- Description: Cambia retorno a JSON para evitar límite de filas, añade filtros de fecha a todo.
-- ==========================================

-- 1. Limpiar firmas anteriores
DROP FUNCTION IF EXISTS get_dashboard_summary();
DROP FUNCTION IF EXISTS get_dashboard_summary(text, text);
DROP FUNCTION IF EXISTS get_subordinates_with_metrics(uuid, text);
DROP FUNCTION IF EXISTS get_subordinates_with_metrics(text, text);
DROP FUNCTION IF EXISTS get_subordinates_with_metrics(text, text, text, text);
DROP FUNCTION IF EXISTS get_map_locations();
DROP FUNCTION IF EXISTS get_map_locations(text, text);

-- ------------------------------------------------------------------
-- FUNCIÓN A: get_dashboard_summary (v14)
-- Genera KPIs globales, tendencias y el top de líderes en una sola llamada.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_start_date text DEFAULT NULL, p_end_date text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_lideres INTEGER;
    total_brigadistas INTEGER;
    total_movilizadores INTEGER;
    total_ciudadanos INTEGER;
    daily_registrations json;
    section_data json;
    leader_performance json;
    v_start timestamptz := COALESCE(p_start_date::timestamptz, '-infinity');
    v_end timestamptz := COALESCE(p_end_date::timestamptz, 'infinity');
BEGIN
    SELECT COUNT(*) INTO total_lideres FROM lideres WHERE created_at BETWEEN v_start AND v_end;
    SELECT COUNT(*) INTO total_brigadistas FROM brigadistas WHERE created_at BETWEEN v_start AND v_end;
    SELECT COUNT(*) INTO total_movilizadores FROM movilizadores WHERE created_at BETWEEN v_start AND v_end;
    SELECT COUNT(*) INTO total_ciudadanos FROM ciudadanos WHERE created_at BETWEEN v_start AND v_end;

    SELECT json_agg(t) INTO daily_registrations FROM (
        SELECT to_char(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
        FROM ciudadanos WHERE created_at BETWEEN v_start AND v_end
        GROUP BY 1 ORDER BY 1 ASC
    ) t;

    SELECT json_agg(t) INTO section_data FROM (
        SELECT 
            seccion as "sectionNumber",
            COUNT(*) FILTER (WHERE role = 'lider') as lideres,
            COUNT(*) FILTER (WHERE role = 'brigadista') as brigadistas,
            COUNT(*) FILTER (WHERE role = 'movilizador') as movilizadores,
            COUNT(*) FILTER (WHERE role = 'ciudadano') as ciudadanos,
            COUNT(*) as "totalRegistrations"
        FROM (
            SELECT seccion, created_at, 'lider' as role FROM lideres
            UNION ALL SELECT seccion, created_at, 'brigadista' as role FROM brigadistas
            UNION ALL SELECT seccion, created_at, 'movilizador' as role FROM movilizadores
            UNION ALL SELECT seccion, created_at, 'ciudadano' as role FROM ciudadanos
        ) r
        WHERE seccion IS NOT NULL AND created_at BETWEEN v_start AND v_end
        GROUP BY seccion
    ) t;

    SELECT json_agg(t) INTO leader_performance FROM (
        SELECT 
            l.id, l.nombre as name, l.nombre, 'lider' as role, l.created_at,
            (SELECT COUNT(*) FROM brigadistas b WHERE b.lider_id = l.id) as "brigadierCount",
            (SELECT COUNT(*) FROM movilizadores m JOIN brigadistas b ON m.brigadista_id = b.id WHERE b.lider_id = l.id) as "mobilizerCount",
            (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id JOIN brigadistas b ON m.brigadista_id = b.id 
             WHERE b.lider_id = l.id AND c.created_at BETWEEN v_start AND v_end) as "citizenCount",
            (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id JOIN brigadistas b ON m.brigadista_id = b.id 
             WHERE b.lider_id = l.id AND c.created_at >= CURRENT_DATE) as "todayCount",
            (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id JOIN brigadistas b ON m.brigadista_id = b.id 
             WHERE b.lider_id = l.id AND c.created_at >= date_trunc('week', now())) as "weekCount",
            (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id JOIN brigadistas b ON m.brigadista_id = b.id 
             WHERE b.lider_id = l.id AND c.created_at >= date_trunc('month', now())) as "monthCount"
        FROM lideres l
        ORDER BY "citizenCount" DESC
    ) t;

    RETURN json_build_object(
        'totalLideres', COALESCE(total_lideres, 0),
        'totalBrigadistas', COALESCE(total_brigadistas, 0),
        'totalMobilizers', COALESCE(total_movilizadores, 0),
        'totalCitizens', COALESCE(total_ciudadanos, 0),
        'dailyRegistrations', COALESCE(daily_registrations, '[]'::json),
        'sectionData', COALESCE(section_data, '[]'::json),
        'leaderPerformance', COALESCE(leader_performance, '[]'::json),
        'goals', json_build_object('overallProgress', json_build_object('current', COALESCE(total_ciudadanos, 0), 'target', 60000, 'percentage', CASE WHEN COALESCE(total_ciudadanos, 0) > 0 THEN (total_ciudadanos::float / 60000.0) * 100 ELSE 0 END))
    );
END;
$$;

-- ------------------------------------------------------------------
-- FUNCIÓN B: get_subordinates_with_metrics (v14)
-- Obtiene subordinados con métricas filtradas.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_subordinates_with_metrics(p_parent_id text, p_parent_role text, p_start_date text DEFAULT NULL, p_end_date text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    v_start timestamptz := COALESCE(p_start_date::timestamptz, '-infinity');
    v_end timestamptz := COALESCE(p_end_date::timestamptz, 'infinity');
BEGIN
    IF p_parent_role = 'lider' THEN
        SELECT json_agg(t) INTO result FROM (
            SELECT 
                b.id, b.nombre, b.nombre as name, 'brigadista' as role, b.created_at, b.lider_id as "parentId",
                (SELECT COUNT(*) FROM movilizadores m WHERE m.brigadista_id = b.id) as "mobilizerCount",
                (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id WHERE m.brigadista_id = b.id AND c.created_at BETWEEN v_start AND v_end) as "citizenCount",
                (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id WHERE m.brigadista_id = b.id AND c.created_at >= CURRENT_DATE) as "todayCount",
                (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id WHERE m.brigadista_id = b.id AND c.created_at >= date_trunc('week', now())) as "weekCount",
                (SELECT COUNT(*) FROM ciudadanos c JOIN movilizadores m ON c.movilizador_id = m.id WHERE m.brigadista_id = b.id AND c.created_at >= date_trunc('month', now())) as "monthCount"
            FROM brigadistas b
            WHERE (p_parent_id IS NULL OR p_parent_id = '' OR b.lider_id = p_parent_id)
            ORDER BY "citizenCount" DESC LIMIT 500
        ) t;
    ELSIF p_parent_role = 'brigadista' THEN
        SELECT json_agg(t) INTO result FROM (
            SELECT 
                m.id, m.nombre, m.nombre as name, 'movilizador' as role, m.created_at, m.brigadista_id as "parentId",
                (SELECT COUNT(*) FROM ciudadanos c WHERE c.movilizador_id = m.id AND c.created_at BETWEEN v_start AND v_end) as "citizenCount",
                (SELECT COUNT(*) FROM ciudadanos c WHERE c.movilizador_id = m.id AND c.created_at >= CURRENT_DATE) as "todayCount",
                (SELECT COUNT(*) FROM ciudadanos c WHERE c.movilizador_id = m.id AND c.created_at >= date_trunc('week', now())) as "weekCount",
                (SELECT COUNT(*) FROM ciudadanos c WHERE c.movilizador_id = m.id AND c.created_at >= date_trunc('month', now())) as "monthCount"
            FROM movilizadores m
            WHERE (p_parent_id IS NULL OR p_parent_id = '' OR m.brigadista_id = p_parent_id)
            ORDER BY "citizenCount" DESC LIMIT 500
        ) t;
    ELSE
        SELECT json_agg(t) INTO result FROM (
            SELECT id, nombre, nombre as name, 'ciudadano' as role, created_at, movilizador_id as "parentId"
            FROM ciudadanos
            WHERE (p_parent_id IS NULL OR p_parent_id = '' OR movilizador_id = p_parent_id)
            AND created_at BETWEEN v_start AND v_end
            ORDER BY created_at DESC LIMIT 500
        ) t;
    END IF;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ------------------------------------------------------------------
-- FUNCIÓN C: get_map_locations (v14 - RETORNO JSON Y FILTRO)
-- Retorna un JSON único con todos los puntos para evitar paginación.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_map_locations(p_start_date text DEFAULT NULL, p_end_date text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    v_start timestamptz := COALESCE(p_start_date::timestamptz, '-infinity');
    v_end timestamptz := COALESCE(p_end_date::timestamptz, 'infinity');
BEGIN
    SELECT json_agg(t) INTO result FROM (
        SELECT id, nombre as name, nombre, 'lider' as role, lat, lng, seccion, NULL as "parentId", created_at, geocode_status
        FROM lideres WHERE lat IS NOT NULL AND created_at BETWEEN v_start AND v_end
        UNION ALL
        SELECT id, nombre as name, nombre, 'brigadista' as role, lat, lng, seccion, lider_id as "parentId", created_at, geocode_status
        FROM brigadistas WHERE lat IS NOT NULL AND created_at BETWEEN v_start AND v_end
        UNION ALL
        SELECT id, nombre as name, nombre, 'movilizador' as role, lat, lng, seccion, brigadista_id as "parentId", created_at, geocode_status
        FROM movilizadores WHERE lat IS NOT NULL AND created_at BETWEEN v_start AND v_end
        UNION ALL
        SELECT id, nombre as name, nombre, 'ciudadano' as role, lat, lng, seccion, movilizador_id as "parentId", created_at, geocode_status
        FROM ciudadanos WHERE lat IS NOT NULL AND created_at BETWEEN v_start AND v_end
    ) t;

    RETURN COALESCE(result, '[]'::json);
END;
$$;
