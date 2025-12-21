import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building, Activity, CheckCircle } from 'lucide-react';
import { MainLayout } from '../../features/layout';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ForceRefreshButton } from './ForceRefreshButton';

interface Organization {
    id: string;
    screen_count?: number;
}

export default function SuperAdminDashboard() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    // Mock Metrics Data
    const metrics = {
        totalTenants: orgs.length,
        activeScreens: orgs.reduce((acc, org) => acc + (org.screen_count || 0), 0),
        systemStatus: 'Operational'
    };

    const [trialPeriodDays, setTrialPeriodDays] = useState<number>(14);
    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        fetchOrgs();
        fetchSystemSettings();
    }, []);

    const fetchSystemSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'trial_period_days')
                .single();

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching settings:', error);
                }
            } else if (data) {
                setTrialPeriodDays(Number(data.value));
            }
        } catch (err) {
            console.error('Unexpected error fetching settings:', err);
        }
    };

    const handleUpdateSettings = async () => {
        setSettingsLoading(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'trial_period_days',
                    value: trialPeriodDays,
                    description: 'Default duration of the trial period in days'
                });

            if (error) throw error;
            alert('Settings updated successfully');
        } catch (err) {
            console.error('Error updating settings:', err);
            alert('Failed to update settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchOrgs = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select(`
                    id,
                    screens: screens(count)
                `);

            if (error) throw error;

            const transformedData = (data || []).map((org: any) => ({
                id: org.id,
                screen_count: org.screens?.[0]?.count || 0,
            }));

            setOrgs(transformedData);
        } catch (error) {
            console.error('Error fetching orgs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout
            title="Super Admin Dashboard"
            actions={
                <div className="flex items-center gap-3">
                    <ForceRefreshButton />
                </div>
            }
        >
            {
                loading ? (
                    <div className="flex justify-center py-12" >
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        {/* Top Metrics Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Building size={64} className="text-foreground" />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-sm font-medium text-muted-foreground">Total Tenants</h3>
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                        <Building size={20} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-foreground relative z-10">{metrics.totalTenants}</div>
                                <div className="text-xs text-green-400 mt-1 flex items-center relative z-10">
                                    <Activity size={12} className="mr-1" /> +2 this week
                                </div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={64} className="text-foreground" />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-sm font-medium text-muted-foreground">Active Screens</h3>
                                    <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                                        <Activity size={20} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-foreground relative z-10">{metrics.activeScreens}</div>
                                <div className="text-xs text-muted-foreground mt-1 relative z-10">Across all organizations</div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CheckCircle size={64} className="text-foreground" />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-sm font-medium text-muted-foreground">System Status</h3>
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                        <CheckCircle size={20} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-foreground flex items-center gap-2 relative z-10">
                                    {metrics.systemStatus}
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 relative z-10">All systems operational</div>
                            </div>
                        </div>

                        {/* System Configuration */}
                        <div className="glass-panel p-6 rounded-xl mb-8">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-primary" />
                                System Configuration
                            </h3>
                            <div className="flex items-end gap-4 max-w-md">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Default Trial Period (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={trialPeriodDays}
                                        onChange={(e) => setTrialPeriodDays(parseInt(e.target.value) || 0)}
                                        className="glass-input w-full rounded-lg px-3 py-2 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    disabled={settingsLoading}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>

                    </>
                )}
        </MainLayout >
    );
}

