import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Check, Shield, Zap, Monitor, Star } from 'lucide-react';

interface BillingOrganization {
    id: string;
    name: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete';
    max_screens: number;
    stripe_customer_id: string | null;
    current_plan_id: string | null;
    subscription_plans?: Plan; // Joined plan details
    is_manual_override?: boolean;
    manual_screen_limit?: number;
    manual_storage_limit?: number;
}

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    stripe_price_id?: string;
    limits_config: {
        max_screens: number;
        storage_gb: number;
    };
    is_featured: boolean;
    display_order: number;
}

export default function Billing() {
    const { orgId } = useUserRole();
    const [organization, setOrganization] = useState<BillingOrganization | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [screenCount, setScreenCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null); // Track loading per plan ID

    useEffect(() => {
        if (orgId) {
            fetchData();
        }
    }, [orgId]);

    const fetchData = async () => {
        try {
            // Fetch Org Details with Plan
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select(`
                    id, 
                    name, 
                    subscription_status, 
                    max_screens, 
                    stripe_customer_id, 
                    current_plan_id,
                    is_manual_override,
                    manual_screen_limit,
                    manual_storage_limit,
                    subscription_plans (
                        id,
                        name,
                        price_monthly,
                        stripe_price_id,
                        limits_config,
                        is_featured,
                        display_order
                    )
                `)
                .eq('id', orgId)
                .single();

            if (orgError) throw orgError;

            // Flatten the response if needed or just use it as is. 
            // Supabase returns the joined object as a property.
            // We need to cast it to match our interface or let TS infer.
            // The subscription_plans will be an object (since it's a foreign key relation on current_plan_id)
            // But wait, current_plan_id is the FK. So subscription_plans should be a single object.

            setOrganization(orgData as any);

            // Fetch Active Plans
            const { data: plansData, error: plansError } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (plansError) throw plansError;
            setPlans(plansData || []);

            // Fetch Screen Count
            const { count, error: countError } = await supabase
                .from('screens')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId);

            if (countError) throw countError;
            setScreenCount(count || 0);

        } catch (error) {
            console.error('Error fetching billing details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscriptionChange = async (plan: Plan) => {
        console.log('Attempting to change subscription to:', plan);

        if (!plan.stripe_price_id) {
            console.error('Plan missing stripe_price_id:', plan);
            alert('Configuration Error: This plan does not have a valid Stripe Price ID. Please contact support.');
            return;
        }

        setCheckoutLoading(plan.id);
        try {
            console.log('Invoking create-checkout-session with:', {
                org_id: orgId,
                plan_id: plan.stripe_price_id,
                return_url: window.location.href
            });

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    org_id: orgId,
                    plan_id: plan.stripe_price_id,
                    return_url: window.location.href
                }
            });

            if (error) {
                console.error('Supabase function error:', error);
                throw error;
            }

            console.log('Checkout session created:', data);

            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error('No URL returned from checkout session creation');
                alert('Failed to start checkout. No URL returned.');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setCheckoutLoading('portal');
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: {
                    org_id: orgId,
                    return_url: window.location.href
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating portal session:', error);
            alert('Failed to open billing portal.');
        } finally {
            setCheckoutLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!organization) return null;

    // Use the joined plan details if available, otherwise try to find in active plans, otherwise default to first (Free)
    const currentPlan = organization.subscription_plans || plans.find(p => p.id === organization.current_plan_id) || plans[0];

    // Check if org has custom limits that differ from the plan defaults
    const planLimit = currentPlan?.limits_config?.max_screens || 1;
    const orgMaxScreens = Number(organization.max_screens);

    // Check for manual override from TenantsManager
    const isManualOverride = organization.is_manual_override;
    const manualLimit = organization.manual_screen_limit ? Number(organization.manual_screen_limit) : 0;

    const hasCustomLimits = orgMaxScreens !== planLimit;

    const isCustomPlan = currentPlan?.name === 'Custom' || hasCustomLimits || isManualOverride;

    // For Custom plans (or manual overrides), use organization limits. For others, use plan limits.
    // Priority: Manual Override > Org Max Screens > Plan Limit
    let maxScreens = planLimit;
    if (isManualOverride) {
        maxScreens = manualLimit === 0 ? 999999 : manualLimit; // 0 usually means unlimited in some contexts, but let's assume explicit value
    } else if (hasCustomLimits) {
        maxScreens = orgMaxScreens;
    }

    console.log('Billing Debug:', {
        orgMaxScreens,
        planLimit,
        hasCustomLimits,
        isCustomPlan,
        maxScreens,
        isManualOverride,
        manualLimit,
        currentPlanName: currentPlan?.name
    });

    const usagePercentage = Math.min((screenCount / maxScreens) * 100, 100);
    const isUnlimited = maxScreens >= 999999;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white text-glow">Billing & Subscription</h1>
                <p className="text-gray-400 mt-1">Manage your plan and payment details.</p>
            </div>

            {/* Current Plan Usage */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            Current Plan: <span className="text-violet-400">{isCustomPlan ? 'Custom' : (currentPlan?.name || 'Unknown')}</span>
                            {organization.subscription_status === 'active' && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">ACTIVE</span>
                            )}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {isCustomPlan
                                ? 'You are on a custom plan tailored to your needs.'
                                : organization.subscription_status === 'active'
                                    ? 'Your subscription is active.'
                                    : 'You are currently on the free tier.'}
                        </p>
                    </div>
                    {organization.stripe_customer_id && !isCustomPlan && (
                        <button
                            onClick={handleManageSubscription}
                            disabled={!!checkoutLoading}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 font-medium transition-colors disabled:opacity-50"
                        >
                            {checkoutLoading === 'portal' ? 'Loading...' : 'Manage Subscription'}
                        </button>
                    )}
                    {isCustomPlan && (
                        <div className="text-sm text-gray-500 italic">
                            Contact support to change your custom plan.
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-300">Screen Usage</span>
                        <span className="text-white">
                            {screenCount} / {isUnlimited ? 'Unlimited' : maxScreens} Screens
                        </span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${screenCount >= maxScreens ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-violet-600 shadow-[0_0_10px_#7c3aed]'
                                }`}
                            style={{ width: isUnlimited ? '0%' : `${usagePercentage}%` }} // Don't show bar for unlimited
                        />
                    </div>
                    {!isUnlimited && screenCount >= maxScreens && !isCustomPlan && (
                        <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                            <Shield size={12} />
                            You have reached your screen limit. Upgrade to add more screens.
                        </p>
                    )}
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    // Determine if this card is the "current" plan
                    let isCurrent = false;

                    if (isCustomPlan) {
                        isCurrent = plan.name === 'Custom';
                    } else {
                        isCurrent = plan.id === currentPlan?.id;
                    }

                    // Hide 'Custom' plan from the list UNLESS it is the current plan
                    if (plan.name === 'Custom' && !isCurrent) return null;

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-2xl border p-6 relative flex flex-col backdrop-blur-md transition-all duration-300 ${isCurrent
                                ? 'bg-violet-500/10 border-violet-500/30 shadow-[0_0_30px_rgba(124,58,237,0.15)]'
                                : plan.is_featured
                                    ? 'glass-panel border-violet-500/50 shadow-[0_0_30px_rgba(124,58,237,0.2)] transform scale-105 z-10'
                                    : 'glass-panel border-white/10'
                                }`}
                        >
                            {plan.is_featured && !isCurrent && (
                                <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                                    POPULAR
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isCurrent ? 'bg-violet-500/20 border-violet-500/30' : 'bg-white/5 border-white/10'
                                    }`}>
                                    {plan.name.toLowerCase().includes('pro') ? (
                                        <Zap className={isCurrent ? 'text-violet-400' : 'text-gray-400'} size={20} />
                                    ) : plan.name.toLowerCase().includes('enterprise') ? (
                                        <Star className={isCurrent ? 'text-violet-400' : 'text-gray-400'} size={20} />
                                    ) : (
                                        <Monitor className={isCurrent ? 'text-violet-400' : 'text-gray-400'} size={20} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white text-glow">${plan.price_monthly}</span>
                                        <span className="text-sm text-gray-400">/mo</span>
                                    </div>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check size={16} className="text-emerald-400" />
                                    <strong className="text-white">
                                        {isCurrent && isCustomPlan
                                            ? (maxScreens >= 999999 ? 'Unlimited' : maxScreens)
                                            : (plan.limits_config.max_screens >= 999999 ? 'Unlimited' : plan.limits_config.max_screens)
                                        }
                                    </strong> Screens
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check size={16} className="text-emerald-400" />
                                    <strong className="text-white">
                                        {isCurrent && isCustomPlan
                                            ? (organization.manual_storage_limit ? `${Math.round(organization.manual_storage_limit / (1024 * 1024 * 1024))} GB` : 'Custom')
                                            : (plan.limits_config.storage_gb >= 999999 ? 'Unlimited' : `${plan.limits_config.storage_gb} GB`)
                                        }
                                    </strong> Storage
                                </li>
                            </ul>

                            {isCurrent ? (
                                <button disabled className="w-full py-2.5 bg-violet-500/10 text-violet-300 rounded-xl font-medium cursor-not-allowed border border-violet-500/20">
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscriptionChange(plan)}
                                    disabled={!!checkoutLoading}
                                    className={`w-full py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${plan.is_featured
                                        ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]'
                                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                        } ${!plan.stripe_price_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {checkoutLoading === plan.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-b-transparent"></div>
                                    ) : (
                                        <>
                                            {plan.price_monthly > (currentPlan?.price_monthly || 0) ? 'Upgrade' : 'Downgrade'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
