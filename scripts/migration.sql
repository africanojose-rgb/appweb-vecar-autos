-- ============================================================
-- Esquema inicial: Supabase PostgreSQL
-- Proyecto: Vecar Autos - Panel de Control
-- Ejecutar esto en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla principal: vehiculos
DROP TABLE IF EXISTS public.vehiculos CASCADE;

CREATE TABLE public.vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marca TEXT NOT NULL,
  linea TEXT NOT NULL,
  version TEXT DEFAULT '',
  placa TEXT NOT NULL,
  anio INTEGER NOT NULL CHECK (anio >= 1900 AND anio <= 2100),
  cilindraje TEXT DEFAULT '0',
  color TEXT DEFAULT 'N/A',
  transmision TEXT DEFAULT 'AT' CHECK (transmision IN ('AT', 'MC')),
  kilometraje INTEGER DEFAULT 0,
  matricula_ciudad TEXT DEFAULT 'Bogota',
  precio_compra BIGINT DEFAULT 0,
  precio_venta BIGINT NOT NULL CHECK (precio_venta > 0),
  ubicacion TEXT DEFAULT '129',
  soat_vence TEXT DEFAULT '',
  rtm_vence TEXT DEFAULT '',
  reporte BOOLEAN DEFAULT FALSE,
  prenda BOOLEAN DEFAULT FALSE,
  estado TEXT DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'VIRTUAL', 'SEPARADO', 'ALISTAMIENTO', 'VENDIDO')),
  visible_web BOOLEAN DEFAULT TRUE,
  descripcion TEXT DEFAULT '',
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_by_email TEXT,
  last_modified_by UUID REFERENCES auth.users(id)
);

-- 3. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_vehiculos_marca ON public.vehiculos(marca);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON public.vehiculos(placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON public.vehiculos(estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_anio ON public.vehiculos(anio);
CREATE INDEX IF NOT EXISTS idx_vehiculos_precio_venta ON public.vehiculos(precio_venta);
CREATE INDEX IF NOT EXISTS idx_vehiculos_created_at ON public.vehiculos(created_at DESC);

-- 4. Habilitar Realtime (necesario para suscripciones en vivo)
-- NOTA: También debes ir a Database > Replication y habilitar la replicación
-- para la tabla public.vehiculos manualmente en el dashboard.
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos;

-- 5. Row Level Security
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
DROP POLICY IF EXISTS "Lectura: autenticados o visible_web" ON public.vehiculos;
CREATE POLICY "Lectura: autenticados o visible_web" ON public.vehiculos
  FOR SELECT
  USING (auth.role() = 'authenticated' OR visible_web = true);

DROP POLICY IF EXISTS "Insercion: solo autenticados" ON public.vehiculos;
CREATE POLICY "Insercion: solo autenticados" ON public.vehiculos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Actualizacion: solo autenticados" ON public.vehiculos;
CREATE POLICY "Actualizacion: solo autenticados" ON public.vehiculos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Eliminacion: solo autenticados" ON public.vehiculos;
CREATE POLICY "Eliminacion: solo autenticados" ON public.vehiculos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 7. Políticas para Storage (ejecutar en SQL Editor también)
-- Bucket: vehiculos (crear manualmente en Storage > New Bucket)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica storage" ON storage.objects;
CREATE POLICY "Lectura publica storage" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehiculos');

DROP POLICY IF EXISTS "Subida autenticada storage" ON storage.objects;
CREATE POLICY "Subida autenticada storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehiculos');

DROP POLICY IF EXISTS "Eliminacion autenticada storage" ON storage.objects;
CREATE POLICY "Eliminacion autenticada storage" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'vehiculos' AND auth.role() = 'authenticated');

-- 8. Función para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehiculos_updated_at ON public.vehiculos;
CREATE TRIGGER trg_vehiculos_updated_at
  BEFORE UPDATE ON public.vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. Verificación
SELECT 'Migracion completada exitosamente' AS resultado;
SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehiculos';
