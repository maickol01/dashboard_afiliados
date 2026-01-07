-- 1. DROP TRIGGERS (If you haven't already via Dashboard)
-- Replace 'trigger_name' with the actual name if different.
-- DROP TRIGGER IF EXISTS geocode_lideres_trigger ON public.lideres;
-- DROP TRIGGER IF EXISTS geocode_brigadistas_trigger ON public.brigadistas;
-- DROP TRIGGER IF EXISTS geocode_movilizadores_trigger ON public.movilizadores;
-- DROP TRIGGER IF EXISTS geocode_ciudadanos_trigger ON public.ciudadanos;

-- 2. UPDATE RPC FUNCTION to accept and save lat/lng
CREATE OR REPLACE FUNCTION public.handle_new_user_registration(
      user_id uuid,
      user_role text,
      full_name text,
      phone_number text,
      clave_electoral text,
      curp text,
      direccion text,
      colonia text,
      codigo_postal text,
      seccion text,
      entidad text,
      municipio text,
      superior_id text,
      lat double precision DEFAULT NULL, -- NEW PARAMETER
      lng double precision DEFAULT NULL  -- NEW PARAMETER
  )
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
  DECLARE
    v_legacy_superior_id text;
    v_superior_phone_number text;
  BEGIN
    -- This function handles inserts and optionally saves geolocation from the app.

    IF user_role = 'CIUDADANO' THEN
      IF superior_id IS NOT NULL THEN
        SELECT p.phone_number INTO v_superior_phone_number FROM public.profiles p
        WHERE p.id = superior_id::uuid;
        SELECT m.id INTO v_legacy_superior_id FROM public.movilizadores m WHERE
        m.numero_cel = v_superior_phone_number;
      END IF;

      INSERT INTO public.ciudadanos (id, nombre, movilizador_id, clave_electoral,
        curp, direccion, colonia, codigo_postal, seccion, entidad, municipio,
        numero_cel, lat, lng, geocode_status) -- Added lat, lng, status
      VALUES (user_id::text, full_name, v_legacy_superior_id, clave_electoral,
        curp, direccion, colonia, codigo_postal, seccion, entidad, municipio,
        handle_new_user_registration.phone_number, lat, lng, 
        CASE WHEN lat IS NOT NULL THEN 'manual_app' ELSE 'pending' END);

    ELSE
      UPDATE public.profiles
      SET
        full_name = handle_new_user_registration.full_name,
        phone_number = handle_new_user_registration.phone_number,
        role = user_role,
        lider_id = CASE WHEN user_role = 'BRIGADISTA' THEN superior_id::uuid ELSE
        NULL END,
        brigadista_id = CASE WHEN user_role = 'MOVILIZADOR' THEN
        superior_id::uuid ELSE NULL END,
        updated_at = now()
      WHERE id = user_id;

      IF superior_id IS NOT NULL THEN
        SELECT p.phone_number INTO v_superior_phone_number FROM public.profiles p
        WHERE p.id = superior_id::uuid;

        IF user_role = 'BRIGADISTA' THEN
          SELECT l.id INTO v_legacy_superior_id FROM public.lideres l WHERE
          l.numero_cel = v_superior_phone_number;

        ELSIF user_role = 'MOVILIZADOR' THEN
          SELECT b.id INTO v_legacy_superior_id FROM public.brigadistas b WHERE
          b.numero_cel = v_superior_phone_number;
        END IF;
      END IF;

      IF user_role = 'LIDER' THEN
        INSERT INTO public.lideres (id, nombre, clave_electoral, curp, direccion,
        colonia, codigo_postal, seccion, entidad, municipio, numero_cel, lat, lng, geocode_status)
        VALUES (user_id::text, full_name, clave_electoral, curp, direccion,
        colonia, codigo_postal, seccion, entidad, municipio,
        handle_new_user_registration.phone_number, lat, lng,
        CASE WHEN lat IS NOT NULL THEN 'manual_app' ELSE 'pending' END);

      ELSIF user_role = 'BRIGADISTA' THEN
        INSERT INTO public.brigadistas (id, nombre, lider_id, clave_electoral,
        curp, direccion, colonia, codigo_postal, seccion, entidad, municipio, numero_cel, lat, lng, geocode_status)
        VALUES (user_id::text, full_name, v_legacy_superior_id, clave_electoral,
        curp, direccion, colonia, codigo_postal, seccion, entidad, municipio,
        handle_new_user_registration.phone_number, lat, lng,
        CASE WHEN lat IS NOT NULL THEN 'manual_app' ELSE 'pending' END);

      ELSIF user_role = 'MOVILIZADOR' THEN
        INSERT INTO public.movilizadores (id, nombre, brigadista_id,
        clave_electoral, curp, direccion, colonia, codigo_postal, seccion, entidad,
        municipio, numero_cel, lat, lng, geocode_status)
        VALUES (user_id::text, full_name, v_legacy_superior_id, clave_electoral,
        curp, direccion, colonia, codigo_postal, seccion, entidad, municipio,
        handle_new_user_registration.phone_number, lat, lng,
        CASE WHEN lat IS NOT NULL THEN 'manual_app' ELSE 'pending' END);
      END IF;
    END IF;
  END;
  $function$;
