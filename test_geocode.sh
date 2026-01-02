#!/bin/bash

# Configuración
PROJECT_REF="qknogktmkyxytzrxqkfb"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbm9na3Rta3l4eXR6cnhxa2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDgwODEsImV4cCI6MjA1OTQyNDA4MX0.uL9vBysjOpd1QNsGYeHnIQAGcB5HUAg1YZeu0-MzKgE"
URL="https://${PROJECT_REF}.supabase.co/functions/v1/geocode-person"

echo "Prueba 1: Priorizando CP (Sin colonia explicita en query)"

# Usamos ID null para NO guardar en DB, solo probar
curl -i --location --request POST "$URL" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data '{ "table": "lideres", "record": { "id": null, "nombre_completo": "PRUEBA CP", "direccion": "Calle Nacozari 807", "colonia": "SOP", "municipio": "NAVOJOA", "entidad": "SON, 85890" } }'

echo -e "\n\nPrueba finalizada."