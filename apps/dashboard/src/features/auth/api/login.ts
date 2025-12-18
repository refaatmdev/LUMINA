import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export const useLogin = () => {
    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        },
    });
};
