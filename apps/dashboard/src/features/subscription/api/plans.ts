import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    stripe_price_id?: string;
    limits_config: {
        max_screens: number;
        storage_gb: number;
    };
    max_screens: number;
    storage_gb: number;
    is_featured: boolean;
    display_order: number;
    is_active: boolean;
}

export const usePlans = () => {
    return useQuery({
        queryKey: ['plans'],
        queryFn: async (): Promise<Plan[]> => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data;
        }
    });
};

export const useSavePlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (plan: Partial<Plan>) => {
            if (plan.id) {
                const { error } = await supabase
                    .from('subscription_plans')
                    .update(plan)
                    .eq('id', plan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('subscription_plans')
                    .insert(plan);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
        }
    });
};

export const useDeletePlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
        }
    });
};
