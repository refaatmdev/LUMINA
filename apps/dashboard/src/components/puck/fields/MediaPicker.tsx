import React, { useState, useRef } from 'react';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { useMediaAssets } from '../../../hooks/useMediaAssets';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Upload, Link as LinkIcon, Image as ImageIcon, Film, Grid, X } from 'lucide-react';

interface MediaPickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    type: 'image' | 'video';
    maxSizeMB?: number;
    readOnly?: boolean;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
    value,
    onChange,
    label,
    type,
    maxSizeMB = 20,
    readOnly
}) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'link'>('upload');
    const { uploadFile, uploading } = useMediaUpload();
    const { assets, loading: loadingAssets, refetch } = useMediaAssets(type);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [linkInput, setLinkInput] = useState('');

    // --- Upload Logic ---
    const handleFile = async (file: File) => {
        if (!file.type.startsWith(`${type}/`)) {
            toast.error(`Invalid file type. Please upload a ${type}.`);
            return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`File too large! Your limit is ${maxSizeMB}MB.`);
            return;
        }

        const url = await uploadFile(file);
        if (url) {
            onChange(url);
            toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
            refetch(); // Refresh gallery
        } else {
            toast.error("Upload failed. Please try again.");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // --- Link Logic ---
    const handleLinkSubmit = () => {
        if (linkInput) {
            onChange(linkInput);
            toast.success("Link applied!");
        }
    };

    // --- Render Preview ---
    const renderPreview = () => {
        if (!value) return null;

        return (
            <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mb-4">
                {type === 'image' ? (
                    <img src={value} alt="Preview" className="w-full h-48 object-cover" />
                ) : (
                    <video src={value} className="w-full h-48 object-cover" controls />
                )}

                {!readOnly && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove"
                    >
                        <X size={16} />
                    </button>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                    {type === 'image' ? <ImageIcon size={12} /> : <Film size={12} />}
                    <span className="capitalize">{type}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-3">
            <Toaster position="top-center" />
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

            {value && renderPreview()}

            {!value && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}
                            `}
                        >
                            <Upload size={16} /> Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'gallery' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}
                            `}
                        >
                            <Grid size={16} /> Gallery
                        </button>
                        <button
                            onClick={() => setActiveTab('link')}
                            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'link' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}
                            `}
                        >
                            <LinkIcon size={16} /> Link
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-gray-50/50 min-h-[200px]">
                        {activeTab === 'upload' && (
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer h-full flex flex-col items-center justify-center
                                    ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-white'}
                                    ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => !readOnly && inputRef.current?.click()}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept={type === 'image' ? "image/*" : "video/mp4,video/webm"}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFile(file);
                                    }}
                                    disabled={readOnly || uploading}
                                />

                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin text-indigo-600" size={24} />
                                            <span className="text-sm font-medium text-indigo-600">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100">
                                                <Upload className="text-indigo-600" size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Click or drag {type}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Max size: {maxSizeMB}MB
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="h-full">
                                {loadingAssets ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                                    </div>
                                ) : assets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <Grid size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">No {type}s found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                                        {assets.map((asset) => (
                                            <div
                                                key={asset.id}
                                                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all"
                                                onClick={() => onChange(asset.url)}
                                            >
                                                {type === 'image' ? (
                                                    <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={asset.url} className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <div className="flex flex-col gap-3 h-full justify-center">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Paste URL</label>
                                    <input
                                        type="text"
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        placeholder={`https://example.com/my-${type}....`}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleLinkSubmit}
                                    disabled={!linkInput}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Use Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
