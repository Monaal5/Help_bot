-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

-- Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 