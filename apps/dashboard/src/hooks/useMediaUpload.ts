import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from './useUserRole';

interface UseMediaUploadReturn {
    uploadFile: (file: File) => Promise<string | null>;
    uploading: boolean;
    error: string | null;
}

export function useMediaUpload(): UseMediaUploadReturn {
    const { orgId } = useUserRole();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File): Promise<string | null> => {
        if (!orgId) {
            setError('Organization ID not found');
            return null;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Check File Type & Size Limits
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (!isVideo && !isImage) {
                throw new Error('Invalid file type. Only images and videos are allowed.');
            }

            const sizeMB = file.size / (1024 * 1024);
            if (isVideo && sizeMB > 100) {
                throw new Error('Video size exceeds 100MB limit.');
            }
            if (isImage && sizeMB > 5) {
                throw new Error('Image size exceeds 5MB limit.');
            }

            // 2. Check Storage Quota
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('storage_used_bytes, storage_limit_bytes')
                .eq('id', orgId)
                .single();

            if (orgError) throw orgError;

            const used = org.storage_used_bytes || 0;
            const limit = org.storage_limit_bytes || 524288000; // Default 500MB if not set

            if (used + file.size > limit) {
                throw new Error(`Storage quota exceeded. Used: ${(used / (1024 * 1024)).toFixed(2)}MB / ${(limit / (1024 * 1024)).toFixed(2)}MB`);
            }

            // 3. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${orgId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media') // Assuming 'media' bucket exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            // 5. Insert into media_assets (Trigger will update storage_used_bytes)
            const { error: dbError } = await supabase
                .from('media_assets')
                .insert({
                    org_id: orgId,
                    file_name: file.name,
                    file_size_bytes: file.size,
                    url: publicUrl,
                    type: isVideo ? 'video' : 'image'
                });

            if (dbError) {
                // Rollback storage upload if DB insert fails (optional but good practice)
                await supabase.storage.from('media').remove([filePath]);
                throw dbError;
            }

            return publicUrl;

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { uploadFile, uploading, error };
}
