import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface Slide {
    id: string;
    name: string;
    content: any;
    updated_at: string;
    org_id: string;
}

export const useSlides = (orgId: string | null) => {
    return useQuery({
        queryKey: ['slides', orgId],
        queryFn: async (): Promise<Slide[]> => {
            if (!orgId) return [];
            const { data, error } = await supabase
                .from('slides')
                .select('id, name, updated_at, content, org_id')
                .eq('org_id', orgId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!orgId
    });
};

export const useDeleteSlide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string; orgId: string }) => {
            const { error } = await supabase
                .from('slides')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, { orgId }) => {
            queryClient.invalidateQueries({ queryKey: ['slides', orgId] });
        }
    });
};

export const useCreateSlide = () => {
    const queryClient = useQueryClient();

    // The actual creation often happens in the Editor, but if we have a "Quick Create" from list:
    // This might be used if we create a record before navigating. 
    // For now, the legacy code just navigates with state.
    // We will keep it simple for now, but adding this hook for future use.
    return useMutation({
        mutationFn: async ({ name, orgId }: { name: string; orgId: string }) => {
            const { data, error } = await supabase
                .from('slides')
                .insert({
                    org_id: orgId,
                    name: name,
                    content: {} // Empty content
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['slides', data.org_id] });
        }
    });
};
