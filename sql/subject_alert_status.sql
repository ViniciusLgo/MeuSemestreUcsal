-- Coluna de alerta para disciplinas sem professor
-- Execute no Supabase SQL Editor

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS alert_status TEXT
    CHECK (alert_status IN ('pendente', 'ignorado'))
    DEFAULT NULL;

COMMENT ON COLUMN subjects.alert_status IS
  'null = sem tratativa | pendente = precisa de professor | ignorado = admin descartou';
