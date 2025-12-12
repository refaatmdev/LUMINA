import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from './useUserRole';

export interface MediaAsset {
    id: string;
    created_at: string;
    file_name: string;
    url: string;
    type: 'image' | 'video';
    file_size_bytes: number;
}

export function useMediaAssets(type?: 'image' | 'video') {
    const { orgId } = useUserRole();
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async () => {
        if (!orgId) return;

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('media_assets')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setAssets(data || []);
        } catch (err: any) {
            console.error('Error fetching media assets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [orgId, type]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return { assets, loading, error, refetch: fetchAssets };
}
