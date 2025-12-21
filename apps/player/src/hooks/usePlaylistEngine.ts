import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PlaylistItem {
    id: string;
    slide_id: string;
    order: number;
    duration: number;
    schedule_rules: {
        startTime: string;
        endTime: string;
        days: number[];
    } | null;
    slides: {
        content: any;
        orientation?: 'landscape' | 'portrait';
    };
}

interface UsePlaylistEngineProps {
    playlistId: string | null;
}

export function usePlaylistEngine({ playlistId }: UsePlaylistEngineProps) {
    if (playlistId) console.log(`[PlaylistEngine] Hook Initialized | ID: ${playlistId}`);

    const [currentSlide, setCurrentSlide] = useState<any | null>(null);
    const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
    const [nextSlide, setNextSlide] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const itemsRef = useRef<PlaylistItem[]>([]);
    const currentIndexRef = useRef<number>(-1);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to check if an item is scheduled to play right now
    const isItemScheduledNow = useCallback((item: PlaylistItem) => {
        // If no schedule rules, it plays 24/7
        if (!item.schedule_rules) {
            // console.log(`[Schedule Check] Slide: ${item.slide_id} | No Rules -> PASSED`);
            return true;
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0-6

        // Robust time formatting: HH:MM 
        // Using getHours/getMinutes is safe from locale variations
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        const { startTime, endTime, days } = item.schedule_rules;

        // Debug Log (Visible in Console)
        console.log(`[Schedule Check] Slide: ${item.slide_id.substring(0, 6)}... | Now: Day=${currentDay} Time=${currentTime} | Rule: Days=[${days}] ${startTime}-${endTime}`);

        // Check Day
        if (days && days.length > 0 && !days.includes(currentDay)) {
            console.log(` -> Failed Day Check (Current Day ${currentDay} not in [${days}])`);
            return false;
        }

        // Check Time
        if (startTime && currentTime < startTime) {
            console.log(` -> Failed Start Time (${currentTime} < ${startTime})`);
            return false;
        }
        if (endTime && currentTime > endTime) {
            console.log(` -> Failed End Time (${currentTime} > ${endTime})`);
            return false;
        }

        console.log(` -> PASSED`);
        return true;
    }, []);

    // Helper to find next valid item index starting from a given index
    const findNextValidItem = useCallback((startIndex: number, items: PlaylistItem[]) => {
        let index = startIndex;
        let attempts = 0;
        const maxAttempts = items.length;

        while (attempts < maxAttempts) {
            if (index >= items.length) {
                index = 0; // Loop back to start
            }

            const item = items[index];
            if (isItemScheduledNow(item)) {
                return { index, item };
            }

            index++;
            attempts++;
        }
        return null;
    }, [isItemScheduledNow]);

    // Function to find the next valid item
    const playNextItem = useCallback(() => {
        if (itemsRef.current.length === 0) {
            setCurrentSlide(null);
            setCurrentSlideId(null);
            setNextSlide(null);
            return;
        }

        // 1. Find the item to play NOW (starting from next index)
        const currentResult = findNextValidItem(currentIndexRef.current + 1, itemsRef.current);

        if (currentResult) {
            // Update Current
            currentIndexRef.current = currentResult.index;
            setCurrentSlide(currentResult.item.slides.content);
            setCurrentSlideId(currentResult.item.slide_id);

            // 2. Find the NEXT item to preload (starting from the one after current)
            const nextResult = findNextValidItem(currentResult.index + 1, itemsRef.current);
            if (nextResult) {
                setNextSlide(nextResult.item.slides.content);
            } else {
                setNextSlide(null);
            }

            // Schedule next play
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                playNextItem();
            }, currentResult.item.duration * 1000);

        } else {
            // If we get here, NO items are valid right now
            setCurrentSlide(null);
            setCurrentSlideId(null);
            setNextSlide(null);
            // Retry in 10 seconds
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                playNextItem();
            }, 10000);
        }

    }, [findNextValidItem]);

    // Fetch Playlist Items
    useEffect(() => {
        if (!playlistId) {
            setLoading(false);
            setCurrentSlide(null);
            setCurrentSlideId(null);
            setNextSlide(null);
            itemsRef.current = [];
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        const fetchPlaylist = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('playlist_items')
                    .select(`
                        *,
                        slides (content, orientation)
                    `)
                    .eq('playlist_id', playlistId)
                    .order('order', { ascending: true });

                if (error) throw error;

                console.log(`[PlaylistEngine] Fetched ${data?.length || 0} items for playlist ${playlistId}`);
                data?.forEach((item, idx) => {
                    console.log(`[Item ${idx}] ID: ${item.id} | Slide: ${item.slide_id} | Order: ${item.order}`);
                });

                itemsRef.current = data || [];
                currentIndexRef.current = -1; // Reset index
                playNextItem(); // Start the loop

            } catch (err: any) {
                console.error('Error fetching playlist:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylist();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [playlistId, playNextItem]);

    // Extract current orientation
    const currentOrientation = itemsRef.current.find(i => i.slide_id === currentSlideId)?.slides?.orientation || 'landscape';

    return { currentSlide, nextSlide, currentSlideId, loading, error, currentOrientation };
}
