-- =============================================================================
-- 02_seed.sql — Dados iniciais (sem anúncios fictícios)
-- Execute depois de 01_schema.sql.
-- =============================================================================

USE vassouras_motos;

-- Configuração base da loja (id = 1). Ajuste pelos campos reais da loja.
INSERT INTO store_config (id, name, tagline, city, state, about_text)
VALUES (
  1,
  'Vassouras Motos',
  'Veículos selecionados',
  'Vassouras',
  'RJ',
  'Somos uma loja de veículos em Vassouras, RJ. Cada unidade do nosso estoque passa por conferência de documentação e revisão antes de ser anunciada.'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  tagline = VALUES(tagline),
  city = VALUES(city),
  state = VALUES(state);

-- Marcas usadas nos filtros e no formulário de cadastro
INSERT IGNORE INTO brands (name, slug) VALUES
  ('Chevrolet', 'chevrolet'),
  ('Fiat', 'fiat'),
  ('Ford', 'ford'),
  ('Honda', 'honda'),
  ('Hyundai', 'hyundai'),
  ('Jeep', 'jeep'),
  ('Nissan', 'nissan'),
  ('Renault', 'renault'),
  ('Toyota', 'toyota'),
  ('Volkswagen', 'volkswagen'),
  ('Yamaha', 'yamaha');

-- -----------------------------------------------------------------------------
-- Credencial administrativa
-- NÃO insira senha em texto. Gere o hash com o utilitário documentado no README
-- (seção "Senha do painel") ou defina a senha pelo próprio painel no primeiro
-- acesso, que grava o hash PBKDF2 nesta tabela.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Veículos
-- Intencionalmente vazio: nenhum anúncio fictício é inserido.
-- Cadastre os veículos reais pelo painel administrativo (/admin).
-- -----------------------------------------------------------------------------