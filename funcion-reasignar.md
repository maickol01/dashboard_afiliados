```sql
-- Elimina cualquier función anterior para evitar conflictos
DROP FUNCTION IF EXISTS public.reasignar_brigadista(text, text);
DROP FUNCTION IF EXISTS public.reasignar_movilizador(text, text);

-- Función DEFINITIVA que usa NOMBRE y ROL como enlace para Brigadistas
CREATE OR REPLACE FUNCTION public.reasignar_brigadista(brigadista_id_in TEXT, nuevo_lider_id_in TEXT)
RETURNS VOID AS $$
DECLARE
  brigadista_profile_uuid UUID;
  nuevo_lider_profile_uuid UUID;
  brigadista_nombre TEXT;
  nuevo_lider_nombre TEXT;
BEGIN
  -- 1. Obtener los NOMBRES
  SELECT nombre INTO brigadista_nombre FROM public.brigadistas WHERE id = brigadista_id_in;
  SELECT nombre INTO nuevo_lider_nombre FROM public.lideres WHERE id = nuevo_lider_id_in;

  IF brigadista_nombre IS NULL OR nuevo_lider_nombre IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el nombre para el brigadista o el nuevo líder.';
  END IF;

  -- 2. Usar NOMBRE y ROL para encontrar los UUIDs únicos en PROFILES
  SELECT id INTO brigadista_profile_uuid FROM public.profiles WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(brigadista_nombre)) AND LOWER(TRIM(role)) = 'brigadista';
  SELECT id INTO nuevo_lider_profile_uuid FROM public.profiles WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(nuevo_lider_nombre)) AND LOWER(TRIM(role)) = 'lider';

  -- 3. VERIFICAR que ambos perfiles se encontraron
  IF brigadista_profile_uuid IS NULL THEN
    RAISE EXCEPTION 'Error de integridad: El brigadista "%" no tiene un perfil con el rol "brigadista".', brigadista_nombre;
  END IF;
  IF nuevo_lider_profile_uuid IS NULL THEN
    RAISE EXCEPTION 'Error de integridad: El nuevo líder "%" no tiene un perfil con el rol "lider".', nuevo_lider_nombre;
  END IF;

  -- 4. Proceder con las actualizaciones
  UPDATE public.brigadistas SET lider_id = nuevo_lider_id_in WHERE id = brigadista_id_in;
  UPDATE public.profiles SET lider_id = nuevo_lider_profile_uuid WHERE id = brigadista_profile_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función DEFINITIVA que usa NOMBRE y ROL como enlace para Movilizadores
CREATE OR REPLACE FUNCTION public.reasignar_movilizador(movilizador_id_in TEXT, nuevo_brigadista_id_in TEXT)
RETURNS VOID AS $$
DECLARE
  movilizador_profile_uuid UUID;
  nuevo_brigadista_profile_uuid UUID;
  movilizador_nombre TEXT;
  nuevo_brigadista_nombre TEXT;
BEGIN
  -- 1. Obtener los NOMBRES
  SELECT nombre INTO movilizador_nombre FROM public.movilizadores WHERE id = movilizador_id_in;
  SELECT nombre INTO nuevo_brigadista_nombre FROM public.brigadistas WHERE id = nuevo_brigadista_id_in;

  IF movilizador_nombre IS NULL OR nuevo_brigadista_nombre IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el nombre para el movilizador o el nuevo brigadista.';
  END IF;

  -- 2. Usar NOMBRE y ROL para encontrar los UUIDs únicos en PROFILES
  SELECT id INTO movilizador_profile_uuid FROM public.profiles WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(movilizador_nombre)) AND LOWER(TRIM(role)) = 'movilizador';
  SELECT id INTO nuevo_brigadista_profile_uuid FROM public.profiles WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(nuevo_brigadista_nombre)) AND LOWER(TRIM(role)) = 'brigadista';

  -- 3. VERIFICAR que ambos perfiles se encontraron
  IF movilizador_profile_uuid IS NULL THEN
    RAISE EXCEPTION 'Error de integridad: El movilizador "%" no tiene un perfil con el rol "movilizador".', movilizador_nombre;
  END IF;
  IF nuevo_brigadista_profile_uuid IS NULL THEN
    RAISE EXCEPTION 'Error de integridad: El nuevo brigadista "%" no tiene un perfil con el rol "brigadista".', nuevo_brigadista_nombre;
  END IF;

  -- 4. Proceder con las actualizaciones
  UPDATE public.movilizadores SET brigadista_id = nuevo_brigadista_id_in WHERE id = movilizador_id_in;
  UPDATE public.profiles SET brigadista_id = nuevo_brigadista_profile_uuid WHERE id = movilizador_profile_uuid;
END;
$$ LANGUAGE plpgsql;
```