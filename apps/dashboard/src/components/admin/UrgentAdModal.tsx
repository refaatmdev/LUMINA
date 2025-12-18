import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, AlertTriangle, Clock, Monitor, Layers, Check, Megaphone } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';

interface UrgentAdModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface Screen {
    id: string;
    name: string;
    group_id: string | null;
}

interface ScreenGroup {
    id: string;
    name: string;
}

export default function UrgentAdModal({ onClose, onSuccess }: UrgentAdModalProps) {
    const { orgId } = useUserRole();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Content & Duration
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState<'info' | 'warning' | 'success'>('warning');
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [startTime, setStartTime] = useState<string>('');

    // Step 2: Targeting
    const [targetType, setTargetType] = useState<'screen' | 'group'>('screen');
    const [screens, setScreens] = useState<Screen[]>([]);
    const [groups, setGroups] = useState<ScreenGroup[]>([]);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

    useEffect(() => {
        if (orgId) {
            fetchTargets();
        }
    }, [orgId]);

    const fetchTargets = async () => {
        const { data: screensData } = await supabase
            .from('screens')
            .select('id, name, group_id')
            .eq('org_id', orgId);

        const { data: groupsData } = await supabase
            .from('screen_groups')
            .select('id, name')
            .eq('org_id', orgId);

        if (screensData) setScreens(screensData);
        if (groupsData) setGroups(groupsData);
    };

    const handleCreateAndDeploy = async () => {
        if (!message || !selectedTargetId || !orgId) return;

        setLoading(true);
        try {
            // 1. Create the Slide
            const slideContent = {
                content: [
                    {
                        type: "Notice",
                        props: {
                            type: alertType,
                            text: message,
                            id: "Notice-" + Math.random().toString(36).substr(2, 9)
                        }
                    }
                ],
                root: { props: { title: "Urgent Ad" } }
            };

            const { data: slide, error: slideError } = await supabase
                .from('slides')
                .insert({
                    org_id: orgId,
                    name: `URGENT: ${message.substring(0, 20)}...`,
                    content: slideContent,
                })
                .select()
                .single();

            if (slideError || !slide) throw slideError || new Error('Failed to create slide');

            // 2. Calculate Expiration
            const startAt = startTime ? new Date(startTime) : new Date();
            const expiresAt = new Date(startAt.getTime() + durationMinutes * 60000);

            // 3. Update Target
            const table = targetType === 'screen' ? 'screens' : 'screen_groups';
            const { error: updateError } = await supabase
                .from(table)
                .update({
                    urgent_slide_id: slide.id,
                    urgent_starts_at: startAt.toISOString(),
                    urgent_expires_at: expiresAt.toISOString()
                })
                .eq('id', selectedTargetId);

            if (updateError) throw updateError;

            // 4. Broadcast Update (Optional but good for immediate effect)
            const channel = supabase.channel('player-state-updates');
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    if (targetType === 'screen') {
                        await channel.send({
                            type: 'broadcast',
                            event: 'screen_updated',
                            payload: { id: selectedTargetId }
                        });
                    } else {
                        // Notify group
                        await channel.send({
                            type: 'broadcast',
                            event: 'group_updated',
                            payload: { id: selectedTargetId }
                        });

                        // Notify screens in group
                        const groupScreens = screens.filter(s => s.group_id === selectedTargetId);
                        for (const s of groupScreens) {
                            await channel.send({
                                type: 'broadcast',
                                event: 'screen_updated',
                                payload: { id: s.id }
                            });
                        }
                    }
                    supabase.removeChannel(channel);
                }
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deploying urgent ad:', error);
            alert('Failed to deploy urgent ad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-destructive/20 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-5 border-b border-destructive/20 bg-destructive/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Create Urgent Ad</h2>
                            <p className="text-sm text-destructive">Deploy emergency content immediately</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 bg-background">
                    {step === 1 ? (
                        <>
                            {/* Message Input */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Urgent Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl p-4 focus:ring-2 focus:ring-destructive/20 focus:border-destructive outline-none transition-all text-lg font-medium text-foreground placeholder-muted-foreground"
                                    placeholder="e.g. Store closing in 15 minutes..."
                                    rows={3}
                                    autoFocus
                                />
                            </div>

                            {/* Alert Type */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Alert Style</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'warning', label: 'Warning', activeClass: 'ring-destructive bg-destructive/10 text-destructive border-destructive/20' },
                                        { id: 'info', label: 'Info', activeClass: 'ring-blue-500 bg-blue-500/10 text-blue-500 border-blue-500/20' },
                                        { id: 'success', label: 'Success', activeClass: 'ring-green-500 bg-green-500/10 text-green-500 border-green-500/20' },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setAlertType(type.id as any)}
                                            className={`py-3 px-4 rounded-xl border font-medium transition-all ${alertType === type.id
                                                ? `ring-2 ring-offset-1 ring-offset-background ${type.activeClass}`
                                                : 'border-border text-muted-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 15, 30, 60, 120].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setDurationMinutes(mins)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${durationMinutes === mins
                                                ? 'bg-foreground text-background border-foreground'
                                                : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                                                }`}
                                        >
                                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Time (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Start Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-destructive/20 focus:border-destructive outline-none transition-all text-foreground"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Leave blank to start immediately.</p>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!message}
                                className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl font-bold hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                Next: Select Target
                                <Clock size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Target Selection */}
                            <div>
                                <div className="flex bg-muted p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => setTargetType('screen')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${targetType === 'screen' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Individual Screens
                                    </button>
                                    <button
                                        onClick={() => setTargetType('group')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${targetType === 'group' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Screen Groups
                                    </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {targetType === 'screen' ? (
                                        screens.map(screen => (
                                            <button
                                                key={screen.id}
                                                onClick={() => setSelectedTargetId(screen.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedTargetId === screen.id
                                                    ? 'border-destructive bg-destructive/10 text-destructive'
                                                    : 'border-border hover:border-destructive/30 hover:bg-destructive/5 text-foreground'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Monitor size={18} className={selectedTargetId === screen.id ? 'text-destructive' : 'text-muted-foreground'} />
                                                    <span className="font-medium">{screen.name}</span>
                                                </div>
                                                {selectedTargetId === screen.id && <Check size={18} className="text-destructive" />}
                                            </button>
                                        ))
                                    ) : (
                                        groups.map(group => (
                                            <button
                                                key={group.id}
                                                onClick={() => setSelectedTargetId(group.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedTargetId === group.id
                                                    ? 'border-destructive bg-destructive/10 text-destructive'
                                                    : 'border-border hover:border-destructive/30 hover:bg-destructive/5 text-foreground'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Layers size={18} className={selectedTargetId === group.id ? 'text-destructive' : 'text-muted-foreground'} />
                                                    <span className="font-medium">{group.name}</span>
                                                </div>
                                                {selectedTargetId === group.id && <Check size={18} className="text-destructive" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 text-muted-foreground hover:bg-muted rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateAndDeploy}
                                    disabled={!selectedTargetId || loading}
                                    className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-bold hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <AlertTriangle size={18} />
                                            DEPLOY NOW
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
