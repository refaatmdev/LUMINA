import { MainLayout } from '../../layout';
import { useFinancialMetrics, useRecentTransactions } from '../api/finance';
import { DollarSign, TrendingUp, Users, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card } from '../../../components/ui/Card';

export const FinancePage = () => {
    const { data: metrics, isLoading: dataLoading } = useFinancialMetrics();
    const { data: transactions, isLoading: txLoading } = useRecentTransactions();

    const loading = dataLoading || txLoading;

    // COLORS for charts - updated to neon palette
    const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    if (loading) return <LoadingSpinner />;

    return (
        <MainLayout title="Financial Analytics" subtitle="Overview of revenue, growth, and transactions.">
            <div className="space-y-8 text-foreground">

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                            <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                                <ArrowUpRight size={16} className="mr-1" />
                                +12.5%
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">Monthly Recurring Revenue</p>
                        <h3 className="text-3xl font-bold text-foreground">${metrics?.totalMrr.toLocaleString()}</h3>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                <Users size={24} />
                            </div>
                            <span className="flex items-center text-blue-400 text-sm font-medium bg-blue-500/10 px-2 py-1 rounded-full">
                                <ArrowUpRight size={16} className="mr-1" />
                                +5.2%
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">Active Subscribers</p>
                        <h3 className="text-3xl font-bold text-foreground">{metrics?.activeSubscribers}</h3>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                                <TrendingUp size={24} className="transform rotate-180" />
                            </div>
                            <span className="flex items-center text-red-400 text-sm font-medium bg-red-500/10 px-2 py-1 rounded-full">
                                <ArrowDownRight size={16} className="mr-1" />
                                {metrics?.churnRate.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">Churn Rate</p>
                        <h3 className="text-3xl font-bold text-foreground">{metrics?.churnRate.toFixed(1)}%</h3>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* MRR Growth Chart */}
                    <Card className="lg:col-span-2 p-6">
                        <h3 className="text-lg font-bold text-white mb-6">MRR Growth (Last 12 Months)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics?.mrrHistory}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            color: 'hsl(var(--popover-foreground))'
                                        }}
                                        formatter={(value: number) => [`$${value}`, 'MRR']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="mrr"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Revenue Breakdown */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6">Revenue by Plan</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics?.revenueByPlan}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {metrics?.revenueByPlan.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number) => `$${value}`}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            color: 'hsl(var(--popover-foreground))'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-3">
                            {metrics?.revenueByPlan.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-muted-foreground">{entry.name}</span>
                                    </div>
                                    <span className="font-medium text-foreground">${entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions?.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {tx.status === 'succeeded' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                    Succeeded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                    <AlertCircle size={12} className="mr-1" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">{tx.customer}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{tx.date}</td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">${tx.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};
