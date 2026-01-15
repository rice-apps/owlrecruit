import { Database } from './supabase';

// -- Helper Types --
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// -- Entity Types (Row representations) --
export type User = Tables<'users'>;
export type Org = Tables<'orgs'>;
export type Opening = Tables<'openings'>;
export type Application = Tables<'applications'>;
export type Review = Tables<'application_reviews'>;
export type Comment = Tables<'comments'>;
export type Interview = Tables<'interviews'>;
export type OrgMember = Tables<'org_members'>;
export type Question = Tables<'questions'>;
export type Rubric = Tables<'rubrics'>;
export type ReviewScore = Tables<'review_scores'>;

// -- Enums --
export type ApplicationStatus = Enums<'status'>;
export type Score = Enums<'score'>;
export type OpeningStatus = Enums<'opening_status'>;
export type OrgRole = Enums<'org_role'>;

// -- Joined / Aggregate Types --

export interface ApplicationWithApplicant extends Application {
  users: Pick<User, 'id' | 'name' | 'email'>;
}

export interface OpeningWithApplicationCount extends Opening {
  application_count: number;
}

export interface OrgWithRole extends Org {
  role: OrgRole;
}
