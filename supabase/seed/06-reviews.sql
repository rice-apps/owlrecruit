-- Seed application reviews (rubric scores per reviewer)
-- score_skills format matches rubric: {"criteria_name": score_value}

INSERT INTO public.application_reviews (id, application_id, reviewer_id, score_skills) VALUES
  -- Reviewer scores Alice's Software Engineer application
  (
    '00000006-0000-0000-0000-000000000001',
    '00000005-1000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000002', -- reviewer
    '{"Technical Skills": 5, "Communication": 4, "Culture Fit": 5}'::jsonb
  ),
  -- Interviewer also scores Alice's application
  (
    '00000006-0000-0000-0000-000000000002',
    '00000005-1000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000003', -- interviewer (also a reviewer member)
    '{"Technical Skills": 4, "Communication": 5, "Culture Fit": 4}'::jsonb
  ),
  -- Reviewer scores Bob's Software Engineer application
  (
    '00000006-0000-0000-0000-000000000003',
    '00000005-1000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000002',
    '{"Technical Skills": 3, "Communication": 3, "Culture Fit": 4}'::jsonb
  ),
  -- Reviewer scores Alice's Finance Intern application (rejected)
  (
    '00000006-0000-0000-0000-000000000004',
    '00000005-1000-0000-0000-000000000004',
    '00000001-0000-0000-0000-000000000002',
    '{"Finance Knowledge": 2, "Attention to Detail": 3}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
