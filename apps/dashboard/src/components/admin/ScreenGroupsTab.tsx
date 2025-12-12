
import React, { useEffect, useState } from 'react';
import { supabase } from '@lumina/shared/lib';
import { Layers, Trash2, Monitor, Plus, Play } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { LoadingSpinner } from '@lumina/shared/ui';

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
    slides: active_slide_id(name),
        screens(id)
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
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 font-medium text-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Create Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Layers size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No groups found</h3>
                    <p className="text-gray-500 mt-1 mb-6">Create a group to manage multiple screens together.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        <Plus size={18} className="mr-1" />
                        Create Group
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                    <Layers size={24} />
                                </div>
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    title="Delete Group"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>

                            <div className="space-y-3 mt-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Monitor size={16} className="mr-2 text-gray-400" />
                                    <span>{group.screens.length} Screen{group.screens.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Play size={16} className="mr-2 text-gray-400" />
                                    <span className={group.slides?.name ? 'text-indigo-600 font-medium' : 'text-gray-400 italic'}>
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
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Create Screen Group</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Plus size={20} className="transform rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="e.g. Lobby Screens"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
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
