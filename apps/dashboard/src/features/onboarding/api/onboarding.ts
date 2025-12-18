import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/auth-store';

export const useCompleteOnboarding = () => {
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (orgName: string) => {
            if (!user) throw new Error("No user found");

            // 1. Create Organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert([{ name: orgName, status: 'active' }])
                .select()
                .single();

            if (orgError) throw orgError;

            // 2. Update Profile with Org ID and Role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    org_id: org.id,
                    role: 'org_admin'
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Refresh profile in store
            await useAuthStore.getState().refreshProfile();

            return org;
        }
    });
};
