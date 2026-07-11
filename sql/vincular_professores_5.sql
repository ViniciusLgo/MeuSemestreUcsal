-- Batch 5 de professores e vínculos — 10/07/2026
-- 2 professores novos + vínculos para BES/ADS.
-- Seguro: ON CONFLICT DO NOTHING em todos os INSERTs.
-- Obs: "Artur Hemrique Kronbauer" (typo no banco) é o mesmo que
--      "Arthur Henrique Kronbauer" — capturado via ILIKE '%Kronbauer%'.

-- ── 1. Inserir professores novos ─────────────────────────────────────────────

INSERT INTO teachers (name, slug, active) VALUES
  ('Patrícia Dourado Lima de Almeida', 'patricia-dourado-lima-de-almeida', true),
  ('Christiane Soares',                'christiane-soares',                true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Vínculos professor ↔ disciplina ──────────────────────────────────────

INSERT INTO teacher_subjects (teacher_id, subject_id, active)
SELECT DISTINCT t.id, s.id, true
FROM teachers t
CROSS JOIN subjects s
WHERE s.active = true
AND (

  -- ── BES011 · Bancos de Dados I (Arthur Kronbauer) ─────────────────────────
  (t.name ILIKE '%Kronbauer%'         AND s.code = 'BES011')

  -- ── BES051 · Governança de Tecnologia da Informação (Fernando César) ───────
  OR (t.name ILIKE '%Fernando C%sar%' AND s.code = 'BES051')

  -- ── CST319 · Sistemas Operacionais/ADS (Pedro Arthur) ─────────────────────
  OR (t.name ILIKE '%Pedro Arthur%'   AND s.code = 'CST319')

  -- ── BES022 · Testes e Qualidade de Software/BES (Pedro Arthur) ────────────
  OR (t.name ILIKE '%Pedro Arthur%'   AND s.code = 'BES022')

  -- ── BES005 · Lógica de Programação e Algoritmos/BES (Patrícia Dourado) ─────
  OR (t.name ILIKE '%Patr%cia Dourado%' AND s.code = 'BES005')

  -- ── BES008 · Programação Orientada a Objetos/BES (Patrícia Dourado) ────────
  OR (t.name ILIKE '%Patr%cia Dourado%' AND s.code = 'BES008')

  -- ── BES005 · Lógica de Programação e Algoritmos/BES (Everton Pires) ────────
  OR (t.name ILIKE '%Everton%'        AND s.code = 'BES005')

  -- ── BES006 · Estrutura de Dados/BES (Jorge Alberto) ──────────────────────
  OR (t.name ILIKE '%Jorge Alberto%'  AND s.code = 'BES006')

  -- ── CST367 · Fundamentos de Sistemas de Informação/ADS (Christiane Soares)
  OR (t.name ILIKE '%Christiane Soares%' AND s.code = 'CST367')

  -- ── BES043 · Tópicos Avançados em Banco de Dados/BES (Andre Ricardo) ──────
  OR (t.name ILIKE '%Andre Ricardo%'  AND s.code = 'BES043')

)
ON CONFLICT DO NOTHING;

-- ── 3. Verificar resultado ───────────────────────────────────────────────────
/*
SELECT t.name AS professor, s.name AS disciplina, s.code AS codigo
FROM teacher_subjects ts
JOIN teachers t ON t.id = ts.teacher_id
JOIN subjects  s ON s.id = ts.subject_id
WHERE t.name ILIKE ANY(ARRAY[
  '%Kronbauer%',
  '%Fernando C%sar%',
  '%Pedro Arthur%',
  '%Patr%cia Dourado%',
  '%Everton%',
  '%Jorge Alberto%',
  '%Christiane Soares%',
  '%Andre Ricardo%'
])
ORDER BY t.name, s.name;
*/
