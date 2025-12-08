import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, Trash2, Edit2, X, Shield, Mail, Check } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

interface TeamManagementProps {
    orgId?: string;
}

export default function TeamManagement({ orgId }: TeamManagementProps) {
    const { orgId: userOrgId, role: currentUserRole } = useUserRole();
    const targetOrgId = orgId || userOrgId;

    const [members, setMembers] = useState<Profile[]>([]);
    // Wait, I can't skip lines in replace_file_content like that if I want to change two places far apart.
    // I need to use multi_replace_file_content or two separate calls.
    // Let's use multi_replace_file_content.



    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [editingMember, setEditingMember] = useState<Profile | null>(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        if (targetOrgId) {
            fetchMembers();
        }
    }, [targetOrgId]);

    const fetchMembers = async () => {
        try {
            if (!targetOrgId) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', targetOrgId);

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetOrgId) {
            alert('Organization ID not found');
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: inviteEmail,
                    role: inviteRole,
                    org_id: targetOrgId
                }
            });

            if (error) throw error;

            alert('Invite sent successfully!');
            setInviteEmail('');
            setInviteRole('editor');
            setShowInviteModal(false);
        } catch (error: any) {
            console.error('Invite error:', error);
            alert('Error sending invite: ' + (error.message || 'Unknown error'));
        }
    };

    const openEditModal = (member: Profile) => {
        setEditingMember(member);
        setNewRole(member.role);
        setShowEditModal(true);
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', editingMember.id);

            if (error) throw error;

            setShowEditModal(false);
            setEditingMember(null);
            fetchMembers();
        } catch (error) {
            alert('Error updating role');
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Team Members</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage access and roles for your organization.</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                >
                    <UserPlus size={18} />
                    Invite Member
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-white">
                                            <span className="font-bold text-sm">
                                                {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{member.full_name || 'No Name'}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <Mail size={12} />
                                                {member.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${member.role === 'org_admin' || member.role === 'super_admin'
                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        <Shield size={10} className="mr-1.5" />
                                        {member.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(member)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Edit Role"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remove User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {members.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No team members found.</p>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
                                <p className="text-sm text-gray-500 mt-1">Send an invitation to join your organization.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                        placeholder="colleague@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 appearance-none bg-white"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="org_admin">Organization Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
                                >
                                    <Mail size={18} />
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {showEditModal && editingMember && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit User Role</h3>
                                <p className="text-sm text-gray-500 mt-1">Change permissions for {editingMember.full_name || editingMember.email}</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 appearance-none bg-white"
                                    >
                                        <option value="org_admin">Organization Admin</option>
                                        <option value="editor">Editor</option>
                                        {/* Only Super Admins can promote others to Super Admin */}
                                        {currentUserRole === 'super_admin' && (
                                            <option value="super_admin">Super Admin</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Update Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
