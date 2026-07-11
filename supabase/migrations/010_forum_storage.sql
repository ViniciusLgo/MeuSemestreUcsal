-- Bucket público para anexos do fórum
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-attachments',
  'forum-attachments',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Qualquer usuário autenticado pode fazer upload
CREATE POLICY "forum_attachments_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'forum-attachments');

-- Leitura pública
CREATE POLICY "forum_attachments_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'forum-attachments');

-- Dono pode deletar seu próprio arquivo
CREATE POLICY "forum_attachments_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'forum-attachments' AND owner_id = auth.uid()::text);
