ALTER TABLE public.projects ADD COLUMN template_image_id uuid REFERENCES public.template_images(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN library_theme text;
CREATE TABLE public.image_favorites (user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE, image_id uuid NOT NULL REFERENCES public.template_images(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,image_id));
GRANT SELECT,INSERT,DELETE ON public.image_favorites TO authenticated;
GRANT ALL ON public.image_favorites TO service_role;
ALTER TABLE public.image_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own image favorites" ON public.image_favorites FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Add own image favorites" ON public.image_favorites FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.template_images i JOIN public.templates t ON t.id=i.template_id WHERE i.id=image_id AND i.is_active AND t.is_active));
CREATE POLICY "Remove own image favorites" ON public.image_favorites FOR DELETE TO authenticated USING(user_id=auth.uid());