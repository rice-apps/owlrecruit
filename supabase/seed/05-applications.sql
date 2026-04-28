-- Seed applicants (net_id-based records) and applications
-- application status enum: 'No Status' | 'Applied' | 'Interviewing' | 'Offer' | 'Accepted Offer' | 'Rejected'
--
-- Scenarios covered:
--   alice001 -> Software Engineer: status='Accepted Offer' (linked auth user)
--   bob001   -> Software Engineer: status='Interviewing'  (linked auth user)
--   charlie002 -> Software Engineer: status='No Status'   (no auth account)
--   alice001 -> Finance Intern: status='Rejected'
--   dave003  -> Finance Intern: status='Accepted Offer'
--   alice001 -> Event Coordinator: status='Applied'
--   eve004   -> Marketing Lead: status='Applied'
--   frank005 -> Marketing Lead: status='Interviewing'

-- Applicants (net_id-based, may or may not have auth accounts)
INSERT INTO public.applicants (id, net_id, name) VALUES
  -- These match auth-linked users above
  ('00000005-0000-0000-0000-000000000001', 'alice001', 'Alice Applicant'),
  ('00000005-0000-0000-0000-000000000002', 'bob001',   'Bob Applicant'),
  -- These have no auth accounts (uploaded via CSV scenario)
  ('00000005-0000-0000-0000-000000000003', 'charlie002', 'Charlie Chen'),
  ('00000005-0000-0000-0000-000000000004', 'dave003',    'Dave Davis'),
  ('00000005-0000-0000-0000-000000000005', 'eve004',     'Eve Evans'),
  ('00000005-0000-0000-0000-000000000006', 'frank005',   'Frank Foster')
ON CONFLICT (id) DO NOTHING;

-- Applications
INSERT INTO public.applications (id, opening_id, applicant_id, user_id, form_responses, status) VALUES
  -- Software Engineer opening (has 3 applicants in various states)
  (
    '00000005-1000-0000-0000-000000000001',
    '00000004-0000-0000-0000-000000000001',
    '00000005-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004', -- alice's auth user id
    '{"00000004-1000-0000-0000-000000000001": "Python, TypeScript, Go", "00000004-1000-0000-0000-000000000002": "Built a full-stack recruitment platform for my university.", "00000004-1000-0000-0000-000000000003": "I want to give back to the student community."}'::jsonb,
    'Accepted Offer'
  ),
  (
    '00000005-1000-0000-0000-000000000002',
    '00000004-0000-0000-0000-000000000001',
    '00000005-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000005', -- bob's auth user id
    '{"00000004-1000-0000-0000-000000000001": "Java, Kotlin", "00000004-1000-0000-0000-000000000002": "Developed an Android app with 500+ downloads.", "00000004-1000-0000-0000-000000000003": "Passionate about improving student life."}'::jsonb,
    'Interviewing'
  ),
  (
    '00000005-1000-0000-0000-000000000003',
    '00000004-0000-0000-0000-000000000001',
    '00000005-0000-0000-0000-000000000003',
    NULL, -- no auth account (CSV-uploaded)
    '{"00000004-1000-0000-0000-000000000001": "C++, Rust", "00000004-1000-0000-0000-000000000002": "Systems programming for embedded devices."}'::jsonb,
    'No Status'
  ),

  -- Finance Intern opening (closed, 2 applicants)
  (
    '00000005-1000-0000-0000-000000000004',
    '00000004-0000-0000-0000-000000000003',
    '00000005-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    '{"reason": "I have experience with QuickBooks and nonprofit budgeting."}'::jsonb,
    'Rejected'
  ),
  (
    '00000005-1000-0000-0000-000000000005',
    '00000004-0000-0000-0000-000000000003',
    '00000005-0000-0000-0000-000000000004',
    NULL,
    '{"reason": "Finance major with internship experience at a Big 4 firm."}'::jsonb,
    'Accepted Offer'
  ),

  -- Event Coordinator opening (1 applicant, no reviews yet)
  (
    '00000005-1000-0000-0000-000000000006',
    '00000004-0000-0000-0000-000000000004',
    '00000005-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    '{"00000004-1000-0000-0000-000000000006": "Organized three campus events with 200+ attendees.", "00000004-1000-0000-0000-000000000007": "I keep a backup plan for every critical path item."}'::jsonb,
    'Applied'
  ),

  -- Marketing Lead opening (2 applicants, 1 with interview)
  (
    '00000005-1000-0000-0000-000000000007',
    '00000004-0000-0000-0000-000000000005',
    '00000005-0000-0000-0000-000000000005',
    NULL,
    '{"reason": "Managed social media for a 10k-follower brand."}'::jsonb,
    'Applied'
  ),
  (
    '00000005-1000-0000-0000-000000000008',
    '00000004-0000-0000-0000-000000000005',
    '00000005-0000-0000-0000-000000000006',
    NULL,
    '{"reason": "Content creator with experience in viral campaigns."}'::jsonb,
    'Interviewing'
  )
ON CONFLICT (id) DO NOTHING;

-- CSV-uploaded scenario: bob001 (applicant2's net_id) applied to Marketing Lead with no user_id.
-- This tests that GET /api/openings correctly detects "already applied" via the applicant_id
-- lookup chain (net_id), NOT via user_id — for applications that were CSV-uploaded.
INSERT INTO public.applications (id, opening_id, applicant_id, user_id, form_responses, status) VALUES
  (
    '00000005-1000-0000-0000-000000000009',
    '00000004-0000-0000-0000-000000000005', -- Marketing Lead (ORG_2, open)
    '00000005-0000-0000-0000-000000000002', -- bob001 applicant record
    NULL,                                   -- no user_id: simulates CSV upload
    '{"reason": "Interested in marketing."}'::jsonb,
    'No Status'
  )
ON CONFLICT (id) DO NOTHING;
