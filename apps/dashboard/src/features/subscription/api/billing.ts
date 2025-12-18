import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Plan } from './plans';

export interface BillingOrganization {
    id: string;
    name: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
    max_screens: number;
    stripe_customer_id: string | null;
    current_plan_id: string | null;
    subscription_plans?: Plan;
    is_manual_override?: boolean;
    manual_screen_limit?: number;
    manual_storage_limit?: number;
    current_period_end?: string;
}

export const useBillingInfo = (orgId: string | undefined) => {
    return useQuery({
        queryKey: ['billing', orgId],
        queryFn: async (): Promise<BillingOrganization | null> => {
            if (!orgId) return null;
            const { data, error } = await supabase
                .from('organizations')
                .select(`
                    *,
                    subscription_plans (*)
                `)
                .eq('id', orgId)
                .single();

            if (error) throw error;

            // Map legacy plan structure if needed, or return as is
            return data;
        },
        enabled: !!orgId
    });
};

export const useUpdateSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, planId }: { orgId: string; planId: string }) => {
            // Function to handle subscription updates - this would typically call a backend function 
            // interfacing with Stripe. For now, doing direct DB update as per legacy code.
            const { error } = await supabase
                .from('organizations')
                .update({
                    current_plan_id: planId,
                    subscription_status: 'active', // simplified
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            if (error) throw error;
        },
        onSuccess: (_, { orgId }) => {
            queryClient.invalidateQueries({ queryKey: ['billing', orgId] });
        }
    });
};
