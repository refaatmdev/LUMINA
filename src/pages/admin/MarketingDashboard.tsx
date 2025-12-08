import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Megaphone, Plus, Trash2, Check } from 'lucide-react';

interface Announcement {
    id: string;
    message: string;
    bg_color: string;
    is_active: boolean;
    target_plan: string | null;
    created_at: string;
}

export default function MarketingDashboard() {
    // Coupon State
    const [couponName, setCouponName] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [duration, setDuration] = useState<'once' | 'forever' | 'repeating'>('once');
    const [durationMonths, setDurationMonths] = useState(0);
    const [creatingCoupon, setCreatingCoupon] = useState(false);
    const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

    // Announcement State
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');
    const [newAnnouncementColor, setNewAnnouncementColor] = useState('indigo');
    const [newAnnouncementPlan, setNewAnnouncementPlan] = useState<string>('all');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('system_announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCoupon(true);
        setCouponSuccess(null);

        try {
            const body: any = {
                name: couponName,
                duration: duration,
            };

            if (discountType === 'percent') {
                body.percent_off = discountValue;
            } else {
                body.amount_off = discountValue;
            }

            if (duration === 'repeating') {
                body.duration_in_months = durationMonths;
            }

            const { data, error } = await supabase.functions.invoke('create-coupon', {
                body: body
            });

            if (error) throw error;

            setCouponSuccess(`Coupon ${data.promotionCode.code} created successfully!`);
            setCouponName('');
            setDiscountValue(0);
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            alert('Failed to create coupon: ' + error.message);
        } finally {
            setCreatingCoupon(false);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('system_announcements')
                .insert({
                    message: newAnnouncementMsg,
                    bg_color: newAnnouncementColor,
                    target_plan: newAnnouncementPlan === 'all' ? null : newAnnouncementPlan,
                    is_active: true
                });

            if (error) throw error;

            setNewAnnouncementMsg('');
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Failed to create announcement');
        }
    };

    const toggleAnnouncement = async (id: string, currentState: boolean) => {
        try {
            const { error } = await supabase
                .from('system_announcements')
                .update({ is_active: !currentState })
                .eq('id', id);

            if (error) throw error;
            fetchAnnouncements();
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const { error } = await supabase
                .from('system_announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h1>
                <p className="text-gray-500 mt-1">Manage coupons and system-wide announcements.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Coupon Generator */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Coupon Generator</h2>
                            <p className="text-sm text-gray-500">Create Stripe promo codes</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code Name</label>
                            <input
                                type="text"
                                value={couponName}
                                onChange={(e) => setCouponName(e.target.value.toUpperCase())}
                                placeholder="e.g. SUMMER2025"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as any)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white"
                                >
                                    <option value="percent">Percentage (%)</option>
                                    <option value="amount">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none"
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as any)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white"
                                >
                                    <option value="once">Once</option>
                                    <option value="forever">Forever</option>
                                    <option value="repeating">Repeating</option>
                                </select>
                            </div>
                            {duration === 'repeating' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Months</label>
                                    <input
                                        type="number"
                                        value={durationMonths}
                                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none"
                                        required
                                        min="1"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={creatingCoupon}
                            className="w-full bg-green-600 text-white rounded-xl py-2.5 font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {creatingCoupon ? 'Creating...' : (
                                <>
                                    <Plus size={18} />
                                    Create Coupon
                                </>
                            )}
                        </button>

                        {couponSuccess && (
                            <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2">
                                <Check size={16} />
                                {couponSuccess}
                            </div>
                        )}
                    </form>
                </div>

                {/* Active Campaigns */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <Megaphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
                            <p className="text-sm text-gray-500">Global announcements banner</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateAnnouncement} className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Message</label>
                            <input
                                type="text"
                                value={newAnnouncementMsg}
                                onChange={(e) => setNewAnnouncementMsg(e.target.value)}
                                placeholder="e.g. Upgrade now and get 20% off!"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <select
                                    value={newAnnouncementColor}
                                    onChange={(e) => setNewAnnouncementColor(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white"
                                >
                                    <option value="indigo">Indigo</option>
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="red">Red</option>
                                    <option value="yellow">Yellow</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                                <select
                                    value={newAnnouncementPlan}
                                    onChange={(e) => setNewAnnouncementPlan(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white"
                                >
                                    <option value="all">All Users</option>
                                    <option value="free">Free Plan</option>
                                    <option value="pro">Pro Plan</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Add Announcement
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
                        {loadingAnnouncements ? (
                            <div className="text-center py-4 text-gray-500">Loading...</div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No announcements found.</div>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann.id} className={`p-4 rounded-xl border ${ann.is_active ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase bg-${ann.bg_color}-100 text-${ann.bg_color}-700`}>
                                            {ann.bg_color}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                                                className={`text-xs font-medium px-2 py-1 rounded ${ann.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {ann.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                            <button
                                                onClick={() => deleteAnnouncement(ann.id)}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{ann.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">Target: {ann.target_plan || 'All'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
