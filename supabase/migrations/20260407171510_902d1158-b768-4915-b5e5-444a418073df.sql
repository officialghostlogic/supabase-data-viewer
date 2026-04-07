INSERT INTO storage.buckets (id, name, public) VALUES ('work-images', 'work-images', true);

CREATE POLICY "Public read access for work-images" ON storage.objects FOR SELECT USING (bucket_id = 'work-images');

CREATE POLICY "Allow uploads to work-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'work-images');

CREATE POLICY "Allow updates to work-images" ON storage.objects FOR UPDATE USING (bucket_id = 'work-images');

CREATE POLICY "Allow deletes from work-images" ON storage.objects FOR DELETE USING (bucket_id = 'work-images');