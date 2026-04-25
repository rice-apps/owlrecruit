/**
 * API request body and response types.
 * All API routes return { data: T } on success or { error: string } on failure.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Orgs
// ---------------------------------------------------------------------------

export interface CreateOrgBody {
  name: string;
  description?: string;
}

export interface UpdateOrgBody {
  name?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Org Members
// ---------------------------------------------------------------------------

export interface AddMemberBody {
  userId: string;
  role: "admin" | "reviewer";
}

export interface UpdateMemberRoleBody {
  role: "admin" | "reviewer";
}

// ---------------------------------------------------------------------------
// Openings
// ---------------------------------------------------------------------------

export interface RubricCriterion {
  name: string;
  max_val: number;
  description?: string;
}

export interface CreateOpeningBody {
  org_id: string;
  title: string;
  description?: string;
  application_link?: string;
  closes_at?: string;
  status?: "draft" | "open" | "closed";
  rubric?: RubricCriterion[];
  reviewer_ids?: string[];
}

export interface UpdateOpeningBody {
  title?: string;
  description?: string;
  application_link?: string;
  closes_at?: string | null;
  status?: "draft" | "open" | "closed";
  rubric?: RubricCriterion[];
  reviewer_ids?: string[];
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface QuestionInput {
  question_text: string;
  is_required: boolean;
  sort_order: number;
}

export interface UpdateQuestionsBody {
  questions: QuestionInput[];
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface UpdateApplicationStatusBody {
  status: string;
}

export interface SubmitApplicationBody {
  form_responses: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface ReviewBody {
  /** Map of rubric criterion name → score (0–max_val) */
  scoreSkills?: Record<string, number>;
  /** Comment text */
  content?: string;
  notes?: string;
}

export interface ReviewComment {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
}

export interface ReviewerScore {
  id: string;
  reviewerId: string;
  reviewerName: string;
  scoreSkills: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  rubric: RubricCriterion[];
  reviewerScores: ReviewerScore[];
  resumeUrl: string | null;
}

export interface ReviewsResponse {
  comments: ReviewComment[];
  myScoreSkills: Record<string, number> | null;
  summary: ReviewSummary;
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export interface QAPair {
  question: string;
  answer: string;
}

export interface CreateInterviewBody {
  form_responses?: QAPair[];
  round_number?: number;
}

export interface UpdateInterviewBody {
  form_responses: QAPair[];
}

export interface InterviewWithInterviewer {
  id: string;
  interviewer_id: string;
  form_responses: QAPair[];
  round_number: number;
  created_at: string;
  updated_at: string;
  interviewer: { id: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// CSV Upload
// ---------------------------------------------------------------------------

export interface CsvUploadResponse {
  inserted: number;
  skipped: number;
  errors: Array<{ row?: number; message: string }>;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  openings: Array<{ id: string; title: string; org_name: string }>;
  orgs: Array<{ id: string; name: string }>;
}
