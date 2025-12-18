import { MainLayout } from '../../layout';
import { useSystemStats } from '../api/stats';
import { Monitor, HardDrive, Activity, Smartphone } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card } from '../../../components/ui/Card';

export const SystemStatsPage = () => {
    const { data: stats, isLoading } = useSystemStats();
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

    if (isLoading) return <LoadingSpinner />;

    return (
        <MainLayout title="System Usage Statistics" subtitle="Real-time insights into system performance and usage.">
            <div className="space-y-8">
                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Screens */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
                                <Monitor size={24} />
                            </div>
                            <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                <Activity size={16} className="mr-1" />
                                Live
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">Total Active Screens</p>
                        <h3 className="text-4xl font-bold text-foreground mt-2">{stats?.activeScreens}</h3>
                    </Card>

                    {/* Storage Usage */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
                                <HardDrive size={24} />
                            </div>
                            <span className="text-muted-foreground text-sm">
                                {stats?.storage.used.toFixed(1)} GB / {stats?.storage.total} GB
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">Storage Usage</p>
                        <div className="mt-4 w-full bg-muted rounded-full h-2.5">
                            <div
                                className="bg-pink-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(((stats?.storage.used || 0) / (stats?.storage.total || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            {(((stats?.storage.used || 0) / (stats?.storage.total || 1)) * 100).toFixed(1)}% Used
                        </p>
                    </Card>

                    {/* Top Device OS */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                <Smartphone size={24} />
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm">Top Device OS</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {stats?.deviceStats && stats.deviceStats.length > 0
                                ? stats.deviceStats.sort((a, b) => b.value - a.value)[0].name
                                : 'N/A'
                            }
                        </h3>
                        <p className="text-xs text-muted-foreground">Most popular platform</p>
                    </Card>
                </div>

                {/* Charts & Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Device Distribution Chart */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6">Device OS Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.deviceStats} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 500 }}
                                        width={80}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            color: 'hsl(var(--popover-foreground))'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                        {stats?.deviceStats?.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Most Active Tenants */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-bold text-foreground">Most Active Tenants (24h)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Organization</th>
                                        <th className="px-6 py-3 text-right">Updates/Plays</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {!stats?.activeTenants || stats.activeTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                                                No activity recorded in the last 24 hours.
                                            </td>
                                        </tr>
                                    ) : (
                                        stats.activeTenants.map((tenant, index) => (
                                            <tr key={index} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-xs">
                                                        {tenant.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {tenant.name}
                                                </td>
                                                <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                                                    {tenant.updates.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};
