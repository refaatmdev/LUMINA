import { useState } from 'react';
import { useTenants, useUpdateTenantLimits, type BillingOrganization } from '../api/tenants';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import {
    Search, Ban, CheckCircle,
    Monitor, Database, Edit2, X
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const TenantsManagerPage = () => {
    const { data: tenants, isLoading } = useTenants();
    const updateMutation = useUpdateTenantLimits();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<BillingOrganization | null>(null); // For limits modal
    const [editLimits, setEditLimits] = useState({ max_screens: 0, storage_gb: 0 });

    const filteredTenants = tenants?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm)
    );

    const handleStatusToggle = async (tenant: BillingOrganization) => {
        const newStatus = tenant.subscription_status === 'active' ? 'canceled' : 'active';
        if (confirm(`Are you sure you want to set status to ${newStatus}?`)) {
            await updateMutation.mutateAsync({
                orgId: tenant.id,
                updates: { subscription_status: newStatus }
            });
        }
    };

    const openLimitsModal = (tenant: BillingOrganization) => {
        setSelectedTenant(tenant);
        setEditLimits({
            max_screens: tenant.manual_screen_limit || tenant.subscription_plans?.max_screens || 0,
            storage_gb: tenant.manual_storage_limit || tenant.subscription_plans?.storage_gb || 0
        });
    };

    const handleSaveLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            await updateMutation.mutateAsync({
                orgId: selectedTenant.id,
                updates: {
                    is_manual_override: true,
                    manual_screen_limit: editLimits.max_screens,
                    manual_storage_limit: editLimits.storage_gb
                }
            });
            setSelectedTenant(null);
        } catch (error) {
            console.error(error);
            alert('Failed to update limits');
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
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Limits (Scr/GB)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTenants?.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                    {tenant.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{tenant.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{tenant.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                                {tenant.subscription_plans?.name || 'No Plan'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.subscription_status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {tenant.subscription_status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                                {tenant.subscription_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1" title="Screens">
                                                    <Monitor size={14} className="text-muted-foreground" />
                                                    <span>{tenant.manual_screen_limit || tenant.subscription_plans?.max_screens}</span>
                                                </div>
                                                <div className="w-px h-4 bg-border"></div>
                                                <div className="flex items-center gap-1" title="Storage">
                                                    <Database size={14} className="text-muted-foreground" />
                                                    <span>{tenant.manual_storage_limit || tenant.subscription_plans?.storage_gb}GB</span>
                                                </div>
                                                {tenant.is_manual_override && (
                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded" title="Manual Override Active">
                                                        Override
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openLimitsModal(tenant)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                    title="Edit Limits"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(tenant)}
                                                    className={`p-2 rounded-lg ${tenant.subscription_status === 'active'
                                                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                                        : 'text-muted-foreground hover:text-green-600 hover:bg-green-500/10'
                                                        }`}
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

            {/* Limits Modal */}
            {selectedTenant && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h2 className="text-lg font-bold text-foreground">Override Limits</h2>
                            <button onClick={() => setSelectedTenant(null)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLimits} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Max Screens</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editLimits.max_screens}
                                    onChange={e => setEditLimits({ ...editLimits, max_screens: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Storage (GB)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editLimits.storage_gb}
                                    onChange={e => setEditLimits({ ...editLimits, storage_gb: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="w-full"
                                    isLoading={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? 'Saving...' : 'Save Limits'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
