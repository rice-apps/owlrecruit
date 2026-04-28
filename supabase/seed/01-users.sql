-- Seed auth users and corresponding public.users records
-- Test user emails use @test.owlrecruit.local domain to avoid collisions
--
-- Test credentials:
--   admin@test.owlrecruit.local       / TestPassword123!  (org admin)
--   reviewer@test.owlrecruit.local    / TestPassword123!  (org reviewer)
--   interviewer@test.owlrecruit.local / TestPassword123!  (interviewer)
--   applicant1@test.owlrecruit.local  / TestPassword123!  (applicant with accepted offer)
--   applicant2@test.owlrecruit.local  / TestPassword123!  (applicant under review)

-- Fixed UUIDs for deterministic seeding
DO $$
DECLARE
  admin_auth_id     UUID := '00000001-0000-0000-0000-000000000001';
  reviewer_auth_id  UUID := '00000001-0000-0000-0000-000000000002';
  interviewer_auth_id UUID := '00000001-0000-0000-0000-000000000003';
  app1_auth_id      UUID := '00000001-0000-0000-0000-000000000004';
  app2_auth_id      UUID := '00000001-0000-0000-0000-000000000005';
BEGIN
  -- Insert public.users FIRST with the correct display names and net_ids.
  -- Temporarily bypass the FK (id references auth.users.id) so we can insert
  -- before auth.users. The FK is satisfied once auth.users is inserted below.
  EXECUTE 'SET LOCAL session_replication_role = replica';

  INSERT INTO public.users (id, name, net_id, email) VALUES
    (admin_auth_id,       'Admin User',       'admin001',    'admin@test.owlrecruit.local'),
    (reviewer_auth_id,    'Reviewer User',    'reviewer001', 'reviewer@test.owlrecruit.local'),
    (interviewer_auth_id, 'Interviewer User', 'inter001',    'interviewer@test.owlrecruit.local'),
    (app1_auth_id,        'Alice Applicant',  'alice001',    'applicant1@test.owlrecruit.local'),
    (app2_auth_id,        'Bob Applicant',    'bob001',      'applicant2@test.owlrecruit.local')
  ON CONFLICT (id) DO UPDATE SET
    name   = EXCLUDED.name,
    net_id = EXCLUDED.net_id,
    email  = EXCLUDED.email;

  -- Restore normal replication role so triggers fire for auth.users inserts.
  EXECUTE 'SET LOCAL session_replication_role = DEFAULT';

  -- Insert auth.users. The handle_new_user trigger fires for each row but finds
  -- the public.users row already exists (ON CONFLICT DO NOTHING in trigger) so
  -- the correct net_ids set above are preserved.
  -- Notes:
  --   instance_id = '00000000-...' — GoTrue filters by it; NULL means GoTrue can't find the user
  --   Token columns (confirmation_token etc.) default to '' not NULL — GoTrue's Go struct
  --   uses string (not *string) and panics on NULL scan
  INSERT INTO auth.users (
    id, instance_id, email, email_confirmed_at, encrypted_password,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    created_at, updated_at, aud, role
  ) VALUES
    (admin_auth_id,       '00000000-0000-0000-0000-000000000000', 'admin@test.owlrecruit.local',       now(), extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now(), 'authenticated', 'authenticated'),
    (reviewer_auth_id,    '00000000-0000-0000-0000-000000000000', 'reviewer@test.owlrecruit.local',    now(), extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now(), 'authenticated', 'authenticated'),
    (interviewer_auth_id, '00000000-0000-0000-0000-000000000000', 'interviewer@test.owlrecruit.local', now(), extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now(), 'authenticated', 'authenticated'),
    (app1_auth_id,        '00000000-0000-0000-0000-000000000000', 'applicant1@test.owlrecruit.local',  now(), extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now(), 'authenticated', 'authenticated'),
    (app2_auth_id,        '00000000-0000-0000-0000-000000000000', 'applicant2@test.owlrecruit.local',  now(), extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Insert auth.identities (required by GoTrue ≥ v2.x for email/password sign-in).
  -- provider_id must be the user UUID (not the email) and identity_data must include
  -- email_verified/phone_verified — matching what GoTrue writes via its admin API.
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at) VALUES
    (gen_random_uuid(), admin_auth_id,       admin_auth_id::text,       'email', jsonb_build_object('sub', admin_auth_id::text,       'email', 'admin@test.owlrecruit.local',       'email_verified', true, 'phone_verified', false), now(), now()),
    (gen_random_uuid(), reviewer_auth_id,    reviewer_auth_id::text,    'email', jsonb_build_object('sub', reviewer_auth_id::text,    'email', 'reviewer@test.owlrecruit.local',    'email_verified', true, 'phone_verified', false), now(), now()),
    (gen_random_uuid(), interviewer_auth_id, interviewer_auth_id::text, 'email', jsonb_build_object('sub', interviewer_auth_id::text, 'email', 'interviewer@test.owlrecruit.local', 'email_verified', true, 'phone_verified', false), now(), now()),
    (gen_random_uuid(), app1_auth_id,        app1_auth_id::text,        'email', jsonb_build_object('sub', app1_auth_id::text,        'email', 'applicant1@test.owlrecruit.local',  'email_verified', true, 'phone_verified', false), now(), now()),
    (gen_random_uuid(), app2_auth_id,        app2_auth_id::text,        'email', jsonb_build_object('sub', app2_auth_id::text,        'email', 'applicant2@test.owlrecruit.local',  'email_verified', true, 'phone_verified', false), now(), now())
  ON CONFLICT (provider_id, provider) DO NOTHING;
END $$;
