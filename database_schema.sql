-- SQL para métricas de análisis de pedidos
-- Ejecutar en el editor SQL de Supabase

-- 1. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  address TEXT
);

-- 2. Tabla de Detalles de Pedidos (Items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- 3. Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 4. Vistas para facilitar las consultas del Dashboard

-- Vista: Pedidos totales y Ticket promedio por negocio
CREATE OR REPLACE VIEW view_business_order_stats AS
SELECT 
  business_id,
  COUNT(id) as total_orders,
  COALESCE(AVG(total_amount), 0) as average_ticket
FROM orders
GROUP BY business_id;

-- Vista: Productos más vendidos por negocio
CREATE OR REPLACE VIEW view_best_selling_products AS
SELECT 
  o.business_id,
  oi.product_id,
  SUM(oi.quantity) as total_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
GROUP BY o.business_id, oi.product_id
ORDER BY total_sold DESC;
