-- Grants de escrita para usuário autenticado (admin usa RLS is_admin() como guard)
GRANT INSERT, UPDATE, DELETE ON
  teachers,
  teacher_subjects,
  subjects,
  curriculum_subjects,
  semesters,
  curriculum_versions,
  courses,
  admin_activity
TO authenticated;
