-- Batch 3 de vínculos professor ↔ disciplina — 09/07/2026
-- Corrige lacunas identificadas na lista completa.
-- Seguro: ON CONFLICT DO NOTHING em todos os INSERTs.

-- ── 1. Inserir professores novos ─────────────────────────────────────────────

INSERT INTO teachers (name, slug, active) VALUES
  ('Jader Albuquerque', 'jader-albuquerque', true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Novos vínculos ────────────────────────────────────────────────────────

INSERT INTO teacher_subjects (teacher_id, subject_id, active)
SELECT DISTINCT t.id, s.id, true
FROM teachers t
CROSS JOIN subjects s
WHERE s.active = true
AND (

  -- ── Marcos Câmara — Tópicos Especiais em Engenharia de Software ─────────────
  (t.name ILIKE '%Câmara%'
    AND s.name ILIKE '%T%picos Especiais%Engenharia de Software%')

  -- ── Rafael Bispo — Inteligência Artificial ──────────────────────────────────
  OR (t.name ILIKE '%Rafael Bispo%'
    AND s.name ILIKE '%Intelig%ncia Artificial%')

  -- ── Elton Figueiredo — Tópicos Avançados em Programação ────────────────────
  OR (t.name ILIKE '%Elton Figueiredo%'
    AND s.name ILIKE '%T%picos Avan%ados%Programa%')

  -- ── Jader Albuquerque — Raciocínio Lógico ──────────────────────────────────
  OR (t.name ILIKE '%Jader%'
    AND s.name ILIKE '%Racioc%nio L%gico%')

)
ON CONFLICT DO NOTHING;

-- ── 3. Verificar vínculos criados ────────────────────────────────────────────
/*
SELECT
  t.name   AS professor,
  s.name   AS disciplina,
  s.code   AS codigo
FROM teacher_subjects ts
JOIN teachers t ON t.id = ts.teacher_id
JOIN subjects  s ON s.id = ts.subject_id
WHERE t.name ILIKE ANY(ARRAY[
  '%Câmara%', '%Rafael Bispo%', '%Elton Figueiredo%', '%Jader%'
])
ORDER BY t.name, s.name;
*/
