-- Fix create_org_with_admin function parameter order
DROP FUNCTION IF EXISTS public.create_org_with_admin(TEXT, TEXT, UUID);

CREATE FUNCTION public.create_org_with_admin(
  creator_id UUID,
  org_description TEXT,
  org_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO orgs (name, description)
    VALUES (org_name, org_description)
    RETURNING id INTO new_org_id;

  INSERT INTO org_members (org_id, user_id, role)
    VALUES (new_org_id, creator_id, 'admin');

  RETURN new_org_id;
END;
$$;
