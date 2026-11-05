-- =============================================================================
-- 01_schema.sql — Estrutura do banco (TiDB Cloud / MySQL 8+)
-- Projeto: plataforma de anúncios automotivos (Vassouras Motos)
--
-- Execução MANUAL no console do TiDB Cloud (SQL Editor).
-- Compatível com TiDB Serverless / Dedicated e MySQL 8.0+.
-- Nenhuma tabela é criada automaticamente pela aplicação.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS vassouras_motos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE vassouras_motos;

-- -----------------------------------------------------------------------------
-- Configurações da loja (registro único, id = 1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(120)  NOT NULL,
  tagline         VARCHAR(120)  NOT NULL DEFAULT '',
  logo_url        VARCHAR(500)  NOT NULL DEFAULT '',
  hero_image      VARCHAR(500)  NOT NULL DEFAULT '',
  store_image     VARCHAR(500)  NOT NULL DEFAULT '',
  whatsapp        VARCHAR(30)   NOT NULL DEFAULT '',
  phone           VARCHAR(30)   NOT NULL DEFAULT '',
  address         VARCHAR(200)  NOT NULL DEFAULT '',
  city            VARCHAR(80)   NOT NULL DEFAULT '',
  state           CHAR(2)       NOT NULL DEFAULT '',
  opening_hours   VARCHAR(300)  NOT NULL DEFAULT '',
  instagram       VARCHAR(200)  NOT NULL DEFAULT '',
  facebook        VARCHAR(300)  NOT NULL DEFAULT '',
  about_text      TEXT          NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Credencial administrativa compartilhada
-- Guarda apenas o HASH (PBKDF2-HMAC-SHA256) + salt. Nunca a senha em claro.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_credential (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  password_hash         CHAR(64)     NOT NULL,
  salt                  CHAR(32)     NOT NULL,
  iterations            INT UNSIGNED NOT NULL DEFAULT 100000,
  failed_attempts       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until          DATETIME     NULL,
  password_updated_at   DATETIME     NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Marcas (lista canônica usada nos filtros e no formulário)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)  NOT NULL,
  slug        VARCHAR(60)  NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_name (name),
  UNIQUE KEY uq_brands_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Veículos (anúncios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  brand             VARCHAR(60)    NOT NULL,
  model             VARCHAR(80)    NOT NULL,
  version           VARCHAR(120)   NOT NULL DEFAULT '',
  year_manufacture  SMALLINT       NULL,
  year_model        SMALLINT       NOT NULL,
  price             DECIMAL(12, 2) NOT NULL,
  mileage           INT UNSIGNED   NOT NULL DEFAULT 0,
  fuel              ENUM('Flex','Gasolina','Álcool','Diesel','Híbrido','Elétrico') NOT NULL DEFAULT 'Flex',
  transmission      ENUM('Manual','Automático','Automatizado','CVT')             NOT NULL DEFAULT 'Manual',
  color             VARCHAR(40)    NOT NULL DEFAULT '',
  category          ENUM('Seminovo','Novo','Consignado','Moto')                   NOT NULL DEFAULT 'Seminovo',
  body_type         ENUM('Hatch','Sedan','SUV','Picape','Utilitário','Moto','Outro') NOT NULL DEFAULT 'Hatch',
  doors             TINYINT UNSIGNED NULL,
  engine            VARCHAR(60)    NOT NULL DEFAULT '',
  power             VARCHAR(60)    NOT NULL DEFAULT '',
  description       TEXT           NULL,
  notes             TEXT           NULL,
  status            ENUM('available','paused','sold') NOT NULL DEFAULT 'available',
  featured          TINYINT(1)     NOT NULL DEFAULT 0,
  is_demo           TINYINT(1)     NOT NULL DEFAULT 0,
  views             INT UNSIGNED   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicles_status (status),
  KEY idx_vehicles_brand (brand),
  KEY idx_vehicles_body_type (body_type),
  KEY idx_vehicles_price (price),
  KEY idx_vehicles_year_model (year_model),
  KEY idx_vehicles_mileage (mileage),
  KEY idx_vehicles_featured (featured),
  KEY idx_vehicles_listing (status, created_at DESC),
  KEY idx_vehicles_search (brand, model, version),
  CONSTRAINT chk_vehicles_price CHECK (price >= 0),
  CONSTRAINT chk_vehicles_year CHECK (year_model BETWEEN 1900 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Fotografias dos veículos (galeria; position = 0 é a foto principal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_images (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id  INT UNSIGNED    NOT NULL,
  image_url   VARCHAR(500)    NOT NULL,
  position    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_main     TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_images_vehicle (vehicle_id, position),
  CONSTRAINT fk_images_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Opcionais e equipamentos
-- kind = 'feature' (opcionais) | 'equipment' (equipamentos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_features (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id  INT UNSIGNED    NOT NULL,
  kind        ENUM('feature','equipment') NOT NULL DEFAULT 'feature',
  label       VARCHAR(80)     NOT NULL,
  position    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_features_vehicle (vehicle_id, kind, position),
  CONSTRAINT fk_features_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Interessados (contatos recebidos pela vitrine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id     INT UNSIGNED    NULL,
  vehicle_label  VARCHAR(180)    NOT NULL DEFAULT '',
  name           VARCHAR(120)    NOT NULL,
  phone          VARCHAR(20)     NOT NULL,
  email          VARCHAR(160)    NOT NULL DEFAULT '',
  message        TEXT            NULL,
  status         ENUM('new','in_progress','done') NOT NULL DEFAULT 'new',
  internal_notes TEXT            NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_status (status),
  KEY idx_leads_created (created_at DESC),
  KEY idx_leads_vehicle (vehicle_id),
  CONSTRAINT fk_leads_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;