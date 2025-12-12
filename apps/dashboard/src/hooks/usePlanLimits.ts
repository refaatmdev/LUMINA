import { useState, useEffect } from 'react';
import { supabase } from '@lumina/shared/lib';
import { useUserRole } from './useUserRole';

export function usePlanLimits() {
    const { orgId } = useUserRole();
    const [loading, setLoading] = useState(true);
    const [planTier, setPlanTier] = useState<'free' | 'pro'>('free');
    const [maxScreens, setMaxScreens] = useState(1);
    const [currentScreenCount, setCurrentScreenCount] = useState(0);

    useEffect(() => {
        if (orgId) {
            fetchLimits();
        }
    }, [orgId]);

    const fetchLimits = async () => {
        try {
            // Fetch Org Plan with Subscription Plan details and Overrides
            const { data: org } = await supabase
                .from('organizations')
                .select(`
                    plan_tier,
                    max_screens,
                    is_manual_override,
                    manual_screen_limit,
                    subscription_plans (
                        name,
                        limits_config
                    )
                `)
                .eq('id', orgId)
                .single();

            if (org) {
                // 1. Check for Manual Override FIRST
                if (org.is_manual_override && org.manual_screen_limit) {
                    setPlanTier(org.plan_tier as any || 'custom');
                    setMaxScreens(org.manual_screen_limit);
                }
                // 2. Then check for Subscription Plan
                else if (org.subscription_plans) {
                    const planData = org.subscription_plans as any;
                    setPlanTier(planData.name.toLowerCase());
                    const config = planData.limits_config;
                    setMaxScreens(config.max_screens || config.maxScreens || 1);
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
