import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Data } from "@measured/puck";

export interface SlideData {
    id: string;
    name: string;
    content: Data;
    orientation: 'landscape' | 'portrait';
    status: 'draft' | 'published';
    org_id: string;
    updated_at?: string;
}

// --- Queries ---

export const useSlide = (id: string | null) => {
    return useQuery({
        queryKey: ['slide', id],
        queryFn: async (): Promise<SlideData | null> => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('slides')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id
    });
};

// --- Mutations ---

interface SaveSlideParams {
    id?: string | null;
    orgId: string;
    name: string;
    content: Data;
    orientation: 'landscape' | 'portrait';
    status: 'draft' | 'published';
}

export const useSaveSlide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, orgId, name, content, orientation, status }: SaveSlideParams) => {
            const slideData = {
                org_id: orgId,
                name: name,
                content: content,
                orientation: orientation,
                status: status
            };

            let resultId = id;

            if (id) {
                // Update
                const { error } = await supabase
                    .from('slides')
                    .update({
                        content: content,
                        name: name,
                        status: status,
                        orientation: orientation
                    })
                    .eq('id', id);

                if (error) throw error;
            } else {
                // Create
                const { data, error } = await supabase
                    .from('slides')
                    .insert(slideData)
                    .select()
                    .single();

                if (error) throw error;
                resultId = data.id;
            }

            // Realtime Broadcast if published
            if (status === 'published' && resultId) {
                const channel = supabase.channel('system-updates');
                channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.send({
                            type: 'broadcast',
                            event: 'slide_updated',
                            payload: { id: resultId },
                        });
                        supabase.removeChannel(channel);
                    }
                });
            }

            return resultId;
        },
        onSuccess: (_, variables) => {
            if (variables.id) {
                queryClient.invalidateQueries({ queryKey: ['slide', variables.id] });
            }
            queryClient.invalidateQueries({ queryKey: ['slides', variables.orgId] });
        }
    });
};

export const useSaveTemplate = () => {
    return useMutation({
        mutationFn: async ({ name, category, content }: { name: string, category: string, content: Data }) => {
            const { error } = await supabase.from('templates').insert({
                name,
                category,
                content,
                is_public: true
            });
            if (error) throw error;
        }
    });
};
