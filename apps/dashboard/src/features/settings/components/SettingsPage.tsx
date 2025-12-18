import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth-store';
import { useTeamMembers, useInviteMember, useUpdateMemberRole, type Profile } from '../api/settings';
import { UserPlus, Trash2, Edit2, X, Shield, Mail, Check, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const SettingsPage = () => {
    const { orgId, role: currentUserRole } = useAuthStore();
    const navigate = useNavigate();
    const { data: members, isLoading } = useTeamMembers(orgId);

    // Redirect Super Admin to Super Admin Dashboard
    useEffect(() => {
        if (currentUserRole === 'super_admin') {
            navigate('/admin/super');
        }
    }, [currentUserRole, navigate]);

    // UI State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [editingMember, setEditingMember] = useState<Profile | null>(null);
    const [newRole, setNewRole] = useState('');

    // Mutations
    const inviteMutation = useInviteMember();
    const updateRoleMutation = useUpdateMemberRole();

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        try {
            await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole, orgId });
            alert('Invite sent successfully!');
            setInviteEmail('');
            setInviteRole('editor');
            setShowInviteModal(false);
        } catch (error: any) {
            alert('Error sending invite: ' + (error.message || 'Unknown error'));
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        try {
            await updateRoleMutation.mutateAsync({ id: editingMember.id, role: newRole });
            setShowEditModal(false);
            setEditingMember(null);
        } catch (error) {
            alert('Error updating role');
        }
    };

    const openEditModal = (member: Profile) => {
        setEditingMember(member);
        setNewRole(member.role);
        setShowEditModal(true);
    };

    if (isLoading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Team Members</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage access and roles for your organization.</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                    <UserPlus size={18} />
                    Invite Member
                </button>
            </div>

            <div className="glass-panel rounded-xl border border-border p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="p-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                            <th className="p-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                            <th className="p-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {members?.map((member) => (
                            <tr key={member.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-bold text-sm">
                                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{member.full_name || 'No Name'}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                <Mail size={12} />
                                                {member.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${member.role === 'org_admin' || member.role === 'super_admin'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        <Shield size={10} className="mr-1.5" />
                                        {member.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(member)}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Edit Role"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
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
                {members?.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No team members found.</p>
                    </div>
                )}
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="glass-panel p-6 w-full max-w-md shadow-2xl rounded-2xl relative border border-border bg-card">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Invite Team Member</h3>
                                <p className="text-sm text-muted-foreground mt-1">Send an invitation to join your organization.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="pl-10"
                                        placeholder="colleague@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl outline-none appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="org_admin">Organization Admin</option>
                                    </select>
                                </div>
                            </div>

                            {inviteMutation.isError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    Failed to invite user
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                                <Button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={inviteMutation.isPending}
                                    isLoading={inviteMutation.isPending}
                                    className="flex items-center gap-2"
                                >
                                    {!inviteMutation.isPending && <Mail size={18} />}
                                    Send Invite
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingMember && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="glass-panel p-6 w-full max-w-md shadow-2xl rounded-2xl relative border border-border bg-card">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Edit User Role</h3>
                                <p className="text-sm text-muted-foreground mt-1">Change permissions for {editingMember.full_name || editingMember.email}</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl outline-none appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                    >
                                        <option value="org_admin">Organization Admin</option>
                                        <option value="editor">Editor</option>
                                        {currentUserRole === 'super_admin' && (
                                            <option value="super_admin">Super Admin</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                                <Button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateRoleMutation.isPending}
                                    isLoading={updateRoleMutation.isPending}
                                    className="flex items-center gap-2"
                                >
                                    {!updateRoleMutation.isPending && <Check size={18} />}
                                    Update Role
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
