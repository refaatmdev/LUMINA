import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';

export function usePlanLimits() {
    const { orgId } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [planTier, setPlanTier] = useState<'free' | 'pro'>('free');
    const [maxScreens, setMaxScreens] = useState(1);
    const [currentScreenCount, setCurrentScreenCount] = useState(0);

    useEffect(() => {
        if (orgId) {
            console.log('[usePlanLimits] Fetching limits for Org:', orgId);
            fetchLimits();
        }
    }, [orgId]);

    const fetchLimits = async () => {
        try {
            // Fetch Org Plan with Subscription Plan details and Overrides
            // Using select('*') to match BillingPage robustness
            const { data: org } = await supabase
                .from('organizations')
                .select(`
                    *,
                    subscription_plans (
                        name,
                        limits_config
                    )
                `)
                .eq('id', orgId)
                .single();

            console.log('[usePlanLimits] Raw Org Data:', org);

            if (org) {
                // 1. Check for Manual Override FIRST (Relaxed Logic)
                // Use manual limit if it exists and is greater than default, regardless of strict flag,
                // matching the permissive logic of the Billing Page.
                if (org.manual_screen_limit && org.manual_screen_limit > 1) {
                    console.log('[usePlanLimits] Using Manual Limit:', org.manual_screen_limit);
                    setPlanTier(org.is_manual_override ? 'custom' : (org.plan_tier as any || 'free'));
                    setMaxScreens(org.manual_screen_limit);
                }
                // 2. Then check for Subscription Plan
                else if (org.subscription_plans) {
                    const planData = Array.isArray(org.subscription_plans)
                        ? org.subscription_plans[0]
                        : org.subscription_plans;

                    if (planData) {
                        setPlanTier(planData.name?.toLowerCase() || 'free');
                        const config = planData.limits_config || {};
                        // Check both camelCase and snake_case properties for robustness
                        setMaxScreens(config.max_screens || config.maxScreens || 1);
                    } else {
                        // Fallback if plan relation exists but is empty
                        setPlanTier(org.plan_tier as any || 'free');
                        setMaxScreens(org.max_screens || 1);
                    }
                }
                // 3. Fallback to legacy columns
                else {
                    setPlanTier(org.plan_tier as any || 'free');
                    setMaxScreens(org.max_screens || 1);
                }
            }

            // Fetch Screen Count
            const { count } = await supabase
                .from('screens')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId);

            setCurrentScreenCount(count || 0);

        } catch (error) {
            console.error('Error fetching plan limits:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkScreenLimit = () => {
        // Simple check: is current count less than max allowed?
        return currentScreenCount < maxScreens;
    };

    return {
        loading,
        planTier,
        maxScreens,
        currentScreenCount,
        checkScreenLimit,
        refreshLimits: fetchLimits
    };
}
