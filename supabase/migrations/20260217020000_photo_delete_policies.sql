-- =============================================
-- Photo Delete Policies
-- Allow public delete for fotos_invitados table
-- and fotos-invitados storage bucket.
-- Access control is handled at the frontend level
-- (guests can only delete their own, admins can delete any).
-- =============================================

-- Allow delete on fotos_invitados table
DROP POLICY IF EXISTS "Public delete access on fotos_invitados" ON fotos_invitados;
CREATE POLICY "Public delete access on fotos_invitados"
  ON fotos_invitados FOR DELETE
  USING (true);

-- Allow delete on fotos-invitados storage bucket
DROP POLICY IF EXISTS "Public delete fotos-invitados" ON storage.objects;
CREATE POLICY "Public delete fotos-invitados"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fotos-invitados');
