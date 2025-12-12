import { useEffect, useState } from 'react';
import { supabase } from '@lumina/shared/lib';
import { X, Monitor, Layers, Check, Search } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';

interface AssignSlideModalProps {
    slideId: string;
    slideName: string;
    onClose: () => void;
}

interface Screen {
    id: string;
    name: string;
    active_slide_id: string | null;
    group_id: string | null;
}

interface ScreenGroup {
    id: string;
    name: string;
    active_slide_id: string | null;
}

export default function AssignSlideModal({ slideId, slideName, onClose }: AssignSlideModalProps) {
    const { orgId } = useUserRole();
    const [activeTab, setActiveTab] = useState<'screens' | 'groups'>('screens');
    const [screens, setScreens] = useState<Screen[]>([]);
    const [groups, setGroups] = useState<ScreenGroup[]>([]);
    const [selectedScreens, setSelectedScreens] = useState<Set<string>>(new Set());
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (orgId) {
            fetchData();
        }
    }, [orgId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Screens
            const { data: screensData } = await supabase
                .from('screens')
                .select('id, name, active_slide_id, group_id')
                .eq('org_id', orgId);

            // Fetch Groups
            const { data: groupsData } = await supabase
                .from('screen_groups')
                .select('id, name, active_slide_id')
                .eq('org_id', orgId);

            if (screensData) setScreens(screensData);
            if (groupsData) setGroups(groupsData);

            // Pre-select items that already have this slide assigned
            const preSelectedScreens = new Set<string>();
            screensData?.forEach((s: any) => {
                if (s.active_slide_id === slideId) preSelectedScreens.add(s.id);
            });
            setSelectedScreens(preSelectedScreens);

            const preSelectedGroups = new Set<string>();
            groupsData?.forEach((g: any) => {
                if (g.active_slide_id === slideId) preSelectedGroups.add(g.id);
            });
            setSelectedGroups(preSelectedGroups);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleScreen = (id: string) => {
        const newSet = new Set(selectedScreens);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedScreens(newSet);
    };

    const toggleGroup = (id: string) => {
        const newSet = new Set(selectedGroups);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedGroups(newSet);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update Screens
            // Find screens to ADD assignment
            const screensToAdd = Array.from(selectedScreens).filter(id =>
                !screens.find(s => s.id === id)?.active_slide_id ||
                screens.find(s => s.id === id)?.active_slide_id !== slideId
            );

            // Find screens to REMOVE assignment (only if they were previously assigned to THIS slide)
            const screensToRemove = screens
                .filter(s => s.active_slide_id === slideId && !selectedScreens.has(s.id))
                .map(s => s.id);

            if (screensToAdd.length > 0) {
                // This is the "Emergency Override" action
                await supabase.from('screens').update({ active_slide_id: slideId }).in('id', screensToAdd);
            }
            if (screensToRemove.length > 0) {
                await supabase.from('screens').update({ active_slide_id: null }).in('id', screensToRemove);
            }

            // 2. Update Groups
            const groupsToAdd = Array.from(selectedGroups).filter(id =>
                !groups.find(g => g.id === id)?.active_slide_id ||
                groups.find(g => g.id === id)?.active_slide_id !== slideId
            );

            const groupsToRemove = groups
                .filter(g => g.active_slide_id === slideId && !selectedGroups.has(g.id))
                .map(g => g.id);

            if (groupsToAdd.length > 0) {
                await supabase.from('screen_groups').update({ active_slide_id: slideId }).in('id', groupsToAdd);
            }
            if (groupsToRemove.length > 0) {
                await supabase.from('screen_groups').update({ active_slide_id: null }).in('id', groupsToRemove);
            }

            // Broadcast updates
            const channel = supabase.channel('system-updates');
            channel.subscribe(async (status: any) => {
                if (status === 'SUBSCRIBED') {
                    // Notify screens directly affected
                    const affectedScreenIds = [...screensToAdd, ...screensToRemove];
                    for (const screenId of affectedScreenIds) {
                        await channel.send({
                            type: 'broadcast',
                            event: 'screen_updated',
                            payload: { id: screenId }
                        });
                    }

                    // Notify groups affected
                    const affectedGroupIds = [...groupsToAdd, ...groupsToRemove];
                    for (const groupId of affectedGroupIds) {
                        await channel.send({
                            type: 'broadcast',
                            event: 'group_updated',
                            payload: { id: groupId }
                        });

                        // Also notify all screens in these groups
                        const { data: groupScreens } = await supabase
                            .from('screens')
                            .select('id')
                            .eq('group_id', groupId);

                        if (groupScreens) {
                            for (const s of groupScreens) {
                                await channel.send({
                                    type: 'broadcast',
                                    event: 'screen_updated',
                                    payload: { id: s.id }
                                });
                            }
                        }
                    }
                    supabase.removeChannel(channel);
                }
            });

            onClose();
        } catch (err) {
            console.error('Error assigning slide:', err);
            alert('Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    const filteredScreens = screens.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Assign Slide: {slideName}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Select a slide to play immediately. This will override any scheduled playlists.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button
                        className={`flex-1 py-3.5 font-medium flex items-center justify-center gap-2 text-sm transition-colors ${activeTab === 'screens' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:bg-gray-100/50'}`}
                        onClick={() => setActiveTab('screens')}
                    >
                        <Monitor size={18} /> Individual Screens
                    </button>
                    <button
                        className={`flex-1 py-3.5 font-medium flex items-center justify-center gap-2 text-sm transition-colors ${activeTab === 'groups' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:bg-gray-100/50'}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        <Layers size={18} /> Screen Groups
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'screens' ? 'screens' : 'groups'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeTab === 'screens' ? (
                                filteredScreens.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">No screens found.</p>
                                    </div>
                                ) : (
                                    filteredScreens.map(screen => (
                                        <div
                                            key={screen.id}
                                            onClick={() => toggleScreen(screen.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${selectedScreens.has(screen.id)
                                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedScreens.has(screen.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-gray-300 group-hover:border-indigo-400'
                                                    }`}>
                                                    {selectedScreens.has(screen.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <div>
                                                    <span className={`font-medium block transition-colors ${selectedScreens.has(screen.id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                        {screen.name || 'Unnamed Screen'}
                                                    </span>
                                                    {screen.group_id && (
                                                        <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <Layers size={10} className="mr-1" />
                                                            In Group
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {screen.active_slide_id && screen.active_slide_id !== slideId && (
                                                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg font-medium">
                                                    Replacing other content
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )
                            ) : (
                                filteredGroups.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Layers size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">No groups found.</p>
                                    </div>
                                ) : (
                                    filteredGroups.map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => toggleGroup(group.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${selectedGroups.has(group.id)
                                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedGroups.has(group.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-gray-300 group-hover:border-indigo-400'
                                                    }`}>
                                                    {selectedGroups.has(group.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className={`font-medium transition-colors ${selectedGroups.has(group.id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                    {group.name}
                                                </span>
                                            </div>
                                            {group.active_slide_id && group.active_slide_id !== slideId && (
                                                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg font-medium">
                                                    Replacing other content
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-b-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Save Assignments
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
