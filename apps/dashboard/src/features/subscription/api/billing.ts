import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Plan } from './plans';

export interface BillingOrganization {
    id: string;
    name: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'suspended';
    max_screens: number;
    stripe_customer_id: string | null;
    current_plan_id: string | null;
    subscription_plans?: Plan;
    is_manual_override?: boolean;
    manual_screen_limit?: number;
    manual_storage_limit?: number;
    current_period_end?: string;
    internal_notes?: string;
    plan_tier?: string;
    trial_ends_at?: string;
    created_at?: string;
    screen_count?: number;
    storage_used?: number; // bytes
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
                    subscription_plans (*),
                    screens: screens(count),
                    media_assets (file_size_bytes)
                `)
                .eq('id', orgId)
                .single();

            if (error) throw error;

            // Map legacy plan structure if needed, or return as is
            const orgData = data as any;

            // Handle case where subscription_plans might be returned as an array (even if singular expected)
            const plan = Array.isArray(orgData.subscription_plans)
                ? orgData.subscription_plans[0]
                : orgData.subscription_plans;

            // Calculate real-time storage usage from assets
            const calculatedStorage = orgData.media_assets?.reduce((acc: number, curr: { file_size_bytes: number }) => {
                return acc + (curr.file_size_bytes || 0);
            }, 0) || 0;

            return {
                ...orgData,
                subscription_plans: plan,
                screen_count: orgData.screens?.[0]?.count || 0,
                storage_used: calculatedStorage // Use calculated value
            };
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
