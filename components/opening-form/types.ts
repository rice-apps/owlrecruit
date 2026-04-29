import type { OpeningStatus } from "@/types/app";

export interface EligibleReviewer {
  id: string;
  user_id: string;
  role: string;
  users:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null;
}

export interface RubricItem {
  name: string;
  max_val: number | string;
  description: string;
}

export interface OpeningInitialData {
  title: string;
  description?: string | null;
  application_link?: string | null;
  closes_at?: string | null;
  status: OpeningStatus;
  rubric?: Array<{
    name: string;
    max_val: number;
    description?: string | null;
  }>;
}
