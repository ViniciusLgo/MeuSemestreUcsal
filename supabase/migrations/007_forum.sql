-- =====================
-- FÓRUM — TABELAS
-- =====================

-- Categorias criadas pelo admin
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  slug TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Threads (tópicos)
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
  subject_id  UUID REFERENCES subjects(id)  ON DELETE SET NULL,
  teacher_id  UUID REFERENCES teachers(id)  ON DELETE SET NULL,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'publicado'
                CHECK (status IN ('publicado', 'em_revisao', 'oculto')),
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT thread_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT thread_body_length  CHECK (char_length(body)  <= 5000)
);

-- Posts (respostas dentro de uma thread)
CREATE TABLE forum_posts (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body      TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'publicado'
              CHECK (status IN ('publicado', 'em_revisao', 'oculto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_body_length CHECK (char_length(body) <= 2000)
);

-- Identidade anônima: cada usuário tem um nickname único por thread
CREATE TABLE forum_thread_identities (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  nickname  TEXT NOT NULL,
  color     TEXT NOT NULL,
  UNIQUE(thread_id, user_id)
);

-- Enquetes (opcional por thread, 1:1)
CREATE TABLE forum_polls (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL UNIQUE REFERENCES forum_threads(id) ON DELETE CASCADE,
  question  TEXT NOT NULL,
  ends_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE forum_poll_options (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Votos: 1 por usuário por enquete
CREATE TABLE forum_poll_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Anexos (Supabase Storage)
CREATE TABLE forum_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  post_id      UUID REFERENCES forum_posts(id)   ON DELETE CASCADE,
  uploader_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attachment_has_parent CHECK (
    (thread_id IS NOT NULL AND post_id IS NULL) OR
    (post_id IS NOT NULL AND thread_id IS NULL)
  )
);

-- Denúncias de threads e posts
CREATE TABLE forum_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES forum_posts(id)   ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_has_target CHECK (
    (thread_id IS NOT NULL) OR (post_id IS NOT NULL)
  )
);

-- Reações (like simples)
CREATE TABLE forum_reactions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  post_id   UUID REFERENCES forum_posts(id)   ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, post_id, user_id),
  CONSTRAINT reaction_has_target CHECK (
    (thread_id IS NOT NULL AND post_id IS NULL) OR
    (post_id IS NOT NULL AND thread_id IS NULL)
  )
);

-- =====================
-- VIEW PÚBLICA (sem author_id)
-- =====================

-- Expõe threads sem revelar o author_id real — queries públicas devem usar esta view
CREATE VIEW forum_threads_public AS
SELECT
  id, category_id, subject_id, teacher_id,
  title, body, status, is_pinned, views,
  created_at, updated_at
FROM forum_threads;

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_forum_threads_category  ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_subject   ON forum_threads(subject_id);
CREATE INDEX idx_forum_threads_status    ON forum_threads(status);
CREATE INDEX idx_forum_threads_created   ON forum_threads(created_at DESC);
CREATE INDEX idx_forum_posts_thread      ON forum_posts(thread_id);
CREATE INDEX idx_forum_posts_parent      ON forum_posts(parent_id);
CREATE INDEX idx_forum_posts_status      ON forum_posts(status);
CREATE INDEX idx_forum_identities_thread ON forum_thread_identities(thread_id);
CREATE INDEX idx_forum_poll_votes_poll   ON forum_poll_votes(poll_id);
CREATE INDEX idx_forum_reactions_thread  ON forum_reactions(thread_id);
CREATE INDEX idx_forum_reactions_post    ON forum_reactions(post_id);

-- Full-text search nos títulos e corpos das threads
CREATE INDEX idx_forum_threads_fts ON forum_threads
  USING gin(to_tsvector('portuguese', title || ' ' || body));

-- =====================
-- TRIGGERS
-- =====================

CREATE TRIGGER trg_forum_threads_updated_at
  BEFORE UPDATE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- RLS
-- =====================

ALTER TABLE forum_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_polls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_options      ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_attachments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions         ENABLE ROW LEVEL SECURITY;

-- forum_categories: leitura pública (para exibir no /forum sem login)
CREATE POLICY "Anyone reads active categories"
  ON forum_categories FOR SELECT USING (active = TRUE);
