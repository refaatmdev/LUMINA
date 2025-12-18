import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth-store';
import { usePlaylists, useDeletePlaylist } from '../api/playlists';
import { MainLayout } from '../../layout';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Plus, List, Trash2, Edit, Calendar } from 'lucide-react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export const PlaylistsListPage = () => {
    const navigate = useNavigate();
    const { orgId } = useAuthStore();
    const { data: playlists, isLoading } = usePlaylists(orgId || undefined);
    const deletePlaylistMutation = useDeletePlaylist();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
            setDeletingId(id);
            try {
                await deletePlaylistMutation.mutateAsync(id);
                // No need to manually refetch as invalidation handles it, but just in case
            } catch (error) {
                console.error('Failed to delete playlist:', error);
                alert('Failed to delete playlist');
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <MainLayout
            title="Playlists"
            subtitle="Create and manage your content schedules"
            actions={
                <Button
                    onClick={() => navigate('/admin/playlists/new')}
                    className="flex items-center gap-2"
                >
                    <Plus size={18} />
                    Create Playlist
                </Button>
            }
        >
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : playlists?.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <List size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No Playlists Found</h3>
                    <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
                        Create your first playlist to organize content sequences and schedule them for your screens.
                    </p>
                    <Button onClick={() => navigate('/admin/playlists/new')}>
                        <Plus size={18} className="mr-2" />
                        Create First Playlist
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists?.map((playlist) => (
                        <Card
                            key={playlist.id}
                            className="group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => navigate(`/admin/playlists/${playlist.id}`)}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <List size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/playlists/${playlist.id}`);
                                            }}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(playlist.id, e)}
                                            disabled={deletingId === playlist.id}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            {deletingId === playlist.id ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {playlist.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {playlist.description || 'No description provided.'}
                                </p>

                                <div className="mt-4 pt-4 border-t border-border flex items-center text-xs text-muted-foreground">
                                    <Calendar size={14} className="mr-1.5" />
                                    <span>Updated recently</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};
