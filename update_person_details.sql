-- Function to atomically update person details in both the primary table and the profiles table.
CREATE OR REPLACE FUNCTION update_person_details(person_id TEXT, person_role TEXT, new_data JSONB)
RETURNS VOID AS $$
DECLARE
  profile_uuid UUID;
  current_name TEXT;
BEGIN

  -- 1. Get the current name from the specific role table to find the corresponding profile.
  IF person_role = 'lider' THEN
    SELECT nombre INTO current_name FROM public.lideres WHERE id = person_id;
  ELSIF person_role = 'brigadista' THEN
    SELECT nombre INTO current_name FROM public.brigadistas WHERE id = person_id;
  ELSIF person_role = 'movilizador' THEN
    SELECT nombre INTO current_name FROM public.movilizadores WHERE id = person_id;
  ELSIF person_role = 'ciudadano' THEN
    SELECT nombre INTO current_name FROM public.ciudadanos WHERE id = person_id;
  ELSE
    RAISE EXCEPTION 'Invalid role specified: %', person_role;
  END IF;

  IF current_name IS NULL THEN
    RAISE EXCEPTION 'Person with ID % not found in role table %', person_id, person_role;
  END IF;

  -- 2. Find the unique profile UUID using the current name and role.
  SELECT id INTO profile_uuid FROM public.profiles 
  WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(current_name)) AND LOWER(TRIM(role)) = LOWER(TRIM(person_role));

  IF profile_uuid IS NULL THEN
    RAISE EXCEPTION 'Profile for % (%) not found. Data integrity issue.', current_name, person_role;
  END IF;

  -- 3. Update the specific role table.
  IF person_role = 'lider' THEN
    UPDATE public.lideres
    SET 
      nombre = new_data->>'nombre',
      clave_electoral = new_data->>'clave_electoral',
      curp = new_data->>'curp',
      direccion = new_data->>'direccion',
      colonia = new_data->>'colonia',
      seccion = new_data->>'seccion',
      municipio = new_data->>'municipio',
      entidad = new_data->>'entidad'
    WHERE id = person_id;
  ELSIF person_role = 'brigadista' THEN
    UPDATE public.brigadistas
    SET 
      nombre = new_data->>'nombre',
      clave_electoral = new_data->>'clave_electoral',
      curp = new_data->>'curp',
      direccion = new_data->>'direccion',
      colonia = new_data->>'colonia',
      seccion = new_data->>'seccion',
      municipio = new_data->>'municipio',
      entidad = new_data->>'entidad'
    WHERE id = person_id;
  ELSIF person_role = 'movilizador' THEN
    UPDATE public.movilizadores
    SET 
      nombre = new_data->>'nombre',
      clave_electoral = new_data->>'clave_electoral',
      curp = new_data->>'curp',
      direccion = new_data->>'direccion',
      colonia = new_data->>'colonia',
      seccion = new_data->>'seccion',
      municipio = new_data->>'municipio',
      entidad = new_data->>'entidad'
    WHERE id = person_id;
  ELSIF person_role = 'ciudadano' THEN
    UPDATE public.ciudadanos
    SET 
      nombre = new_data->>'nombre',
      clave_electoral = new_data->>'clave_electoral',
      curp = new_data->>'curp',
      direccion = new_data->>'direccion',
      colonia = new_data->>'colonia',
      seccion = new_data->>'seccion',
      municipio = new_data->>'municipio',
      entidad = new_data->>'entidad'
    WHERE id = person_id;
  END IF;

  -- 4. Update the profiles table.
  UPDATE public.profiles
  SET full_name = new_data->>'nombre'
  WHERE id = profile_uuid;

END;
$$ LANGUAGE plpgsql;