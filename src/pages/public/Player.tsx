import { useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { WifiOff } from 'lucide-react';
import { Render } from "@measured/puck";
import config from '../../puck.config';
import ViralOverlay from '../../components/player/ViralOverlay';
import { usePlaylistEngine } from '../../hooks/usePlaylistEngine';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayLogger } from '../../hooks/usePlayLogger';
import { usePlayerState } from '../../hooks/usePlayerState';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

export default function Player() {
    const { id } = useParams();

    // 1. Get Player State (Mode, Content, IDs)
    const {
        mode,
        slideData: manualSlideData,
        playlistId,
        slideId: manualSlideId,
        orgId,
        loading: stateLoading,
        error: stateError,
        isOffline,
        planTier,
        orientation
    } = usePlayerState(id);

    // 2. Playlist Engine (Only active if mode is 'playlist')
    const {
        currentSlide: playlistSlide,
        nextSlide: playlistNextSlide,
        currentSlideId: playlistSlideId,
        loading: playlistLoading
    } = usePlaylistEngine({
        playlistId: mode === 'playlist' ? playlistId : null
    });

    // 3. Analytics Logger
    // Determine the actual slide ID being played
    const currentPlayingSlideId = mode === 'manual' ? manualSlideId : playlistSlideId;

    usePlayLogger({
        screenId: id,
        orgId: orgId,
        slideId: currentPlayingSlideId
    });

    // Trial Check Logic
    const [isTrialExpired, setIsTrialExpired] = useState(false);

    useEffect(() => {
        if (orgId) {
            checkTrial(orgId);
        }
    }, [orgId]);

    const checkTrial = async (organizationId: string) => {
        const { data } = await supabase
            .from('organizations')
            .select('plan_tier, trial_ends_at')
            .eq('id', organizationId)
            .single();

        if (data && data.plan_tier === 'free' && data.trial_ends_at) {
            const trialEnd = new Date(data.trial_ends_at);
            if (new Date() > trialEnd) {
                setIsTrialExpired(true);
            }
        }
    };

    // 4. Loading & Error States
    if (stateLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <LoadingSpinner className="text-white" />
            </div>
        );
    }

    if (stateError) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Error: {stateError}</div>;
    }

    // 5. Determine Content to Render
    let dataToRender = null;
    let nextDataToRender = null;
    let uniqueKey = '';

    if (mode === 'manual') {
        dataToRender = manualSlideData;
        uniqueKey = `manual-${manualSlideId}`;
    } else if (mode === 'playlist') {
        if (playlistLoading && !playlistSlide) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <LoadingSpinner className="text-white" />
                </div>
            );
        }
        dataToRender = playlistSlide;
        nextDataToRender = playlistNextSlide;
        uniqueKey = playlistSlide ? JSON.stringify(playlistSlide).substring(0, 50) : 'empty';
    }

    // Inject Plan Info for Viral Overlay
    if (dataToRender && dataToRender.root) {
        if (!dataToRender.root.props) dataToRender.root.props = {};
        // We use a type assertion or just direct assignment if TS allows, or spread
        dataToRender = {
            ...dataToRender,
            root: {
                ...dataToRender.root,
                props: {
                    ...dataToRender.root.props,
                    planTier,
                    orgId,
                    screenId: id
                }
            }
        };
    }

    if (!dataToRender) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                    <img src="/logo.svg" alt="Logo" className="w-12 h-12 opacity-50" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <p className="text-gray-500 font-medium">No content scheduled</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black relative overflow-hidden">
            {/* Manual Mode Indicator */}
            {mode === 'manual' && (
                <div className="absolute top-4 right-4 z-50 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" title="Manual Override Active" />
            )}

            {/* Offline Indicator */}
            {isOffline && (
                <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white/70">
                    <WifiOff size={14} className="text-red-400" />
                    <span className="text-xs font-medium">Offline Mode</span>
                </div>
            )}

            <AnimatePresence mode='popLayout'>
                <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-black"
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* 
                            Container to enforce aspect ratio.
                            If orientation is portrait, we want to fit a 9/16 box.
                            If landscape, 16/9.
                            We use max-width/height and aspect-ratio to contain it.
                        */}
                        <div
                            className="relative shadow-2xl overflow-hidden bg-black"
                            style={{
                                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                                height: orientation === 'portrait' ? '100%' : 'auto',
                                width: orientation === 'portrait' ? 'auto' : '100%',
                                maxHeight: '100vh',
                                maxWidth: '100vw',
                            }}
                        >
                            <Render config={config} data={dataToRender} />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Buffer Layer */}
            {nextDataToRender && (
                <div className="absolute inset-0 z-0 opacity-0 pointer-events-none w-full h-full" aria-hidden="true">
                    <Render config={config} data={nextDataToRender} />
                </div>
            )}

            {/* Explicitly Render Viral Overlay for Free/Basic Plans ONLY (Exclude Custom) */}
            {planTier && ['free', 'basic'].includes(planTier) && orgId && (
                <div className="absolute inset-0 z-[100] pointer-events-none">
                    <ViralOverlay orgId={orgId} screenId={id} />
                </div>
            )}

            {/* Trial Expired Overlay */}
            {isTrialExpired && (
                <div className="absolute inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-white p-8 text-center">
                    <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-red-500/50">
                        <WifiOff size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Trial Expired</h1>
                    <p className="text-xl text-gray-300 max-w-md">
                        The trial period for this screen has ended. Please contact your administrator to upgrade the plan.
                    </p>
                </div>
            )}
        </div>
    );
}
