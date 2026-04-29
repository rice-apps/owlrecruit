-- Baseline migration: full schema from scratch

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.status AS ENUM (
  'No Status',
  'Applied',
  'Interviewing',
  'Offer',
  'Accepted Offer',
  'Rejected'
);

CREATE TYPE public.opening_status AS ENUM (
  'draft',
  'open',
  'closed'
);

CREATE TYPE public.org_role AS ENUM (
  'admin',
  'reviewer'
);

-- Tables (in dependency order)

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  net_id text NOT NULL,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_net_id_key UNIQUE (net_id),
  CONSTRAINT users_auth_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.applicants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  net_id text NOT NULL,
  name text,
  CONSTRAINT applicants_pkey PRIMARY KEY (id),
  CONSTRAINT applicants_net_id_key UNIQUE (net_id)
);

CREATE TABLE public.orgs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orgs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.org_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  role public.org_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT org_members_pkey PRIMARY KEY (id),
  CONSTRAINT org_members_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT org_members_org_fkey FOREIGN KEY (org_id) REFERENCES public.orgs(id)
);

CREATE TABLE public.openings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  application_link text,
  status public.opening_status DEFAULT 'open'::public.opening_status,
  closes_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rubric jsonb[],
  reviewer_ids jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT openings_pkey PRIMARY KEY (id),
  CONSTRAINT openings_org_fkey FOREIGN KEY (org_id) REFERENCES public.orgs(id)
);

CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  opening_id uuid NOT NULL,
  question_text text NOT NULL,
  sort_order integer DEFAULT 0,
  is_required boolean DEFAULT false,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_opening_fkey FOREIGN KEY (opening_id) REFERENCES public.openings(id)
);

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  opening_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  form_responses jsonb,
  resume_url text,
  status public.status DEFAULT 'No Status'::public.status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_opening_fkey FOREIGN KEY (opening_id) REFERENCES public.openings(id),
  CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.application_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  score_skills jsonb,
  CONSTRAINT application_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT application_reviews_application_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT application_reviews_reviewer_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id)
);

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_application_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT comments_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  interviewer_id uuid,
  form_responses jsonb,
  interview_date timestamp with time zone,
  round_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_application_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT interviews_interviewer_fkey FOREIGN KEY (interviewer_id) REFERENCES public.users(id)
);

-- RLS: enable on all tables
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews          ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS policies
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = p_org_id
    AND org_members.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = p_org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  );
$$;

-- RLS policies

-- users
CREATE POLICY "users: authenticated users can read any user"
  ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE TO authenticated USING (id = auth.uid());

-- applicants
CREATE POLICY "applicants: authenticated users can read"
  ON public.applicants FOR SELECT TO authenticated USING (true);
CREATE POLICY "applicants: authenticated users can insert"
  ON public.applicants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "applicants: authenticated users can update"
  ON public.applicants FOR UPDATE TO authenticated USING (true);

-- orgs
CREATE POLICY "orgs: authenticated users can read"
  ON public.orgs FOR SELECT TO authenticated USING (true);
CREATE POLICY "orgs: authenticated users can insert"
  ON public.orgs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orgs: admins can update"
  ON public.orgs FOR UPDATE TO authenticated USING (is_org_admin(id));

-- org_members
CREATE POLICY "org_members: members can read their own org"
  ON public.org_members FOR SELECT TO authenticated USING (is_org_member(org_id));
CREATE POLICY "org_members: admins can insert"
  ON public.org_members FOR INSERT TO authenticated WITH CHECK (is_org_admin(org_id));
CREATE POLICY "org_members: admins can update"
  ON public.org_members FOR UPDATE TO authenticated USING (is_org_admin(org_id));
CREATE POLICY "org_members: admins can delete, members can leave"
  ON public.org_members FOR DELETE TO authenticated USING (is_org_admin(org_id) OR user_id = auth.uid());

