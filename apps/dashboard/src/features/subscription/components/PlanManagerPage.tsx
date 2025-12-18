import { useState } from 'react';
import { usePlans, useSavePlan, useDeletePlan, type Plan } from '../api/plans';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Save, X, DollarSign, Monitor, Database, Star } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const PlanManagerPage = () => {
    const { data: plans, isLoading } = usePlans();
    const saveMutation = useSavePlan();
    const deleteMutation = useDeletePlan();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan>>({});

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveMutation.mutateAsync(editingPlan);
            setIsModalOpen(false);
            setEditingPlan({});
        } catch (error) {
            console.error(error);
            alert('Failed to save plan');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const openModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
        } else {
            setEditingPlan({
                name: '',
                price_monthly: 0,
                max_screens: 1,
                storage_gb: 1,
                limits_config: { max_screens: 1, storage_gb: 1 },
                is_featured: false,
                is_active: true,
                display_order: (plans?.length || 0) + 1
            });
        }
        setIsModalOpen(true);
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <MainLayout title="Subscription Plans">
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button
                        onClick={() => openModal()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus size={20} className="mr-2" />
                        Create New Plan
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans?.map((plan) => (
                        <Card key={plan.id} className={`p-6 relative ${plan.is_featured ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                            {plan.is_featured && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg rounded-tr-xl font-medium flex items-center gap-1">
                                    <Star size={12} fill="currentColor" /> Featured
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                                    <div className="text-2xl font-bold text-primary mt-2">
                                        ${plan.price_monthly}<span className="text-sm text-muted-foreground font-normal">/mo</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(plan)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Monitor size={16} className="text-muted-foreground" />
                                    <span>Up to <strong className="text-foreground">{plan.max_screens}</strong> screens</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Database size={16} className="text-muted-foreground" />
                                    <span><strong className="text-foreground">{plan.storage_gb}GB</strong> storage</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <DollarSign size={16} className="text-muted-foreground" />
                                    <span className="truncate text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                                        ID: {plan.stripe_price_id || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingPlan.id ? 'Edit Plan' : 'New Plan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Plan Name</label>
                                    <Input
                                        type="text"
                                        required
                                        value={editingPlan.name || ''}
                                        onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Monthly Price ($)</label>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={editingPlan.price_monthly || 0}
                                        onChange={e => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Stripe Price ID</label>
                                <Input
                                    type="text"
                                    value={editingPlan.stripe_price_id || ''}
                                    onChange={e => setEditingPlan({ ...editingPlan, stripe_price_id: e.target.value })}
                                    placeholder="price_H5gg..."
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Screen Limit</label>
                                    <Input
                                        type="number"
                                        required
                                        min="1"
                                        value={editingPlan.max_screens || 1}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setEditingPlan({
                                                ...editingPlan,
                                                max_screens: val,
                                                limits_config: { ...editingPlan.limits_config!, max_screens: val }
                                            });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Storage (GB)</label>
                                    <Input
                                        type="number"
                                        required
                                        min="1"
                                        value={editingPlan.storage_gb || 1}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setEditingPlan({
                                                ...editingPlan,
                                                storage_gb: val,
                                                limits_config: { ...editingPlan.limits_config!, storage_gb: val }
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingPlan.is_featured || false}
                                        onChange={e => setEditingPlan({ ...editingPlan, is_featured: e.target.checked })}
                                        className="rounded text-primary focus:ring-primary bg-muted border-border"
                                    />
                                    Featured Plan
                                </label>
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingPlan.is_active || false}
                                        onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                                        className="rounded text-primary focus:ring-primary bg-muted border-border"
                                    />
                                    Active (Visible)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="flex-1"
                                    isLoading={saveMutation.isPending}
                                >
                                    {!saveMutation.isPending && <Save size={18} className="mr-2" />}
                                    Save Plan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
