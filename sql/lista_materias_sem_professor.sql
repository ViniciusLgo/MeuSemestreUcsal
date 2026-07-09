-- Lista todas as disciplinas obrigatórias SEM professor ativo
-- Resultado no formato: Matéria / Professor (para preencher manualmente)
-- Execute no Supabase SQL Editor

SELECT
  s.code       AS codigo,
  s.name       AS materia,
  string_agg(DISTINCT cv.shift, ' / ')      AS turno,
  string_agg(DISTINCT c.code, ' / ')        AS curso,
  string_agg(DISTINCT sem.number::text, ', ') AS semestres,
  '' AS professor  -- preencha manualmente
FROM subjects s
JOIN curriculum_subjects cs ON cs.subject_id = s.id
JOIN semesters sem          ON sem.id = cs.semester_id
JOIN curriculum_versions cv ON cv.id = sem.curriculum_version_id
JOIN courses c              ON c.id = cv.course_id
WHERE s.active = true
  AND s.type = 'mandatory'
  AND NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts
    JOIN teachers t ON t.id = ts.teacher_id
    WHERE ts.subject_id = s.id AND t.active = true
  )
GROUP BY s.id, s.code, s.name
ORDER BY c.code, sem.number, s.name;
