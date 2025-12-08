import { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';

type Props = {
    onClose: () => void;
    onCreate: (name: string, orientation: 'landscape' | 'portrait') => void;
};

export default function CreateSlideModal({ onClose, onCreate }: Props) {
    const [name, setName] = useState('');
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), orientation);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Create New Slide</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Slide Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Lobby Display"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Screen Orientation
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setOrientation('landscape')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${orientation === 'landscape'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <Monitor size={32} className="mb-2" />
                                <span className="font-medium text-sm">Landscape</span>
                                <span className="text-xs opacity-70">16:9 (Horizontal)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOrientation('portrait')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${orientation === 'portrait'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <Smartphone size={32} className="mb-2" />
                                <span className="font-medium text-sm">Portrait</span>
                                <span className="text-xs opacity-70">9:16 (Vertical)</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            Create Slide
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
