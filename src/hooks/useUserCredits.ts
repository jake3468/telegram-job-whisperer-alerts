
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { userProfile } = useUserProfile();

  return useQuery({
    queryKey: ['user_credits', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id,
    staleTime: 30000,
    refetchInterval: 15000,
  });
};
