import { useState } from 'react';
import { useAuthStore } from '../../../store/auth-store';
import { useMediaAssets, useStorageQuota, useUploadMedia, useDeleteMedia, useAddExternalUrl } from '../api/media';
import { MainLayout } from '../../layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Film, HardDrive, X } from 'lucide-react';

export const MediaLibraryPage = () => {
    const { orgId } = useAuthStore();
    const { data: assets, isLoading: assetsLoading } = useMediaAssets(orgId);
    const { data: quota } = useStorageQuota(orgId);

    const uploadMutation = useUploadMedia();
    const deleteMutation = useDeleteMedia();
    const addUrlMutation = useAddExternalUrl();

    const [showUrlModal, setShowUrlModal] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [externalType, setExternalType] = useState<'image' | 'video'>('image');

    // Derived state
    const storageUsed = quota?.used_bytes || 0;
    const storageLimit = quota?.limit_bytes || 524288000;
    const usagePercent = Math.min((storageUsed / storageLimit) * 100, 100);
    const usedMB = (storageUsed / (1024 * 1024)).toFixed(2);
    const limitMB = (storageLimit / (1024 * 1024)).toFixed(2);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !orgId) return;

        try {
            await uploadMutation.mutateAsync({ file, orgId });
        } catch (err: any) {
            alert(err.message || 'Upload failed');
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (id: string) => {
        if (!orgId || !confirm('Are you sure you want to delete this asset?')) return;
        try {
            await deleteMutation.mutateAsync({ id, orgId });
        } catch (err) {
            alert('Failed to delete asset');
        }
    };

    const handleAddExternalUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!externalUrl || !orgId) return;

        try {
            await addUrlMutation.mutateAsync({ url: externalUrl, type: externalType, orgId });
            setShowUrlModal(false);
            setExternalUrl('');
        } catch (err) {
            alert('Failed to add URL');
        }
    };

    return (
        <MainLayout
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
                    <label className={`flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 font-medium text-sm cursor-pointer ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload size={18} className="mr-2" />
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload Media'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,video/*"
                            disabled={uploadMutation.isPending}
                        />
                    </label>
                </div>
            }
        >
            {/* Storage Quota Progress Bar */}
            <div className="glass-panel p-6 rounded-xl mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <HardDrive size={16} className="text-violet-400" />
                        Storage Usage
                    </h3>
                    <span className="text-sm font-medium text-gray-300">
                        {usedMB} MB / {limitMB} MB
                    </span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-violet-600 shadow-[0_0_10px_#7c3aed]'}`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
                {uploadMutation.error && (
                    <p className="text-sm text-red-400 mt-2">{uploadMutation.error.message}</p>
                )}
            </div>

            {assetsLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : assets?.length === 0 ? (
                <div className="text-center py-16 glass-panel rounded-xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <ImageIcon size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No media assets</h3>
                    <p className="text-gray-400 mt-1">Upload images or videos to use in your slides.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {assets?.map((asset: any) => (
                        <div key={asset.id} className="group relative glass-panel rounded-xl overflow-hidden aspect-square">
                            {asset.type === 'image' ? (
                                <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                    <Film className="text-white opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 transform translate-y-2 group-hover:translate-y-0">
                                <p className="text-white text-xs truncate mb-2">{asset.file_name}</p>
                                <button
                                    onClick={() => handleDelete(asset.id)}
                                    className="self-end p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-lg font-bold text-white text-glow">Add External URL</h3>
                            <button onClick={() => setShowUrlModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddExternalUrl} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                                <input
                                    type="url"
                                    required
                                    className="glass-input w-full px-4 py-2 rounded-lg outline-none"
                                    value={externalUrl}
                                    onChange={e => setExternalUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${externalType === 'image' ? 'border-violet-500' : 'border-gray-500'}`}>
                                            {externalType === 'image' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="image"
                                            checked={externalType === 'image'}
                                            onChange={() => setExternalType('image')}
                                            className="hidden"
                                        />
                                        <span className={`text-sm ${externalType === 'image' ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-300'}`}>Image</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${externalType === 'video' ? 'border-violet-500' : 'border-gray-500'}`}>
                                            {externalType === 'video' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="video"
                                            checked={externalType === 'video'}
                                            onChange={() => setExternalType('video')}
                                            className="hidden"
                                        />
                                        <span className={`text-sm ${externalType === 'video' ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-300'}`}>Video</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUrlModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg font-medium transition-colors border border-transparent hover:border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addUrlMutation.isPending}
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_20px_rgba(124,58,237,0.6)] transition-all disabled:opacity-50"
                                >
                                    {addUrlMutation.isPending ? 'Adding...' : 'Add URL'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
