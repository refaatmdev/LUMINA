import { useParams, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@lumina/shared/ui';
import { WifiOff } from 'lucide-react';
import { Render } from "@measured/puck";
import { getEditorConfig } from '../../puck.config';
import "@measured/puck/puck.css";
import ViralOverlay from '../../components/player/ViralOverlay';
import { usePlaylistEngine } from '../../hooks/usePlaylistEngine';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayLogger } from '../../hooks/usePlayLogger';
import { usePlayerState } from '../../hooks/usePlayerState';
import { supabase } from '@lumina/shared/lib';
import { useEffect, useState, useMemo } from 'react';
import { useSystemCommands } from '../../hooks/useSystemCommands';
import { useVersionCheck } from '../../hooks/useVersionCheck';

export default function Player() {
    // --- 1. HOOKS (Must be unconditional) ---
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const previewSlideId = searchParams.get('previewSlideId');
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(!!previewSlideId);

    useEffect(() => {
        if (previewSlideId) {
            const fetchPreview = async () => {
                const { data } = await supabase
                    .from('slides')
                    .select('*')
                    .eq('id', previewSlideId)
                    .single();

                if (data) {
                    setPreviewData({
                        ...data.content,
                        orientation: data.orientation
                    });
                }
                setPreviewLoading(false);
            };
            fetchPreview();
        }
    }, [previewSlideId]);

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
        orientation,
        isManualOverride
    } = usePlayerState(id);

    const {
        currentSlide: playlistSlide,
        nextSlide: playlistNextSlide,
        currentSlideId: playlistSlideId,
        loading: playlistLoading,
        currentOrientation: playlistOrientation
    } = usePlaylistEngine({
        playlistId: mode === 'playlist' ? playlistId : null
    });

    const currentPlayingSlideId = mode === 'manual' ? manualSlideId : playlistSlideId;

    // Determine effective orientation
    const effectiveOrientation = previewSlideId
        ? (previewData?.orientation || 'landscape')
        : (mode === 'playlist' ? playlistOrientation : (orientation || 'landscape'));

    // Config Memoization
    const config = useMemo(() => {
        return getEditorConfig(planTier || 'free', effectiveOrientation);
    }, [planTier, effectiveOrientation]);

    usePlayLogger({
        screenId: id,
        orgId: orgId,
        slideId: currentPlayingSlideId
    });

    useSystemCommands();
    const updateAvailable = useVersionCheck();

    const [isTrialExpired, setIsTrialExpired] = useState(false);

    useEffect(() => {
        if (orgId) {
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
            checkTrial(orgId);
        }
    }, [orgId]);

    // --- 2. LOGIC & DATA PREPARATION ---
    let dataToRender = null;
    let nextDataToRender = null;
    let uniqueKey = '';
    let isSpecificLoading = false;

    if (previewSlideId) {
        if (previewLoading) {
            isSpecificLoading = true;
        } else {
            dataToRender = previewData;
            uniqueKey = `preview-${previewSlideId}`;
        }
    } else if (mode === 'manual') {
        dataToRender = manualSlideData;
        uniqueKey = `manual-${manualSlideId}`;
    } else if (mode === 'playlist') {
        if (playlistLoading && !playlistSlide) {
            isSpecificLoading = true;
        } else {
            dataToRender = playlistSlide;
            nextDataToRender = playlistNextSlide;
            uniqueKey = playlistSlide ? JSON.stringify(playlistSlide).substring(0, 50) : 'empty';
        }
    }

    // Version Update Effect (Unconditional location)
    useEffect(() => {
        if (updateAvailable) {
            console.log('Update available, reloading on slide transition...');
            window.location.reload();
        }
    }, [uniqueKey, updateAvailable]);

    // Inject Props
    if (dataToRender && dataToRender.root) {
        if (!dataToRender.root.props) dataToRender.root.props = {};
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

    // --- 3. RENDERING (Early Returns Allowed) ---

    // Global Loading
    if (stateLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <LoadingSpinner className="text-white" />
            </div>
        );
    }

    // Global Error
    if (stateError) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Error: {stateError}</div>;
    }

    // Specific Loading (Preview or Playlist)
    if (isSpecificLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <LoadingSpinner className="text-white" />
            </div>
        );
    }

    // Empty Content
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
                        <div
                            className="relative shadow-2xl overflow-hidden bg-black"
                            style={{
                                width: effectiveOrientation === 'portrait'
                                    ? 'min(100vw, calc(100vh * 9 / 16))'
                                    : 'min(100vw, calc(100vh * 16 / 9))',
                                height: effectiveOrientation === 'portrait'
                                    ? 'min(100vh, calc(100vw * 16 / 9))'
                                    : 'min(100vh, calc(100vw * 9 / 16))',
                                margin: 'auto'
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

            {/* Explicitly Render Viral Overlay for Free/Basic Plans ONLY (Exclude Custom & Manual Override) */}
            {planTier && ['free', 'basic'].includes(planTier) && !isManualOverride && orgId && (
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
