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
      user_profile: {
        Row: {
          bio: string | null
          bot_activated: boolean | null
          bot_id: string | null
          chat_id: string | null
          created_at: string | null
          id: string
          resume: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          bot_activated?: boolean | null
          bot_id?: string | null
          chat_id?: string | null
          created_at?: string | null
          id?: string
          resume?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          bot_activated?: boolean | null
          bot_id?: string | null
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
      users: {
        Row: {
          clerk_id: string
          created_at: string
          credits: number | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          credits?: number | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          credits?: number | null
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
      cleanup_old_webhook_executions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      get_current_user_uuid: {
        Args: Record<PropertyKey, never>
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
