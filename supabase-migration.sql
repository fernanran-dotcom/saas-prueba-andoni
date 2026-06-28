-- Migración: Añadir gestión de pagos y PDF a quotes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pendiente' CHECK (payment_status IN ('Pendiente', 'Parcial', 'Pagado'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Bucket para PDFs (crear manualmente en Storage > New Bucket > quote-pdfs)
-- Las políticas se gestionan desde la UI de Supabase Storage

-- Índice para búsquedas por estado de pago
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);
