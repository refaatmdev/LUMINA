import { useState, useEffect } from 'react';
import { supabase } from '@lumina/shared/lib';
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
            channel.subscribe(async (status: any) => {
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-red-100">
                {/* Header */}
                <div className="p-5 border-b border-red-100 bg-red-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-900">Create Urgent Ad</h2>
                            <p className="text-sm text-red-600/80">Deploy emergency content immediately</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            {/* Message Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgent Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-lg font-medium"
                                    placeholder="e.g. Store closing in 15 minutes..."
                                    rows={3}
                                    autoFocus
                                />
                            </div>

                            {/* Alert Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Style</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'warning', label: 'Warning', color: 'bg-red-100 text-red-700 border-red-200' },
                                        { id: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                        { id: 'success', label: 'Success', color: 'bg-green-100 text-green-700 border-green-200' },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setAlertType(type.id as any)}
                                            className={`py-3 px-4 rounded-xl border font-medium transition-all ${alertType === type.id
                                                ? `ring-2 ring-offset-1 ring-${type.id === 'warning' ? 'red' : type.id === 'info' ? 'blue' : 'green'}-500 ${type.color}`
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 15, 30, 60, 120].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setDurationMinutes(mins)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${durationMinutes === mins
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Time (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-gray-900"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave blank to start immediately.</p>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!message}
                                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                Next: Select Target
                                <Clock size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Target Selection */}
                            <div>
                                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => setTargetType('screen')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${targetType === 'screen' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Individual Screens
                                    </button>
                                    <button
                                        onClick={() => setTargetType('group')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${targetType === 'group' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
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
                                                    ? 'border-red-500 bg-red-50 text-red-900'
                                                    : 'border-gray-200 hover:border-red-200 hover:bg-red-50/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Monitor size={18} className={selectedTargetId === screen.id ? 'text-red-500' : 'text-gray-400'} />
                                                    <span className="font-medium">{screen.name}</span>
                                                </div>
                                                {selectedTargetId === screen.id && <Check size={18} className="text-red-500" />}
                                            </button>
                                        ))
                                    ) : (
                                        groups.map(group => (
                                            <button
                                                key={group.id}
                                                onClick={() => setSelectedTargetId(group.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedTargetId === group.id
                                                    ? 'border-red-500 bg-red-50 text-red-900'
                                                    : 'border-gray-200 hover:border-red-200 hover:bg-red-50/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Layers size={18} className={selectedTargetId === group.id ? 'text-red-500' : 'text-gray-400'} />
                                                    <span className="font-medium">{group.name}</span>
                                                </div>
                                                {selectedTargetId === group.id && <Check size={18} className="text-red-500" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateAndDeploy}
                                    disabled={!selectedTargetId || loading}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
