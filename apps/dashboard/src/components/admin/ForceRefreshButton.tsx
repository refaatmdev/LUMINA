import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForceRefreshButton: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('system_commands')
                .insert({
                    command: 'reload_all',
                    created_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;

            toast.success('Global refresh command sent!');
            setShowConfirm(false);
        } catch (err: any) {
            console.error('Error sending refresh command:', err);
            toast.error('Failed to send command: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm"
            >
                <RefreshCw size={16} />
                Force Global Refresh
            </button>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Confirm Global Refresh</h3>
                        </div>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to force a reload on <strong className="text-gray-900">ALL connected screens globally</strong>?
                            <br /><br />
                            This will interrupt playback for a few seconds on every device. Use this only for critical updates or system resets.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                Yes, Reload All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
