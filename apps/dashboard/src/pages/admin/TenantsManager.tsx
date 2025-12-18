import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search, Plus, MoreVertical, Shield, Ban, CheckCircle,
    Users, Edit2, Save, X, Database, Monitor, Eye
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { PLANS } from '../../constants/plans';

interface Organization {
    id: string;
    name: string;
    logo_url?: string;
    plan_tier: string;
    created_at: string;
    status: 'active' | 'suspended' | 'archived';
    is_manual_override: boolean;
    manual_screen_limit?: number;
    manual_storage_limit?: number;
    admin_notes?: string;
    screen_count?: number; // Joined count
}

interface OrgUser {
    email: string;
    role: string;
}

export default function TenantsManager() {
    const [tenants, setTenants] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [orgUsers, setOrgUsers] = useState<Record<string, OrgUser[]>>({});
    const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLimitsModal, setShowLimitsModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Organization | null>(null);

    // Form States
    const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'free' });
    const [limitsForm, setLimitsForm] = useState({
        is_manual_override: false,
        manual_screen_limit: 0,
        manual_storage_limit_gb: 0
    });
    const [notesBuffer, setNotesBuffer] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            // Fetch orgs and screen counts
            // Note: This requires RLS to allow Super Admin to see all orgs
            const { data: orgs, error } = await supabase
                .from('organizations')
                .select(`
    *,
    screens: screens(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedOrgs = orgs.map((org: any) => ({
                ...org,
                screen_count: org.screens?.[0]?.count || 0
            }));

            setTenants(formattedOrgs);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            alert('Failed to fetch tenants. Ensure you are a Super Admin.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgUsers = async (orgId: string) => {
        if (orgUsers[orgId]) return; // Already fetched

        setLoadingUsers(prev => ({ ...prev, [orgId]: true }));
        try {
            // We need to join profiles with roles. 
            // Assuming profiles table has org_id.
            const { data, error } = await supabase
                .from('profiles')
                .select('email, role')
                .eq('org_id', orgId);

            if (error) throw error;
            setOrgUsers(prev => ({ ...prev, [orgId]: data || [] }));
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(prev => ({ ...prev, [orgId]: false }));
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Create Organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert([{
                    name: newClient.name,
                    plan_tier: newClient.plan,
                    status: 'active'
                }])
                .select()
                .single();

            if (orgError) throw orgError;

            // 2. Invite User (This usually requires an Edge Function to handle Auth invite)
            // For now, we might just create a profile if the user already exists in Auth, 
            // or we'd rely on Supabase Invite User API.
            // Since we don't have the invite logic here, we'll just alert.
            alert(`Organization '${org.name}' created! ID: ${org.id}.\n\nPlease manually invite ${newClient.email} via the Supabase Auth dashboard or implement an invite flow.`);

            setShowCreateModal(false);
            setNewClient({ name: '', email: '', plan: 'free' });
            fetchTenants();
        } catch (error: any) {
            alert('Error creating client: ' + error.message);
        }
    };

    const handleUpdateLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            const { error } = await supabase
                .from('organizations')
                .update({
                    is_manual_override: limitsForm.is_manual_override,
                    manual_screen_limit: limitsForm.manual_screen_limit,
                    manual_storage_limit: limitsForm.manual_storage_limit_gb * 1024 * 1024 * 1024 // Convert GB to Bytes
                })
                .eq('id', selectedTenant.id);

            if (error) throw error;

            setShowLimitsModal(false);
            fetchTenants();
        } catch (error: any) {
            alert('Error updating limits: ' + error.message);
        }
    };

    const toggleStatus = async (org: Organization) => {
        const newStatus = org.status === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} ${org.name}?`)) return;

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ status: newStatus })
                .eq('id', org.id);

            if (error) throw error;
            fetchTenants();
        } catch (error: any) {
            alert('Error updating status: ' + error.message);
        }
    };

    const handleImpersonate = (orgId: string) => {
        if (window.confirm('Are you sure you want to login as this client? You will see exactly what they see.')) {
            sessionStorage.setItem('impersonated_org_id', orgId);
            window.location.reload();
        }
    };

    const saveNotes = async (orgId: string) => {
        const notes = notesBuffer[orgId];
        if (notes === undefined) return;

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ admin_notes: notes })
                .eq('id', orgId);

            if (error) throw error;
            alert('Notes saved!');
            fetchTenants(); // Refresh to ensure sync
        } catch (error: any) {
            alert('Error saving notes: ' + error.message);
        }
    };

    const openLimitsModal = (org: Organization) => {
        setSelectedTenant(org);
        setLimitsForm({
            is_manual_override: org.is_manual_override,
            manual_screen_limit: org.manual_screen_limit || 0,
            manual_storage_limit_gb: (org.manual_storage_limit || 0) / (1024 * 1024 * 1024)
        });
        setShowLimitsModal(true);
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.includes(searchQuery)
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white text-glow">Tenants Manager</h1>
                    <p className="text-gray-400 mt-1">Super Admin Control Panel</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-violet-700 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)]"
                >
                    <Plus size={18} />
                    Create Custom Client
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search organizations..."
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Organization</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Plan</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Stats</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Created</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredTenants.map(org => (
                            <React.Fragment key={org.id}>
                                <tr className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 font-bold border border-white/10">
                                                {org.logo_url ? (
                                                    <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    org.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{org.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{org.id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.is_manual_override ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                                <Shield size={12} />
                                                Custom
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 uppercase border border-white/5">
                                                {org.plan_tier}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1.5" title="Screens">
                                                <Monitor size={16} className="text-blue-400" />
                                                <span>{org.screen_count} / {org.is_manual_override ? (org.manual_screen_limit === 0 ? '∞' : org.manual_screen_limit) : PLANS[org.plan_tier.toUpperCase() as keyof typeof PLANS]?.maxScreens || 1}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            }`}>
                                            {org.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                            {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openLimitsModal(org)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                                title="Edit Limits"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (expandedRow === org.id) {
                                                        setExpandedRow(null);
                                                    } else {
                                                        setExpandedRow(org.id);
                                                        fetchOrgUsers(org.id);
                                                    }
                                                }}
                                                className={`p-2 rounded-lg transition-colors border border-transparent ${expandedRow === org.id ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'}`}
                                                title="View Details"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedRow === org.id && (
                                    <tr className="bg-white/5">
                                        <td colSpan={6} className="px-6 py-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Users List */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                        <Users size={16} className="text-violet-400" />
                                                        Users
                                                    </h4>
                                                    {loadingUsers[org.id] ? (
                                                        <div className="text-sm text-gray-500">Loading users...</div>
                                                    ) : (
                                                        <div className="bg-black/30 rounded-lg border border-white/10 divide-y divide-white/5">
                                                            {orgUsers[org.id]?.length > 0 ? (
                                                                orgUsers[org.id].map((user, idx) => (
                                                                    <div key={idx} className="px-4 py-3 flex justify-between items-center text-sm">
                                                                        <span className="text-gray-300">{user.email}</span>
                                                                        <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full capitalize border border-white/5">{user.role}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="px-4 py-3 text-sm text-gray-500 italic">No users found</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Admin Actions & Notes */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-3">Quick Actions</h4>
                                                        <div className="flex gap-3 flex-wrap">
                                                            <button
                                                                onClick={() => handleImpersonate(org.id)}
                                                                className="px-4 py-2 rounded-lg text-sm font-medium border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Eye size={16} />
                                                                Login as Admin
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStatus(org)}
                                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${org.status === 'active'
                                                                    ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                                                    : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                                                                    }`}
                                                            >
                                                                {org.status === 'active' ? 'Suspend Organization' : 'Activate Organization'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-3">Internal Notes</h4>
                                                        <div className="relative">
                                                            <textarea
                                                                className="glass-input w-full h-24 rounded-lg p-3 text-sm outline-none resize-none"
                                                                placeholder="Add internal notes about this client..."
                                                                value={notesBuffer[org.id] !== undefined ? notesBuffer[org.id] : (org.admin_notes || '')}
                                                                onChange={(e) => setNotesBuffer(prev => ({ ...prev, [org.id]: e.target.value }))}
                                                            />
                                                            {(notesBuffer[org.id] !== undefined && notesBuffer[org.id] !== org.admin_notes) && (
                                                                <button
                                                                    onClick={() => saveNotes(org.id)}
                                                                    className="absolute bottom-3 right-3 p-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 shadow-sm"
                                                                    title="Save Notes"
                                                                >
                                                                    <Save size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Client Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="glass-panel p-6 w-full max-w-md transform transition-all scale-100 rounded-2xl relative">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-white text-glow">Create Custom Client</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClient} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    required
                                    className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
                                <input
                                    type="email"
                                    required
                                    className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Initial Plan</label>
                                <select
                                    className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                    value={newClient.plan}
                                    onChange={e => setNewClient({ ...newClient, plan: e.target.value })}
                                >
                                    {Object.entries(PLANS).map(([key, plan]) => (
                                        <option key={key} value={key.toLowerCase()} className="bg-gray-900 text-white">{plan.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg font-medium transition-colors border border-transparent hover:border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all"
                                >
                                    Create Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Limits Modal */}
            {showLimitsModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="glass-panel p-6 w-full max-w-md transform transition-all scale-100 rounded-2xl relative">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-white text-glow">Edit Limits: {selectedTenant.name}</h3>
                            <button onClick={() => setShowLimitsModal(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateLimits} className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div>
                                    <h4 className="font-medium text-white">Manual Override</h4>
                                    <p className="text-xs text-gray-400">Ignore standard plan limits</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={limitsForm.is_manual_override}
                                        onChange={e => setLimitsForm({ ...limitsForm, is_manual_override: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                </label>
                            </div>

                            <div className={`space-y-4 transition-opacity ${!limitsForm.is_manual_override ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Screen Limit</label>
                                    <div className="relative">
                                        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="number"
                                            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg outline-none"
                                            value={limitsForm.manual_screen_limit}
                                            onChange={e => setLimitsForm({ ...limitsForm, manual_screen_limit: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Storage Limit (GB)</label>
                                    <div className="relative">
                                        <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="number"
                                            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg outline-none"
                                            value={limitsForm.manual_storage_limit_gb}
                                            onChange={e => setLimitsForm({ ...limitsForm, manual_storage_limit_gb: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLimitsModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg font-medium transition-colors border border-transparent hover:border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all"
                                >
                                    Save Limits
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
