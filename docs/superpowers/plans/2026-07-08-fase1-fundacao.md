# Fase 1 — Fundação MeuSemestreUCSAL

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar o projeto Next.js com banco Supabase completo (tabelas + RLS + seed BES/ADS 2023) e as primeiras páginas públicas funcionando.

**Architecture:** Next.js App Router com Server Components para páginas públicas (SSR/SSG), Supabase como backend completo (Auth, Postgres, RLS). Dados públicos lidos server-side; interações autenticadas client-side.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase JS v2, @supabase/ssr

## Global Constraints

- Node.js 20+
- Next.js App Router (nunca Pages Router)
- TypeScript strict mode
- Tailwind CSS (sem bibliotecas de componentes externas por enquanto)
- Supabase project deve existir antes de rodar seed
- Variáveis de ambiente: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Nunca expor author_id, email ou dados de identidade em respostas públicas
- RLS ativo em todas as tabelas desde o início

---

### Task 1: Criar projeto Next.js

**Files:**
- Create: `package.json` (gerado pelo create-next-app)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `.env.local`

- [ ] **Step 1: Criar projeto**

```bash
cd "C:\Users\Vinicius-pc-suporte\Music\GITHUB\MeuSemestreuUCSAL"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Responder às perguntas interativas: Yes para tudo exceto Turbopack (No).

- [ ] **Step 2: Instalar dependências Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Criar .env.local**

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

Pegar as chaves no painel Supabase → Project Settings → API.

- [ ] **Step 4: Verificar que o app sobe**

```bash
npm run dev
```

Abrir http://localhost:3000 — deve mostrar a página padrão do Next.js.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: setup Next.js 15 + Tailwind + Supabase dependencies"
```

---

### Task 2: Clientes Supabase (browser, server, middleware)

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Criar client browser**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Criar client server**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Criar middleware**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Criar types placeholder**

```typescript
// src/types/database.ts
export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

(Será substituído pelos tipos gerados depois do schema estar criado no Supabase.)

- [ ] **Step 5: Commit**

```bash
git add src/lib src/middleware.ts src/types
git commit -m "feat: add Supabase client setup (browser, server, middleware)"
```

---

### Task 3: Schema do banco — migration SQL

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
-- supabase/migrations/001_initial_schema.sql

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
-- TRIGGER: updated_at
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

-- =====================
-- TRIGGER: auto-create profile on signup
-- =====================

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

-- Helper: is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: is_active_user
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
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
```

- [ ] **Step 2: Executar no Supabase**

Abrir Supabase → SQL Editor → colar o conteúdo acima → Run.

Verificar no Table Editor que todas as 11 tabelas apareceram.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add complete database schema with RLS"
```

---

### Task 4: Seed — Cursos, Matrizes, Semestres, Disciplinas BES 2023

**Files:**
- Create: `supabase/seed_bes_2023.sql`

- [ ] **Step 1: Criar seed BES**

```sql
-- supabase/seed_bes_2023.sql

