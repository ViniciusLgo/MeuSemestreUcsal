-- Batch 2 de professores — 09/07/2026
-- Inclui novos professores e novos vínculos para os que já existem.
-- Seguro: usa ON CONFLICT para não duplicar.

-- ── 1. Inserir professores que ainda não existem ─────────────────────────────
-- Professores já cadastrados serão ignorados (ON CONFLICT DO NOTHING).

INSERT INTO teachers (name, slug, active) VALUES
  ('João Luciano de Carvalho', 'joao-luciano-de-carvalho',  true),
  ('Cristiana Pereira Bispo',  'cristiana-pereira-bispo',   true),
  ('Osvaldo Requião',          'osvaldo-requiao',            true),
  ('Fernando César',           'fernando-cesar',             true),
  ('Rafael Bispo',             'rafael-bispo',               true),
  ('Cleber Brito',             'cleber-brito',               true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Criar vínculos professor ↔ disciplina ─────────────────────────────────
-- Usa t.name ILIKE para encontrar tanto professores novos quanto os já
-- cadastrados com nome mais completo (ex: "Câmara" → "Marco Antonio Chaves Câmara").
-- Usa s.name ILIKE para tolerar acentos e variações no nome da disciplina.

INSERT INTO teacher_subjects (teacher_id, subject_id, active)
SELECT DISTINCT t.id, s.id, true
FROM teachers t
CROSS JOIN subjects s
WHERE s.active = true
AND (

  -- ── Marcos Câmara (cadastrado como Marco Antonio Chaves Câmara) ─────────────
  (t.name ILIKE '%Câmara%'
    AND s.name ILIKE '%Redes de Computadores%')

  OR (t.name ILIKE '%Câmara%'
    AND s.name ILIKE '%Arquitetura%Computadores%')

  OR (t.name ILIKE '%Câmara%'
    AND s.name ILIKE '%Sistemas Operacionais%')

  -- ── Christiane / Christianne Dalforno ──────────────────────────────────────
  OR (t.name ILIKE '%Dalforno%'
    AND s.name ILIKE '%gica de Programa%')      -- Lógica de Programação e Algoritmos

  OR (t.name ILIKE '%Dalforno%'
    AND s.name ILIKE '%Programa%o Orientada a Objetos%'
    AND s.name NOT ILIKE '%Avan%')               -- POO básica (não POO avançada)

  OR (t.name ILIKE '%Dalforno%'
    AND s.name ILIKE '%Racioc%nio L%gico%')

  -- ── João Luciano de Carvalho ────────────────────────────────────────────────
  OR (t.name ILIKE '%João Luciano%'
    AND s.name ILIKE '%lculo I%'
    AND s.name NOT ILIKE '%lculo II%'
    AND s.name NOT ILIKE '%lculo III%')

  OR (t.name ILIKE '%João Luciano%'
    AND s.name ILIKE '%Matem%tica Discreta%')

  -- ── Odete (cadastrada como Odete Amanda Guerreiro Rodrigues Martinez) ───────
  OR (t.name ILIKE '%Odete%'
    AND s.name ILIKE '%lculo I%'
    AND s.name NOT ILIKE '%lculo II%'
    AND s.name NOT ILIKE '%lculo III%')

  -- ── Lucas Almeida de Souza (já existe) ─────────────────────────────────────
  OR (t.name ILIKE '%Lucas Almeida%'
    AND s.name ILIKE '%Redes de Computadores%')

  OR (t.name ILIKE '%Lucas Almeida%'
    AND s.name ILIKE '%Seguran%a%Auditoria%')

  -- ── Cristiana Pereira Bispo ─────────────────────────────────────────────────
  OR (t.name ILIKE '%Cristiana Pereira%'
    AND s.name ILIKE '%Programa%o Front%')

  OR (t.name ILIKE '%Cristiana Pereira%'
    AND s.name ILIKE '%Engenharia de Requisitos%')

  OR (t.name ILIKE '%Cristiana Pereira%'
    AND s.name ILIKE '%gica de Programa%')       -- LPA (às vezes)

  -- ── Osvaldo Requião ─────────────────────────────────────────────────────────
  OR (t.name ILIKE '%Requião%'
    AND s.name ILIKE '%Compiladores%')

  OR (t.name ILIKE '%Requião%'
    AND s.name ILIKE '%Racioc%nio L%gico%')

  -- ── Fernando César ──────────────────────────────────────────────────────────
  OR (t.name ILIKE '%Fernando C%sar%'
    AND s.name ILIKE '%Bancos de Dados I%'
    AND s.name NOT ILIKE '%Bancos de Dados II%')

  OR (t.name ILIKE '%Fernando C%sar%'
    AND s.name ILIKE '%Bancos de Dados II%')

  OR (t.name ILIKE '%Fernando C%sar%'
    AND s.name ILIKE '%Governan%a%TI%')

  OR (t.name ILIKE '%Fernando C%sar%'
    AND s.name ILIKE '%Arquitetura de Software%')

  -- ── Rafael Bispo ────────────────────────────────────────────────────────────
  OR (t.name ILIKE '%Rafael Bispo%'
    AND s.name ILIKE '%Processos de Software%')

  -- ── Elton Figueiredo (já existe como Elton Figueiredo da Silva) ────────────
  OR (t.name ILIKE '%Elton Figueiredo%'
    AND s.name ILIKE '%Introdu%o%Engenharia%')

  OR (t.name ILIKE '%Elton Figueiredo%'
    AND s.name ILIKE '%Processos de Software%')

  -- ── Marcos Dessa (já existe como Marcos Dessa de Oliveira) ─────────────────
  OR (t.name ILIKE '%Dessa%'
    AND s.name ILIKE '%Programa%o Front%')

  OR (t.name ILIKE '%Dessa%'
    AND s.name ILIKE '%Dispositivos M%veis%')

  -- ── Cleber Brito ────────────────────────────────────────────────────────────
  OR (t.name ILIKE '%Cleber%'
    AND s.name ILIKE '%Seguran%a%Auditoria%')

  OR (t.name ILIKE '%Cleber%'
    AND s.name ILIKE '%Redes de Computadores%')

)
ON CONFLICT DO NOTHING;

-- ── 3. Verificar vínculos criados ────────────────────────────────────────────
-- Cole abaixo para confirmar o resultado:

/*
SELECT
  t.name   AS professor,
  s.name   AS disciplina,
  s.code   AS codigo
FROM teacher_subjects ts
JOIN teachers t ON t.id = ts.teacher_id
JOIN subjects  s ON s.id = ts.subject_id
WHERE t.name ILIKE ANY(ARRAY[
  '%Câmara%', '%Dalforno%', '%João Luciano%', '%Odete%',
  '%Lucas Almeida%', '%Cristiana Pereira%', '%Requião%',
  '%Fernando C%sar%', '%Rafael Bispo%', '%Elton Figueiredo%',
  '%Dessa%', '%Cleber%'
])
ORDER BY t.name, s.name;
*/
