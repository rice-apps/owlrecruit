-- Seed organizations

INSERT INTO public.orgs (id, name, description) VALUES
  (
    '00000002-0000-0000-0000-000000000001',
    'Rice Student Orgs',
    'Umbrella organization for Rice University student groups.'
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    'HackRice Planning',
    'Organizing committee for the HackRice hackathon.'
  )
ON CONFLICT (id) DO NOTHING;
