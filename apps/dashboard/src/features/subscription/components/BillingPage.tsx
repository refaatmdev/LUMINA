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

    return (
        <MainLayout title="Billing & Subscription">
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Current Subscription Status */}
                <Card>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-1">Current Subscription</h2>
                            <p className="text-muted-foreground">Manage your plan and billing details</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${billingInfo?.subscription_status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                {billingInfo?.subscription_status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            {/* In a real app, this would link to Stripe Customer Portal */}
                            <Button variant="ghost" className="text-primary hover:text-primary/80">
                                Manage Payment Method
                            </Button>
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