-- Curso BES
INSERT INTO courses (id, code, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BES', 'Engenharia de Software')
ON CONFLICT (code) DO NOTHING;

-- Matriz BES 2023
INSERT INTO curriculum_versions (id, course_id, name, campus, shift, year) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Matriz 2023/1', 'Pituaçu', 'Matutino', 2023)
ON CONFLICT DO NOTHING;

-- Semestres BES (1-8)
INSERT INTO semesters (id, curriculum_version_id, number) VALUES
  ('00000000-0001-0001-0001-000000000001', '00000000-0000-0001-0001-000000000001', 1),
  ('00000000-0001-0001-0001-000000000002', '00000000-0000-0001-0001-000000000001', 2),
  ('00000000-0001-0001-0001-000000000003', '00000000-0000-0001-0001-000000000001', 3),
  ('00000000-0001-0001-0001-000000000004', '00000000-0000-0001-0001-000000000001', 4),
  ('00000000-0001-0001-0001-000000000005', '00000000-0000-0001-0001-000000000001', 5),
  ('00000000-0001-0001-0001-000000000006', '00000000-0000-0001-0001-000000000001', 6),
  ('00000000-0001-0001-0001-000000000007', '00000000-0000-0001-0001-000000000001', 7),
  ('00000000-0001-0001-0001-000000000008', '00000000-0000-0001-0001-000000000001', 8)
ON CONFLICT DO NOTHING;

-- Disciplinas BES
INSERT INTO subjects (code, name, type, modality) VALUES
  ('BES001', 'Arquitetura e Organização de Computadores', 'mandatory', 'presencial'),
  ('BES004', 'Introdução à Engenharia de Software', 'mandatory', 'presencial'),
  ('BES005', 'Lógica de Programação e Algoritmos', 'mandatory', 'presencial'),
  ('BES046', 'Raciocínio Lógico', 'mandatory', 'presencial'),
  ('EFB499', 'Cálculo I', 'mandatory', 'presencial'),
  ('EFG011', 'Iniciação à Vida Universitária', 'mandatory', 'presencial'),
  ('BES008', 'Programação Orientada a Objetos', 'mandatory', 'presencial'),
  ('BES010', 'Sistemas Operacionais', 'mandatory', 'presencial'),
  ('BES016', 'Processos de Software', 'mandatory', 'presencial'),
  ('BES048', 'Programação Front End', 'mandatory', 'presencial'),
  ('EFG017', 'Empreendedorismo e Inovação', 'mandatory', 'presencial'),
  ('BES006', 'Estrutura de Dados', 'mandatory', 'presencial'),
  ('BES011', 'Bancos de Dados I', 'mandatory', 'presencial'),
  ('BES012', 'Engenharia de Requisitos', 'mandatory', 'presencial'),
  ('BES049', 'Programação Web', 'mandatory', 'presencial'),
  ('EFG201', 'Iniciação ao Pensar', 'mandatory', 'presencial'),
  ('BES009', 'Redes de Computadores', 'mandatory', 'presencial'),
  ('BES020', 'Programação para Dispositivos Móveis', 'mandatory', 'presencial'),
  ('BES021', 'Segurança e Auditoria de Sistemas', 'mandatory', 'presencial'),
  ('BES022', 'Testes e Qualidade de Software', 'mandatory', 'presencial'),
  ('BES050', 'Programação Orientada a Objetos Avançada', 'mandatory', 'presencial'),
  ('EFG013', 'Teologia e Humanismo', 'mandatory', 'presencial'),
  ('BES019', 'Estrutura Discreta e Lógica', 'mandatory', 'presencial'),
  ('BES023', 'Arquitetura de Software', 'mandatory', 'presencial'),
  ('BES026', 'Sistemas Distribuídos', 'mandatory', 'presencial'),
  ('BES051', 'Governança de Tecnologia da Informação', 'mandatory', 'presencial'),
  ('EFG018', 'Sociedade, Cultura e Meio Ambiente', 'mandatory', 'presencial'),
  ('BES024', 'Gestão do Conhecimento', 'mandatory', 'presencial'),
  ('BES027', 'Banco de Dados II', 'mandatory', 'presencial'),
  ('BES035', 'Engenharia de Software Experimental', 'mandatory', 'presencial'),
  ('BES036', 'Evolução de Software', 'mandatory', 'presencial'),
  ('BES038', 'Inteligência Artificial', 'mandatory', 'presencial'),
  ('EFB659', 'Projeto de Vida e Mundo do Trabalho', 'mandatory', 'presencial'),
  ('BES034', 'Compiladores', 'mandatory', 'presencial'),
  ('BES037', 'Gerência de Projetos', 'mandatory', 'presencial'),
  ('BES043', 'Tópicos Avançados em Banco de Dados', 'mandatory', 'presencial'),
  ('BES045', 'Tópicos Especiais em Engenharia de Software', 'mandatory', 'presencial'),
  ('BES039', 'Pesquisa Operacional', 'mandatory', 'presencial'),
  ('BES040', 'Processos de Negócio', 'mandatory', 'presencial'),
  ('BES044', 'Tópicos Avançados em Programação', 'mandatory', 'presencial'),
  ('BES052', 'Big Data e Analytics', 'mandatory', 'presencial'),
  ('BES053', 'Projeto Final', 'mandatory', 'presencial')
ON CONFLICT (code) DO NOTHING;

-- Vínculo disciplinas BES ao currículo (com semestre)
-- Semestre 1
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000001',
  s.id,
  row_number() OVER (ORDER BY s.code),
  TRUE
FROM subjects s
WHERE s.code IN ('BES001','BES004','BES005','BES046','EFB499','EFG011')
ON CONFLICT DO NOTHING;

-- Semestre 2
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000002',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES008','BES010','BES016','BES048','EFG017')
ON CONFLICT DO NOTHING;

-- Semestre 3
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000003',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES006','BES011','BES012','BES049','EFG201')
ON CONFLICT DO NOTHING;

-- Semestre 4
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000004',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES009','BES020','BES021','BES022','BES050','EFG013')
ON CONFLICT DO NOTHING;

-- Semestre 5
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000005',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES019','BES023','BES026','BES051','EFG018')
ON CONFLICT DO NOTHING;

-- Semestre 6
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000006',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES024','BES027','BES035','BES036','BES038','EFB659')
ON CONFLICT DO NOTHING;

-- Semestre 7
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000007',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES034','BES037','BES043','BES045')
ON CONFLICT DO NOTHING;

-- Semestre 8
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT
  '00000000-0000-0001-0001-000000000001',
  '00000000-0001-0001-0001-000000000008',
  s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s
WHERE s.code IN ('BES039','BES040','BES044','BES052','BES053')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Executar no Supabase SQL Editor**

