import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface LogEntry {
    org_id: string;
    screen_id: string;
    slide_id: string | null;
    played_at: string;
    duration_played: number;
    user_agent?: string;
}

interface UsePlayLoggerProps {
    screenId: string | undefined;
    orgId: string | null;
    slideId: string | null;
    playlistItemId?: string | null; // Optional: track which playlist item was played
}

const BATCH_LIMIT = 10;
const FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function usePlayLogger({ screenId, orgId, slideId }: UsePlayLoggerProps) {
    const startTimeRef = useRef<number | null>(null);
    const currentSlideIdRef = useRef<string | null>(null);

    // Flush logs to Supabase
    const flushLogs = useCallback(async () => {
        const storedLogs = localStorage.getItem('play_logs_buffer');
        if (!storedLogs) return;

        const logs: LogEntry[] = JSON.parse(storedLogs);
        if (logs.length === 0) return;

        try {
            const { error } = await supabase.from('play_logs').insert(logs);
            if (error) {
                console.error('Failed to flush logs:', error);
                // Keep logs in buffer to retry later? 
                // For now, we might lose them if we clear, but keeping them might cause overflow.
                // Let's keep them if it's a network error, but maybe limit size.
                return;
            }

            // Clear buffer on success
            localStorage.removeItem('play_logs_buffer');
            console.log(`Flushed ${logs.length} logs to DB`);
        } catch (err) {
            console.error('Error flushing logs:', err);
        }
    }, []);

    // Log a completed play
    const logPlay = useCallback((duration: number) => {
        if (!screenId || !orgId) return;

        const entry: LogEntry = {
            org_id: orgId,
            screen_id: screenId,
            slide_id: currentSlideIdRef.current,
            played_at: new Date().toISOString(),
            duration_played: Math.round(duration),
            user_agent: navigator.userAgent
        };

        // Add to local buffer
        const storedLogs = localStorage.getItem('play_logs_buffer');
        const logs: LogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
        logs.push(entry);
        localStorage.setItem('play_logs_buffer', JSON.stringify(logs));

        // Check batch limit
        if (logs.length >= BATCH_LIMIT) {
            flushLogs();
        }
    }, [screenId, orgId, flushLogs]);

    // Setup flush interval
    useEffect(() => {
        const interval = setInterval(() => {
            flushLogs();
        }, FLUSH_INTERVAL);

        return () => clearInterval(interval);
    }, [flushLogs]);

    // Track slide changes
    useEffect(() => {
        const now = Date.now();

        // If there was a previous slide, log its duration
        if (startTimeRef.current && currentSlideIdRef.current) {
            const duration = (now - startTimeRef.current) / 1000;
            // Only log if it played for at least 1 second
            if (duration >= 1) {
                logPlay(duration);
            }
        }

        // Start tracking new slide
        startTimeRef.current = now;
        currentSlideIdRef.current = slideId;

        // Handle unmount/page leave - try to log partial play?
        // Hard to do reliably with "fire and forget" on unmount without beacon API.
        // For now, we accept that the last slide before close might not be logged if < 5 mins.
        // Or we could try to flush on visibility change.

    }, [slideId, logPlay]);

    // Optional: Flush on visibility change (tab close/hide)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushLogs();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [flushLogs]);
}
