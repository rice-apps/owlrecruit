export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      applicants: {
        Row: {
          id: string;
          name: string | null;
          net_id: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          net_id: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          net_id?: string;
        };
        Relationships: [];
      };
      application_reviews: {
        Row: {
          application_id: string;
          created_at: string | null;
          id: string;
          reviewer_id: string;
          score: number | null;
          updated_at: string | null;
        };
        Insert: {
          application_id: string;
          created_at?: string | null;
          id?: string;
          reviewer_id: string;
          score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          application_id?: string;
          created_at?: string | null;
          id?: string;
          reviewer_id?: string;
          score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "application_reviews_application_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_reviews_reviewer_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          applicant_id: string;
          created_at: string | null;
          form_responses: Json | null;
          id: string;
          opening_id: string;
          resume_url: string | null;
          status: Database["public"]["Enums"]["status"] | null;
          updated_at: string | null;
          users_id: string | null;
        };
        Insert: {
          applicant_id: string;
          created_at?: string | null;
          form_responses?: Json | null;
          id?: string;
          opening_id: string;
          resume_url?: string | null;
          status?: Database["public"]["Enums"]["status"] | null;
          updated_at?: string | null;
          users_id?: string | null;
        };
        Update: {
          applicant_id?: string;
          created_at?: string | null;
          form_responses?: Json | null;
          id?: string;
          opening_id?: string;
          resume_url?: string | null;
          status?: Database["public"]["Enums"]["status"] | null;
          updated_at?: string | null;
          users_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_opening_fkey";
            columns: ["opening_id"];
            isOneToOne: false;
            referencedRelation: "openings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_users_id_fkey";
            columns: ["users_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          application_id: string;
          content: string;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          application_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          application_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_application_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      interviews: {
        Row: {
          application_id: string;
          created_at: string | null;
          form_responses: Json | null;
          id: string;
          interview_date: string | null;
          interviewer_id: string | null;
          round_number: number | null;
          updated_at: string | null;
        };
        Insert: {
          application_id: string;
          created_at?: string | null;
          form_responses?: Json | null;
          id?: string;
          interview_date?: string | null;
          interviewer_id?: string | null;
          round_number?: number | null;
          updated_at?: string | null;
        };
        Update: {
          application_id?: string;
          created_at?: string | null;
          form_responses?: Json | null;
          id?: string;
          interview_date?: string | null;
          interviewer_id?: string | null;
          round_number?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_application_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interviews_interviewer_fkey";
            columns: ["interviewer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      openings: {
        Row: {
          application_link: string | null;
          closes_at: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          org_id: string;
          rubric: Json[] | null;
          status: Database["public"]["Enums"]["opening_status"] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          application_link?: string | null;
          closes_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          org_id: string;
          rubric?: Json[] | null;
          status?: Database["public"]["Enums"]["opening_status"] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          application_link?: string | null;
          closes_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          org_id?: string;
          rubric?: Json[] | null;
          status?: Database["public"]["Enums"]["opening_status"] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "openings_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      org_members: {
        Row: {
          created_at: string | null;
          id: string;
          org_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          org_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_members_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      orgs: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          is_required: boolean | null;
          opening_id: string;
          question_text: string;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          is_required?: boolean | null;
          opening_id: string;
          question_text: string;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          is_required?: boolean | null;
          opening_id?: string;
          question_text?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_opening_fkey";
            columns: ["opening_id"];
            isOneToOne: false;
            referencedRelation: "openings";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          net_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          net_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          net_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      opening_status: "draft" | "open" | "closed";
      org_role: "admin" | "reviewer";
      score:
        | "Inclined (Strong)"
        | "Inclined"
        | "Inclined (Lean)"
        | "Disinclined (Lean)"
        | "Disinclined"
        | "Disinclined (Strong)";
      status:
        | "No Status"
        | "Applied"
        | "Interviewing"
        | "Offer"
        | "Accepted Offer"
        | "Rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      opening_status: ["draft", "open", "closed"],
      org_role: ["admin", "reviewer"],
      score: [
        "Inclined (Strong)",
        "Inclined",
        "Inclined (Lean)",
        "Disinclined (Lean)",
        "Disinclined",
        "Disinclined (Strong)",
      ],
      status: [
        "No Status",
        "Applied",
        "Interviewing",
        "Offer",
        "Accepted Offer",
        "Rejected",
      ],
    },
  },
} as const;
