import { useState } from 'react';

export default function EnvDebug() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const [minimized, setMinimized] = useState(false);

    if (minimized) {
        return (
            <div className="fixed top-0 left-0 bg-red-500 text-white p-1 z-[99999] text-xs cursor-pointer opacity-50 hover:opacity-100" onClick={() => setMinimized(false)}>
                DEBUG
            </div>
        )
    }

    return (
        <div className="fixed top-0 left-0 bg-black/80 text-green-400 p-4 z-[99999] text-xs font-mono max-w-sm border border-green-500">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold underline">Environment Debug</h3>
                <button onClick={() => setMinimized(true)} className="text-white bg-red-600 px-2 rounded">Hide</button>
            </div>

            <div>
                <strong>URL:</strong> {url ? `${url.substring(0, 15)}...` : 'UNDEFINED'}
            </div>
            <div>
                <strong>Key:</strong> {key ? `${key.substring(0, 10)}...` : 'UNDEFINED'}
            </div>

            <div className="mt-2 text-white">
                <p>If UNDEFINED, .env file is missing or not loading.</p>
            </div>
        </div>
    );
}
