-- =====================
-- TABLES
-- =====================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curriculum_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campus TEXT,
  shift TEXT,
  year INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id UUID NOT NULL REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  UNIQUE(curriculum_version_id, number)
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mandatory', 'elective', 'extension')),
  modality TEXT NOT NULL DEFAULT 'presencial' CHECK (modality IN ('presencial', 'ead', 'hibrida')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curriculum_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id UUID NOT NULL REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  recommended_order INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(curriculum_version_id, subject_id)
);

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(teacher_id, subject_id, course_id)
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name_internal TEXT,
  course_id UUID REFERENCES courses(id),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id),
  curriculum_version_id UUID REFERENCES curriculum_versions(id),
  rating_general SMALLINT NOT NULL CHECK (rating_general BETWEEN 1 AND 5),
  rating_didactics SMALLINT NOT NULL CHECK (rating_didactics BETWEEN 1 AND 5),
  rating_organization SMALLINT NOT NULL CHECK (rating_organization BETWEEN 1 AND 5),
  rating_workload SMALLINT NOT NULL CHECK (rating_workload BETWEEN 1 AND 5),
  rating_difficulty SMALLINT NOT NULL CHECK (rating_difficulty BETWEEN 1 AND 5),
  would_recommend BOOLEAN NOT NULL,
  attendance_pressure TEXT CHECK (attendance_pressure IN ('baixa', 'media', 'alta')),
  assessment_style TEXT CHECK (assessment_style IN ('prova', 'projeto', 'trabalho', 'misto')),
  comment TEXT,
  had_in_person_event BOOLEAN,
  relevant_to_course BOOLEAN,
  status TEXT NOT NULL DEFAULT 'publicada' CHECK (status IN ('publicada', 'oculta', 'em_revisao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(author_id, teacher_id, subject_id),
  CONSTRAINT comment_max_length CHECK (comment IS NULL OR char_length(comment) <= 1000)
);

CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_reviews_teacher ON reviews(teacher_id);
CREATE INDEX idx_reviews_subject ON reviews(subject_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_author ON reviews(author_id);
CREATE INDEX idx_curriculum_subjects_version ON curriculum_subjects(curriculum_version_id);
CREATE INDEX idx_teacher_subjects_teacher ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject ON teacher_subjects(subject_id);
CREATE INDEX idx_subjects_name_search ON subjects USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_teachers_name_search ON teachers USING gin(to_tsvector('portuguese', name));

-- =====================
-- TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-cria profile quando usuário se cadastra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- RLS
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service inserts profile on signup" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin reads all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admin updates any profile" ON profiles FOR UPDATE USING (is_admin());

-- courses
CREATE POLICY "Anyone reads active courses" ON courses FOR SELECT USING (active = TRUE);
CREATE POLICY "Admin manages courses" ON courses FOR ALL USING (is_admin());

-- curriculum_versions
CREATE POLICY "Anyone reads active versions" ON curriculum_versions FOR SELECT USING (active = TRUE);
CREATE POLICY "Admin manages versions" ON curriculum_versions FOR ALL USING (is_admin());

-- semesters
CREATE POLICY "Anyone reads semesters" ON semesters FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages semesters" ON semesters FOR ALL USING (is_admin());

-- subjects
CREATE POLICY "Anyone reads active subjects" ON subjects FOR SELECT USING (active = TRUE);
CREATE POLICY "Admin manages subjects" ON subjects FOR ALL USING (is_admin());

-- curriculum_subjects
CREATE POLICY "Anyone reads curriculum subjects" ON curriculum_subjects FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages curriculum subjects" ON curriculum_subjects FOR ALL USING (is_admin());

-- teachers
CREATE POLICY "Anyone reads active teachers" ON teachers FOR SELECT USING (active = TRUE);
CREATE POLICY "Admin manages teachers" ON teachers FOR ALL USING (is_admin());

-- teacher_subjects
CREATE POLICY "Anyone reads teacher subjects" ON teacher_subjects FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages teacher subjects" ON teacher_subjects FOR ALL USING (is_admin());

-- reviews
CREATE POLICY "Anyone reads published reviews" ON reviews FOR SELECT USING (status = 'publicada');
CREATE POLICY "Admin reads all reviews" ON reviews FOR SELECT USING (is_admin());
CREATE POLICY "Active users insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id AND is_active_user());
CREATE POLICY "Users delete own reviews" ON reviews FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admin updates reviews" ON reviews FOR UPDATE USING (is_admin());

-- review_reports
CREATE POLICY "Logged users create reports" ON review_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages reports" ON review_reports FOR ALL USING (is_admin());

-- admin_activity
CREATE POLICY "Admin manages activity log" ON admin_activity FOR ALL USING (is_admin());