Rodar o SQL acima. Verificar no Table Editor que courses, curriculum_versions, semesters, subjects e curriculum_subjects têm dados.

---

### Task 5: Seed — ADS 2023 e Eletivas EAD

**Files:**
- Create: `supabase/seed_ads_eletivas_2023.sql`

- [ ] **Step 1: Criar seed ADS + Eletivas**

```sql
-- supabase/seed_ads_eletivas_2023.sql

-- Curso ADS
INSERT INTO courses (id, code, name) VALUES
  ('00000000-0000-0000-0000-000000000002', 'ADS', 'Análise e Desenvolvimento de Sistemas')
ON CONFLICT (code) DO NOTHING;

-- Matriz ADS 2023
INSERT INTO curriculum_versions (id, course_id, name, campus, shift, year) VALUES
  ('00000000-0000-0001-0001-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'Matriz 2023/1', 'Pituaçu', 'Noturno', 2023)
ON CONFLICT DO NOTHING;

-- Semestres ADS (1-5)
INSERT INTO semesters (id, curriculum_version_id, number) VALUES
  ('00000000-0002-0001-0001-000000000001', '00000000-0000-0001-0001-000000000002', 1),
  ('00000000-0002-0001-0001-000000000002', '00000000-0000-0001-0001-000000000002', 2),
  ('00000000-0002-0001-0001-000000000003', '00000000-0000-0001-0001-000000000002', 3),
  ('00000000-0002-0001-0001-000000000004', '00000000-0000-0001-0001-000000000002', 4),
  ('00000000-0002-0001-0001-000000000005', '00000000-0000-0001-0001-000000000002', 5)
ON CONFLICT DO NOTHING;

-- Disciplinas exclusivas ADS (as compartilhadas com BES já existem)
INSERT INTO subjects (code, name, type, modality) VALUES
  ('CST302', 'Lógica de Programação e Algoritmos', 'mandatory', 'presencial'),
  ('CST303', 'Matemática I', 'mandatory', 'presencial'),
  ('CST304', 'Arquitetura e Organização de Computadores', 'mandatory', 'presencial'),
  ('CST328', 'Raciocínio Lógico', 'mandatory', 'presencial'),
  ('CST367', 'Fundamentos de Sistemas de Informação', 'mandatory', 'presencial'),
  ('CST222', 'Programação Front End', 'mandatory', 'presencial'),
  ('CST309', 'Programação Orientada a Objetos', 'mandatory', 'presencial'),
  ('CST310', 'Redes de Computadores', 'mandatory', 'presencial'),
  ('CST319', 'Sistemas Operacionais', 'mandatory', 'presencial'),
  ('CST305', 'Estrutura de Dados', 'mandatory', 'presencial'),
  ('CST311', 'Bancos de Dados', 'mandatory', 'presencial'),
  ('CST313', 'Introdução à Engenharia de Software', 'mandatory', 'presencial'),
  ('CST315', 'Programação Web', 'mandatory', 'presencial'),
  ('CST223', 'Processos de Software', 'mandatory', 'presencial'),
  ('CST314', 'Programação Orientada a Objetos Avançada', 'mandatory', 'presencial'),
  ('CST316', 'Segurança e Auditoria de Sistemas', 'mandatory', 'presencial'),
  ('CST318', 'Programação para Dispositivos Móveis', 'mandatory', 'presencial'),
  ('CST320', 'Testes e Qualidade de Software', 'mandatory', 'presencial'),
  ('CST224', 'Projeto Integrador', 'mandatory', 'presencial'),
  ('CST322', 'Arquitetura de Software', 'mandatory', 'presencial'),
  ('CST324', 'Gerência de Projetos', 'mandatory', 'presencial'),
  ('CST325', 'Processos de Negócio', 'mandatory', 'presencial'),
  ('CST327', 'Sistemas de Apoio à Decisão', 'mandatory', 'presencial')
ON CONFLICT (code) DO NOTHING;

-- Vínculos ADS Semestre 1
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '00000000-0002-0001-0001-000000000001', s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST302','CST303','CST304','CST328','CST367','EFG011')
ON CONFLICT DO NOTHING;

-- Semestre 2
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '00000000-0002-0001-0001-000000000002', s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST222','CST309','CST310','CST319','EFG017','EFG201')
ON CONFLICT DO NOTHING;

-- Semestre 3
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '00000000-0002-0001-0001-000000000003', s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST305','CST311','CST313','CST315','EFG013')
ON CONFLICT DO NOTHING;

-- Semestre 4
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '00000000-0002-0001-0001-000000000004', s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST223','CST314','CST316','CST318','CST320','EFG018')
ON CONFLICT DO NOTHING;

-- Semestre 5
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '00000000-0002-0001-0001-000000000005', s.id, row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST224','CST322','CST324','CST325','CST327','EFB659')
ON CONFLICT DO NOTHING;

-- =====================
-- ELETIVAS (todas EAD)
-- =====================
INSERT INTO subjects (code, name, type, modality) VALUES
  ('EFB207', 'Língua Brasileira de Sinais - LIBRAS', 'elective', 'ead'),
  ('ELE001', 'Inclusão e Acessibilidade', 'elective', 'ead'),
  ('ELE002', 'Educomunicação', 'elective', 'ead'),
  ('ELE003', 'Ciências, Natureza e Sociedade', 'elective', 'ead'),
  ('ELE004', 'Compliance Empresarial e Societário', 'elective', 'ead'),
  ('ELE005', 'Projeto de Extensão em Direito e Cidadania', 'elective', 'ead'),
  ('ELE006', 'Interfaces de Dashboards Interativos', 'elective', 'ead'),
  ('ELE007', 'Criação de Dashboards Inteligentes', 'elective', 'ead'),
  ('ELE008', 'Etnias e Diversidade Cultural', 'elective', 'ead'),
  ('ELE009', 'Culinárias Alternativas e Tendências Alimentares', 'elective', 'ead'),
  ('ELE010', 'Propaganda Infanto-Juvenil e o Direito da Criança e Adolescente', 'elective', 'ead'),
  ('ELE011', 'Ética Profissional', 'elective', 'ead'),
  ('ELE012', 'Tecnologia para Negócios', 'elective', 'ead'),
  ('ELE013', 'Primeiros Socorros', 'elective', 'ead'),
  ('ELE014', 'Comunicação, Cultura e Cidadania', 'elective', 'ead'),
  ('ELE015', 'Argumentação e Retórica Aplicadas às Mídias Digitais', 'elective', 'ead'),
  ('ELE016', 'Tomada de Decisão', 'elective', 'ead'),
  ('ELE017', 'Gênero, Sexualidade e Direito', 'elective', 'ead'),
  ('ELE018', 'Impacto do Ambiente Construído na Qualidade de Vida da População', 'elective', 'ead'),
  ('ELE019', 'Introdução à Toxicologia Ambiental', 'elective', 'ead')
ON CONFLICT (code) DO NOTHING;

-- Eletivas disponíveis para BES
INSERT INTO curriculum_subjects (curriculum_version_id, subject_id, is_required)
SELECT '00000000-0000-0001-0001-000000000001', s.id, FALSE
FROM subjects s WHERE s.type = 'elective'
ON CONFLICT DO NOTHING;

-- Eletivas disponíveis para ADS
INSERT INTO curriculum_subjects (curriculum_version_id, subject_id, is_required)
SELECT '00000000-0000-0001-0001-000000000002', s.id, FALSE
FROM subjects s WHERE s.type = 'elective'
ON CONFLICT DO NOTHING;

-- Admin seed: marcar vinicruzlago@gmail.com como admin
-- (executar APÓS o usuário ter feito login pela primeira vez)
-- UPDATE profiles SET role = 'admin' WHERE email = 'vinicruzlago@gmail.com';
```

