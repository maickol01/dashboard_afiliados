// Update this section in your 'crear-usuario' Edge Function:

    const { error: rpcError } = await supabaseAdmin.rpc('handle_new_user_registration', {
        user_id: newUser.id,
        user_role: userRole,
        full_name: metadata.full_name,
        phone_number: metadata.phone_number,
        clave_electoral: metadata.clave_electoral,
        curp: metadata.curp,
        direccion: metadata.direccion,
        colonia: metadata.colonia,
        codigo_postal: metadata.codigo_postal,
        seccion: metadata.seccion,
        entidad: metadata.entidad,
        municipio: metadata.municipio,
        superior_id: metadata.superior_id,
        lat: metadata.lat, // NEW: Pass latitude
        lng: metadata.lng  // NEW: Pass longitude
    });