-- openings
CREATE POLICY "openings: authenticated users can read open openings"
  ON public.openings FOR SELECT TO authenticated
  USING (status = 'open' OR is_org_member(org_id));
CREATE POLICY "openings: admins can insert"
  ON public.openings FOR INSERT TO authenticated WITH CHECK (is_org_admin(org_id));
CREATE POLICY "openings: admins can update"
  ON public.openings FOR UPDATE TO authenticated USING (is_org_admin(org_id));
CREATE POLICY "openings: admins can delete"
  ON public.openings FOR DELETE TO authenticated USING (is_org_admin(org_id));

-- questions
CREATE POLICY "questions: authenticated users can read"
  ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions: admins can insert"
  ON public.questions FOR INSERT TO authenticated
  WITH CHECK (is_org_admin((SELECT org_id FROM public.openings WHERE id = opening_id)));
CREATE POLICY "questions: admins can update"
  ON public.questions FOR UPDATE TO authenticated
  USING (is_org_admin((SELECT org_id FROM public.openings WHERE id = opening_id)));
CREATE POLICY "questions: admins can delete"
  ON public.questions FOR DELETE TO authenticated
  USING (is_org_admin((SELECT org_id FROM public.openings WHERE id = opening_id)));

-- applications
CREATE POLICY "applications: users can read own, org members can read all"
  ON public.applications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_org_member((SELECT org_id FROM public.openings WHERE id = opening_id))
  );
CREATE POLICY "applications: authenticated users can insert"
  ON public.applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "applications: org members can update"
  ON public.applications FOR UPDATE TO authenticated
  USING (is_org_member((SELECT org_id FROM public.openings WHERE id = opening_id)));

-- application_reviews
CREATE POLICY "application_reviews: org members can read"
  ON public.application_reviews FOR SELECT TO authenticated
  USING (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "application_reviews: org members can insert"
  ON public.application_reviews FOR INSERT TO authenticated
  WITH CHECK (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "application_reviews: reviewers can update own review"
  ON public.application_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

-- comments
CREATE POLICY "comments: org members can read"
  ON public.comments FOR SELECT TO authenticated
  USING (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "comments: org members can insert"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "comments: users can update own comment"
  ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "comments: users can delete own comment"
  ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- interviews
CREATE POLICY "interviews: org members can read"
  ON public.interviews FOR SELECT TO authenticated
  USING (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "interviews: org members can insert"
  ON public.interviews FOR INSERT TO authenticated
  WITH CHECK (is_org_member((
    SELECT o.org_id FROM public.openings o
    JOIN public.applications a ON a.opening_id = o.id
    WHERE a.id = application_id
  )));
CREATE POLICY "interviews: interviewers can update own record"
  ON public.interviews FOR UPDATE TO authenticated
  USING (interviewer_id = auth.uid());

-- Functions

-- Trigger: auto-create public.users row on first sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_net_id text;
  v_name   text;
BEGIN
  v_net_id := split_part(NEW.email, '@', 1);
  v_name   := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    v_net_id
  );
  INSERT INTO public.users (id, email, net_id, name)
    VALUES (NEW.id, NEW.email, v_net_id, v_name)
    ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auth hook: restrict sign-up to @rice.edu emails
CREATE OR REPLACE FUNCTION public.restrict_to_rice_email(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email text;
BEGIN
  email := event->'user'->>'email';
  IF email IS NULL OR email NOT LIKE '%@rice.edu' THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 422,
        'message', 'Only Rice University email addresses (@rice.edu) are allowed.'
      )
    );
  END IF;
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restrict_to_rice_email TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.restrict_to_rice_email FROM authenticated, anon, public;

CREATE OR REPLACE FUNCTION public.create_org_with_admin(
  creator_id uuid,
  org_description text,
  org_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO orgs (name, description)
    VALUES (org_name, org_description)
    RETURNING id INTO new_org_id;

  INSERT INTO org_members (org_id, user_id, role)
    VALUES (new_org_id, creator_id, 'admin');

  RETURN new_org_id;
END;
$$;
