
export interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  cv_bot_activated: boolean;
  cv_chat_id: string | null;
  created_at: string | null;
  show_onboarding_popup: boolean;
  show_job_alerts_onboarding_popup: boolean;
}

export interface UserProfileUpdateData {
  bio?: string | null;
  resume?: string | null;
  bot_activated?: boolean | null;
  chat_id?: string | null;
  cv_bot_activated?: boolean;
  cv_chat_id?: string | null;
  show_onboarding_popup?: boolean;
  show_job_alerts_onboarding_popup?: boolean;
}
