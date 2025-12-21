'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function StartPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const refOrg = searchParams.get('ref_org');
        const refScreen = searchParams.get('ref_screen');

        // Construct the destination URL (Dashboard Registration)
        // Assuming the dashboard lives at app.luminapp.io based on standard SaaS patterns
        // If local dev, this might need to be localhost:3000, but for prod generic is safer.
        // User asked for luminapp.io, so likely production context.
        const dashboardUrl = new URL('https://app.luminapp.io/register');

        if (refOrg) dashboardUrl.searchParams.set('ref_org', refOrg);
        if (refScreen) dashboardUrl.searchParams.set('ref_screen', refScreen);

        // Add a small delay for the animation
        const timer = setTimeout(() => {
            window.location.href = dashboardUrl.toString();
        }, 1500);

        return () => clearTimeout(timer);
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]"
            >
                <span className="text-3xl font-bold text-white">L</span>
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2 text-center">
                Welcome to Lumina
            </h1>
            <p className="text-gray-400 text-center max-w-sm mb-8">
                Redirecting you to create your account...
            </p>

            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );
}

export default function StartPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <StartPageContent />
        </Suspense>
    );
}
