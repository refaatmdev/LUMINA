import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

// Types
export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

export interface InviteUserParams {
    email: string;
    role: string;
    orgId: string;
}

// Queries
export const useTeamMembers = (orgId: string | null) => {
    return useQuery({
        queryKey: ['team-members', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', orgId);

            if (error) throw error;
            return data as Profile[];
        },
        enabled: !!orgId,
    });
};

// Mutations
export const useUpdateMemberRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
        }
    });
};

export const useInviteMember = () => {
    return useMutation({
        mutationFn: async ({ email, role, orgId }: InviteUserParams) => {
            const { error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email,
                    role,
                    org_id: orgId
                }
            });
            if (error) throw error;
        }
    });
};
