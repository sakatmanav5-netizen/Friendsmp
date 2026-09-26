DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
DROP POLICY IF EXISTS "settings staff read" ON public.site_settings;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon USING (key = 'content');
CREATE POLICY "settings staff read" ON public.site_settings FOR SELECT TO authenticated USING (key = 'content');