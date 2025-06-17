export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          feature_used: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          feature_used?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          feature_used?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_logs: {
        Row: {
          data: Json | null
          id: string
          log_type: string
          timestamp: string | null
        }
        Insert: {
          data?: Json | null
          id?: string
          log_type: string
          timestamp?: string | null
        }
        Update: {
          data?: Json | null
          id?: string
          log_type?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      job_alerts: {
        Row: {
          alert_frequency: string
          country: string
          created_at: string
          id: string
          job_title: string
          job_type: Database["public"]["Enums"]["job_type"]
          last_run: string | null
          location: string
          max_alerts_per_day: number
          preferred_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_frequency: string
          country: string
          created_at?: string
          id?: string
          job_title: string
          job_type: Database["public"]["Enums"]["job_type"]
          last_run?: string | null
          location: string
          max_alerts_per_day?: number
          preferred_time: string
          timezone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_frequency?: string
          country?: string
          created_at?: string
          id?: string
          job_title?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          last_run?: string | null
          location?: string
          max_alerts_per_day?: number
          preferred_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      job_analyses: {
        Row: {
          company_name: string
          created_at: string
          id: string
          job_description: string
          job_match: string | null
          job_title: string
          match_score: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          job_description: string
          job_match?: string | null
          job_title: string
          match_score?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          job_description?: string
          job_match?: string | null
          job_title?: string
          match_score?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cover_letters: {
        Row: {
          company_name: string
          cover_letter: string | null
          created_at: string
          id: string
          job_description: string
          job_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cover_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      job_linkedin: {
        Row: {
          audience: string | null
          created_at: string
          id: string
          opinion: string | null
          personal_story: string | null
          post_content_1: string | null
          post_content_2: string | null
          post_content_3: string | null
          post_heading_1: string | null
          post_heading_2: string | null
          post_heading_3: string | null
          tone: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          id?: string
          opinion?: string | null
          personal_story?: string | null
          post_content_1?: string | null
          post_content_2?: string | null
          post_content_3?: string | null
          post_heading_1?: string | null
          post_heading_2?: string | null
          post_heading_3?: string | null
          tone?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          id?: string
          opinion?: string | null
          personal_story?: string | null
          post_content_1?: string | null
          post_content_2?: string | null
          post_content_3?: string | null
          post_heading_1?: string | null
          post_heading_2?: string | null
          post_heading_3?: string | null
          tone?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_linkedin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_post_images: {
        Row: {
          created_at: string
          id: string
          image_data: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_data: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_data?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_linkedin_post_images_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "job_linkedin"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string | null
          created_at: string
          credits_amount: number
          description: string | null
          id: string
          is_active: boolean
          plan_name: string
          plan_type: string
          price_amount: number | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          credits_amount: number
          description?: string | null
          id?: string
          is_active?: boolean
          plan_name: string
          plan_type: string
          price_amount?: number | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          credits_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          plan_name?: string
          plan_type?: string
          price_amount?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          current_balance: number
          free_credits: number
          id: string
          next_reset_date: string
          paid_credits: number
          subscription_plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          free_credits?: number
          id?: string
          next_reset_date?: string
          paid_credits?: number
          subscription_plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          free_credits?: number
          id?: string
          next_reset_date?: string
          paid_credits?: number
          subscription_plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          bio: string | null
          bot_activated: boolean | null
          chat_id: string | null
          created_at: string | null
          id: string
          resume: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          bot_activated?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          id?: string
          resume?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          bot_activated?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          id?: string
          resume?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_resumes: {
        Row: {
          awards: Json | null
          career_level: string | null
          career_objective: string | null
          certifications: Json | null
          color_scheme: string | null
          created_at: string
          education: Json | null
          email: string | null
          font_preference: string | null
          full_name: string | null
          github_url: string | null
          hobbies: string | null
          id: string
          industry_focus: string | null
          languages: Json | null
          length_preference: string | null
          linkedin_url: string | null
          location: string | null
          memberships: Json | null
          output_format: string | null
          patents: Json | null
          phone: string | null
          portfolio_url: string | null
          projects: Json | null
          publications: Json | null
          section_order: Json | null
          skills_summary: string | null
          soft_skills: Json | null
          speaking_engagements: Json | null
          technical_skills: Json | null
          template_style: string | null
          updated_at: string
          user_profile_id: string
          volunteer_work: Json | null
          work_experience: Json | null
          years_experience: number | null
        }
        Insert: {
          awards?: Json | null
          career_level?: string | null
          career_objective?: string | null
          certifications?: Json | null
          color_scheme?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          font_preference?: string | null
          full_name?: string | null
          github_url?: string | null
          hobbies?: string | null
          id?: string
          industry_focus?: string | null
          languages?: Json | null
          length_preference?: string | null
          linkedin_url?: string | null
          location?: string | null
          memberships?: Json | null
          output_format?: string | null
          patents?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          projects?: Json | null
          publications?: Json | null
          section_order?: Json | null
          skills_summary?: string | null
          soft_skills?: Json | null
          speaking_engagements?: Json | null
          technical_skills?: Json | null
          template_style?: string | null
          updated_at?: string
          user_profile_id: string
          volunteer_work?: Json | null
          work_experience?: Json | null
          years_experience?: number | null
        }
        Update: {
          awards?: Json | null
          career_level?: string | null
          career_objective?: string | null
          certifications?: Json | null
          color_scheme?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          font_preference?: string | null
          full_name?: string | null
          github_url?: string | null
          hobbies?: string | null
          id?: string
          industry_focus?: string | null
          languages?: Json | null
          length_preference?: string | null
          linkedin_url?: string | null
          location?: string | null
          memberships?: Json | null
          output_format?: string | null
          patents?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          projects?: Json | null
          publications?: Json | null
          section_order?: Json | null
          skills_summary?: string | null
          soft_skills?: Json | null
          speaking_engagements?: Json | null
          technical_skills?: Json | null
          template_style?: string | null
          updated_at?: string
          user_profile_id?: string
          volunteer_work?: Json | null
          work_experience?: Json | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_resumes_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          executed_at: string | null
          fingerprint: string
          id: string
          record_id: string | null
          request_type: string | null
          status: string | null
          submission_id: string | null
          webhook_response: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          fingerprint: string
          id?: string
          record_id?: string | null
          request_type?: string | null
          status?: string | null
          submission_id?: string | null
          webhook_response?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          fingerprint?: string
          id?: string
          record_id?: string | null
          request_type?: string | null
          status?: string | null
          submission_id?: string | null
          webhook_response?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      webhook_execution_monitoring: {
        Row: {
          execution_count: number | null
          execution_ids: string[] | null
          execution_times: string[] | null
          fingerprint: string | null
          request_type: string | null
          statuses: string[] | null
          time_diff_between_first_last: unknown | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description?: string
          p_is_paid?: boolean
        }
        Returns: boolean
      }
      check_and_insert_cover_letter_execution: {
        Args: {
          p_fingerprint: string
          p_record_id: string
          p_submission_id?: string
          p_request_type?: string
          p_check_minutes?: number
        }
        Returns: string
      }
      check_and_insert_execution: {
        Args: {
          p_fingerprint: string
          p_record_id: string
          p_submission_id?: string
          p_request_type?: string
          p_check_minutes?: number
        }
        Returns: string
      }
      check_sufficient_credits: {
        Args: { p_user_id: string; p_required_credits: number }
        Returns: boolean
      }
      cleanup_old_linkedin_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_posts: number
          deleted_images: number
        }[]
      }
      cleanup_old_webhook_executions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deduct_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_feature_used: string
          p_description?: string
        }
        Returns: boolean
      }
      delete_old_job_analyses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_clerk_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id_from_clerk: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_user_credits: {
        Args: { p_user_id: string }
        Returns: string
      }
      insert_job_analysis: {
        Args: {
          p_user_id: string
          p_company_name: string
          p_job_title: string
          p_job_description: string
        }
        Returns: string
      }
      reset_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      job_type: "Remote" | "On-site" | "Hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_type: ["Remote", "On-site", "Hybrid"],
    },
  },
} as const
