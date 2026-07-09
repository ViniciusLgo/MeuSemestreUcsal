-- Tabela de sugestões de professores enviadas por alunos
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS teacher_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  details       TEXT,
  suggested_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- RLS
ALTER TABLE teacher_suggestions ENABLE ROW LEVEL SECURITY;

-- Aluno pode inserir
CREATE POLICY "aluno pode sugerir professor"
  ON teacher_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (suggested_by = auth.uid());

-- Aluno pode ver suas próprias sugestões
CREATE POLICY "aluno ve suas sugestoes"
  ON teacher_suggestions FOR SELECT
  TO authenticated
  USING (suggested_by = auth.uid());

-- Admin pode fazer tudo (via service role — sem policy separada)
