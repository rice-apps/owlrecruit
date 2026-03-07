-- Add reviewer_ids column to openings table
-- Stores an array of user IDs assigned as reviewers for each opening
ALTER TABLE public.openings
ADD COLUMN IF NOT EXISTS reviewer_ids jsonb DEFAULT '[]'::jsonb;
