import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lumina/shared/lib';
import { useUserRole } from '../../hooks/useUserRole';
import { LoadingSpinner } from '@lumina/shared/ui';
import { Clock } from 'lucide-react';

type Props = {
    children: React.ReactNode;
    fallback?: React.ReactNode; // Optional custom fallback (e.g. for Player)
};

export default function TrialGuard({ children, fallback }: Props) {
    const { orgId, role, loading: roleLoading } = useUserRole();
    const [trialStatus, setTrialStatus] = useState<'active' | 'expired' | 'loading'>('loading');
    const navigate = useNavigate();

    useEffect(() => {
        if (roleLoading) return;

        // Super admins bypass trial checks
        if (role === 'super_admin') {
            setTrialStatus('active');
            return;
        }

        if (orgId) {
            checkTrialStatus();
            console.log('Checking trial status for org:', orgId);
        } else {
            // No org usually means loading or error, but let's assume active for now until org is loaded
            // Or if user has no org, they can't do much anyway.
            setTrialStatus('active');
        }
    }, [orgId, role, roleLoading]);

    const checkTrialStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('plan_tier, trial_ends_at')
                .eq('id', orgId)
                .single();

            if (error) throw error;
            console.log('Trial status:', data);
            if (data.plan_tier === 'free' && data.trial_ends_at) {
                const trialEnd = new Date(data.trial_ends_at);
                const now = new Date();

                if (now > trialEnd) {
                    setTrialStatus('expired');
                    return;
                }
            }

            setTrialStatus('active');
        } catch (error) {
            console.error('Error checking trial status:', error);
            // Fail safe to active or handle error? 
            // Let's fail safe to active to avoid locking out on network errors, 
            // but log it.
            setTrialStatus('active');
        }
    };

    if (roleLoading || trialStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (trialStatus === 'expired') {
        if (fallback) {
            return <>{fallback}</>;
        }

        // Default Dashboard Fallback
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Expired</h1>
                    <p className="text-gray-500 mb-8">
                        Your free trial has ended. To continue using Lumina and access all features, please upgrade your plan.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/admin/billing')}
                            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Upgrade Now
                        </button>
                        <button
                            onClick={() => window.location.href = 'mailto:support@lumina.com'}
                            className="w-full bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
