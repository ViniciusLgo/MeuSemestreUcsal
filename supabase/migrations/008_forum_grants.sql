-- Grants para as tabelas do fórum
-- GRANT SELECT ON ALL TABLES do 003_grants.sql só cobre tabelas existentes na época.
-- Este migration garante os grants para as tabelas criadas no 007_forum.sql.

GRANT SELECT ON forum_categories TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  forum_threads,
  forum_posts,
  forum_thread_identities,
  forum_polls,
  forum_poll_options,
  forum_poll_votes,
  forum_attachments,
  forum_reports,
  forum_reactions,
  forum_categories
TO authenticated;
