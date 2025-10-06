-- Seed Data for Development
-- Creates a test user organization link for development

-- Note: In production, this would be handled by the auth flow
-- For now, we'll create a mapping for anonymous users to access the base scenario

-- Insert a test user_organization mapping
-- This assumes there's an existing organization with id a0000000-0000-0000-0000-000000000001
-- and allows access without requiring actual auth

-- We can't insert auth.users directly (managed by Supabase Auth)
-- Instead, we'll create a function that allows bypassing RLS for development

-- Create a development bypass function
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS UUID AS $$
BEGIN
  -- In development, return the default organization
  -- In production, this should use auth.uid()
  IF auth.uid() IS NULL THEN
    RETURN 'a0000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  RETURN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: For actual user auth, you'll need to:
-- 1. Create users via Supabase Auth dashboard or API
-- 2. Insert corresponding user_organizations records
-- Example:
-- INSERT INTO user_organizations (user_id, organization_id, role)
-- VALUES ('your-auth-user-id', 'a0000000-0000-0000-0000-000000000001', 'owner');
