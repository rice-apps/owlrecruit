-- Clear all test data in reverse dependency order
-- Safe to run multiple times (idempotent)

TRUNCATE TABLE
  public.interviews,
  public.application_reviews,
  public.comments,
  public.applications,
  public.questions,
  public.openings,
  public.org_members,
  public.orgs,
  public.applicants,
  public.users
CASCADE;

-- Remove test auth users (identified by test email domain)
DELETE FROM auth.users WHERE email LIKE '%@test.owlrecruit.local';
