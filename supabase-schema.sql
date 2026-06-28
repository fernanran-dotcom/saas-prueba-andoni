-- ============================================
-- Esquema SQL para ERP Micro-SaaS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  email TEXT
);

-- 2. Tabla de presupuestos (con gestión de pagos y PDF)
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Borrador', 'Enviado', 'Aceptado', 'Rechazado')),
  payment_status TEXT DEFAULT 'Pendiente' CHECK (payment_status IN ('Pendiente', 'Parcial', 'Pagado')),
  paid_amount NUMERIC(10,2),
  file_url TEXT,
  file_name TEXT
);

-- 3. Tabla de facturas
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  due_date DATE NOT NULL,
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendiente de cobro', 'Cobrada'))
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
CREATE POLICY "Usuarios pueden ver sus propios clientes"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios clientes"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios clientes"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios clientes"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para quotes
CREATE POLICY "Usuarios pueden ver sus propios presupuestos"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios presupuestos"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios presupuestos"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios presupuestos"
  ON quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para invoices
CREATE POLICY "Usuarios pueden ver sus propias facturas"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias facturas"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias facturas"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias facturas"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Índices para mejorar rendimiento
-- ============================================
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_quotes_payment_status ON quotes(payment_status);
