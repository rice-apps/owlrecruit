-- =============================================================================
-- 1. create_org_with_admin
--    Atomically creates an org and assigns the creator as admin.
-- =============================================================================

CREATE OR REPLACE FUNCTION create_org_with_admin(
  org_name TEXT,
  org_description TEXT,
  creator_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
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


-- =============================================================================
-- 2. replace_opening_questions
--    Atomically deletes existing questions and inserts new ones.
--    Accepts a JSON array: [{ "question_text": "...", "is_required": bool, "sort_order": int }]
-- =============================================================================

CREATE OR REPLACE FUNCTION replace_opening_questions(
  target_opening_id UUID,
  questions_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  inserted JSONB;
BEGIN
  -- Delete existing questions for this opening
  DELETE FROM questions WHERE opening_id = target_opening_id;

  -- If the array is empty or null, return early
  IF questions_json IS NULL OR jsonb_array_length(questions_json) = 0 THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Insert new questions and capture the result
  WITH inserted_rows AS (
    INSERT INTO questions (opening_id, question_text, is_required, sort_order)
    SELECT
      target_opening_id,
      (elem->>'question_text')::TEXT,
      (elem->>'is_required')::BOOLEAN,
      (elem->>'sort_order')::INT
    FROM jsonb_array_elements(questions_json) AS elem
    RETURNING *
  )
  SELECT jsonb_agg(row_to_json(inserted_rows)) INTO inserted FROM inserted_rows;

  RETURN COALESCE(inserted, '[]'::JSONB);
END;
$$;
