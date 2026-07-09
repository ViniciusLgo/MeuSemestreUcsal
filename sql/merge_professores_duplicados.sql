-- Merge de professores duplicados — 09/07/2026
-- Estratégia: mantém o com nome completo, migra avaliações e disciplinas, deleta o duplicado.
-- Cada bloco é independente: verifica IDs antes de agir, seguro de rodar mais de uma vez.

-- ═══════════════════════════════════════════════════════════════════════════════
-- MERGE 1: "Angela" → "Angela Peixoto Santana"
-- Sem avaliações nos dois — só disciplinas
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM teachers WHERE name = 'Angela Peixoto Santana' LIMIT 1;
  SELECT id INTO drop_id FROM teachers WHERE name = 'Angela' LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'SKIP Angela: keep=%, drop=%', keep_id, drop_id;
    RETURN;
  END IF;

  -- Transfere disciplinas (ignora duplicatas)
  INSERT INTO teacher_subjects (teacher_id, subject_id, active)
  SELECT keep_id, subject_id, true
  FROM teacher_subjects WHERE teacher_id = drop_id
  ON CONFLICT DO NOTHING;

  -- Transfere avaliações (precaução)
  UPDATE reviews SET teacher_id = keep_id WHERE teacher_id = drop_id;

  -- Remove vínculos do duplicado e deleta
  DELETE FROM teacher_subjects WHERE teacher_id = drop_id;
  DELETE FROM teachers WHERE id = drop_id;

  RAISE NOTICE '✅ Merge: Angela → Angela Peixoto Santana';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MERGE 2: "Joao Luciano" → "João Luciano de Carvalho"
-- "Joao Luciano" tem 3 avaliações (★5.3) — migra para o com nome correto
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM teachers WHERE name = 'João Luciano de Carvalho' LIMIT 1;
  SELECT id INTO drop_id FROM teachers WHERE name = 'Joao Luciano' LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'SKIP João Luciano: keep=%, drop=%', keep_id, drop_id;
    RETURN;
  END IF;

  INSERT INTO teacher_subjects (teacher_id, subject_id, active)
  SELECT keep_id, subject_id, true
  FROM teacher_subjects WHERE teacher_id = drop_id
  ON CONFLICT DO NOTHING;

  UPDATE reviews SET teacher_id = keep_id WHERE teacher_id = drop_id;

  DELETE FROM teacher_subjects WHERE teacher_id = drop_id;
  DELETE FROM teachers WHERE id = drop_id;

  RAISE NOTICE '✅ Merge: Joao Luciano → João Luciano de Carvalho (avaliações migradas)';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MERGE 3: "Marco Camara" → "Marco Antonio Chaves Câmara"
-- "Marco Camara" tem 3 avaliações (★5.0) — migra para o com nome completo
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM teachers WHERE name = 'Marco Antonio Chaves Câmara' LIMIT 1;
  SELECT id INTO drop_id FROM teachers WHERE name = 'Marco Camara' LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'SKIP Marco Câmara: keep=%, drop=%', keep_id, drop_id;
    RETURN;
  END IF;

  INSERT INTO teacher_subjects (teacher_id, subject_id, active)
  SELECT keep_id, subject_id, true
  FROM teacher_subjects WHERE teacher_id = drop_id
  ON CONFLICT DO NOTHING;

  UPDATE reviews SET teacher_id = keep_id WHERE teacher_id = drop_id;

  DELETE FROM teacher_subjects WHERE teacher_id = drop_id;
  DELETE FROM teachers WHERE id = drop_id;

  RAISE NOTICE '✅ Merge: Marco Camara → Marco Antonio Chaves Câmara (avaliações migradas)';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MERGE 4: "ODETE" → "Odete Amanda Guerreiro Rodrigues Martinez"
-- "ODETE" tem 1 avaliação (★2.0) — migra para o com nome completo
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM teachers WHERE name = 'Odete Amanda Guerreiro Rodrigues Martinez' LIMIT 1;
  SELECT id INTO drop_id FROM teachers WHERE name = 'ODETE' LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'SKIP ODETE: keep=%, drop=%', keep_id, drop_id;
    RETURN;
  END IF;

  INSERT INTO teacher_subjects (teacher_id, subject_id, active)
  SELECT keep_id, subject_id, true
  FROM teacher_subjects WHERE teacher_id = drop_id
  ON CONFLICT DO NOTHING;

  UPDATE reviews SET teacher_id = keep_id WHERE teacher_id = drop_id;

  DELETE FROM teacher_subjects WHERE teacher_id = drop_id;
  DELETE FROM teachers WHERE id = drop_id;

  RAISE NOTICE '✅ Merge: ODETE → Odete Amanda Guerreiro Rodrigues Martinez (avaliação migrada)';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MERGE 5: "Osvaldo - ORM" → "Osvaldo Requião"
-- "Osvaldo - ORM" tem 2 avaliações (★3.0) — migra para o com nome real
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM teachers WHERE name = 'Osvaldo Requião' LIMIT 1;
  SELECT id INTO drop_id FROM teachers WHERE name = 'Osvaldo - ORM' LIMIT 1;

  IF keep_id IS NULL OR drop_id IS NULL THEN
    RAISE NOTICE 'SKIP Osvaldo: keep=%, drop=%', keep_id, drop_id;
    RETURN;
  END IF;

  INSERT INTO teacher_subjects (teacher_id, subject_id, active)
  SELECT keep_id, subject_id, true
  FROM teacher_subjects WHERE teacher_id = drop_id
  ON CONFLICT DO NOTHING;

  UPDATE reviews SET teacher_id = keep_id WHERE teacher_id = drop_id;

  DELETE FROM teacher_subjects WHERE teacher_id = drop_id;
  DELETE FROM teachers WHERE id = drop_id;

  RAISE NOTICE '✅ Merge: Osvaldo - ORM → Osvaldo Requião (avaliações migradas)';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO — rode após os merges para confirmar
-- ═══════════════════════════════════════════════════════════════════════════════
/*
SELECT
  t.name,
  COUNT(DISTINCT ts.subject_id) AS disciplinas,
  COUNT(DISTINCT r.id)          AS avaliacoes,
  ROUND(AVG(r.rating_general), 1) AS media
FROM teachers t
LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id AND ts.active = true
LEFT JOIN reviews r           ON r.teacher_id  = t.id AND r.status = 'publicada'
WHERE t.name ILIKE ANY(ARRAY[
  '%Angela%', '%João Luciano%', '%Câmara%',
  '%Odete%', '%Osvaldo%'
])
AND t.active = true
GROUP BY t.name
ORDER BY t.name;
*/
