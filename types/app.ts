import { Database } from "./database";
import type { FieldType } from "@/lib/question-utils";

export type { FieldType };

// -- Helper Types --
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// -- Entity Types (Row representations) --
export type User = Tables<"users">;
export type Org = Tables<"orgs">;
export type Opening = Tables<"openings">;
export type Application = Tables<"applications">;
export type Review = Tables<"application_reviews">;
export type Comment = Tables<"comments">;
export type Interview = Tables<"interviews">;
export type OrgMember = Tables<"org_members">;
export type Question = Tables<"questions">;

// -- Enums --
export type ApplicationStatus = Enums<"status">;
export type OpeningStatus = Enums<"opening_status">;
export type OrgRole = Enums<"org_role">;

// -- Status constants --
// satisfies Record<string, string> (not the DB enum) so these remain valid
// when applications.status moves to a text column for user-defined statuses.
export const ApplicationStatus = {
  NO_STATUS: "No Status",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  ACCEPTED_OFFER: "Accepted Offer",
  REJECTED: "Rejected",
} as const satisfies Record<string, string>;

export const OpeningStatus = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
} as const satisfies Record<string, string>;

export const DEFAULT_APPLICATION_STATUS = ApplicationStatus.APPLIED;
export const DEFAULT_OPENING_STATUS = OpeningStatus.DRAFT;

// -- Rich question type (decoded from question_text) --
export interface TypedQuestion {
  id: string;
  opening_id: string;
  /** Stored in DB as plain string or JSON-encoded string */
  question_text: string;
  /** Decoded display label (= form_responses key) */
  label: string;
  type: FieldType;
  options: string[] | null;
  is_required: boolean | null;
  sort_order: number | null;
}

// -- Joined / Aggregate Types --

export interface ApplicationWithApplicant extends Application {
  users: Pick<User, "id" | "name" | "email">;
}

export interface OpeningWithApplicationCount extends Opening {
  application_count: number;
}

export interface OrgWithRole extends Org {
  role: OrgRole;
}

export interface MemberWithUser extends OrgMember {
  users: Pick<User, "id" | "name" | "email">;
}

export interface OpeningWithOrg extends Opening {
  org: Pick<Org, "id" | "name">;
}
