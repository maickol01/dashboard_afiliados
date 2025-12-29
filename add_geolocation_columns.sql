-- Add geospatial columns to lideres
ALTER TABLE public.lideres ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.lideres ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.lideres ADD COLUMN IF NOT EXISTS geocode_status text DEFAULT 'pending';
ALTER TABLE public.lideres ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;

-- Add geospatial columns to brigadistas
ALTER TABLE public.brigadistas ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.brigadistas ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.brigadistas ADD COLUMN IF NOT EXISTS geocode_status text DEFAULT 'pending';
ALTER TABLE public.brigadistas ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;

-- Add geospatial columns to movilizadores
ALTER TABLE public.movilizadores ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.movilizadores ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.movilizadores ADD COLUMN IF NOT EXISTS geocode_status text DEFAULT 'pending';
ALTER TABLE public.movilizadores ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;

-- Add geospatial columns to ciudadanos
ALTER TABLE public.ciudadanos ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.ciudadanos ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.ciudadanos ADD COLUMN IF NOT EXISTS geocode_status text DEFAULT 'pending';
ALTER TABLE public.ciudadanos ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;
