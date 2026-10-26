-- =============================================================
-- banco.sql - API de Usuários do Teu Estoque
-- Cria o banco app_usuarios e a tabela usuarios com as
-- restrições necessárias (email e usuário únicos).
--
-- Como executar no Windows PowerShell:
--   psql -U postgres -f banco.sql
--
-- Observação: nenhuma senha de aplicativo é definida aqui.
-- As credenciais do banco e o JWT_SECRET ficam somente no
-- arquivo .env (que nunca sobe para o GitHub).
-- =============================================================

-- 1) Cria o banco de dados (comente esta linha se o banco já existir)
CREATE DATABASE app_usuarios;

-- 2) Conecta ao banco recém-criado
\c app_usuarios

-- 3) Cria a tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(100)  NOT NULL,
    sobrenome       VARCHAR(100)  NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    usuario         VARCHAR(50)   NOT NULL,
    senha           VARCHAR(255)  NOT NULL,  -- guarda apenas o hash gerado pelo bcryptjs
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    data_criacao    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuarios_email   UNIQUE (email),
    CONSTRAINT uk_usuarios_usuario UNIQUE (usuario)
);

-- 4) Índices para acelerar as buscas por email e usuário
CREATE INDEX IF NOT EXISTS idx_usuarios_email   ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios (usuario);

-- 5) Atualiza automaticamente a data de alteracao em cada UPDATE
CREATE OR REPLACE FUNCTION fn_usuarios_data_alteracao()
RETURNS TRIGGER AS $$ BEGIN
    NEW.data_alteracao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_data_alteracao ON usuarios;
CREATE TRIGGER trg_usuarios_data_alteracao
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_usuarios_data_alteracao();

-- 6) Produtos e saldo do estoque
CREATE TABLE IF NOT EXISTS produtos (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    quantidade      INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    data_criacao    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos (nome);