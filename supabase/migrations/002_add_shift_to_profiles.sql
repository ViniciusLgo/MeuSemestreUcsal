-- Adiciona turno e versão de currículo ao perfil do aluno
-- Usado para pré-preencher o formulário de avaliação e filtrar reviews por turno

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS curriculum_version_id UUID REFERENCES curriculum_versions(id),
  ADD COLUMN IF NOT EXISTS shift TEXT CHECK (shift IN ('Matutino', 'Noturno'));
