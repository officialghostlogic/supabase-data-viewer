
-- Unique index on works.accession_number for upsert support (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS works_accession_number_unique 
ON public.works(accession_number) 
WHERE accession_number IS NOT NULL;

-- Create artwork-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artwork-images', 'artwork-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for artwork-images
CREATE POLICY "Public read artwork-images" ON storage.objects
FOR SELECT USING (bucket_id = 'artwork-images');

-- Allow uploads to artwork-images
CREATE POLICY "Allow uploads artwork-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'artwork-images');

-- Allow updates to artwork-images
CREATE POLICY "Allow updates artwork-images" ON storage.objects
FOR UPDATE USING (bucket_id = 'artwork-images');

-- Allow deletes from artwork-images
CREATE POLICY "Allow deletes artwork-images" ON storage.objects
FOR DELETE USING (bucket_id = 'artwork-images');
