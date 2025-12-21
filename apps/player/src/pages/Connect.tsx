import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BackgroundWaves from '../components/ui/BackgroundWaves';

export default function Connect() {
    // ... state code remains same ...
    const [pairingCode, setPairingCode] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-login check
        const savedScreenId = localStorage.getItem('lumina_screen_id');
        if (savedScreenId) {
            navigate(`/player/${savedScreenId}`);
            return;
        }

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
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 relative overflow-hidden">
            <BackgroundWaves />

            <div className="relative z-10 max-w-md w-full">
                {/* Logo Area */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                        <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Lumina</span>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Pair Screen</h2>
                        <p className="text-white/40 text-sm">Use the code below to register this device</p>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-8 mb-8 border border-white/5 shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative text-center">
                            <span className="text-6xl font-mono tracking-[0.2em] font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] select-all cursor-pointer">
                                {pairingCode}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-sm text-white/40 bg-white/5 py-3 rounded-full border border-white/5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                        </span>
                        <span>Waiting for connection...</span>
                    </div>
                </div>

                <div className="text-center mt-8 text-white/20 text-xs">
                    <p>Powered by Lumina Digital Signage Engine v2.0</p>
                </div>
            </div>
        </div>
    );
}
