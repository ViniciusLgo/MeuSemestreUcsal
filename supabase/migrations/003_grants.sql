-- Concede permissões de leitura pública (anon) e acesso completo ao usuário autenticado
-- Necessário para tabelas criadas via SQL Editor (o Dashboard faz isso automaticamente)

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Leitura pública: cursos, grades, disciplinas, professores, avaliações publicadas
GRANT SELECT ON
  courses,
  curriculum_versions,
  semesters,
  subjects,
  curriculum_subjects,
  teachers,
  teacher_subjects,
  reviews
TO anon;

-- Usuário autenticado: leitura em tudo + escrever onde o RLS permite
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON reviews, review_reports, profiles TO authenticated;
