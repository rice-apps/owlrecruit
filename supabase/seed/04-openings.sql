-- Seed openings and their questions
-- opening_status enum: 'draft' | 'open' | 'closed'
-- rubric format: array of {name: text, max_val: integer}

INSERT INTO public.openings (id, org_id, title, description, status, closes_at, rubric) VALUES
  (
    '00000004-0000-0000-0000-000000000001',
    '00000002-0000-0000-0000-000000000001',
    'Software Engineer',
    'Join our engineering team to build web applications for Rice student organizations.',
    'open',
    now() + interval '30 days',
    '[{"name": "Technical Skills", "max_val": 5}, {"name": "Communication", "max_val": 5}, {"name": "Culture Fit", "max_val": 5}]'::jsonb
  ),
  (
    '00000004-0000-0000-0000-000000000002',
    '00000002-0000-0000-0000-000000000001',
    'UX Designer',
    'Help design intuitive interfaces for our recruitment platform.',
    'draft',
    now() + interval '60 days',
    '[{"name": "Design Portfolio", "max_val": 5}, {"name": "UX Process", "max_val": 5}]'::jsonb
  ),
  (
    '00000004-0000-0000-0000-000000000003',
    '00000002-0000-0000-0000-000000000001',
    'Finance Intern',
    'Assist with budgeting and financial reporting for student org events.',
    'closed',
    now() - interval '7 days',
    '[{"name": "Finance Knowledge", "max_val": 5}, {"name": "Attention to Detail", "max_val": 5}]'::jsonb
  ),
  (
    '00000004-0000-0000-0000-000000000004',
    '00000002-0000-0000-0000-000000000002',
    'Event Coordinator',
    'Coordinate logistics for HackRice hackathon events.',
    'open',
    now() + interval '14 days',
    '[{"name": "Organization", "max_val": 5}, {"name": "Leadership", "max_val": 5}]'::jsonb
  ),
  (
    '00000004-0000-0000-0000-000000000005',
    '00000002-0000-0000-0000-000000000002',
    'Marketing Lead',
    'Drive social media and outreach strategy for HackRice.',
    'open',
    now() + interval '21 days',
    '[{"name": "Marketing Experience", "max_val": 5}, {"name": "Creativity", "max_val": 5}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Reviewers for openings (Software Engineer: reviewer + interviewer; Finance Intern: reviewer; Marketing Lead: reviewer)
INSERT INTO public.opening_reviewers (opening_id, user_id) VALUES
  ('00000004-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000002'),
  ('00000004-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000003'),
  ('00000004-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000002'),
  ('00000004-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002')
ON CONFLICT (opening_id, user_id) DO NOTHING;

-- Questions for Software Engineer opening
INSERT INTO public.questions (id, opening_id, question_text, sort_order, is_required) VALUES
  ('00000004-1000-0000-0000-000000000001', '00000004-0000-0000-0000-000000000001', 'What programming languages are you most comfortable with?', 0, true),
  ('00000004-1000-0000-0000-000000000002', '00000004-0000-0000-0000-000000000001', 'Describe a technical project you are proud of.', 1, true),
  ('00000004-1000-0000-0000-000000000003', '00000004-0000-0000-0000-000000000001', 'Why do you want to work with student organizations?', 2, false)
ON CONFLICT (id) DO NOTHING;

-- Questions for UX Designer opening
INSERT INTO public.questions (id, opening_id, question_text, sort_order, is_required) VALUES
  ('00000004-1000-0000-0000-000000000004', '00000004-0000-0000-0000-000000000002', 'Share a link to your design portfolio.', 0, true),
  ('00000004-1000-0000-0000-000000000005', '00000004-0000-0000-0000-000000000002', 'Describe your UX research process.', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Questions for Event Coordinator opening
INSERT INTO public.questions (id, opening_id, question_text, sort_order, is_required) VALUES
  ('00000004-1000-0000-0000-000000000006', '00000004-0000-0000-0000-000000000004', 'Describe an event you have coordinated previously.', 0, true),
  ('00000004-1000-0000-0000-000000000007', '00000004-0000-0000-0000-000000000004', 'How do you handle last-minute changes to event plans?', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Research Assistant opening — used by apply-form integration tests (dot-labeled questions).
INSERT INTO public.openings (id, org_id, title, description, status, closes_at, rubric) VALUES
  (
    '00000004-0000-0000-0000-000000000006',
    '00000002-0000-0000-0000-000000000001',
    'Research Assistant',
    'Assist with ongoing research projects.',
    'open',
    now() + interval '30 days',
    '[{"name": "Research Skills", "max_val": 5}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (id, opening_id, question_text, sort_order, is_required) VALUES
  ('00000004-1000-0000-0000-000000000008', '00000004-0000-0000-0000-000000000006', '{"label":"Tell us about yourself.","type":"textarea","options":null}', 0, true),
  ('00000004-1000-0000-0000-000000000009', '00000004-0000-0000-0000-000000000006', '{"label":"GPA (0.0–4.0)","type":"text","options":null}', 1, false)
ON CONFLICT (id) DO NOTHING;
