import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth-store';
import { usePlanLimits } from '../../../hooks/usePlanLimits';
import { getEditorConfig } from '../../../puck.config';
import { useSlide, useSaveSlide, useSaveTemplate } from '../api/editor';
import { EditorCanvas } from './EditorCanvas';
import TemplateGallery from '../../../components/editor/TemplateGallery';
import type { Data } from "@measured/puck";
import { Render } from "@measured/puck";

// NOTE: We are NOT using MainLayout here because the editor needs full screen control
// and often has its own specialized UI.

export const SlideEditorPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const slideId = searchParams.get('id');
    const { orgId, role } = useAuthStore();
    const { planTier, loading: limitsLoading } = usePlanLimits();

    // -- State --
    const initialName = location.state?.name || 'Untitled Slide';
    const initialOrientation = location.state?.orientation || 'landscape';

    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(initialOrientation);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isPreview, setIsPreview] = useState(false);
    const [showTemplateGallery, setShowTemplateGallery] = useState(!slideId); // Show if new

    // Data State
    const [puckData, setPuckData] = useState<Data>({
        content: [],
        root: { props: { title: initialName } }
    });

    // -- Queries --
    const { data: fetchedSlide, isLoading: slideLoading } = useSlide(slideId);
    const saveMutation = useSaveSlide();
    const saveTemplateMutation = useSaveTemplate();

    // -- Effect: Load Slide Data --
    useEffect(() => {
        if (fetchedSlide) {
            setOrientation(fetchedSlide.orientation);
            if (fetchedSlide.content && (fetchedSlide.content as any).root) {
                setPuckData(fetchedSlide.content as Data);
            }
        }
    }, [fetchedSlide]);

    // -- Effect: Apply Plan Limits (Watermarks) --
    useEffect(() => {
        if (!limitsLoading) {
            setPuckData(prev => {
                const newData = { ...prev };
                if (!newData.root?.props) {
                    newData.root = { props: { title: 'Untitled Slide' } };
                }

                // Force watermark on free plan
                if (planTier === 'free') {
                    (newData.root.props as any).showWatermark = true;
                }
                return newData;
            });
        }
    }, [limitsLoading, planTier]);

    // -- Handlers --
    const handleSave = async (status: 'draft' | 'published') => {
        if (!orgId) return;
        try {
            const name = puckData.root.props?.title || 'Untitled Slide';
            const newId = await saveMutation.mutateAsync({
                id: slideId,
                orgId,
                name: name,
                content: puckData,
                orientation,
                status
            });

            if (status === 'draft') alert('Saved as Draft!');
            if (status === 'published') alert('Published successfully!');

            if (!slideId && newId) {
                navigate(`/admin/editor?id=${newId}`, { replace: true });
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save slide');
        }
    };

    const handleDataChange = (data: Data) => {
        // Enforce watermark on change for free plan
        if (planTier === 'free' && data.root.props) {
            (data.root.props as any).showWatermark = true;
        }
        setPuckData(data);
    };

    const handleSaveTemplate = async () => {
        const name = prompt('Enter template name:');
        if (!name) return;
        const category = prompt('Enter category:', 'General') || 'General';

        try {
            await saveTemplateMutation.mutateAsync({ name, category, content: puckData });
            alert('Template saved successfully!');
        } catch (err) {
            alert('Failed to save template');
        }
    };

    const config = useMemo(() => getEditorConfig(planTier, orientation), [planTier, orientation]);

    if (limitsLoading || (slideId && slideLoading)) {
        return <div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">Loading Editor...</div>;
    }

    return (
        <div className="h-screen w-screen bg-gray-900 relative flex flex-col overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            {showTemplateGallery && (
                <TemplateGallery
                    onSelect={(data) => {
                        // Apply active plan limits
                        const newData = { ...data };
                        if (planTier === 'free' && newData.root.props) {
                            (newData.root.props as any).showWatermark = true;
                        }
                        setPuckData(newData);
                        setShowTemplateGallery(false);
                    }}
                    onCancel={() => setShowTemplateGallery(false)}
                />
            )}

            {/* Toolbar */}
            {!isPreview && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] flex gap-2 items-center glass-panel px-3 py-2 rounded-2xl shadow-xl">
                    {/* Admin Template Save */}
                    {role === 'super_admin' && (
                        <button onClick={handleSaveTemplate} className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/20 text-sm font-medium transition-colors">
                            Save Tpl
                        </button>
                    )}

                    <button onClick={() => handleSave('draft')} className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors">
                        Save Draft
                    </button>

                    <button onClick={() => setIsPreview(true)} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 text-sm font-medium transition-colors flex items-center gap-2">
                        <span>👁️ Preview</span>
                    </button>

                    <button onClick={() => handleSave('published')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-all shadow-lg">
                        {saveMutation.isPending ? 'Saving...' : 'Publish'}
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1"></div>

                    <button onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')} className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors w-32">
                        {orientation === 'landscape' ? '⬒ Landscape' : '⬓ Portrait'}
                    </button>

                    <button
                        onClick={() => navigate('/admin/slides')}
                        className="ml-2 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>✕ Close</span>
                    </button>
                </div>
            )}

            {/* Preview Mode */}
            {isPreview ? (
                <div className="flex-1 bg-gray-900 flex flex-col relative overflow-hidden z-20">
                    <div className="glass-panel border-b border-white/10 px-6 py-3 flex justify-between items-center shadow-lg z-10 rounded-none relative">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-white text-glow">Preview Mode</h2>
                            <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
                                {['desktop', 'tablet', 'mobile'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode as any)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${viewMode === mode ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setIsPreview(false)} className="text-gray-300 hover:text-white font-medium px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">
                            Exit Preview
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/50 to-gray-900">
                        <div
                            className="bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden relative border border-white/10 ring-1 ring-white/5"
                            style={{
                                width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '100%',
                                height: viewMode === 'mobile' ? '667px' : viewMode === 'tablet' ? '1024px' : '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                                transform: viewMode === 'desktop' ? 'scale(0.95)' : 'none'
                            }}
                        >
                            <Render config={config} data={puckData} />
                        </div>
                    </div>
                </div>
            ) : (
                <EditorCanvas
                    config={config}
                    initialData={puckData}
                    onChange={handleDataChange}
                    onPublish={() => { }} // Not used by Puck direct button, we use our own toolbar
                />
            )}

        </div>
    );
};
