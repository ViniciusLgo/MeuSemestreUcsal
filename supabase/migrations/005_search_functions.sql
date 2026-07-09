CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION search_subjects(
  p_query TEXT,
  p_curso TEXT DEFAULT '',
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  code TEXT,
  name TEXT,
  subject_type TEXT,
  modality TEXT,
  exact_match BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.code,
    s.name,
    s.type AS subject_type,
    s.modality,
    (
      unaccent(lower(s.name)) LIKE '%' || unaccent(lower(p_query)) || '%'
      OR unaccent(lower(s.code)) LIKE '%' || unaccent(lower(p_query)) || '%'
    ) AS exact_match
  FROM subjects s
  WHERE s.active = true
    AND (
      unaccent(lower(s.name)) LIKE '%' || unaccent(lower(p_query)) || '%'
      OR unaccent(lower(s.code)) LIKE '%' || unaccent(lower(p_query)) || '%'
      OR (s.aliases IS NOT NULL AND unaccent(lower(s.aliases)) LIKE '%' || unaccent(lower(p_query)) || '%')
      OR similarity(unaccent(lower(s.name)), unaccent(lower(p_query))) > 0.2
    )
    AND (
      p_curso = ''
      OR EXISTS (
        SELECT 1
        FROM curriculum_subjects cs
        JOIN curriculum_versions cv ON cs.curriculum_version_id = cv.id
        JOIN courses c ON cv.course_id = c.id
        WHERE cs.subject_id = s.id AND c.code = p_curso
      )
    )
  ORDER BY
    (unaccent(lower(s.name)) LIKE '%' || unaccent(lower(p_query)) || '%') DESC,
    (s.aliases IS NOT NULL AND unaccent(lower(s.aliases)) LIKE '%' || unaccent(lower(p_query)) || '%') DESC,
    similarity(unaccent(lower(s.name)), unaccent(lower(p_query))) DESC,
    s.name
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION search_teachers(
  p_query TEXT,
  p_curso TEXT DEFAULT '',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  exact_match BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    (unaccent(lower(t.name)) LIKE '%' || unaccent(lower(p_query)) || '%') AS exact_match
  FROM teachers t
  WHERE t.active = true
    AND (
      unaccent(lower(t.name)) LIKE '%' || unaccent(lower(p_query)) || '%'
      OR similarity(unaccent(lower(t.name)), unaccent(lower(p_query))) > 0.2
    )
    AND (
      p_curso = ''
      OR EXISTS (
        SELECT 1
        FROM teacher_subjects ts
        JOIN courses c ON ts.course_id = c.id
        WHERE ts.teacher_id = t.id AND c.code = p_curso
      )
    )
  ORDER BY
    (unaccent(lower(t.name)) LIKE '%' || unaccent(lower(p_query)) || '%') DESC,
    similarity(unaccent(lower(t.name)), unaccent(lower(p_query))) DESC,
    t.name
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION search_subjects TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_teachers TO anon, authenticated;
