import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

// Types
export interface Screen {
    id: string;
    name: string;
    pairing_code: string;
    is_online: boolean;
    last_ping: string;
    group_id: string | null;
    active_slide_id: string | null;
    urgent_slide_id: string | null;
    screen_groups: { name: string } | null;
    slides: { name: string } | null;
    urgent_slide: { name: string } | null;
}

export interface ScreenGroup {
    id: string;
    name: string;
}

export interface Announcement {
    message: string;
    bg_color: string;
    target_plan: string | null;
}

// Queries
export const useScreens = (orgId: string | null) => {
    return useQuery({
        queryKey: ['screens', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const { data, error } = await supabase
                .from('screens')
                .select(`
                    *,
                    screen_groups (name),
                    slides:active_slide_id (name),
                    urgent_slide:urgent_slide_id (name)
                `)
                .eq('org_id', orgId)
                .order('name');

            if (error) throw error;
            return data as Screen[];
        },
        enabled: !!orgId,
    });
};

export const useScreenGroups = (orgId: string | null) => {
    return useQuery({
        queryKey: ['screenGroups', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const { data, error } = await supabase
                .from('screen_groups')
                .select('id, name')
                .eq('org_id', orgId)
                .order('name');

            if (error) throw error;
            return data as ScreenGroup[];
        },
        enabled: !!orgId,
    });
};

export const useAnnouncements = (planTier: string | null) => {
    return useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('system_announcements')
                .select('message, bg_color, target_plan')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Client-side filtering logic from original component
            const match = data?.find(a => !a.target_plan || a.target_plan === planTier || (a.target_plan === 'pro' && (planTier as any) === 'enterprise'));
            return match || null;
        }
    });
};

// Mutations
export const useDeleteScreen = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (screenId: string) => {
            const { error } = await supabase.from('screens').delete().eq('id', screenId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] });
        }
    });
};

export const useAddScreen = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, pairingCode, orgId }: { name: string; pairingCode: string; orgId: string }) => {
            const { error } = await supabase.from('screens').insert([{
                name,
                org_id: orgId,
                pairing_code: pairingCode,
                auth_type: 'pairing_code',
                status: 'offline'
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] });
        }
    });
};

export const useUpdateScreen = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            const { error } = await supabase.from('screens').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] });
        }
    });
};
