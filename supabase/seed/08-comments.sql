-- Seed comments for application reviews
INSERT INTO public.comments (id, application_id, user_id, content) VALUES
  (
    '00000008-0000-0000-0000-000000000001',
    '00000005-1000-0000-0000-000000000001', -- Alice's SE application
    '00000001-0000-0000-0000-000000000002', -- reviewer
    'Strong technical background with excellent project history.'
  ),
  (
    '00000008-0000-0000-0000-000000000002',
    '00000005-1000-0000-0000-000000000001', -- Alice's SE application
    '00000001-0000-0000-0000-000000000003', -- interviewer
    'Great culture fit, enthusiastic about student org mission.'
  ),
  (
    '00000008-0000-0000-0000-000000000003',
    '00000005-1000-0000-0000-000000000002', -- Bob's SE application
    '00000001-0000-0000-0000-000000000002', -- reviewer
    'Solid Android experience, needs improvement in communication skills.'
  )
ON CONFLICT (id) DO NOTHING;
