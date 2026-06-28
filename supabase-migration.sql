-- Migración: Añadir gestión de pagos y PDF a quotes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pendiente' CHECK (payment_status IN ('Pendiente', 'Parcial', 'Pagado'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Bucket para PDFs (crear en Supabase Dashboard > Storage > New Bucket > quote-pdfs > Public)
-- O ejecutar en SQL Editor (requiere service_role):
-- select storage.create_bucket('quote-pdfs', jsonb_build_object('public', true));
-- Luego crear política de acceso público:
-- create policy "Public Access" on storage.objects for all using (bucket_id = 'quote-pdfs') with check (bucket_id = 'quote-pdfs');

-- Índice para búsquedas por estado de pago
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);
