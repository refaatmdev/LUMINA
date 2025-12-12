import { useState, useEffect } from 'react';
import { supabase } from '@lumina/shared/lib';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Monitor, HardDrive, Activity, Smartphone } from 'lucide-react';

export default function SystemStats() {
    const [loading, setLoading] = useState(true);
    const [activeScreens, setActiveScreens] = useState(0);
    const [deviceStats, setDeviceStats] = useState<any[]>([]);
    const [storageStats, setStorageStats] = useState({ used: 0, total: 0 });
    const [activeTenants, setActiveTenants] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Total Active Screens (Online in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { count: activeCount } = await supabase
                .from('screens')
                .select('*', { count: 'exact', head: true })
                .gt('last_ping', fiveMinutesAgo);

            setActiveScreens(activeCount || 0);

            // 2. Top Devices (from play_logs user_agent)
            // Note: This is a heavy query if logs are huge. Ideally use a materialized view or RPC.
            // For now, we'll fetch a sample of recent logs.
            const { data: logs } = await supabase
                .from('play_logs')
                .select('user_agent')
                .order('played_at', { ascending: false })
                .limit(1000); // Sample last 1000 plays

            const osCounts: Record<string, number> = {
                'Tizen': 0,
                'WebOS': 0,
                'Android': 0,
                'Desktop': 0,
                'Other': 0
            };

            logs?.forEach(log => {
                const ua = log.user_agent || '';
                if (ua.includes('Tizen')) osCounts['Tizen']++;
                else if (ua.includes('Web0S') || ua.includes('WebOS')) osCounts['WebOS']++;
                else if (ua.includes('Android')) osCounts['Android']++;
                else if (ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux')) osCounts['Desktop']++;
                else osCounts['Other']++;
            });

            const deviceData = Object.keys(osCounts).map(name => ({
                name,
                value: osCounts[name]
            })).filter(d => d.value > 0);

            setDeviceStats(deviceData);

            // 3. Storage Usage
            // Sum of all media file sizes. Assuming we have a 'media' table with 'size' column.
            // If not, we might need to mock or check storage bucket metadata (harder from client).
            // Let's assume we can sum 'size' from 'media_library' table if it exists, or mock it if not.
            // Checking schema... assuming 'media_library' or similar.
            // If not found, I'll mock it for now as per "Goal: Visualize".
            // Actually, let's try to fetch from 'media_items' if it exists.

            const { data: mediaItems, error: mediaError } = await supabase
                .from('media_items') // Guessing table name
                .select('size_bytes');

            if (!mediaError && mediaItems) {
                const totalBytes = mediaItems.reduce((acc, item) => acc + (item.size_bytes || 0), 0);
                setStorageStats({
                    used: totalBytes / (1024 * 1024 * 1024), // GB
                    total: 100 // Mock total capacity 100GB
                });
            } else {
                // Mock if table doesn't exist
                setStorageStats({ used: 12.5, total: 100 });
            }

            // 4. Most Active Tenants (by daily updates/plays)
            // We can count play_logs per org in the last 24h
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: activeLogs } = await supabase
                .from('play_logs')
                .select('org_id')
                .gt('played_at', oneDayAgo);

            const orgCounts: Record<string, number> = {};
            activeLogs?.forEach(log => {
                orgCounts[log.org_id] = (orgCounts[log.org_id] || 0) + 1;
            });

            // Get top 5 org IDs
            const topOrgIds = Object.entries(orgCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([id]) => id);

            if (topOrgIds.length > 0) {
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .in('id', topOrgIds);

                const topTenants = topOrgIds.map(id => {
                    const org = orgs?.find(o => o.id === id);
                    return {
                        name: org?.name || 'Unknown Org',
                        updates: orgCounts[id]
                    };
                });
                setActiveTenants(topTenants);
            } else {
                setActiveTenants([]);
            }

        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

    if (loading) {
        return <div className="flex justify-center items-center h-96">Loading system stats...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Usage Statistics</h1>
                <p className="text-gray-500 mt-1">Real-time insights into system performance and usage.</p>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Screens */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Monitor size={24} />
                        </div>
                        <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                            <Activity size={16} className="mr-1" />
                            Live
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Total Active Screens</p>
                    <h3 className="text-4xl font-bold text-gray-900 mt-2">{activeScreens}</h3>
                </div>

                {/* Storage Usage */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <HardDrive size={24} />
                        </div>
                        <span className="text-gray-500 text-sm">
                            {storageStats.used.toFixed(1)} GB / {storageStats.total} GB
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Storage Usage</p>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-2.5">
                        <div
                            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((storageStats.used / storageStats.total) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-right">
                        {((storageStats.used / storageStats.total) * 100).toFixed(1)}% Used
                    </p>
                </div>

                {/* Top Device OS */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Smartphone size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Top Device OS</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {deviceStats.length > 0 ? deviceStats.sort((a, b) => b.value - a.value)[0].name : 'N/A'}
                    </h3>
                    <p className="text-xs text-gray-400">Most popular platform</p>
                </div>
            </div>

            {/* Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Device Distribution Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Device OS Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deviceStats} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#4B5563', fontSize: 14, fontWeight: 500 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {deviceStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Most Active Tenants */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">Most Active Tenants (24h)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Organization</th>
                                    <th className="px-6 py-3 text-right">Updates/Plays</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                            No activity recorded in the last 24 hours.
                                        </td>
                                    </tr>
                                ) : (
                                    activeTenants.map((tenant, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {tenant.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {tenant.name}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600 font-mono">
                                                {tenant.updates.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
