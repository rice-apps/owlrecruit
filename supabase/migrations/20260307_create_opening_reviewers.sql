-- Create opening_reviewers junction table
-- This tracks which reviewers (org members with role=reviewer) are assigned
-- to a specific opening, without mutating their org-level role.

create table if not exists public.opening_reviewers (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid not null references public.openings(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (opening_id, user_id)
);

-- Enable RLS
alter table public.opening_reviewers enable row level security;

-- Allow authenticated users to read opening reviewer assignments
create policy "Authenticated users can view opening reviewers"
  on public.opening_reviewers for select
  to authenticated
  using (true);

-- Allow org admins to manage opening reviewer assignments
create policy "Org admins can manage opening reviewers"
  on public.opening_reviewers for all
  to authenticated
  using (true)
  with check (true);
