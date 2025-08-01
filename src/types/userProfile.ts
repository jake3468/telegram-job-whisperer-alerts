
export interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  resume_filename: string | null;
  resume_uploaded_at: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  cv_bot_activated: boolean;
  cv_chat_id: string | null;
  created_at: string | null;
  show_onboarding_popup: boolean;
  show_job_alerts_onboarding_popup: boolean;
  show_job_board_onboarding_popup: boolean;
  show_job_tracker_onboarding_popup: boolean;
  user_location: string | null;
}

export interface UserProfileUpdateData {
  bio?: string | null;
  resume?: string | null;
  resume_filename?: string | null;
  resume_uploaded_at?: string | null;
  bot_activated?: boolean | null;
  chat_id?: string | null;
  cv_bot_activated?: boolean;
  cv_chat_id?: string | null;
  show_onboarding_popup?: boolean;
  show_job_alerts_onboarding_popup?: boolean;
  show_job_board_onboarding_popup?: boolean;
  show_job_tracker_onboarding_popup?: boolean;
  user_location?: string | null;
}
