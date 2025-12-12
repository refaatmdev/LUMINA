import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Building, Plus, Users, Activity, HardDrive, LogIn, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import AdminLayout from '../layout/AdminLayout';
import TeamManagement from './TeamManagement';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ForceRefreshButton } from './ForceRefreshButton';

interface Organization {
    id: string;
    name: string;
    status: 'active' | 'suspended';
    created_at: string;
    plan?: 'Free' | 'Pro' | 'Enterprise';
    screen_count?: number;
    storage_used?: string;
    logo_url?: string;
    trial_ends_at?: string;
    is_manual_override?: boolean;
    plan_tier?: string;
}

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [newOrgName, setNewOrgName] = useState('');
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    // Mock Metrics Data
    const metrics = {
        totalTenants: orgs.length,
        activeScreens: orgs.reduce((acc, org) => acc + (org.screen_count || 0), 0), // Mock calculation
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
                if (error.code !== 'PGRST116') { // Ignore not found, use default
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
                    *,
                    screens: screens(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data
            const transformedData = (data || []).map((org: any) => ({
                ...org,
                status: org.status || 'active',
                plan: org.plan_tier || org.plan || 'Free',
                plan_tier: org.plan_tier || org.plan || 'free',
                screen_count: org.screens?.[0]?.count || 0,
                storage_used: org.storage_used ? `${Math.round(org.storage_used / (1024 * 1024 * 1024))}GB` : '0GB', // Convert bytes to GB if exists, else 0
                logo_url: org.logo_url || null,
                trial_ends_at: org.trial_ends_at,
                is_manual_override: org.is_manual_override
            }));

            setOrgs(transformedData);
        } catch (error) {
            console.error('Error fetching orgs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('organizations')
                .insert([{ name: newOrgName, status: 'active' }]);

            if (error) throw error;

            setNewOrgName('');
            setShowCreateModal(false);
            fetchOrgs();
        } catch (error) {
            alert('Error creating organization');
            console.error(error);
        }
    };

    const handleImpersonate = (orgId: string) => {
        localStorage.setItem('impersonatedOrgId', orgId);
        alert(`Impersonating Admin for Org ID: ${orgId}. Redirecting to Dashboard...`);
        navigate('/admin');
    };

    const handleSuspend = async (orgId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            // Update local state optimistically
            setOrgs(orgs.map(org => org.id === orgId ? { ...org, status: newStatus } : org));

            const { error } = await supabase
                .from('organizations')
                .update({ status: newStatus })
                .eq('id', orgId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            fetchOrgs(); // Revert on error
        }
    };

    return (
        <AdminLayout
            title="Super Admin Dashboard"
            actions={
                <div className="flex items-center gap-3">
                    <ForceRefreshButton />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 font-medium text-sm"
                    >
                        <Plus size={18} className="mr-2" />
                        New Organization
                    </button>
                </div>
            }
        >
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {/* Top Metrics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Tenants</h3>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Building size={20} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{metrics.totalTenants}</div>
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                                <Activity size={12} className="mr-1" /> +2 this week
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Active Screens</h3>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{metrics.activeScreens}</div>
                            <div className="text-xs text-gray-500 mt-1">Across all organizations</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">System Status</h3>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                {metrics.systemStatus}
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">All systems operational</div>
                        </div>
                    </div>

                    {/* System Configuration */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-600" />
                            System Configuration
                        </h3>
                        <div className="flex items-end gap-4 max-w-md">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Trial Period (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={trialPeriodDays}
                                    onChange={(e) => setTrialPeriodDays(parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                />
                            </div>
                            <button
                                onClick={handleUpdateSettings}
                                disabled={settingsLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {settingsLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Organizations Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orgs.map((org) => (
                                        <tr key={org.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold text-lg border border-gray-200">
                                                        {org.logo_url ? (
                                                            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            org.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{org.name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{org.plan} Plan</span>
                                                            <span>• {new Date(org.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Activity size={14} className="mr-2 text-gray-400" />
                                                        {org.screen_count} Screens
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <HardDrive size={14} className="mr-2 text-gray-400" />
                                                        {org.storage_used} Used
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${org.status === 'active'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {org.status === 'active' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                                                    {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleImpersonate(org.id)}
                                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Log in as User"
                                                    >
                                                        <LogIn size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedOrgId(org.id)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Manage Users"
                                                    >
                                                        <Users size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingOrg(org)}
                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit Organization"
                                                    >
                                                        <Activity size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSuspend(org.id, org.status)}
                                                        className={`p-2 rounded-lg transition-colors ${org.status === 'active'
                                                            ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                                                            }`}
                                                        title={org.status === 'active' ? "Suspend Organization" : "Activate Organization"}
                                                    >
                                                        <AlertTriangle size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Create Organization</h3>
                                        <p className="text-sm text-gray-500 mt-1">Add a new tenant to the system.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateOrg} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={newOrgName}
                                                onChange={(e) => setNewOrgName(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                                placeholder="Acme Corp"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Create Organization
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {selectedOrgId && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Manage Users
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Organization: <span className="font-medium text-gray-900">{orgs.find(o => o.id === selectedOrgId)?.name}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrgId(null)}
                                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
                                    <TeamManagement orgId={selectedOrgId} />
                                </div>
                            </div>
                        </div>
                    )}

                    {editingOrg && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Edit Organization</h3>
                                        <p className="text-sm text-gray-500 mt-1">Update details for {editingOrg.name}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingOrg(null)}
                                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const { error } = await supabase
                                            .from('organizations')
                                            .update({
                                                trial_ends_at: editingOrg.trial_ends_at,
                                                is_manual_override: editingOrg.is_manual_override,
                                                plan_tier: editingOrg.plan_tier
                                            })
                                            .eq('id', editingOrg.id);

                                        if (error) throw error;
                                        setEditingOrg(null);
                                        fetchOrgs();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Error updating organization');
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan</label>
                                        <select
                                            value={editingOrg.plan_tier || 'free'}
                                            onChange={(e) => setEditingOrg({ ...editingOrg, plan_tier: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white"
                                        >
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Trial Ends At</label>
                                        <input
                                            type="datetime-local"
                                            value={editingOrg.trial_ends_at ? (() => {
                                                const date = new Date(editingOrg.trial_ends_at);
                                                const offset = date.getTimezoneOffset() * 60000;
                                                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                                                return localISOTime;
                                            })() : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val) {
                                                    setEditingOrg({ ...editingOrg, trial_ends_at: undefined });
                                                } else {
                                                    const date = new Date(val);
                                                    setEditingOrg({ ...editingOrg, trial_ends_at: date.toISOString() });
                                                }
                                            }}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave empty for no trial expiration.</p>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_manual_override"
                                            checked={editingOrg.is_manual_override || false}
                                            onChange={(e) => setEditingOrg({ ...editingOrg, is_manual_override: e.target.checked })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_manual_override" className="ml-2 block text-sm text-gray-900">
                                            Manual Override (Custom Client)
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        If checked, this client will be treated as "Custom" regardless of plan tier (hides watermark, etc).
                                    </p>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingOrg(null)}
                                            className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
}
