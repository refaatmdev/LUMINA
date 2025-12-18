import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Layers, Monitor, Play, Trash2 } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ScreenGroup {
    id: string;
    name: string;
    active_slide_id: string | null;
    slides?: {
        name: string;
    } | null;
    screens: {
        id: string;
    }[];
}

export default function ScreenGroupsTab() {
    const { orgId } = useUserRole();
    const [groups, setGroups] = useState<ScreenGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchGroups();
        }
    }, [orgId]);

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('screen_groups')
                .select(`
                    *,
                    slides:active_slide_id (name),
                    screens (id)
                `)
                .eq('org_id', orgId)
                .order('name');

            if (error) throw error;
            setGroups(data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { error } = await supabase
                .from('screen_groups')
                .insert([{
                    name: newGroupName,
                    org_id: orgId
                }]);

            if (error) throw error;

            setNewGroupName('');
            setShowCreateModal(false);
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group? Screens in this group will be ungrouped.')) return;

        try {
            const { error } = await supabase
                .from('screen_groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Failed to delete group');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

    return (
        <div>
            {/* Header Actions */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all duration-200 font-medium text-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Create Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-xl border border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Layers size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white text-glow">No groups found</h3>
                    <p className="text-gray-400 mt-1 mb-6">Create a group to manage multiple screens together.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        <Plus size={18} className="mr-1" />
                        Create Group
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="glass-panel rounded-xl border border-white/10 shadow-lg hover:border-violet-500/30 transition-all duration-300 p-6 group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-violet-500/10 rounded-lg text-violet-400 group-hover:bg-violet-500/20 transition-colors border border-violet-500/20">
                                    <Layers size={24} />
                                </div>
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="text-gray-500 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded-lg"
                                    title="Delete Group"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{group.name}</h3>

                            <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center text-sm text-gray-300">
                                    <Monitor size={16} className="mr-2 text-blue-400" />
                                    <span>{group.screens.length} Screen{group.screens.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-300">
                                    <Play size={16} className="mr-2 text-emerald-400" />
                                    <span className={group.slides?.name ? 'text-white font-medium' : 'text-gray-500 italic'}>
                                        {group.slides?.name || 'No content playing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-md transform transition-all scale-100 shadow-2xl relative">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-white text-glow">Create Screen Group</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="glass-input w-full px-4 py-2.5 rounded-xl outline-none"
                                    placeholder="e.g. Lobby Screens"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 text-gray-300 hover:bg-white/5 rounded-xl font-medium transition-colors border border-transparent hover:border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-medium shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
