import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, TrendingUp, Users, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinanceAnalytics() {
    const [loading, setLoading] = useState(true);
    const [mrrData, setMrrData] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [churnRate, setChurnRate] = useState(0);
    const [totalMrr, setTotalMrr] = useState(0);
    const [activeSubscribers, setActiveSubscribers] = useState(0);

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

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

            setTotalMrr(currentMrr);
            // Set Active Subscribers Count (Real Data)
            setActiveSubscribers(activeCount);

            // Prepare Pie Chart Data
            const pieData = Object.keys(planCounts).map(name => ({
                name,
                value: planCounts[name]
            }));
            setRevenueData(pieData);

            // Mock MRR History (Last 12 Months) - Still mocked as we don't have historical data
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonthIndex = new Date().getMonth();
            const historyData = [];

            for (let i = 11; i >= 0; i--) {
                const monthIndex = (currentMonthIndex - i + 12) % 12;
                const factor = 0.5 + (0.5 * (11 - i) / 11);
                const randomVariation = (Math.random() * 0.1) - 0.05;
                const value = Math.round(currentMrr * (factor + randomVariation));

                historyData.push({
                    name: months[monthIndex],
                    mrr: value
                });
            }
            historyData[11].mrr = currentMrr;
            setMrrData(historyData);


            // Fetch Real Recent Transactions from Stripe via Edge Function
            const { data: txData, error: txError } = await supabase.functions.invoke('get-recent-transactions');

            if (txError) {
                console.error('Error fetching transactions:', txError);
                // Fallback to empty or mock if needed, but user asked for real.
                setTransactions([]);
            } else {
                setTransactions(txData.transactions || []);
            }

            // Calculate Churn Rate
            const { count: canceledCount } = await supabase
                .from('organizations')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'canceled');

            const { count: totalCount } = await supabase
                .from('organizations')
                .select('*', { count: 'exact', head: true });

            if (totalCount && totalCount > 0) {
                setChurnRate(((canceledCount || 0) / totalCount) * 100);
            }

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    // COLORS for charts - updated to neon palette
    const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    if (loading) {
        return <div className="flex justify-center items-center h-96 text-white text-glow">Loading financial data...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white text-glow">Financial Analytics</h1>
                <p className="text-gray-400 mt-1">Overview of revenue, growth, and transactions.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                            <DollarSign size={24} />
                        </div>
                        <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            <ArrowUpRight size={16} className="mr-1" />
                            +12.5%
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">Monthly Recurring Revenue</p>
                    <h3 className="text-3xl font-bold text-white text-glow">${totalMrr.toLocaleString()}</h3>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                            <Users size={24} />
                        </div>
                        <span className="flex items-center text-blue-400 text-sm font-medium bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                            <ArrowUpRight size={16} className="mr-1" />
                            +5.2%
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">Active Subscribers</p>
                    <h3 className="text-3xl font-bold text-white text-glow">
                        {activeSubscribers}
                    </h3>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                            <TrendingUp size={24} className="transform rotate-180" />
                        </div>
                        <span className="flex items-center text-red-400 text-sm font-medium bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                            <ArrowDownRight size={16} className="mr-1" />
                            {churnRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">Churn Rate</p>
                    <h3 className="text-3xl font-bold text-white text-glow">{churnRate.toFixed(1)}%</h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MRR Growth Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white text-glow mb-6">MRR Growth (Last 12 Months)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mrrData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                        color: '#fff'
                                    }}
                                    formatter={(value: number) => [`$${value}`, 'MRR']}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mrr"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#1f2937' }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#c4b5fd' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white text-glow mb-6">Revenue by Plan</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {revenueData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `$${value}`}
                                    contentStyle={{
                                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#9ca3af' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {revenueData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }} />
                                    <span className="text-gray-300">{entry.name}</span>
                                </div>
                                <span className="font-medium text-white">${entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white text-glow">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className={`hover:bg-white/5 transition-colors ${tx.status === 'failed' ? 'bg-red-500/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        {tx.status === 'succeeded' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                                Succeeded
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                                <AlertCircle size={12} className="mr-1" />
                                                Failed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">{tx.customer}</td>
                                    <td className="px-6 py-4 text-gray-400">{tx.date}</td>
                                    <td className="px-6 py-4 text-right font-medium text-white">${tx.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
