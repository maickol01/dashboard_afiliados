CREATE OR REPLACE FUNCTION delete_person_and_handle_children(
    p_person_id TEXT,
    p_role TEXT,
    p_action TEXT, -- 'reassign' or 'delete-all'
    p_new_parent_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_person_name TEXT;
BEGIN
    RAISE LOG 'Starting deletion for person_id: %, role: %, action: %', p_person_id, p_role, p_action;

    -- Step 1: Get the name of the person to be deleted
    IF p_role = 'lider' THEN
        SELECT nombre INTO v_person_name FROM public.lideres WHERE id = p_person_id;
    ELSIF p_role = 'brigadista' THEN
        SELECT nombre INTO v_person_name FROM public.brigadistas WHERE id = p_person_id;
    ELSIF p_role = 'movilizador' THEN
        SELECT nombre INTO v_person_name FROM public.movilizadores WHERE id = p_person_id;
    ELSIF p_role = 'ciudadano' THEN
        SELECT nombre INTO v_person_name FROM public.ciudadanos WHERE id = p_person_id;
    END IF;

    IF v_person_name IS NULL THEN
        RAISE EXCEPTION 'Person with ID % and role % not found in role table.', p_person_id, p_role;
    END IF;
    RAISE LOG 'Found person name: %', v_person_name;

    -- Find the user_id from the profiles table using a normalized name and role for robustness
    SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(v_person_name)) AND LOWER(TRIM(role)) = LOWER(TRIM(p_role));
    RAISE LOG 'Found user_id from profiles: %', v_user_id;

    -- Step 2: Handle descendants based on the action
    IF p_action = 'reassign' AND p_new_parent_id IS NOT NULL THEN
        RAISE LOG 'Reassigning descendants to new parent: %', p_new_parent_id;
        IF p_role = 'lider' THEN
            UPDATE public.brigadistas SET lider_id = p_new_parent_id WHERE lider_id = p_person_id;
        ELSIF p_role = 'brigadista' THEN
            UPDATE public.movilizadores SET brigadista_id = p_new_parent_id WHERE brigadista_id = p_person_id;
        END IF;
    ELSE -- 'delete-all'
        RAISE LOG 'Deleting all descendants.';
        IF p_role = 'lider' THEN
            DELETE FROM public.ciudadanos WHERE movilizador_id IN (SELECT id FROM public.movilizadores WHERE brigadista_id IN (SELECT id FROM public.brigadistas WHERE lider_id = p_person_id));
            DELETE FROM public.movilizadores WHERE brigadista_id IN (SELECT id FROM public.brigadistas WHERE lider_id = p_person_id);
            DELETE FROM public.brigadistas WHERE lider_id = p_person_id;
        ELSIF p_role = 'brigadista' THEN
            DELETE FROM public.ciudadanos WHERE movilizador_id IN (SELECT id FROM public.movilizadores WHERE brigadista_id = p_person_id);
            DELETE FROM public.movilizadores WHERE brigadista_id = p_person_id;
        END IF;
    END IF;
    RAISE LOG 'Descendant handling complete.';

    -- Step 3: Delete the person from their primary role table
    RAISE LOG 'Deleting from primary role table: %', p_role;
    IF p_role = 'lider' THEN
        DELETE FROM public.lideres WHERE id = p_person_id;
    ELSIF p_role = 'brigadista' THEN
        DELETE FROM public.brigadistas WHERE id = p_person_id;
    ELSIF p_role = 'movilizador' THEN
        DELETE FROM public.movilizadores WHERE id = p_person_id;
    ELSIF p_role = 'ciudadano' THEN
        DELETE FROM public.ciudadanos WHERE id = p_person_id;
    END IF;
    RAISE LOG 'Deletion from role table complete.';

    -- Step 4: Delete from profiles and auth.users if a user_id was found
    IF v_user_id IS NOT NULL THEN
        RAISE LOG 'Deleting from profiles and auth.users for user_id: %', v_user_id;
        -- Delete from profiles table
        DELETE FROM public.profiles WHERE id = v_user_id;
        
        -- Step 5: Delete from auth.users using the found user_id
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE LOG 'Deletion from profiles and auth.users complete.';
    ELSE
        RAISE WARNING 'Could not find a corresponding user in profiles/auth for person_id %, so only the role table record was deleted.', p_person_id;
    END IF;

    RAISE LOG 'Function finished successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;