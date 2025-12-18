import React, { useState } from 'react';
import { Monitor, Wifi, Plus } from 'lucide-react';
import { useAddScreen } from '../api/dashboard';
import { useAuthStore } from '../../../store/auth-store';
import { usePlanLimits } from '../../../hooks/usePlanLimits';
import { getPlanLimits } from '../../../constants/plans';

interface AddScreenModalProps {
    onClose: () => void;
}

export const AddScreenModal: React.FC<AddScreenModalProps> = ({ onClose }) => {
    const { orgId } = useAuthStore();
    const [newScreenName, setNewScreenName] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [pairingError, setPairingError] = useState<React.ReactNode | null>(null);

    // We still use some hooks from outside the feature if they are generic utils (hooks/usePlanLimits)
    const { checkScreenLimit, planTier, maxScreens } = usePlanLimits();
    const addScreenMutation = useAddScreen();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPairingError(null);

        if (!orgId) return;

        const canAdd = await checkScreenLimit();
        if (!canAdd) {
            const limits = getPlanLimits(planTier || 'free');
            if (planTier === 'pro' && limits.maxScreens >= 100) {
                setPairingError(
                    <span>
                        Need more than 100 screens?{' '}
                        <a href="mailto:enterprise@lumina.app" className="underline font-bold">
                            Contact our Enterprise Team
                        </a>
                    </span>
                );
            } else {
                setPairingError(`You reached the limit of ${maxScreens} screens. Upgrade plan to add more.`);
            }
            return;
        }

        try {
            await addScreenMutation.mutateAsync({
                name: newScreenName,
                pairingCode: pairingCode,
                orgId: orgId
            });
            onClose();
        } catch (error: any) {
            setPairingError('Error creating screen: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Pair New Screen</h3>
                        <p className="text-sm text-muted-foreground mt-1">Enter the code displayed on your TV screen.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                        <Plus size={20} className="transform rotate-45" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Screen Name</label>
                        <div className="relative">
                            <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                value={newScreenName}
                                onChange={(e) => setNewScreenName(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground"
                                placeholder="e.g. Lobby TV"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Pairing Code</label>
                        <input
                            type="text"
                            value={pairingCode}
                            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 font-mono uppercase text-2xl tracking-[0.2em] text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground"
                            placeholder="XXXXXX"
                            maxLength={6}
                            required
                        />
                    </div>
                    {pairingError && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                            {pairingError}
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addScreenMutation.isPending}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Wifi size={18} />
                            {addScreenMutation.isPending ? 'Pairing...' : 'Pair Screen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
