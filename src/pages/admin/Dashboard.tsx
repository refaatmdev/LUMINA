import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Monitor, Wifi, WifiOff, FolderInput, Layers, Layout, AlertTriangle, Calendar, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import ScreenGroupsTab from '../../components/admin/ScreenGroupsTab';
import UrgentAdModal from '../../components/admin/UrgentAdModal';
import ScheduleManager from '../../components/admin/ScheduleManager';

interface Screen {
    id: string;
    name: string;
    pairing_code: string;
    is_online: boolean;
    last_ping: string;
    group_id: string | null;
    active_slide_id: string | null;
    override_expires_at: string | null;
    default_playlist_id: string | null;
    screen_groups: {
        name: string;
    } | null;
    slides: {
        name: string;
    } | null;
    urgent_slide_id: string | null;
    urgent_slide: {
        name: string;
    } | null;
}

interface ScreenGroup {
    id: string;
    name: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const { orgId } = useUserRole();
    const [activeTab, setActiveTab] = useState<'screens' | 'groups'>('screens');
    const [screens, setScreens] = useState<Screen[]>([]);
    const [groups, setGroups] = useState<ScreenGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showPairModal, setShowPairModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showUrgentAdModal, setShowUrgentAdModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Selection State
    const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [scheduleTarget, setScheduleTarget] = useState<{ id: string, name: string, type: 'screen' | 'group' } | null>(null);

    // Form State
    const [newScreenName, setNewScreenName] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [pairingError, setPairingError] = useState<string | null>(null);

    useEffect(() => {
        if (user && orgId) {
            fetchScreens();
            fetchGroups();
        }

        const channel = supabase.channel('dashboard-screens')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'screens' },
                () => {
                    fetchScreens();
                }
            )
            .subscribe();

        const refreshInterval = setInterval(() => {
            setScreens(prev => [...prev]); // Trigger re-render for online status
        }, 10000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, [user, orgId]);

    const fetchScreens = async () => {
        if (!user || !orgId) return;

        const { data, error } = await supabase
            .from('screens')
            .select(`
                *,
                screen_groups (
                    name
                ),
                slides:active_slide_id (
                    name
                ),
                urgent_slide:urgent_slide_id (
                    name
                )
            `)
            .eq('org_id', orgId)
            .order('name');

        if (!error && data) {
            setScreens(data);
        }
        setLoading(false);
    };

    const fetchGroups = async () => {
        if (!user || !orgId) return;

        const { data, error } = await supabase
            .from('screen_groups')
            .select('id, name')
            .eq('org_id', orgId)
            .order('name');

        if (!error && data) {
            setGroups(data);
        }
    };

    const handleAddScreen = async (e: React.FormEvent) => {
        e.preventDefault();
        setPairingError(null);

        try {
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (userError || !userData) throw new Error('Could not fetch user organization');

            const { error } = await supabase
                .from('screens')
                .insert([{
                    name: newScreenName,
                    org_id: userData.org_id,
                    pairing_code: pairingCode,
                    auth_type: 'pairing_code',
                    status: 'offline'
                }]);

            if (error) throw error;

            setNewScreenName('');
            setShowPairModal(false);
            fetchScreens();
        } catch (error: any) {
            setPairingError('Error creating screen: ' + (error.message || 'Unknown error'));
            console.error(error);
        }
    };

    const openMoveModal = (screenId: string, currentGroupId?: string | null) => {
        setSelectedScreenId(screenId);
        setSelectedGroupId(currentGroupId || '');
        setShowMoveModal(true);
    };

    const openScheduleModal = (id: string, name: string, type: 'screen' | 'group') => {
        setScheduleTarget({ id, name, type });
        setShowScheduleModal(true);
    };

    const handleMoveScreen = async () => {
        if (!selectedScreenId) return;

        try {
            const { error } = await supabase
                .from('screens')
                .update({ group_id: selectedGroupId === '' ? null : selectedGroupId })
                .eq('id', selectedScreenId);

            if (error) throw error;

            setShowMoveModal(false);
            fetchScreens();
        } catch (error) {
            console.error('Error moving screen:', error);
            alert('Failed to move screen');
        }
    };

    const handleAssignSlide = async (targetId: string, slideId: string | null, type: 'screen' | 'group') => {
        try {
            const table = type === 'screen' ? 'screens' : 'screen_groups';
            const { error } = await supabase
                .from(table)
                .update({ active_slide_id: slideId })
                .eq('id', targetId);

            if (error) throw error;

            fetchScreens();
            fetchGroups();
        } catch (err) {
            console.error('Error updating slide assignment:', err);
        }
    };

