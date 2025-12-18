import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface FinancialMetrics {
    totalMrr: number;
    activeSubscribers: number;
    revenueByPlan: { name: string; value: number }[];
    mrrHistory: { name: string; mrr: number }[];
    churnRate: number;
}

export interface Transaction {
    id: string;
    customer: string;
    date: string;
    amount: number;
    status: 'succeeded' | 'failed';
}

export const useFinancialMetrics = () => {
    return useQuery({
        queryKey: ['financial-metrics'],
        queryFn: async (): Promise<FinancialMetrics> => {
            // 1. Fetch Active Subscriptions for MRR and Count
            const { data: orgs, error: orgsError } = await supabase
                .from('organizations')
                .select(`
                    id,
                    plan_tier,
                    subscription_status,
                    subscription_plans (
                        price_monthly,
                        name
                    )
                `)
                .eq('subscription_status', 'active');

            if (orgsError) throw orgsError;

            // Calculate Total MRR and Active Subscribers
            let currentMrr = 0;
            const planCounts: Record<string, number> = {};
            const activeCount = orgs?.length || 0;

            orgs?.forEach((org: any) => {
                const price = org.subscription_plans?.price_monthly || 0;
                const planName = org.subscription_plans?.name || 'Unknown';

                currentMrr += price;
                if (planCounts[planName]) {
                    planCounts[planName] += price;
                } else {
                    planCounts[planName] = price;
                }
            });

            // Prepare Pie Chart Data
            const revenueByPlan = Object.keys(planCounts).map(name => ({
                name,
                value: planCounts[name]
            }));

            // Mock MRR History (Last 12 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonthIndex = new Date().getMonth();
            const mrrHistory = [];

            for (let i = 11; i >= 0; i--) {
                const monthIndex = (currentMonthIndex - i + 12) % 12;
                const factor = 0.5 + (0.5 * (11 - i) / 11);
                const randomVariation = (Math.random() * 0.1) - 0.05;
                const value = Math.round(currentMrr * (factor + randomVariation));

                mrrHistory.push({
                    name: months[monthIndex],
                    mrr: value
                });
            }
            mrrHistory[11].mrr = currentMrr;

            // Calculate Churn Rate
            const { count: canceledCount } = await supabase
                .from('organizations')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'canceled');

            const { count: totalCount } = await supabase
                .from('organizations')
                .select('*', { count: 'exact', head: true });

            let churnRate = 0;
            if (totalCount && totalCount > 0) {
                churnRate = ((canceledCount || 0) / totalCount) * 100;
            }

            return {
                totalMrr: currentMrr,
                activeSubscribers: activeCount,
                revenueByPlan,
                mrrHistory,
                churnRate
            };
        }
    });
};

export const useRecentTransactions = () => {
    return useQuery({
        queryKey: ['recent-transactions'],
        queryFn: async (): Promise<Transaction[]> => {
            const { data, error } = await supabase.functions.invoke('get-recent-transactions');
            if (error) {
                console.error('Error fetching transactions:', error);
                return [];
            }
            return data.transactions || [];
        }
    });
};
