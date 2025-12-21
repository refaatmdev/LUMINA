import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface Slide {
    id: string;
    name: string;
    content: any;
}

export interface PlaylistItem {
    id: string; // client-side temp id or db id
    slide_id: string;
    slide_name: string;
    order: number;
    duration: number;
    schedule_rules: {
        startTime: string;
        endTime: string;
        days: number[]; // 0-6
    } | null;
}

export interface Playlist {
    id: string;
    name: string;
    description: string;
    org_id: string;
}

// --- Queries ---

export const usePlaylist = (id: string | undefined) => {
    return useQuery({
        queryKey: ['playlist', id],
        queryFn: async (): Promise<Playlist | null> => {
            if (!id || id === 'new') return null;
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id && id !== 'new'
    });
};

export const usePlaylistItems = (playlistId: string | undefined) => {
    return useQuery({
        queryKey: ['playlist-items', playlistId],
        queryFn: async (): Promise<PlaylistItem[]> => {
            if (!playlistId || playlistId === 'new') return [];

            const { data, error } = await supabase
                .from('playlist_items')
                .select(`
                    *,
                    slides (name)
                `)
                .eq('playlist_id', playlistId)
                .order('order', { ascending: true });

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                slide_id: item.slide_id,
                slide_name: item.slides?.name || 'Unknown Slide',
                order: item.order,
                duration: item.duration,
                schedule_rules: item.schedule_rules
            }));
        },
        enabled: !!playlistId && playlistId !== 'new'
    });
};

export const usePlaylists = (orgId: string | undefined) => {
    return useQuery({
        queryKey: ['playlists', orgId],
        queryFn: async (): Promise<Playlist[]> => {
            if (!orgId) return [];
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('org_id', orgId)
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!orgId
    });
};

// --- Mutations ---

interface SavePlaylistParams {
    playlist: { id: string; name: string; description: string };
    items: PlaylistItem[];
    orgId: string;
}

export const useSavePlaylist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlist, items, orgId }: SavePlaylistParams) => {
            let playlistId = playlist.id;
            let newPlaylistRecord = null;

            // 1. Create/Update Playlist Record
            if (playlistId === 'new') {
                const { data, error } = await supabase
                    .from('playlists')
                    .insert({
                        org_id: orgId,
                        name: playlist.name,
                        description: playlist.description
                    })
                    .select()
                    .single();

                if (error) throw error;
                playlistId = data.id;
                newPlaylistRecord = data;
            } else {
                const { data, error } = await supabase
                    .from('playlists')
                    .update({
                        name: playlist.name,
                        description: playlist.description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', playlistId)
                    .select()
                    .single();

                if (error) throw error;
                newPlaylistRecord = data;
            }

            // 2. Sync Items (Delete All & Insert Strategy)
            const { error: deleteError } = await supabase
                .from('playlist_items')
                .delete()
                .eq('playlist_id', playlistId);

            if (deleteError) throw deleteError;

            if (items.length > 0) {
                const itemsToInsert = items.map((item, index) => ({
                    playlist_id: playlistId,
                    slide_id: item.slide_id,
                    order: index,
                    duration: item.duration,
                    schedule_rules: item.schedule_rules
                }));

                const { error: insertError } = await supabase
                    .from('playlist_items')
                    .insert(itemsToInsert);

                if (insertError) throw insertError;
            }

            return { playlistId, playlist: newPlaylistRecord };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['playlist', data.playlistId] });
            queryClient.invalidateQueries({ queryKey: ['playlist-items', data.playlistId] });
        }
    });
};

export const useDeletePlaylist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            // We need to invalidate the playlists list
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
        }
    });
};
