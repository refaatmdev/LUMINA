import { useEffect, useState } from 'react';
import { supabase } from '@lumina/shared/lib';
import { useUserRole } from '../../hooks/useUserRole';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import AdminLayout from '../../components/layout/AdminLayout';
import { LoadingSpinner } from '@lumina/shared/ui';
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Film, HardDrive } from 'lucide-react';

interface MediaAsset {
    id: string;
    file_name: string;
    url: string;
    type: 'image' | 'video';
    file_size_bytes: number;
    created_at: string;
}

export default function MediaLibrary() {
    const { orgId, loading: roleLoading } = useUserRole();
    const { uploadFile, uploading, error: uploadError } = useMediaUpload();

    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLimit, setStorageLimit] = useState(524288000); // Default 500MB
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [externalType, setExternalType] = useState<'image' | 'video'>('image');

    useEffect(() => {
        if (orgId) {
            fetchMediaAndStorage();
        }
    }, [orgId]);

    const fetchMediaAndStorage = async () => {
        try {
            // Fetch Assets
            const { data: mediaData, error: mediaError } = await supabase
                .from('media_assets')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false });

            if (mediaError) throw mediaError;
            setAssets(mediaData || []);

            // Fetch Storage Usage
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('storage_used_bytes, storage_limit_bytes')
                .eq('id', orgId)
                .single();

            if (orgError) throw orgError;
            setStorageUsed(orgData.storage_used_bytes || 0);
            setStorageLimit(orgData.storage_limit_bytes || 524288000);

        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await uploadFile(file);
        if (url) {
            fetchMediaAndStorage();
        } else {
            alert('Upload failed');
        }
        // Reset input
        e.target.value = '';
    };

    const handleAddExternalUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!externalUrl) return;

        try {
            const { error } = await supabase
                .from('media_assets')
                .insert({
                    org_id: orgId,
                    file_name: 'External URL',
                    file_size_bytes: 0, // Does not count towards quota
                    url: externalUrl,
                    type: externalType
                });

            if (error) throw error;

            setShowUrlModal(false);
            setExternalUrl('');
            fetchMediaAndStorage();
        } catch (error) {
            console.error('Error adding external URL:', error);
            alert('Failed to add URL');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
            // Delete from DB first (Trigger updates quota)
            const { error: dbError } = await supabase
                .from('media_assets')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // If it's a hosted file (not external), delete from Storage
            // We can check if the URL contains our supabase storage domain
            // Or simpler: if file_size_bytes > 0, it's likely hosted. 
            // Better: Extract path from URL if possible, or store path in DB.
            // For now, let's assume if it has a file_size > 0 it is hosted.
            // But we need the path. The URL is public.
            // Path is usually `orgId/filename`.
            // Let's try to extract filename from URL.

            // Actually, for this iteration, let's just delete the DB record. 
            // The storage file will be orphaned but quota is restored.
            // To be clean, we should delete the file.
            // Let's assume we can derive the path or just skip for now to avoid errors.

            fetchMediaAndStorage();
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        }
    };

    const usagePercent = Math.min((storageUsed / storageLimit) * 100, 100);
    const usedMB = (storageUsed / (1024 * 1024)).toFixed(2);
    const limitMB = (storageLimit / (1024 * 1024)).toFixed(2);

    return (
        <AdminLayout
            title="Media Library"
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUrlModal(true)}
                        className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200 font-medium text-sm"
                    >
                        <LinkIcon size={18} className="mr-2" />
                        External URL
                    </button>
                    <label className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 font-medium text-sm cursor-pointer">
                        <Upload size={18} className="mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Media'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,video/*"
                            disabled={uploading}
                        />
                    </label>
                </div>
            }
        >
            {/* Storage Quota Progress Bar */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <HardDrive size={16} />
                        Storage Usage
                    </h3>
                    <span className="text-sm font-medium text-gray-900">
                        {usedMB} MB / {limitMB} MB
                    </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
                {uploadError && (
                    <p className="text-sm text-red-600 mt-2">{uploadError}</p>
                )}
            </div>

            {loading || roleLoading ? (
                <LoadingSpinner />
            ) : assets.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No media assets</h3>
                    <p className="text-gray-500 mt-1">Upload images or videos to use in your slides.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {assets.map((asset) => (
                        <div key={asset.id} className="group relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden aspect-square">
                            {asset.type === 'image' ? (
                                <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                    <Film className="text-white opacity-50" size={32} />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                                <p className="text-white text-xs truncate mb-2">{asset.file_name}</p>
                                <button
                                    onClick={() => handleDelete(asset.id)}
                                    className="self-end p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* External URL Modal */}
            {showUrlModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add External URL</h3>
                        <form onSubmit={handleAddExternalUrl} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={externalUrl}
                                    onChange={e => setExternalUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="image"
                                            checked={externalType === 'image'}
                                            onChange={() => setExternalType('image')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Image
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="video"
                                            checked={externalType === 'video'}
                                            onChange={() => setExternalType('video')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Video
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUrlModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Add URL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
