-- Schema improvements
--
-- 1. Unique constraint on applications(opening_id, applicant_id)
-- 2. Replace openings.reviewer_ids jsonb with opening_reviewers join table
-- 3. Convert openings.rubric from jsonb[] to jsonb
-- 4. Unique constraint on org_members(org_id, user_id)

-- 1. Unique constraint on applications
ALTER TABLE public.applications
  ADD CONSTRAINT applications_opening_applicant_unique UNIQUE (opening_id, applicant_id);

-- 2a. Create opening_reviewers join table
CREATE TABLE public.opening_reviewers (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  opening_id uuid NOT NULL,
  user_id    uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT opening_reviewers_pkey PRIMARY KEY (id),
  CONSTRAINT opening_reviewers_opening_fkey FOREIGN KEY (opening_id)
    REFERENCES public.openings(id) ON DELETE CASCADE,
  CONSTRAINT opening_reviewers_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT opening_reviewers_unique UNIQUE (opening_id, user_id)
);

ALTER TABLE public.opening_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opening_reviewers: org members can read"
  ON public.opening_reviewers FOR SELECT TO authenticated
  USING (is_org_member((SELECT org_id FROM public.openings WHERE id = opening_id)));

CREATE POLICY "opening_reviewers: admins can insert"
  ON public.opening_reviewers FOR INSERT TO authenticated
  WITH CHECK (is_org_admin((SELECT org_id FROM public.openings WHERE id = opening_id)));

CREATE POLICY "opening_reviewers: admins can delete"
  ON public.opening_reviewers FOR DELETE TO authenticated
  USING (is_org_admin((SELECT org_id FROM public.openings WHERE id = opening_id)));

-- 2b. Migrate existing reviewer_ids data to opening_reviewers
INSERT INTO public.opening_reviewers (opening_id, user_id)
SELECT id, (jsonb_array_elements_text(reviewer_ids))::uuid
FROM public.openings
WHERE reviewer_ids IS NOT NULL AND jsonb_array_length(reviewer_ids) > 0;

-- 2c. Drop reviewer_ids column
ALTER TABLE public.openings DROP COLUMN reviewer_ids;

-- 3. Convert rubric from jsonb[] to jsonb
ALTER TABLE public.openings
  ALTER COLUMN rubric TYPE jsonb USING to_jsonb(rubric);

-- 4. Unique constraint on org_members
ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_org_user_unique UNIQUE (org_id, user_id);

-- 5. Allow unauthenticated (anon) users to read open openings (public discover page)
CREATE POLICY "openings: anon can read open openings"
  ON public.openings FOR SELECT TO anon
  USING (status = 'open');

-- 6. Allow applicants to read their own CSV-uploaded applications (where user_id is NULL)
--    by matching applicant_id via the net_id lookup chain.
DROP POLICY IF EXISTS "applications: users can read own, org members can read all" ON public.applications;
CREATE POLICY "applications: users can read own, org members can read all"
  ON public.applications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_org_member((SELECT org_id FROM public.openings WHERE id = opening_id))
    OR applicant_id IN (
      SELECT a.id FROM public.applicants a
      INNER JOIN public.users u ON u.net_id = a.net_id
      WHERE u.id = auth.uid()
    )
  );

