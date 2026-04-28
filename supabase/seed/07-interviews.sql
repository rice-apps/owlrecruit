-- Seed interview records
-- form_responses: free-form Q&A pairs stored as jsonb array

INSERT INTO public.interviews (id, application_id, interviewer_id, form_responses, interview_date, round_number) VALUES
  -- Interview for Bob's Software Engineer application (interviewing status)
  (
    '00000007-0000-0000-0000-000000000001',
    '00000005-1000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000003', -- interviewer user
    '[
      {"question": "Tell us about yourself.", "answer": "I am a junior CS major focused on mobile development."},
      {"question": "What is your greatest technical achievement?", "answer": "Built an Android app that reached 500 downloads."},
      {"question": "How do you handle tight deadlines?", "answer": "I break tasks into milestones and communicate blockers early."}
    ]'::jsonb,
    now() + interval '3 days',
    1
  ),
  -- Interview for Frank's Marketing Lead application
  (
    '00000007-0000-0000-0000-000000000002',
    '00000005-1000-0000-0000-000000000008',
    '00000001-0000-0000-0000-000000000003',
    '[
      {"question": "Describe a successful marketing campaign you ran.", "answer": "Launched a TikTok campaign that gained 50k impressions in 48 hours."}
    ]'::jsonb,
    now() + interval '5 days',
    1
  )
ON CONFLICT (id) DO NOTHING;

-- Comment seeding for review sidebar testing
INSERT INTO public.comments (id, application_id, user_id, content) VALUES
  -- Comments on Alice's Software Engineer application
  (
    '00000007-1000-0000-0000-000000000001',
    '00000005-1000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000002',
    'Strong technical background. Recommend moving forward.'
  ),
  (
    '00000007-1000-0000-0000-000000000002',
    '00000005-1000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000003',
    'Great culture fit based on portfolio review. +1 to proceed.'
  ),
  -- Comment on Bob's application
  (
    '00000007-1000-0000-0000-000000000003',
    '00000005-1000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000002',
    'Solid mobile experience. Needs more web background. Scheduling interview to assess.'
  )
ON CONFLICT (id) DO NOTHING;
