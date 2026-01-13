-- Fix 1: Restrict profiles to authenticated users only
-- Since the app doesn't use public profile viewing, restrict to authenticated users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" 
  ON profiles FOR SELECT TO authenticated 
  USING (true);

-- Fix 2: Add length validation trigger for posts table
-- Using trigger instead of CHECK constraints for better error messages and flexibility
CREATE OR REPLACE FUNCTION public.validate_post_length()
RETURNS TRIGGER AS $$
BEGIN
  IF char_length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Title must be 200 characters or less';
  END IF;
  IF NEW.excerpt IS NOT NULL AND char_length(NEW.excerpt) > 500 THEN
    RAISE EXCEPTION 'Excerpt must be 500 characters or less';
  END IF;
  IF char_length(NEW.content) > 50000 THEN
    RAISE EXCEPTION 'Content must be 50,000 characters or less';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_post_length
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_length();