-- Migração: rating_general de 1-5 para 1-10
-- Execute no Supabase SQL Editor

-- 1. Remover constraint antiga
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_general_check;

-- 2. Escalar dados existentes (×2)
UPDATE reviews SET rating_general = rating_general * 2
WHERE rating_general BETWEEN 1 AND 5;

-- 3. Adicionar nova constraint
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_general_check
  CHECK (rating_general BETWEEN 1 AND 10);
