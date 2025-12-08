import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
            // Fetch Org Plan
            const { data: org } = await supabase
                .from('organizations')
                .select('plan_tier, max_screens')
                .eq('id', orgId)
                .single();

            if (org) {
                setPlanTier(org.plan_tier as 'free' | 'pro');
                setMaxScreens(org.max_screens);
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
        if (planTier === 'free' && currentScreenCount >= maxScreens) {
            return false;
        }
        return true;
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
