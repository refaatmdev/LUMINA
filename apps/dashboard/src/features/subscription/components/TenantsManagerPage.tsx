
import { useState } from 'react';
import { useTenants, useUpdateTenantLimits } from '../api/tenants';
import { usePlans } from '../api/plans'; // Import usePlans
import { type BillingOrganization } from '../api/billing';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import {
    Search, Ban, CheckCircle,
    Monitor, Database, Edit2, X, Users, LogIn
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import TeamManagement from '../../../components/admin/TeamManagement';

export const TenantsManagerPage = () => {
    const navigate = useNavigate();
    const { data: tenants, isLoading } = useTenants();
    const { data: plans } = usePlans(); // Fetch available plans
    const updateMutation = useUpdateTenantLimits();

    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<BillingOrganization | null>(null);
    const [editingTenant, setEditingTenant] = useState<BillingOrganization | null>(null);

    // Form state for editing tenant
    const [editForm, setEditForm] = useState<{
        plan_tier: string;
        trial_ends_at: string;
        is_manual_override: boolean;
        internal_notes: string;
        manual_screen_limit: number;
        manual_storage_limit: number;
    }>({
        plan_tier: 'free',
        trial_ends_at: '',
        is_manual_override: false,
        internal_notes: '',
        manual_screen_limit: 0,
        manual_storage_limit: 0
    });
    console.log(tenants);
    const filteredTenants = tenants?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm)
    );

    const handleImpersonate = (orgId: string) => {
        if (confirm(`Are you sure you want to impersonate an admin for this organization ? `)) {
            sessionStorage.setItem('impersonated_org_id', orgId);
            // Redirect to root, the AuthProvider/useUserRole will pick up the new "org_admin" role
            navigate('/');
            window.location.reload();
        }
    };

    const handleStatusToggle = async (tenant: BillingOrganization) => {
        const newStatus = tenant.subscription_status === 'active' ? 'suspended' : 'active';
        if (confirm(`Are you sure you want to set status to ${newStatus}?`)) {
            await updateMutation.mutateAsync({
                orgId: tenant.id,
                updates: { subscription_status: newStatus as BillingOrganization['subscription_status'] }
            });
        }
    };

    const openEditModal = (tenant: BillingOrganization) => {
        setEditingTenant(tenant);

        // Format date for datetime-local input
        let dateStr = '';
        if (tenant.trial_ends_at) {
            const date = new Date(tenant.trial_ends_at);
            const offset = date.getTimezoneOffset() * 60000;
            dateStr = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        }

        setEditForm({
            // Ensure we use the plan ID if available, otherwise match by name or fallback
            // We'll store the plan ID in plan_tier temporarily or handle it separately?
            // Let's assume the select value will be the plan ID for simplicity and correctness.
            plan_tier: tenant.current_plan_id || '', // Use ID for the select value
            trial_ends_at: dateStr,
            is_manual_override: tenant.is_manual_override || false,
            internal_notes: tenant.internal_notes || '',
            manual_screen_limit: tenant.manual_screen_limit || 0,
            manual_storage_limit: tenant.manual_storage_limit || 0
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;

        // Find selected plan to get its name for plan_tier (legacy string field)
        const selectedPlan = plans?.find(p => p.id === editForm.plan_tier);

        try {
            await updateMutation.mutateAsync({
                orgId: editingTenant.id,
                updates: {
                    current_plan_id: selectedPlan?.id || null, // Update the FK
                    plan_tier: selectedPlan?.name.toLowerCase() || 'custom', // Update the legacy string
                    trial_ends_at: editForm.trial_ends_at ? new Date(editForm.trial_ends_at).toISOString() : undefined,
                    is_manual_override: editForm.is_manual_override,
                    internal_notes: editForm.internal_notes,
                    manual_screen_limit: editForm.manual_screen_limit,
                    manual_storage_limit: editForm.manual_storage_limit
                }
            });
            setEditingTenant(null);
        } catch (error) {
            console.error(error);
            alert('Failed to update tenant');
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <MainLayout title="Tenants Manager">
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <Input
                            type="text"
                            placeholder="Search tenants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Tenants Table */}
                <Card className="p-0 overflow-hidden border-border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border text-left">
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage (Scr/Stor)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTenants?.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                    {tenant.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground flex items-center gap-2">
                                                        {tenant.name}
                                                        {tenant.internal_notes && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-500" title={`Note: ${tenant.internal_notes} `}></span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono">{tenant.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                                {tenant.plan_tier || tenant.subscription_plans?.name || 'Free'}
                                            </span>
                                            {tenant.is_manual_override && (
                                                <div className="text-[10px] text-yellow-500 mt-1 font-medium">Override Active</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5" title="Screens">
                                                    <Monitor size={14} className="text-primary/70" />
                                                    <span className="text-foreground font-medium">
                                                        {tenant.screen_count || 0} / {tenant.manual_screen_limit || tenant.subscription_plans?.max_screens}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Storage">
                                                    <Database size={14} className="text-blue-500/70" />
                                                    <span className="text-foreground font-medium">
                                                        {Math.round((tenant.storage_used || 0) / (1024 * 1024))}MB / {tenant.manual_storage_limit || tenant.subscription_plans?.storage_gb}GB
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline - flex items - center gap - 1.5 px - 2.5 py - 0.5 rounded - full text - xs font - medium border ${tenant.subscription_status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                } `}>
                                                {tenant.subscription_status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                                <span className="capitalize">{tenant.subscription_status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {/* We don't have created_at in Tenant type usually, checking if we can get it. 
                                                If not, generic fallback or map from another field. 
                                                BillingOrganization has `created_at` in some contexts? 
                                                Checking `useTenants` query select: ` * `. So if `organizations` table has `created_at`, it is there.
                                            */}
                                            {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleImpersonate(tenant.id)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Log in as User"
                                                >
                                                    <LogIn size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedTenantForUsers(tenant)}
                                                    className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Manage Users"
                                                >
                                                    <Users size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(tenant)}
                                                    className="p-2 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                    title="Edit Details & Limits"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(tenant)}
                                                    className={`p - 2 rounded - lg transition - colors ${tenant.subscription_status === 'active'
                                                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                                        : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                                                        } `}
                                                    title={tenant.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                                                >
                                                    {tenant.subscription_status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Manage Users Modal */}
            {selectedTenantForUsers && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-border bg-card">
                        <div className="p-6 border-b border-border flex justify-between items-center z-10 bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Manage Users
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Organization: <span className="font-medium text-primary">{selectedTenantForUsers.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTenantForUsers(null)}
                                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <TeamManagement orgId={selectedTenantForUsers.id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {editingTenant && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="glass-panel w-full max-w-lg overflow-hidden flex flex-col rounded-2xl border border-border bg-card">
                        <div className="p-6 border-b border-border flex justify-between items-center z-10 bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Edit Organization</h3>
                                <p className="text-sm text-muted-foreground mt-1">{editingTenant.name}</p>
                            </div>
                            <button
                                onClick={() => setEditingTenant(null)}
                                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                            {/* Plan Selection */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Plan Tier</label>
                                <select
                                    value={editForm.plan_tier}
                                    onChange={(e) => setEditForm({ ...editForm, plan_tier: e.target.value })}
                                    className="glass-input w-full px-3 py-2 rounded-lg outline-none bg-background text-foreground border border-input"
                                >
                                    <option value="">Select Plan</option>
                                    {plans?.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} (${plan.price_monthly}/mo)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Trial */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Trial Ends At</label>
                                <input
                                    type="datetime-local"
                                    value={editForm.trial_ends_at}
                                    onChange={(e) => setEditForm({ ...editForm, trial_ends_at: e.target.value })}
                                    className="glass-input w-full px-3 py-2 rounded-lg outline-none bg-background text-foreground border border-input"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Leave empty for no trial expiration.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Max Screens</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={editForm.manual_screen_limit}
                                        onChange={(e) => setEditForm({ ...editForm, manual_screen_limit: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">0 = Plan Default</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Storage (GB)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={editForm.manual_storage_limit}
                                        onChange={(e) => setEditForm({ ...editForm, manual_storage_limit: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">0 = Plan Default</p>
                                </div>
                            </div>

                            {/* Manual Override */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                                <input
                                    type="checkbox"
                                    id="manual_override"
                                    checked={editForm.is_manual_override}
                                    onChange={(e) => setEditForm({ ...editForm, is_manual_override: e.target.checked })}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div>
                                    <label htmlFor="manual_override" className="block text-sm font-medium text-foreground">
                                        Manual Override (Custom Client)
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Treat as "Custom" regardless of plan (hides watermarks, enables all features).
                                    </p>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Internal Notes</label>
                                <textarea
                                    className="glass-input w-full px-3 py-2 rounded-lg outline-none bg-background text-foreground border border-input min-h-[100px]"
                                    placeholder="Add notes about this client..."
                                    value={editForm.internal_notes}
                                    onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingTenant(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={updateMutation.isPending}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
