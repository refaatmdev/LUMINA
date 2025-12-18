import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface SystemStats {
    activeScreens: number;
    deviceStats: { name: string; value: number }[];
    storage: { used: number; total: number };
    activeTenants: { name: string; updates: number }[];
}

export const useSystemStats = () => {
    return useQuery({
        queryKey: ['system-stats'],
        queryFn: async (): Promise<SystemStats> => {
            // 1. Total Active Screens (Online in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { count: activeScreens } = await supabase
                .from('screens')
                .select('*', { count: 'exact', head: true })
                .gt('last_ping', fiveMinutesAgo);

            // 2. Top Devices (from play_logs user_agent)
            const { data: logs } = await supabase
                .from('play_logs')
                .select('user_agent')
                .order('played_at', { ascending: false })
                .limit(1000);

            const osCounts: Record<string, number> = {
                'Tizen': 0, 'WebOS': 0, 'Android': 0, 'Desktop': 0, 'Other': 0
            };

            logs?.forEach(log => {
                const ua = log.user_agent || '';
                if (ua.includes('Tizen')) osCounts['Tizen']++;
                else if (ua.includes('Web0S') || ua.includes('WebOS')) osCounts['WebOS']++;
                else if (ua.includes('Android')) osCounts['Android']++;
                else if (ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux')) osCounts['Desktop']++;
                else osCounts['Other']++;
            });

            const deviceStats = Object.keys(osCounts).map(name => ({
                name,
                value: osCounts[name]
            })).filter(d => d.value > 0);

            // 3. Storage Usage
            const { data: mediaItems, error: mediaError } = await supabase
                .from('media_items')
                .select('size_bytes');

            let storageUsed = 12.5; // Default fallback
            if (!mediaError && mediaItems) {
                const totalBytes = mediaItems.reduce((acc, item) => acc + (item.size_bytes || 0), 0);
                storageUsed = totalBytes / (1024 * 1024 * 1024); // GB
            }

            // 4. Most Active Tenants (by daily updates/plays)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: activeLogs } = await supabase
                .from('play_logs')
                .select('org_id')
                .gt('played_at', oneDayAgo);

            const orgCounts: Record<string, number> = {};
            activeLogs?.forEach(log => {
                const orgId = log.org_id; // Check if org_id exists
                if (orgId) orgCounts[orgId] = (orgCounts[orgId] || 0) + 1;
            });

            const topOrgIds = Object.entries(orgCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([id]) => id);

            let activeTenants: { name: string; updates: number }[] = [];

            if (topOrgIds.length > 0) {
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .in('id', topOrgIds);

                activeTenants = topOrgIds.map(id => {
                    const org = orgs?.find(o => o.id === id);
                    return {
                        name: org?.name || 'Unknown Org',
                        updates: orgCounts[id]
                    };
                });
            }

            return {
                activeScreens: activeScreens || 0,
                deviceStats,
                storage: { used: storageUsed, total: 100 },
                activeTenants
            };
        }
    });
};
