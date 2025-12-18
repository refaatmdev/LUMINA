import { useState } from 'react';
import { MainLayout } from '../../layout';
import { Tag, Megaphone, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, useCreateCoupon } from '../api/marketing';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const MarketingPage = () => {
    // Coupon State
    const [couponName, setCouponName] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [duration, setDuration] = useState<'once' | 'forever' | 'repeating'>('once');
    const [durationMonths, setDurationMonths] = useState(0);
    const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

    // Announcement State
    const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');
    const [newAnnouncementColor, setNewAnnouncementColor] = useState('indigo');
    const [newAnnouncementPlan, setNewAnnouncementPlan] = useState<string>('all');

    // Hooks
    const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
    const createAnnouncement = useCreateAnnouncement();
    const updateAnnouncement = useUpdateAnnouncement();
    const deleteAnnouncement = useDeleteAnnouncement();
    const createCoupon = useCreateCoupon();

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
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

            const data = await createCoupon.mutateAsync(body);

            setCouponSuccess(`Coupon ${data.promotionCode.code} created successfully!`);
            setCouponName('');
            setDiscountValue(0);
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            alert('Failed to create coupon: ' + (error.message || 'Unknown error'));
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAnnouncement.mutateAsync({
                message: newAnnouncementMsg,
                bg_color: newAnnouncementColor,
                target_plan: newAnnouncementPlan === 'all' ? null : newAnnouncementPlan,
                is_active: true
            });
            setNewAnnouncementMsg('');
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Failed to create announcement');
        }
    };

    const toggleAnnouncement = async (id: string, currentState: boolean) => {
        try {
            await updateAnnouncement.mutateAsync({
                id,
                updates: { is_active: !currentState }
            });
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await deleteAnnouncement.mutateAsync(id);
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    return (
        <MainLayout title="Marketing & Promotions" subtitle="Manage coupons and system-wide announcements.">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Coupon Generator */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Coupon Generator</h2>
                            <p className="text-sm text-muted-foreground">Create Stripe promo codes</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Code Name</label>
                            <Input
                                type="text"
                                value={couponName}
                                onChange={(e) => setCouponName(e.target.value.toUpperCase())}
                                placeholder="e.g. SUMMER2025"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as any)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none bg-card"
                                >
                                    <option value="percent">Percentage (%)</option>
                                    <option value="amount">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Value</label>
                                <Input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    required
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as any)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none bg-card"
                                >
                                    <option value="once">Once</option>
                                    <option value="forever">Forever</option>
                                    <option value="repeating">Repeating</option>
                                </select>
                            </div>
                            {duration === 'repeating' && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Months</label>
                                    <input
                                        type="number"
                                        value={durationMonths}
                                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                                        className="w-full glass-input rounded-xl px-4 py-2.5 outline-none"
                                        required
                                        min="1"
                                    />
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={createCoupon.isPending}
                            isLoading={createCoupon.isPending}
                            variant="primary" // Changed to primary violet since green button is not in standard variants yet, or use custom className
                            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)] border-transparent" // Overriding for specific green coupon style
                        >
                            {!createCoupon.isPending && <Plus size={18} className="mr-2" />}
                            Create Coupon
                        </Button>

                        {couponSuccess && (
                            <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2">
                                <Check size={16} />
                                {couponSuccess}
                            </div>
                        )}
                        {createCoupon.isError && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                Failed to create coupon
                            </div>
                        )}
                    </form>
                </Card>

                {/* Active Campaigns */}
                <Card className="p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                            <Megaphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Active Campaigns</h2>
                            <p className="text-sm text-muted-foreground">Global announcements banner</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateAnnouncement} className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Announcement Message</label>
                            <Input
                                type="text"
                                value={newAnnouncementMsg}
                                onChange={(e) => setNewAnnouncementMsg(e.target.value)}
                                placeholder="e.g. Upgrade now and get 20% off!"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Color</label>
                                <select
                                    value={newAnnouncementColor}
                                    onChange={(e) => setNewAnnouncementColor(e.target.value)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none bg-card"
                                >
                                    <option value="indigo">Indigo</option>
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="red">Red</option>
                                    <option value="yellow">Yellow</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Target</label>
                                <select
                                    value={newAnnouncementPlan}
                                    onChange={(e) => setNewAnnouncementPlan(e.target.value)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none bg-card"
                                >
                                    <option value="all">All Users</option>
                                    <option value="free">Free Plan</option>
                                    <option value="pro">Pro Plan</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={createAnnouncement.isPending}
                            isLoading={createAnnouncement.isPending}
                            className="w-full"
                        >
                            {!createAnnouncement.isPending && <Plus size={18} className="mr-2" />}
                            Add Announcement
                        </Button>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
                        {announcementsLoading ? (
                            <LoadingSpinner />
                        ) : announcements?.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No announcements found.</div>
                        ) : (
                            announcements?.map((ann) => (
                                <div key={ann.id} className={`p-4 rounded-xl border ${ann.is_active ? 'border-primary/20 bg-primary/10' : 'border-border bg-muted/50 opacity-60'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase bg-${ann.bg_color}-100 text-${ann.bg_color}-700`}>
                                            {ann.bg_color}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                                                disabled={updateAnnouncement.isPending}
                                                className={`text-xs font-medium px-2 py-1 rounded ${ann.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {ann.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                                disabled={deleteAnnouncement.isPending}
                                                className="text-muted-foreground hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{ann.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Target: {ann.target_plan || 'All'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </MainLayout >
    );
};