CREATE POLICY "Admin manages categories"
  ON forum_categories FOR ALL USING (is_admin());

-- forum_threads: leitura só para logados; escrita para usuários ativos
CREATE POLICY "Logged users read published threads"
  ON forum_threads FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'publicado');
CREATE POLICY "Admin reads all threads"
  ON forum_threads FOR SELECT USING (is_admin());
CREATE POLICY "Active users create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (auth.uid() = author_id AND is_active_user());
CREATE POLICY "Author deletes own thread"
  ON forum_threads FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admin manages threads"
  ON forum_threads FOR ALL USING (is_admin());

-- forum_posts: mesmo padrão das threads
CREATE POLICY "Logged users read published posts"
  ON forum_posts FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'publicado');
CREATE POLICY "Admin reads all posts"
  ON forum_posts FOR SELECT USING (is_admin());
CREATE POLICY "Active users create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND is_active_user());
CREATE POLICY "Author deletes own post"
  ON forum_posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admin manages posts"
  ON forum_posts FOR ALL USING (is_admin());

-- forum_thread_identities: logados leem nickname+color; cada um insere o próprio
-- (a coluna user_id nunca deve ser retornada em queries públicas — use SELECT nickname, color apenas)
CREATE POLICY "Logged users read identities"
  ON forum_thread_identities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users insert own identity"
  ON forum_thread_identities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manages identities"
  ON forum_thread_identities FOR ALL USING (is_admin());

-- forum_polls e forum_poll_options: leitura para logados
CREATE POLICY "Logged users read polls"
  ON forum_polls FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages polls"
  ON forum_polls FOR ALL USING (is_admin());

CREATE POLICY "Logged users read poll options"
  ON forum_poll_options FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages poll options"
  ON forum_poll_options FOR ALL USING (is_admin());

-- forum_poll_votes: logados leem contagens; 1 voto por usuário
CREATE POLICY "Logged users read votes"
  ON forum_poll_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Active users vote once"
  ON forum_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_active_user());
CREATE POLICY "Admin manages votes"
  ON forum_poll_votes FOR ALL USING (is_admin());

-- forum_attachments
CREATE POLICY "Logged users read attachments"
  ON forum_attachments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Active users upload attachments"
  ON forum_attachments FOR INSERT WITH CHECK (auth.uid() = uploader_id AND is_active_user());
CREATE POLICY "Uploader deletes own attachment"
  ON forum_attachments FOR DELETE USING (auth.uid() = uploader_id);
CREATE POLICY "Admin manages attachments"
  ON forum_attachments FOR ALL USING (is_admin());

-- forum_reports
CREATE POLICY "Active users report content"
  ON forum_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id AND is_active_user());
CREATE POLICY "Admin manages reports"
  ON forum_reports FOR ALL USING (is_admin());

-- forum_reactions
CREATE POLICY "Logged users read reactions"
  ON forum_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Active users react"
  ON forum_reactions FOR INSERT WITH CHECK (auth.uid() = user_id AND is_active_user());
CREATE POLICY "Users remove own reaction"
  ON forum_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin manages reactions"
  ON forum_reactions FOR ALL USING (is_admin());

-- =====================
-- FUNÇÕES AUXILIARES
-- =====================

-- Incrementa views de forma segura (sem precisar de auth)
CREATE OR REPLACE FUNCTION increment_forum_views(thread_id UUID)
RETURNS VOID AS $$
  UPDATE forum_threads SET views = views + 1 WHERE id = thread_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================
-- SEED: CATEGORIAS INICIAIS
-- =====================

INSERT INTO forum_categories (name, description, icon, slug, "order") VALUES
  ('Geral',              'Assuntos variados do dia a dia acadêmico',      '💬', 'geral',      1),
  ('Dúvidas Acadêmicas', 'Tire suas dúvidas sobre disciplinas e provas',  '❓', 'duvidas',    2),
  ('Estágio e Mercado',  'Oportunidades, currículos e vida profissional',  '💼', 'estagio',    3),
  ('Desabafos',          'Espaço seguro para falar o que sente',          '😤', 'desabafos',  4),
  ('Projetos e Grupos',  'Forme equipes e divulgue seus projetos',        '🚀', 'projetos',   5);
