import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { type Data } from "@measured/puck";

interface PlayerState {
    mode: 'manual' | 'playlist' | 'none';
    slideData: Data | null;
    playlistId: string | null;
    slideId: string | null; // ID of the manual slide
    groupId: string | null;
    orgId: string | null;
    loading: boolean;
    error: string | null;
    isOffline?: boolean;
    planTier?: string;
    orientation?: 'landscape' | 'portrait';
}

export function usePlayerState(screenId: string | undefined) {
    const [state, setState] = useState<PlayerState>({
        mode: 'none',
        slideData: null,
        playlistId: null,
        slideId: null,
        groupId: null,
        orgId: null,
        loading: true,
        error: null,
        isOffline: false,
        planTier: undefined,
    });

    // Refs for subscriptions to access current state
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const fetchContent = useCallback(async () => {
        if (!screenId) return;

        try {
            const { data: rpcData, error } = await supabase.rpc('get_player_slide_content', {
                screen_id: screenId
            });

            if (error) throw error;

            // Validation: Check if screen exists (if org_id is missing, it likely doesn't exist)
            if (rpcData && !rpcData.org_id) {
                console.warn("Screen not found or access denied. Clearing persistence.");
                localStorage.removeItem('lumina_screen_id');
                localStorage.removeItem('lumina_org_id');
                localStorage.removeItem('cached_slide_data');
                // Force reload to go back to connect (handled by Connect.tsx check or App router)
                // Since we are in a hook, we can't easily navigate. 
                // We'll set an error state that the component can react to.
                setState(prev => ({ ...prev, loading: false, error: 'SCREEN_NOT_FOUND' }));
                return;
            }

            if (rpcData) {
                const newState: PlayerState = {
                    mode: 'none',
                    slideData: null,
                    playlistId: null,
                    slideId: null,
                    groupId: rpcData.group_id || null,
                    orgId: rpcData.org_id || null,
                    loading: false,
                    error: null,
                    isOffline: false, // Online
                    planTier: rpcData.plan_tier,
                    orientation: rpcData.orientation || 'landscape',
                };

                if (rpcData.type === 'slide') {
                    // Manual Mode
                    newState.mode = 'manual';
                    newState.slideId = rpcData.slide_id;

                    if (rpcData.content) {
                        const content = rpcData.content as any;
                        if (content.content || content.root) {
                            newState.slideData = content;
                        }
                    }
                } else if (rpcData.type === 'playlist') {
                    // Playlist Mode
                    newState.mode = 'playlist';
                    newState.playlistId = rpcData.playlist_id;
                }

                // Cache the successful state
                localStorage.setItem('cached_slide_data', JSON.stringify(newState));
                setState(newState);
            } else {
                setState(prev => ({ ...prev, loading: false, mode: 'none', isOffline: false }));
            }
        } catch (err: any) {
            console.error('Error fetching player content:', err);

            // Offline Fallback
            const cached = localStorage.getItem('cached_slide_data');
            if (cached) {
                try {
                    const cachedState = JSON.parse(cached);
                    setState({
                        ...cachedState,
                        loading: false,
                        isOffline: true, // Mark as offline
                        error: null // Clear error since we are showing cached content
                    });
                    console.log("Using cached content due to error.");
                    return;
                } catch (parseErr) {
                    console.error("Error parsing cached data:", parseErr);
                }
            }

            setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
    }, [screenId]);

    // Initial Fetch & Heartbeat
    useEffect(() => {
        if (!screenId) return;

        fetchContent();

        const sendHeartbeat = async () => {
            try {
                await supabase.rpc('ping_screen', { screen_id: screenId });
            } catch (err) {
                console.error('Error sending heartbeat:', err);
            }
        };

        sendHeartbeat();
        const heartbeatInterval = setInterval(() => {
            sendHeartbeat();
            fetchContent(); // Poll for content updates (schedules, expirations)
        }, 10000); // Check every 10 seconds

        return () => clearInterval(heartbeatInterval);
    }, [screenId, fetchContent]);

    // Real-time Subscriptions
    useEffect(() => {
        if (!screenId) return;

        const channel = supabase.channel('player-state-updates')
            // Listen for direct updates to the slides table
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'slides' },
                (payload) => {
                    // If the updated slide is the one we are currently showing in manual mode
                    if (stateRef.current.mode === 'manual' &&
                        stateRef.current.slideId &&
                        payload.new &&
                        (payload.new as any).id === stateRef.current.slideId) {
                        console.log('Manual slide update received:', payload);
                        fetchContent();
                    }
                }
            )
            // Listen for updates to screen_groups
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'screen_groups' },
                (payload) => {
                    if (stateRef.current.groupId &&
                        payload.new &&
                        (payload.new as any).id === stateRef.current.groupId) {
                        console.log('Group update received:', payload);
                        fetchContent();
                    }
                }
            )
            // Listen for updates to the screen itself (e.g. active_slide_id change)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'screens', filter: `id=eq.${screenId}` },
                (payload) => {
                    console.log('Screen update received:', payload);
                    fetchContent();
                }
            )
            // Broadcast events
            .on('broadcast', { event: 'slide_updated' }, () => fetchContent())
            .on('broadcast', { event: 'screen_updated' }, (payload) => {
                if (payload.id === screenId) fetchContent();
            })
            .on('broadcast', { event: 'group_updated' }, (payload) => {
                if (stateRef.current.groupId && payload.id === stateRef.current.groupId) fetchContent();
            })
            .on('broadcast', { event: 'playlist_updated' }, (payload) => {
                if (stateRef.current.mode === 'playlist' &&
                    stateRef.current.playlistId &&
                    payload.id === stateRef.current.playlistId) {
                    fetchContent();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [screenId, fetchContent]);

    return state;
}
