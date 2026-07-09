-- Tabela para salvar a grade montada pelo aluno
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Minha grade',
  course_code TEXT NOT NULL,
  semesters   INTEGER[] NOT NULL,
  -- JSON com { subject_id, teacher_id, days[], slotId, numSlots }[]
  items       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS saved_grades_user_id_idx ON saved_grades(user_id);

-- RLS
ALTER TABLE saved_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_grade" ON saved_grades
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER saved_grades_updated_at
  BEFORE UPDATE ON saved_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
