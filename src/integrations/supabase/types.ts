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
      blogs: {
        Row: {
          author_name: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_role_analyses: {
        Row: {
          career_development: Json | null
          company_name: string
          company_news_updates: string[] | null
          created_at: string | null
          id: string
          interview_and_hiring_insights: Json | null
          job_title: string
          local_role_market_context: string | null
          location: string
          research_date: string | null
          role_compensation_analysis: Json | null
          role_experience_score: number | null
          role_experience_score_breakdown: string[] | null
          role_experience_specific_insights: string | null
          role_security_automation_risks: string | null
          role_security_departmental_trends: string | null
          role_security_outlook: string | null
          role_security_score: number | null
          role_security_score_breakdown: string[] | null
          role_specific_considerations: Json | null
          role_workplace_environment: Json | null
          sources: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_development?: Json | null
          company_name: string
          company_news_updates?: string[] | null
          created_at?: string | null
          id?: string
          interview_and_hiring_insights?: Json | null
          job_title: string
          local_role_market_context?: string | null
          location: string
          research_date?: string | null
          role_compensation_analysis?: Json | null
          role_experience_score?: number | null
          role_experience_score_breakdown?: string[] | null
          role_experience_specific_insights?: string | null
          role_security_automation_risks?: string | null
          role_security_departmental_trends?: string | null
          role_security_outlook?: string | null
          role_security_score?: number | null
          role_security_score_breakdown?: string[] | null
          role_specific_considerations?: Json | null
          role_workplace_environment?: Json | null
          sources?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_development?: Json | null
          company_name?: string
          company_news_updates?: string[] | null
          created_at?: string | null
          id?: string
          interview_and_hiring_insights?: Json | null
          job_title?: string
          local_role_market_context?: string | null
          location?: string
          research_date?: string | null
          role_compensation_analysis?: Json | null
          role_experience_score?: number | null
          role_experience_score_breakdown?: string[] | null
          role_experience_specific_insights?: string | null
          role_security_automation_risks?: string | null
          role_security_departmental_trends?: string | null
          role_security_outlook?: string | null
          role_security_score?: number | null
          role_security_score_breakdown?: string[] | null
          role_specific_considerations?: Json | null
          role_workplace_environment?: Json | null
          sources?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_role_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
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
      interview_prep: {
        Row: {
          company_name: string
          created_at: string
          id: string
          interview_questions: Json | null
          job_description: string
          job_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          interview_questions?: Json | null
          job_description: string
          job_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          interview_questions?: Json | null
          job_description?: string
          job_title?: string
          updated_at?: string
          user_id?: string
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
          updated_at: string | null
          variation_number: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_data: string
          post_id: string
          updated_at?: string | null
          variation_number?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_data?: string
          post_id?: string
          updated_at?: string | null
          variation_number?: number | null
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
      payment_products: {
        Row: {
          billing_cycle: string | null
          created_at: string
          credits_amount: number
          currency: string | null
          currency_code: string | null
          id: string
          is_active: boolean
          is_default_region: boolean | null
          price_amount: number | null
          product_id: string
          product_name: string
          product_type: string
          region: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          credits_amount: number
          currency?: string | null
          currency_code?: string | null
          id?: string
          is_active?: boolean
          is_default_region?: boolean | null
          price_amount?: number | null
          product_id: string
          product_name: string
          product_type: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          credits_amount?: number
          currency?: string | null
          currency_code?: string | null
          id?: string
          is_active?: boolean
          is_default_region?: boolean | null
          price_amount?: number | null
          product_id?: string
          product_name?: string
          product_type?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number | null
          created_at: string
          credits_awarded: number | null
          currency: string | null
          customer_email: string
          customer_name: string | null
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          payment_id: string | null
          payment_method: string | null
          processed: boolean
          processed_at: string | null
          product_id: string
          quantity: number | null
          raw_payload: Json
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
          webhook_id: string
          webhook_timestamp: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          credits_awarded?: number | null
          currency?: string | null
          customer_email: string
          customer_name?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          processed?: boolean
          processed_at?: string | null
          product_id: string
          quantity?: number | null
          raw_payload: Json
          status: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_id: string
          webhook_timestamp: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          credits_awarded?: number | null
          currency?: string | null
          customer_email?: string
          customer_name?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          processed?: boolean
          processed_at?: string | null
          product_id?: string
          quantity?: number | null
          raw_payload?: Json
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_id?: string
          webhook_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tracking: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          next_billing_date: string | null
          previous_billing_date: string | null
          product_id: string
          status: string
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          next_billing_date?: string | null
          previous_billing_date?: string | null
          product_id: string
          status: string
          subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          next_billing_date?: string | null
          previous_billing_date?: string | null
          product_id?: string
          status?: string
          subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          cv_bot_activated: boolean
          cv_chat_id: string | null
          id: string
          resume: string | null
          show_onboarding_popup: boolean
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          bot_activated?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          cv_bot_activated?: boolean
          cv_chat_id?: string | null
          id?: string
          resume?: string | null
          show_onboarding_popup?: boolean
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          bot_activated?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          cv_bot_activated?: boolean
          cv_chat_id?: string | null
          id?: string
          resume?: string | null
          show_onboarding_popup?: boolean
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
      bytea_to_text: {
        Args: { data: string }
        Returns: string
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
      cleanup_old_company_analysis_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_analyses: number
        }[]
      }
      cleanup_old_interview_prep_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_interview_prep: number
        }[]
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
      debug_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_user_auth: {
        Args: Record<PropertyKey, never>
        Returns: {
          clerk_id: string
          jwt_sub: string
          jwt_issuer: string
          jwt_aud: string
          current_setting_claims: string
          auth_role: string
          user_exists: boolean
          user_id_found: string
        }[]
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
      get_current_clerk_user_id: {
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
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
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
      process_payment_credits: {
        Args: {
          p_webhook_id: string
          p_event_type: string
          p_customer_email: string
          p_customer_name?: string
          p_product_id?: string
          p_quantity?: number
          p_amount?: number
          p_currency?: string
          p_status?: string
          p_payment_id?: string
          p_subscription_id?: string
          p_payment_method?: string
          p_error_code?: string
          p_error_message?: string
          p_webhook_timestamp?: string
          p_raw_payload?: Json
        }
        Returns: Json
      }
      reset_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      test_jwt_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_result: string
          clerk_id: string
          issuer: string
          can_access_users: boolean
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      job_type: "Remote" | "On-site" | "Hybrid"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