    return (
        <AdminLayout
            title="Screens"
            actions={
                activeTab === 'screens' ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowUrgentAdModal(true)}
                            className="flex items-center bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-200 shadow-sm transition-all duration-200 font-medium text-sm"
                        >
                            <AlertTriangle size={18} className="mr-2" />
                            Urgent Ad
                        </button>
                        <button
                            onClick={() => setShowPairModal(true)}
                            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 font-medium text-sm"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Screen
                        </button>
                    </div>
                ) : null
            }
        >
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'screens' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('screens')}
                >
                    All Screens
                    {activeTab === 'screens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
                </button>
                <button
                    className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'groups' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('groups')}
                >
                    Screen Groups
                    {activeTab === 'groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
                </button>
            </div>

            {activeTab === 'groups' ? (
                <ScreenGroupsTab />
            ) : (
                <>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : screens.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Monitor size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No screens found</h3>
                            <p className="text-gray-500 mt-1 mb-6">Get started by pairing your first screen.</p>
                            <button
                                onClick={() => setShowPairModal(true)}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <Plus size={18} className="mr-1" />
                                Add Screen
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {screens.map((screen) => (
                                <div key={screen.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                                            <Monitor className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {screen.urgent_slide_id && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/10 border border-red-600/20">
                                                    <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                                                    <span className="text-xs font-bold text-red-600">URGENT AD</span>
                                                </div>
                                            )}
                                            {screen.active_slide_id && !screen.urgent_slide_id && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-xs font-medium text-indigo-500">Manual Override</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const isOnline = screen.last_ping && (new Date().getTime() - new Date(screen.last_ping).getTime() < 120000); // 2 minutes
                                                return (
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isOnline
                                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                        : 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400'
                                                        }`}>
                                                        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                        <span className="text-xs font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{screen.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        {screen.screen_groups ? (
                                            <span className="text-sm text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Layers className="w-3 h-3" />
                                                {screen.screen_groups.name}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-zinc-500">Not Paired</span>
                                        )}
                                        {screen.active_slide_id && (
                                            <span className="text-sm text-zinc-500 flex items-center gap-1">
                                                <Layout className="w-3 h-3" />
                                                {screen.slides?.name || 'Unknown Slide'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                                            ID: {screen.pairing_code}
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            {screen.urgent_slide_id && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const { error } = await supabase
                                                                .from('screens')
                                                                .update({
                                                                    urgent_slide_id: null,
                                                                    urgent_starts_at: null,
                                                                    urgent_expires_at: null
                                                                })
                                                                .eq('id', screen.id);
                                                            if (error) throw error;
                                                            fetchScreens();
                                                        } catch (err) {
                                                            console.error('Error stopping urgent ad:', err);
                                                        }
                                                    }}
                                                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors px-2 py-1 rounded shadow-sm flex items-center gap-1"
                                                    title="Stop Urgent Ad"
                                                >
                                                    <AlertTriangle size={10} />
                                                    STOP URGENT
                                                </button>
                                            )}
                                            {screen.active_slide_id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAssignSlide(screen.id, null, 'screen');
                                                    }}
                                                    className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                                                    title="Stop Manual Override"
                                                >
                                                    Stop Override
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openScheduleModal(screen.id, screen.name, 'screen');
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                                            >
                                                <Calendar size={12} />
                                                Schedule
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openMoveModal(screen.id, screen.group_id);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                                            >
                                                <FolderInput className="w-3 h-3" />
                                                Move
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/player/${screen.id}`, '_blank');
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this screen? This action cannot be undone.')) {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('screens')
                                                                .delete()
                                                                .eq('id', screen.id);

                                                            if (error) throw error;
                                                            fetchScreens();
                                                        } catch (err) {
                                                            console.error('Error deleting screen:', err);
                                                            alert('Failed to delete screen');
                                                        }
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                                                title="Delete Screen"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Pair Screen Modal */}
            {showPairModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Pair New Screen</h3>
                                <p className="text-sm text-gray-500 mt-1">Enter the code displayed on your TV screen.</p>
                            </div>
                            <button
                                onClick={() => setShowPairModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAddScreen} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Screen Name</label>
                                <div className="relative">
                                    <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={newScreenName}
                                        onChange={(e) => setNewScreenName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                        placeholder="e.g. Lobby TV"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pairing Code</label>
                                <input
                                    type="text"
                                    value={pairingCode}
                                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono uppercase text-2xl tracking-[0.2em] text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-300"
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            {pairingError && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                    {pairingError}
                                </div>
                            )}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPairModal(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
                                >
                                    <Wifi size={18} />
                                    Pair Screen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Move to Group Modal */}
            {showMoveModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Move Screen</h3>
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Group</label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                >
                                    <option value="">No Group (Ungrouped)</option>
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setShowMoveModal(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMoveScreen}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Urgent Ad Modal */}
            {showUrgentAdModal && (
                <UrgentAdModal
                    onClose={() => setShowUrgentAdModal(false)}
                    onSuccess={() => {
                        fetchScreens();
                        fetchGroups();
                    }}
                />
            )}

            {/* Schedule Modal */}
            {showScheduleModal && scheduleTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl transform transition-all scale-100 border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Manage Schedule</h3>
                                <p className="text-sm text-gray-500 mt-1">Set time-based rules for {scheduleTarget.name}</p>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>

                        <ScheduleManager targetType={scheduleTarget.type} targetId={scheduleTarget.id} />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
