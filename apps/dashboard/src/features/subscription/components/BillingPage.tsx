import { useState } from 'react';
import { useAuthStore } from '../../../store/auth-store';
import { usePlans } from '../api/plans';
import { useBillingInfo, useUpdateSubscription } from '../api/billing';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Check } from 'lucide-react';

export const BillingPage = () => {
    const { orgId } = useAuthStore();
    const { data: billingInfo, isLoading: billingLoading } = useBillingInfo(orgId || undefined);
    const { data: plans, isLoading: plansLoading } = usePlans();

    const updateSubscription = useUpdateSubscription();
    const [updating, setUpdating] = useState<string | null>(null);

    if (billingLoading || plansLoading) return <LoadingSpinner />;

    const currentPlanId = billingInfo?.current_plan_id;

    const handlePlanSelect = async (planId: string) => {
        if (!orgId) return;
        setUpdating(planId);
        try {
            await updateSubscription.mutateAsync({ orgId, planId });
            alert('Subscription updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update subscription');
        } finally {
            setUpdating(null);
        }
    };
    console.log(billingInfo);
    return (
        <MainLayout title="Billing & Subscription">
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Current Subscription Status */}
                {/* Current Subscription Status */}
                <Card className="overflow-hidden border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
                                    Current Plan:
                                    <span className="text-primary">
                                        {billingInfo?.is_manual_override ? 'Custom Enterprise' :
                                            billingInfo?.subscription_plans?.name || 'Free Trial'}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase ${billingInfo?.subscription_status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                        }`}>
                                        {billingInfo?.subscription_status || 'UNKNOWN'}
                                    </span>
                                </h2>
                                <p className="text-muted-foreground">
                                    {billingInfo?.is_manual_override
                                        ? 'You are on a custom plan tailored to your needs.'
                                        : 'Manage your plan and billing details.'}
                                </p>
                            </div>
                            <div className="text-sm text-muted-foreground italic">
                                {billingInfo?.is_manual_override && 'Contact support to change your custom plan.'}
                            </div>
                        </div>

                        {/* Usage Bars */}
                        <div className="space-y-6">
                            {/* Screen Usage */}
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-foreground">Screen Usage</span>
                                    <span className="text-muted-foreground">
                                        {billingInfo?.screen_count || 0} / {billingInfo?.manual_screen_limit || billingInfo?.subscription_plans?.max_screens || 0} Screens
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, ((billingInfo?.screen_count || 0) / (billingInfo?.manual_screen_limit || billingInfo?.subscription_plans?.max_screens || 1)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Storage Usage */}
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-foreground">Storage Usage</span>
                                    <span className="text-muted-foreground">
                                        {Math.round((billingInfo?.storage_used || 0) / (1024 * 1024))}MB / {billingInfo?.manual_storage_limit || billingInfo?.subscription_plans?.storage_gb || 0}GB
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden leading-none">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (((billingInfo?.storage_used || 0) / (1024 * 1024 * 1024)) / (billingInfo?.manual_storage_limit || billingInfo?.subscription_plans?.storage_gb || 1)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Plans Grid */}
                <div>
                    <h3 className="text-xl font-bold text-foreground mb-6 text-center">Available Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans?.map((plan) => {
                            const isCurrent = currentPlanId === plan.id;

                            return (
                                <Card
                                    key={plan.id}
                                    className={`relative border-2 ${isCurrent
                                        ? 'border-primary/50 bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.1)] scale-105'
                                        : 'border-border hover:border-primary/30'
                                        }`}
                                >
                                    {plan.is_featured && !isCurrent && (
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-violet-600 text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                            Recommended
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                                        <div className="flex justify-center items-baseline gap-1">
                                            <span className="text-4xl font-bold text-foreground">${plan.price_monthly}</span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center gap-3 text-muted-foreground">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Check size={12} className="text-emerald-500" />
                                            </div>
                                            <span><strong>{plan.max_screens}</strong> Screens</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-muted-foreground">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Check size={12} className="text-emerald-500" />
                                            </div>
                                            <span><strong>{plan.storage_gb}GB</strong> Storage</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-muted-foreground">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Check size={12} className="text-emerald-500" />
                                            </div>
                                            <span>Unlimited Playlists</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-muted-foreground">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Check size={12} className="text-emerald-500" />
                                            </div>
                                            <span>Email Support</span>
                                        </li>
                                    </ul>

                                    <Button
                                        onClick={() => handlePlanSelect(plan.id)}
                                        disabled={isCurrent || updating !== null}
                                        variant={isCurrent ? 'secondary' : 'primary'}
                                        isLoading={updating === plan.id}
                                        className="w-full"
                                    >
                                        {isCurrent ? 'Current Plan' : 'Upgrade'}
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
