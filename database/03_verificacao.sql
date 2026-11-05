-- =============================================================================
-- 03_verificacao.sql — Conferência da estrutura e dos dados
-- Rode cada bloco no SQL Editor do TiDB Cloud.
-- =============================================================================

USE vassouras_motos;

-- 1) Tabelas criadas
SELECT table_name, engine, table_collation
FROM information_schema.tables
WHERE table_schema = 'vassouras_motos'
ORDER BY table_name;

-- 2) Colunas e tipos por tabela
SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'vassouras_motos'
ORDER BY table_name, ordinal_position;

-- 3) Chaves primárias e estrangeiras
SELECT constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'vassouras_motos'
  AND (referenced_table_name IS NOT NULL OR constraint_name = 'PRIMARY')
ORDER BY table_name, constraint_name;

-- 4) Índices
SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS colunas
FROM information_schema.statistics
WHERE table_schema = 'vassouras_motos'
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- 5) Contagem de registros
SELECT 'store_config' AS tabela, COUNT(*) AS registros FROM store_config
UNION ALL SELECT 'brands', COUNT(*) FROM brands
UNION ALL SELECT 'admin_credential', COUNT(*) FROM admin_credential
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'vehicle_images', COUNT(*) FROM vehicle_images
UNION ALL SELECT 'vehicle_features', COUNT(*) FROM vehicle_features
UNION ALL SELECT 'leads', COUNT(*) FROM leads;

-- 6) Situação do estoque
SELECT status, COUNT(*) AS total
FROM vehicles
GROUP BY status;

-- 7) Veículos sem nenhuma foto (deveria ser zero em produção)
SELECT v.id, v.brand, v.model
FROM vehicles v
LEFT JOIN vehicle_images i ON i.vehicle_id = v.id
WHERE i.id IS NULL;

-- 8) Anúncios que aparecem na vitrine (disponíveis, em destaque primeiro)
SELECT id, brand, model, version, year_model, price, mileage, featured
FROM vehicles
WHERE status = 'available'
ORDER BY featured DESC, created_at DESC
LIMIT 20;

-- 9) Interessados aguardando atendimento
SELECT id, name, phone, vehicle_label, created_at
FROM leads
WHERE status = 'new'
ORDER BY created_at DESC;

-- 10) Configuração atual da loja
SELECT name, whatsapp, phone, city, state, opening_hours
FROM store_config
WHERE id = 1;