import { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B0F19] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-white/10">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Create New Slide</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Slide Name
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Lobby Display"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Screen Orientation
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setOrientation('landscape')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${orientation === 'landscape'
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:bg-white/5'
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
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                <Smartphone size={32} className="mb-2" />
                                <span className="font-medium text-sm">Portrait</span>
                                <span className="text-xs opacity-70">9:16 (Vertical)</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            variant="primary"
                        >
                            Create Slide
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

