-- Batch 4 de professores e vínculos — 09/07/2026
-- 14 professores novos + vínculos para disciplinas BES/CST/ELE-EXT.
-- Seguro: ON CONFLICT DO NOTHING em todos os INSERTs.
-- Professores já cadastrados (Fernando César, Jader, Rafael Bispo, etc.)
-- são encontrados via ILIKE — não precisam ser re-inseridos.

-- ── 1. Inserir professores novos ─────────────────────────────────────────────

INSERT INTO teachers (name, slug, active) VALUES
  ('Jorge Alberto Prado de Campos',           'jorge-alberto-prado-de-campos',          true),
  ('Adelito Tosta Inacio da Silva',            'adelito-tosta-inacio-da-silva',           true),
  ('Pedro Arthur de Melo Nascimento',          'pedro-arthur-de-melo-nascimento',         true),
  ('Ederaldo Muniz Barreto Junior',            'ederaldo-muniz-barreto-junior',           true),
  ('Sheila Tirony de Almeida Silva',           'sheila-tirony-de-almeida-silva',          true),
  ('Everton Pires dos Santos',                 'everton-pires-dos-santos',                true),
  ('Haroldo Claudio Sande de Oliveira Peon',  'haroldo-claudio-sande-de-oliveira-peon',  true),
  ('Maria Sampaio de Almeida',                'maria-sampaio-de-almeida',               true),
  ('Luana Ribeiro Pinto Araujo',              'luana-ribeiro-pinto-araujo',             true),
  ('Elisangela Conceicao Dantas Leao',        'elisangela-conceicao-dantas-leao',       true),
  ('Maria Gorete Borges Figueiredo',          'maria-gorete-borges-figueiredo',         true),
  ('Velda Gama Alves Torres',                 'velda-gama-alves-torres',                true),
  ('Janine Dias de Oliveira Melo',            'janine-dias-de-oliveira-melo',           true),
  ('Igor Goncalves da Silva',                 'igor-goncalves-da-silva',                true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Vínculos professor ↔ disciplina ──────────────────────────────────────
-- Busca por s.code quando o código é conhecido (mais preciso).
-- Busca por s.name ILIKE quando não há código (disciplinas sem código no CSV).
-- Professores já cadastrados com nome diferente são capturados via ILIKE.

INSERT INTO teacher_subjects (teacher_id, subject_id, active)
SELECT DISTINCT t.id, s.id, true
FROM teachers t
CROSS JOIN subjects s
WHERE s.active = true
AND (

  -- ── BES020 · Programação para Dispositivos Móveis ───────────────────────────
  (t.name ILIKE '%Jorge Alberto%'       AND s.code = 'BES020')
  OR (t.name ILIKE '%Dessa%'            AND s.code = 'BES020')
  OR (t.name ILIKE '%Adelito%'          AND s.code = 'BES020')

  -- ── BES024 · Gestão do Conhecimento ────────────────────────────────────────
  OR (t.name ILIKE '%Pedro Arthur%'     AND s.code = 'BES024')
  OR (t.name ILIKE '%Jader%'            AND s.code = 'BES024')
  OR (t.name ILIKE '%Ederaldo%'         AND s.code = 'BES024')

  -- ── BES027 · Banco de Dados II ─────────────────────────────────────────────
  -- Fernando Cezar Reis Borges = Fernando César (já cadastrado)
  OR (t.name ILIKE '%Fernando C%sar%'   AND s.code = 'BES027')
  OR (t.name ILIKE '%Adelito%'          AND s.code = 'BES027')
  OR (t.name ILIKE '%Jader%'            AND s.code = 'BES027')

  -- ── BES035 · Engenharia de Software Experimental ───────────────────────────
  OR (t.name ILIKE '%Sheila%'           AND s.code = 'BES035')

  -- ── BES036 · Evolução de Software ──────────────────────────────────────────
  OR (t.name ILIKE '%Jader%'            AND s.code = 'BES036')
  OR (t.name ILIKE '%Sheila%'           AND s.code = 'BES036')

  -- ── BES038 · Inteligência Artificial ───────────────────────────────────────
  OR (t.name ILIKE '%Rafael Bispo%'     AND s.code = 'BES038')

  -- ── BES040 · Processos de Negócio ──────────────────────────────────────────
  OR (t.name ILIKE '%Haroldo%'          AND s.code = 'BES040')
  OR (t.name ILIKE '%Lucas Almeida%'    AND s.code = 'BES040')

  -- ── BES042 · Projeto Final II ──────────────────────────────────────────────
  OR (t.name ILIKE '%Angela Peixoto%'   AND s.code = 'BES042')

  -- ── BES043 · Tópicos Avançados em Banco de Dados ───────────────────────────
  OR (t.name ILIKE '%Everton%'          AND s.code = 'BES043')

  -- ── BES044 · Tópicos Avançados em Programação ──────────────────────────────
  OR (t.name ILIKE '%Elton Figueiredo%' AND s.code = 'BES044')

  -- ── BES052 · Big Data e Analytics ──────────────────────────────────────────
  OR (t.name ILIKE '%Sheila%'           AND s.code = 'BES052')

  -- ── CST324 · Gerência de Projetos (ADS) ────────────────────────────────────
  OR (t.name ILIKE '%Maria Sampaio%'    AND s.code = 'CST324')

  -- ── CST325 · Processos de Negócio (ADS) ────────────────────────────────────
  OR (t.name ILIKE '%Haroldo%'          AND s.code = 'CST325')

  -- ── ELE-EXT002 · Tomada de Decisão ─────────────────────────────────────────
  OR (t.name ILIKE '%Luana%'            AND s.code = 'ELE-EXT002')

  -- ── ELE-EXT003 · Impactos do Ambiente Construído ───────────────────────────
  OR (t.name ILIKE '%Elisangela%'       AND s.code = 'ELE-EXT003')

  -- ── ELE-EXT004 · Inclusão e Acessibilidade ─────────────────────────────────
  OR (t.name ILIKE '%Maria Gorete%'     AND s.code = 'ELE-EXT004')

  -- ── ELE-EXT005 · Educomunicação ────────────────────────────────────────────
  OR (t.name ILIKE '%Velda%'            AND s.code = 'ELE-EXT005')

  -- ── ELE-EXT007 · Ciência, Natureza e Sociedade ─────────────────────────────
  OR (t.name ILIKE '%Janine%'           AND s.code = 'ELE-EXT007')

  -- ── ELE-EXT008 · Direito da Criança e do Adolescente ───────────────────────
  OR (t.name ILIKE '%Velda%'            AND s.code = 'ELE-EXT008')

  -- ── ELE-EXT010 · Tecnologias e Inteligências Artificiais ───────────────────
  OR (t.name ILIKE '%Igor Gon%'         AND s.code = 'ELE-EXT010')

  -- ── Sistemas Distribuídos (sem código — busca por nome) ────────────────────
  OR (t.name ILIKE '%Adelito%'          AND s.name ILIKE '%Sistemas Distribu%')

  -- ── Estrutura / Matemática Discreta e Lógica ───────────────────────────────
  -- João Luciano de Carvalho Gomes = João Luciano de Carvalho (já cadastrado)
  OR (t.name ILIKE '%João Luciano%'     AND s.name ILIKE '%Discreta%')

  -- ── Arquitetura de Software (Fernando — já linkado no batch 2) ─────────────
  OR (t.name ILIKE '%Fernando C%sar%'   AND s.name ILIKE '%Arquitetura de Software%')

  -- ── Questões Ambientais na Comunidade ──────────────────────────────────────
  OR (t.name ILIKE '%Janine%'           AND s.name ILIKE '%Quest%es Ambientais%')

)
ON CONFLICT DO NOTHING;

-- ── 3. Verificar resultado ───────────────────────────────────────────────────
/*
SELECT t.name AS professor, s.name AS disciplina, s.code AS codigo
FROM teacher_subjects ts
JOIN teachers t ON t.id = ts.teacher_id
JOIN subjects  s ON s.id = ts.subject_id
WHERE t.name ILIKE ANY(ARRAY[
  '%Jorge Alberto%', '%Adelito%', '%Pedro Arthur%', '%Ederaldo%',
  '%Sheila%', '%Everton%', '%Haroldo%', '%Maria Sampaio%',
  '%Luana%', '%Elisangela%', '%Maria Gorete%', '%Velda%',
  '%Janine%', '%Igor Gon%',
  -- e professores já existentes com novos vínculos:
  '%Fernando C%sar%', '%Jader%', '%Rafael Bispo%',
  '%Elton Figueiredo%', '%Angela Peixoto%', '%Lucas Almeida%', '%João Luciano%'
])
ORDER BY t.name, s.name;
*/