- [ ] **Step 2: Executar no Supabase SQL Editor**

Rodar o SQL. Verificar que ADS + eletivas apareceram.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add seed data BES/ADS 2023 + 20 eletivas EAD"
```

---

### Task 6: Design System — globals, tokens, componentes base

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Avatar.tsx`
- Create: `src/components/ui/StarRating.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Configurar Tailwind com tokens de cor**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Globals CSS com fontes e base**

```css
/* src/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.75rem;
  }
  body {
    @apply bg-slate-50 text-slate-900 antialiased;
  }
  h1, h2, h3 {
    @apply font-display;
  }
}

@layer utilities {
  .container-page {
    @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
```

- [ ] **Step 3: Componente Button**

```typescript
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
```

- [ ] **Step 4: Componente Badge**

```typescript
// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info' | 'ead'
  className?: string
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-brand-50 text-brand-700',
  ead: 'bg-purple-50 text-purple-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Componente Card**

```typescript
// src/components/ui/Card.tsx
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-100 shadow-sm p-6',
      hover && 'transition-shadow hover:shadow-md hover:border-slate-200',
      className
    )}>
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Componente Avatar**

```typescript
// src/components/ui/Avatar.tsx
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
}

const colors = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
]

function getColor(name: string) {
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
      sizes[size],
      getColor(name),
      className
    )}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
```

- [ ] **Step 7: Componente StarRating**

```typescript
// src/components/ui/StarRating.tsx
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

export function StarRating({ value, max = 5, size = 'md', className }: StarRatingProps) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value)
        return (
          <svg
            key={i}
            className={cn(starSize, filled ? 'text-amber-400' : 'text-slate-200')}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 8: Utilitário cn**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 9: Verificar componentes**

```bash
npm run dev
```

Sem erros de TypeScript no terminal.

- [ ] **Step 10: Commit**

```bash
git add src/components/ui src/lib src/app/globals.css tailwind.config.ts
git commit -m "feat: add design system tokens and base UI components"
```

---

### Task 7: Layout — Header e Footer

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Header**

```typescript
// src/components/layout/Header.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">MS</span>
          </div>
          <span className="font-display font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
            MeuSemestre<span className="text-brand-600">UCSAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/curso/BES" className="hover:text-brand-600 transition-colors">Engenharia de Software</Link>
          <Link href="/curso/ADS" className="hover:text-brand-600 transition-colors">ADS</Link>
          <Link href="/buscar" className="hover:text-brand-600 transition-colors">Buscar</Link>
          <Link href="/monte-sua-grade" className="hover:text-brand-600 transition-colors">Monte sua Grade</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/avaliar">Avaliar</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
```

Nota: `asChild` não existe nativamente — simplificar removendo `asChild` e usando `<a>` ou ajustar para `<Link>` direto dentro do botão.

Versão corrigida do Button para aceitar Link:

```typescript
// src/components/layout/Header.tsx (versão sem asChild)
import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">MS</span>
          </div>
          <span className="font-display font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
            MeuSemestre<span className="text-brand-600">UCSAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/curso/BES" className="hover:text-brand-600 transition-colors">Eng. de Software</Link>
          <Link href="/curso/ADS" className="hover:text-brand-600 transition-colors">ADS</Link>
          <Link href="/buscar" className="hover:text-brand-600 transition-colors">Buscar</Link>
          <Link href="/monte-sua-grade" className="hover:text-brand-600 transition-colors">Monte sua Grade</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/entrar"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            href="/avaliar"
            className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Avaliar
          </Link>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Footer**

```typescript
// src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-100 bg-white">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">MS</span>
              </div>
              <span className="font-display font-bold text-slate-900">MeuSemestreUCSAL</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Avaliações anônimas de professores feitas por alunos da UCSAL.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Cursos</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/curso/BES" className="hover:text-brand-600 transition-colors">Engenharia de Software</Link></li>
              <li><Link href="/curso/ADS" className="hover:text-brand-600 transition-colors">Análise e Desenvolvimento</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/buscar" className="hover:text-brand-600 transition-colors">Buscar</Link></li>
              <li><Link href="/monte-sua-grade" className="hover:text-brand-600 transition-colors">Monte sua Grade</Link></li>
              <li><Link href="/faq" className="hover:text-brand-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Conta</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/entrar" className="hover:text-brand-600 transition-colors">Entrar</Link></li>
              <li><Link href="/avaliar" className="hover:text-brand-600 transition-colors">Avaliar professor</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MeuSemestreUCSAL — Projeto independente de alunos.</p>
          <p>Não afiliado oficialmente à UCSAL.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: { default: 'MeuSemestreUCSAL', template: '%s | MeuSemestreUCSAL' },
  description: 'Avaliações anônimas de professores da UCSAL. Compare professores, monte sua grade e tome decisões mais inteligentes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verificar layout**

```bash
npm run dev
```

Abrir http://localhost:3000 — deve aparecer header com logo e nav, e footer.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/app/layout.tsx
git commit -m "feat: add Header and Footer layout components"
```

---

### Task 8: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/CourseCards.tsx`

- [ ] **Step 1: Hero Section**

```typescript
// src/components/home/HeroSection.tsx
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
      </div>

      <div className="container-page relative py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Avaliações anônimas de professores da UCSAL
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Escolha o melhor professor<br />
            <span className="text-accent-400">para você</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-100 leading-relaxed mb-8 max-w-2xl">
            Veja avaliações reais de alunos da UCSAL, compare professores por disciplina e
            monte sua grade ideal com base em dados, não em chutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar disciplina ou professor
            </Link>
            <Link
              href="/monte-sua-grade"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-accent-600 transition-colors text-base"
            >
              Monte sua grade perfeita →
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Professores avaliados', value: '0+' },
            { label: 'Avaliações publicadas', value: '0+' },
            { label: 'Disciplinas', value: '60+' },
            { label: 'Cursos', value: '2' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-brand-200 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Course Cards**

```typescript
// src/components/home/CourseCards.tsx
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const courses = [
  {
    code: 'BES',
    name: 'Engenharia de Software',
    type: 'Bacharelado',
    semesters: 8,
    shift: 'Matutino',
    color: 'brand',
    description: 'Formação completa em desenvolvimento de software, arquitetura de sistemas e gestão de projetos.',
  },
  {
    code: 'ADS',
    name: 'Análise e Desenvolvimento de Sistemas',
    type: 'Tecnólogo',
    semesters: 5,
    shift: 'Noturno',
    color: 'purple',
    description: 'Curso tecnólogo voltado para o desenvolvimento ágil de sistemas e aplicações corporativas.',
  },
]

export function CourseCards() {
  return (
    <section className="container-page py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">Escolha seu curso</h2>
        <p className="text-slate-500">Selecione o curso para ver a matriz, disciplinas e professores disponíveis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {courses.map((course) => (
          <Link key={course.code} href={`/curso/${course.code}`}>
            <Card hover className="h-full group cursor-pointer">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                course.color === 'brand' ? 'bg-brand-100' : 'bg-purple-100'
              }`}>
                <span className={`font-display font-bold text-lg ${
                  course.color === 'brand' ? 'text-brand-700' : 'text-purple-700'
                }`}>{course.code}</span>
              </div>
              <Badge variant={course.color === 'brand' ? 'info' : 'default'} className="mb-3">
                {course.type}
              </Badge>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                {course.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">{course.description}</p>
              <div className="flex gap-4 text-xs text-slate-400 font-medium">
                <span>{course.semesters} semestres</span>
                <span>{course.shift}</span>
                <span>Pituaçu</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Home page**

```typescript
// src/app/page.tsx
import { HeroSection } from '@/components/home/HeroSection'
import { CourseCards } from '@/components/home/CourseCards'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CourseCards />
    </>
  )
}
```

- [ ] **Step 4: Verificar no browser**

```bash
npm run dev
```

http://localhost:3000 — deve mostrar hero com gradiente, stats e os dois cards de curso.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/home
git commit -m "feat: add home page with hero and course cards"
```

---

### Task 9: Página de Curso `/curso/[codigo]`

**Files:**
- Create: `src/app/curso/[codigo]/page.tsx`
- Create: `src/lib/queries/courses.ts`

- [ ] **Step 1: Query de curso**

```typescript
// src/lib/queries/courses.ts
import { createClient } from '@/lib/supabase/server'

export async function getCourseByCode(code: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*, curriculum_versions(*)')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()
  if (error) return null
  return data
}

export async function getCurriculumWithSubjects(versionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('curriculum_subjects')
    .select(`
      id, recommended_order, is_required,
      semester:semesters(id, number),
      subject:subjects(id, code, name, type, modality)
    `)
    .eq('curriculum_version_id', versionId)
    .order('recommended_order')
  if (error) return []
  return data
}
```

- [ ] **Step 2: Página do curso**

```typescript
// src/app/curso/[codigo]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseByCode, getCurriculumWithSubjects } from '@/lib/queries/courses'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ codigo: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params
  return { title: `Curso ${codigo.toUpperCase()}` }
}

export default async function CoursePage({ params }: Props) {
  const { codigo } = await params
  const course = await getCourseByCode(codigo)
  if (!course) notFound()

  const activeVersion = course.curriculum_versions?.find((v: { active: boolean }) => v.active)
  const subjects = activeVersion ? await getCurriculumWithSubjects(activeVersion.id) : []

  const bySemester = subjects.reduce((acc: Record<number, typeof subjects>, item) => {
    const num = item.semester?.number ?? 0
    if (!acc[num]) acc[num] = []
    acc[num].push(item)
    return acc
  }, {})

  const semesterNumbers = Object.keys(bySemester)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)

  const electives = subjects.filter((s) => s.subject?.type === 'elective')

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <Badge variant="info" className="mb-3">{codigo.toUpperCase()}</Badge>
        <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">{course.name}</h1>
        {activeVersion && (
          <p className="text-slate-500">{activeVersion.name} · {activeVersion.shift} · {activeVersion.campus}</p>
        )}
      </div>

      {semesterNumbers.map((num) => (
        <div key={num} className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
              {num}
            </span>
            {num}º Semestre
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bySemester[num].map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`}>
                <Card hover className="p-4 cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{item.subject?.code}</span>
                    {item.subject?.modality === 'ead' && <Badge variant="ead">EAD</Badge>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{item.subject?.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {electives.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-700 mb-3">Disciplinas Eletivas (EAD)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {electives.map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`}>
                <Card hover className="p-4 cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{item.subject?.code}</span>
                    <Badge variant="ead">EAD</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{item.subject?.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Testar no browser**

Abrir http://localhost:3000/curso/BES e http://localhost:3000/curso/ADS.
Deve listar as disciplinas por semestre com cards clicáveis.

- [ ] **Step 4: Commit**

```bash
git add src/app/curso src/lib/queries
git commit -m "feat: add course page with curriculum by semester"
```

---

### Task 10: Página de Disciplina `/disciplina/[id]`

**Files:**
- Create: `src/app/disciplina/[id]/page.tsx`
- Create: `src/lib/queries/subjects.ts`

- [ ] **Step 1: Query de disciplina**

```typescript
// src/lib/queries/subjects.ts
import { createClient } from '@/lib/supabase/server'

export async function getSubjectById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()
  if (error) return null
  return data
}

export async function getTeachersBySubject(subjectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('teacher:teachers(id, name, slug)')
    .eq('subject_id', subjectId)
    .eq('active', true)
  if (error) return []
  return data.map((ts) => ts.teacher).filter(Boolean)
}

export async function getReviewsBySubject(subjectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating_general, rating_didactics, rating_organization,
      rating_workload, rating_difficulty, would_recommend,
      attendance_pressure, assessment_style, comment,
      had_in_person_event, relevant_to_course, created_at,
      teacher:teachers(id, name)
    `)
    .eq('subject_id', subjectId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}
```

- [ ] **Step 2: Página da disciplina**

```typescript
// src/app/disciplina/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSubjectById, getTeachersBySubject, getReviewsBySubject } from '@/lib/queries/subjects'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import { Avatar } from '@/components/ui/Avatar'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const subject = await getSubjectById(id)
  return { title: subject?.name ?? 'Disciplina' }
}

function avg(reviews: Array<{ rating_general: number }>, key: keyof (typeof reviews)[0]) {
  if (!reviews.length) return 0
  return reviews.reduce((sum, r) => sum + Number(r[key]), 0) / reviews.length
}

export default async function SubjectPage({ params }: Props) {
  const { id } = await params
  const [subject, teachers, reviews] = await Promise.all([
    getSubjectById(id),
    getTeachersBySubject(id),
    getReviewsBySubject(id),
  ])
  if (!subject) notFound()

  const avgGeneral = avg(reviews as never, 'rating_general')
  const isEad = subject.modality === 'ead'

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono text-slate-400">{subject.code}</span>
          <Badge variant={isEad ? 'ead' : 'default'}>
            {isEad ? 'EAD' : subject.modality}
          </Badge>
          <Badge variant={subject.type === 'mandatory' ? 'info' : 'warning'}>
            {subject.type === 'mandatory' ? 'Obrigatória' : 'Eletiva'}
          </Badge>
        </div>
        <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">{subject.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          {reviews.length > 0 ? (
            <>
              <StarRating value={avgGeneral} />
              <span className="font-bold text-slate-900">{avgGeneral.toFixed(1)}</span>
              <span className="text-slate-400 text-sm">({reviews.length} avaliações)</span>
            </>
          ) : (
            <span className="text-slate-400 text-sm">Nenhuma avaliação ainda</span>
          )}
        </div>
      </div>

      {teachers.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Professores que lecionam esta disciplina</h2>
          <div className="flex flex-wrap gap-3">
            {teachers.map((teacher) => teacher && (
              <Link key={(teacher as { id: string }).id} href={`/professor/${(teacher as { id: string }).id}`}>
                <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all">
                  <Avatar name={(teacher as { name: string }).name} size="sm" />
                  <span className="text-sm font-semibold text-slate-800">{(teacher as { name: string }).name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-slate-900">Avaliações</h2>
          <Link
            href="/avaliar"
            className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-400 mb-4">Ainda não há avaliações para esta disciplina.</p>
            <Link href="/avaliar" className="text-brand-600 font-medium hover:underline">
              Seja o primeiro a avaliar →
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    {review.teacher && (
                      <Link href={`/professor/${(review.teacher as { id: string }).id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                        {(review.teacher as { name: string }).name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating_general} size="sm" />
                      <span className="text-sm font-bold text-slate-800">{review.rating_general}/5</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {review.would_recommend && <Badge variant="success">Recomenda</Badge>}
                    {review.attendance_pressure && (
                      <Badge variant={review.attendance_pressure === 'alta' ? 'warning' : 'default'}>
                        Chamada {review.attendance_pressure}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs text-center">
                  {[
                    { label: 'Didática', value: review.rating_didactics },
                    { label: 'Organização', value: review.rating_organization },
                    { label: 'Carga', value: review.rating_workload },
                    { label: 'Dificuldade', value: review.rating_difficulty },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 rounded-lg py-2">
                      <div className="font-bold text-slate-900 text-base">{m.value}</div>
                      <div className="text-slate-400">{m.label}</div>
                    </div>
                  ))}
                </div>

                {review.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                    {review.comment}
                  </p>
                )}

                <p className="text-xs text-slate-300 mt-3">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Testar**

Clicar em uma disciplina na página `/curso/BES`. Deve carregar a página da disciplina.

- [ ] **Step 4: Commit**

```bash
git add src/app/disciplina src/lib/queries/subjects.ts
git commit -m "feat: add subject page with teachers and reviews"
```

---

### Task 11: Página de Professor `/professor/[id]`

**Files:**
- Create: `src/app/professor/[id]/page.tsx`
- Create: `src/lib/queries/teachers.ts`

- [ ] **Step 1: Query de professor**

```typescript
// src/lib/queries/teachers.ts
import { createClient } from '@/lib/supabase/server'

export async function getTeacherById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()
  if (error) return null
  return data
}

export async function getSubjectsByTeacher(teacherId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('subject:subjects(id, code, name, modality)')
    .eq('teacher_id', teacherId)
    .eq('active', true)
  if (error) return []
  return data.map((ts) => ts.subject).filter(Boolean)
}

export async function getReviewsByTeacher(teacherId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating_general, rating_didactics, rating_organization,
      rating_workload, rating_difficulty, would_recommend,
      attendance_pressure, assessment_style, comment, created_at,
      subject:subjects(id, name, code)
    `)
    .eq('teacher_id', teacherId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}
```

- [ ] **Step 2: Página do professor**

```typescript
// src/app/professor/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTeacherById, getSubjectsByTeacher, getReviewsByTeacher } from '@/lib/queries/teachers'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const teacher = await getTeacherById(id)
  return { title: teacher?.name ?? 'Professor' }
}

export default async function TeacherPage({ params }: Props) {
  const { id } = await params
  const [teacher, subjects, reviews] = await Promise.all([
    getTeacherById(id),
    getSubjectsByTeacher(id),
    getReviewsByTeacher(id),
  ])
  if (!teacher) notFound()

  const avgOf = (key: string) => reviews.length
    ? reviews.reduce((s, r) => s + Number((r as Record<string, unknown>)[key]), 0) / reviews.length
    : 0

  const pctRecommend = reviews.length
    ? Math.round(reviews.filter((r) => r.would_recommend).length / reviews.length * 100)
    : 0

  return (
    <div className="container-page py-10">
      <div className="flex items-start gap-6 mb-10">
        <Avatar name={teacher.name} size="lg" />
        <div>
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-1">{teacher.name}</h1>
          <p className="text-slate-400 text-sm">{reviews.length} avaliações</p>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={avgOf('rating_general')} />
              <span className="font-bold text-slate-900">{avgOf('rating_general').toFixed(1)}</span>
              <span className="text-slate-400 text-sm">nota geral</span>
            </div>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Didática', value: avgOf('rating_didactics') },
            { label: 'Organização', value: avgOf('rating_organization') },
            { label: 'Carga', value: avgOf('rating_workload') },
            { label: 'Dificuldade', value: avgOf('rating_difficulty') },
            { label: 'Recomenda', value: pctRecommend, suffix: '%' },
          ].map((m) => (
            <Card key={m.label} className="text-center py-4">
              <div className="font-display text-2xl font-bold text-slate-900">
                {m.suffix ? m.value : m.value.toFixed(1)}{m.suffix ?? ''}
              </div>
              <div className="text-xs text-slate-400 mt-1">{m.label}</div>
            </Card>
          ))}
        </div>
      )}

      {subjects.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Disciplinas lecionadas</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => s && (
              <Link key={(s as { id: string }).id} href={`/disciplina/${(s as { id: string }).id}`}>
                <Badge variant="info" className="cursor-pointer hover:bg-brand-100 transition-colors py-1.5 px-3 text-sm">
                  {(s as { name: string }).name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-slate-900">Avaliações</h2>
          <Link
            href="/avaliar"
            className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-400">Nenhuma avaliação ainda.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    {review.subject && (
                      <Link href={`/disciplina/${(review.subject as { id: string }).id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                        {(review.subject as { name: string }).name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating_general} size="sm" />
                      <span className="text-sm font-bold">{review.rating_general}/5</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {review.would_recommend && <Badge variant="success">Recomenda</Badge>}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                )}
                <p className="text-xs text-slate-300 mt-3">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Testar**

Navegar até `/professor/[id]` de qualquer professor (após adicionar um via admin).

- [ ] **Step 4: Commit final**

```bash
git add src/app/professor src/lib/queries/teachers.ts
git commit -m "feat: add teacher profile page with stats and reviews"
```

---

## Self-Review

**Spec coverage:**

| Requisito | Task |
|---|---|
| Next.js App Router + TS + Tailwind | Task 1 |
| Supabase client (browser + server + middleware) | Task 2 |
| Todas as tabelas + RLS + triggers | Task 3 |
| Seed BES 2023 | Task 4 |
| Seed ADS 2023 + eletivas EAD | Task 5 |
| Design system (tokens, Button, Badge, Card, Avatar, StarRating) | Task 6 |
| Layout (Header, Footer, root layout) | Task 7 |
| Home page (hero + course cards) | Task 8 |
| `/curso/[codigo]` | Task 9 |
| `/disciplina/[id]` | Task 10 |
| `/professor/[id]` | Task 11 |
| RLS: público lê só `publicada` | Task 3 |
| RLS: autor_id nunca exposto publicamente | Task 3 + queries sem retornar author_id |
| Campos EAD extras (had_in_person_event, relevant_to_course) | Task 3 + Task 10 |

**Gaps identificados e aceitos para próximas fases:**
- Auth (login OTP) → Fase 2
- Formulário de avaliação → Fase 2
- Busca → Fase 3
- Painel /painel-interno → Fase 4
- Monte sua grade → Fase 5
