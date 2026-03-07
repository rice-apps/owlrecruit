alter table orgs add column if not exists social_links jsonb default '{}'::jsonb;
