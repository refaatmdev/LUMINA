import React, { useState, useEffect } from 'react';
import { Monitor, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lumina/shared/lib';

export default function Connect() {
    const [activeTab, setActiveTab] = useState<'pairing' | 'legacy'>('pairing');
    const [pairingCode, setPairingCode] = useState('');
    const navigate = useNavigate();

    // Legacy Login State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Auto-login check
        const savedScreenId = localStorage.getItem('lumina_screen_id');
        if (savedScreenId) {
            navigate(`/player/${savedScreenId}`);
            return;
        }

        if (activeTab === 'pairing') {
            // Generate random code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setPairingCode(code);

            // Poll for pairing status
            const interval = setInterval(async () => {
                try {
                    const { data } = await supabase.rpc('get_screen_by_pairing_code', {
                        check_code: code
                    });

                    if (data && data.length > 0) {
                        const screen = data[0];
                        // Pairing successful!
                        clearInterval(interval);

                        // Save to localStorage
                        localStorage.setItem('lumina_screen_id', screen.id);
                        if (screen.org_id) {
                            localStorage.setItem('lumina_org_id', screen.org_id);
                        }

                        // Redirect to player
                        navigate(`/player/${screen.id}`);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000); // Check every 3 seconds

            return () => clearInterval(interval);
        }
    }, [activeTab, navigate]);

    const handleLegacyLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Legacy login:', username, password);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex border-b border-gray-700">
                    <button
                        className={`flex-1 py-4 text-center font-medium ${activeTab === 'pairing' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('pairing')}
                    >
                        <Monitor className="inline-block mr-2" size={20} />
                        Smart TV Pairing
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-medium ${activeTab === 'legacy' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('legacy')}
                    >
                        <Key className="inline-block mr-2" size={20} />
                        Legacy Login
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'pairing' ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Pair this Screen</h2>
                            <p className="text-gray-400 mb-8">Enter the code below in your Admin Dashboard</p>

                            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
                                <span className="text-5xl font-mono tracking-widest text-blue-400 font-bold">
                                    {pairingCode}
                                </span>
                            </div>

                            <div className="flex items-center justify-center text-sm text-gray-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                Waiting for connection...
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Legacy Login</h2>
                            <form onSubmit={handleLegacyLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter screen username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Connect Screen
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
