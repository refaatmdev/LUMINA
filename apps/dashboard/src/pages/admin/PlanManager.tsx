import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus, Edit2, Trash2, X, Save,
    DollarSign, Monitor, Database, Star
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Plan {
    id: string;
    name: string;
    stripe_price_id?: string;
    price_monthly: number;
    limits_config: {
        max_screens: number;
        storage_gb: number;
    };
    is_active: boolean;
    is_featured: boolean;
    display_order: number;
}

export default function PlanManager() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: '',
        price_monthly: 0,
        stripe_price_id: '',
        limits_config: { max_screens: 1, storage_gb: 1 },
        is_active: true,
        is_featured: false,
        display_order: 0
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            alert('Error fetching plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                price_monthly: formData.price_monthly,
                stripe_price_id: formData.stripe_price_id,
                limits_config: formData.limits_config,
                is_active: formData.is_active,
                is_featured: formData.is_featured,
                display_order: formData.display_order
            };

            if (editingPlan) {
                const { error } = await supabase
                    .from('subscription_plans')
                    .update(payload)
                    .eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('subscription_plans')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingPlan(null);
            resetForm();
            fetchPlans();
        } catch (error: any) {
            alert('Error saving plan: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (error: any) {
            alert('Error deleting plan: ' + error.message);
        }
    };

    const openModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            resetForm();
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price_monthly: 0,
            stripe_price_id: '',
            limits_config: { max_screens: 1, storage_gb: 1 },
            is_active: true,
            is_featured: false,
            display_order: plans.length + 1
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white text-glow">Subscription Plans</h1>
                    <p className="text-gray-400 mt-1">Manage pricing tiers and limits</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-violet-700 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)]"
                >
                    <Plus size={18} />
                    Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={`glass-panel rounded-xl shadow-lg border p-6 relative transition-all duration-300 ${plan.is_active ? 'border-white/10 hover:border-violet-500/30' : 'border-white/5 opacity-75 grayscale'}`}>
                        {plan.is_featured && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                <Star size={12} fill="currentColor" />
                                FEATURED
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <div className="text-2xl font-bold text-violet-400 mt-1 text-glow">
                                    ${plan.price_monthly}<span className="text-sm text-gray-400 font-normal">/mo</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(plan)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10 text-shadow-sm">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-white/10 pt-4 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2"><Monitor size={16} className="text-blue-400" /> Max Screens</span>
                                <span className="font-medium text-white">{plan.limits_config.max_screens}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2"><Database size={16} className="text-pink-400" /> Storage</span>
                                <span className="font-medium text-white">{plan.limits_config.storage_gb} GB</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" /> Stripe ID</span>
                                <span className="font-mono text-xs text-gray-500 truncate max-w-[120px]" title={plan.stripe_price_id}>{plan.stripe_price_id || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${plan.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500">Order: {plan.display_order}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="glass-panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl relative shadow-2xl">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-white text-glow">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                        value={formData.price_monthly}
                                        onChange={e => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stripe Price ID</label>
                                <input
                                    type="text"
                                    className="glass-input w-full px-4 py-2 rounded-lg outline-none font-mono text-sm"
                                    placeholder="price_..."
                                    value={formData.stripe_price_id}
                                    onChange={e => setFormData({ ...formData, stripe_price_id: e.target.value })}
                                    spellCheck={false}
                                />
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                <h4 className="font-medium text-white text-sm">Limits Configuration</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Max Screens</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="glass-input w-full px-3 py-2 rounded-lg outline-none"
                                            value={formData.limits_config?.max_screens}
                                            onChange={e => setFormData({
                                                ...formData,
                                                limits_config: { ...formData.limits_config!, max_screens: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Storage (GB)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0.1"
                                            step="0.1"
                                            className="glass-input w-full px-3 py-2 rounded-lg outline-none"
                                            value={formData.limits_config?.storage_gb}
                                            onChange={e => setFormData({
                                                ...formData,
                                                limits_config: { ...formData.limits_config!, storage_gb: parseFloat(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Active Plan</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.is_featured}
                                            onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Featured</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    className="glass-input w-24 px-3 py-2 rounded-lg outline-none"
                                    value={formData.display_order}
                                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg font-medium transition-colors border border-transparent hover:border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all"
                                >
                                    <Save size={18} />
                                    Save Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
