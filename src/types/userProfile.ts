
export interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  cv_bot_activated: boolean;
  cv_chat_id: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
}

export interface UserProfileUpdateData {
  bio?: string | null;
  resume?: string | null;
  bot_activated?: boolean | null;
  chat_id?: string | null;
  cv_bot_activated?: boolean;
  cv_chat_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}
