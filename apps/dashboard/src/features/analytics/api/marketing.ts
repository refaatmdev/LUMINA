import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface Announcement {
    id: string;
    message: string;
    bg_color: string;
    is_active: boolean;
    target_plan: string | null;
    created_at: string;
}

export const useAnnouncements = () => {
    return useQuery({
        queryKey: ['announcements'],
        queryFn: async (): Promise<Announcement[]> => {
            const { data, error } = await supabase
                .from('system_announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });
};

export const useCreateAnnouncement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (announcement: Partial<Announcement>) => {
            const { error } = await supabase
                .from('system_announcements')
                .insert(announcement);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }
    });
};

export const useUpdateAnnouncement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Announcement> }) => {
            const { error } = await supabase
                .from('system_announcements')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }
    });
};

export const useDeleteAnnouncement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('system_announcements')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }
    });
};

export const useCreateCoupon = () => {
    return useMutation({
        mutationFn: async (body: any) => {
            const { data, error } = await supabase.functions.invoke('create-coupon', {
                body: body
            });

            if (error) throw error;
            return data;
        }
    });
};
