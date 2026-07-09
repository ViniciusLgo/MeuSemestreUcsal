-- Migração: is_easy_to_pass boolean → text (3 opções)
-- Roda UMA vez no Supabase antes de fazer deploy do código atualizado.
-- Converte dados existentes: true → 'sim', false → 'nao', null → null

ALTER TABLE reviews
  ALTER COLUMN is_easy_to_pass TYPE text
  USING CASE
    WHEN is_easy_to_pass = true  THEN 'sim'
    WHEN is_easy_to_pass = false THEN 'nao'
    ELSE NULL
  END;

-- Opcional: adicionar constraint para garantir apenas valores válidos
ALTER TABLE reviews
  ADD CONSTRAINT reviews_is_easy_to_pass_check
  CHECK (is_easy_to_pass IN ('sim', 'mais_ou_menos', 'nao') OR is_easy_to_pass IS NULL);

-- Verificar resultado:
-- SELECT is_easy_to_pass, COUNT(*) FROM reviews GROUP BY is_easy_to_pass;
