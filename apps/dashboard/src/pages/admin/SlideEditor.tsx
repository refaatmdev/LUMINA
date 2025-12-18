import { useEffect, useState, useMemo } from 'react';
import { Puck, type Data, Render } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { getEditorConfig } from '../../puck.config';
import { supabase } from '../../lib/supabase';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import TemplateGallery from '../../components/editor/TemplateGallery';
import { useUserRole } from '../../hooks/useUserRole';
import { usePlanLimits } from '../../hooks/usePlanLimits';

export default function SlideEditor() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const slideId = searchParams.get('id');

    // Get initial values from navigation state (from CreateSlideModal)
    const initialName = location.state?.name || 'Untitled Slide';
    const initialOrientation = location.state?.orientation || 'landscape';

    const [initialData, setInitialData] = useState<Data>({
        content: [],
        root: { props: { title: initialName } }
    });
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(initialOrientation);
    const [loading, setLoading] = useState(!!slideId);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);
    const { role } = useUserRole();
    const [puckKey, setPuckKey] = useState(0);
    const [isPreview, setIsPreview] = useState(false);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    useEffect(() => {
        if (slideId) {
            fetchSlide();
        } else {
            // If new slide, show template gallery
            setShowTemplateGallery(true);
            setLoading(false);
        }
    }, [slideId]);

    const fetchSlide = async () => {
        try {
            const { data, error } = await supabase
                .from('slides')
                .select('*')
                .eq('id', slideId)
                .single();

            if (error) throw error;
            if (data) {
                if (data.orientation) {
                    setOrientation(data.orientation);
                }

                if (data.content) {
                    // Check if content is valid Puck data, otherwise use default
                    const content = data.content as any;
                    if (content.content || content.root) {
                        setInitialData(content);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching slide:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (data: Data, status: 'draft' | 'published' = 'published') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('You must be logged in to save.');
            return;
        }
        // Get org_id for the user
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            alert('Error fetching user organization.');
            return;
        }

        const slideData = {
            org_id: userData.org_id,
            name: data.root.props?.title || 'Puck Slide',
            content: data,
            orientation: orientation,
            status: status
        };

        let error;
        let newSlideId = slideId;

        if (slideId) {
            const { error: updateError } = await supabase
                .from('slides')
                .update({
                    content: data,
                    name: slideData.name,
                    status: status
                })
                .eq('id', slideId);
            error = updateError;
        } else {
            const { data: insertedData, error: insertError } = await supabase
                .from('slides')
                .insert(slideData)
                .select()
                .single();

            if (insertedData) {
                newSlideId = insertedData.id;
                navigate(`/admin/editor?id=${insertedData.id}`, { replace: true });
            }
            error = insertError;
        }

        if (error) {
            console.error(error);
            alert('Error saving slide.');
            return null;
        } else {
            // Broadcast update only if published
            if (status === 'published') {
                const channel = supabase.channel('system-updates');
                channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.send({
                            type: 'broadcast',
                            event: 'slide_updated',
                            payload: { id: newSlideId },
                        });
                        supabase.removeChannel(channel);
                    }
                });
            }
            return newSlideId;
        }
    };

    // We need state to hold the latest data for "Save as Template"
    const [currentData, setCurrentData] = useState<Data>(initialData);

    const saveTemplateToDB = async () => {
        const name = prompt('Enter template name:');
        if (!name) return;
        const category = prompt('Enter category:', 'General');

        try {
            const { error } = await supabase.from('templates').insert({
                name,
                category: category || 'General',
                content: currentData,
                is_public: true // For now, all templates created by admins are public
            });

            if (error) throw error;
            alert('Template saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Error saving template');
        }
    };

    const { planTier, loading: limitsLoading } = usePlanLimits();

    // Enforce watermark logic when data changes or loads
    useEffect(() => {
        if (!limitsLoading) {
            const newData = { ...initialData };

            // Ensure root and props exist
            if (!newData.root) {
                newData.root = { props: { title: 'Untitled Slide' } };
            }
            if (!newData.root.props) {
                newData.root.props = { title: 'Untitled Slide' };
            }

            const props = newData.root.props as any;

            // If free plan, force showWatermark to true
            if (planTier === 'free') {
                props.showWatermark = true;
            }
            // If pro plan, respect existing value or default to true if undefined
            else if (props.showWatermark === undefined) {
                props.showWatermark = true;
            }

            setInitialData(newData);
            setCurrentData(newData);
        }
    }, [limitsLoading, planTier]);

    const handleDataChange = (data: Data) => {
        // Enforce watermark on change for free plan
        if (planTier === 'free' && data.root.props) {
            (data.root.props as any).showWatermark = true;
        }
        setCurrentData(data);
    };

    const config = useMemo(() => {
        return getEditorConfig(planTier, orientation);
    }, [planTier, orientation]);

    if (loading || limitsLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading editor...</div>;



    // ...

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
                        // Apply watermark logic to template data
                        if (planTier === 'free') {
                            if (!data.root) data.root = { props: {} };
                            if (!data.root.props) data.root.props = {};
                            (data.root.props as any).showWatermark = true;
                        }
                        setInitialData(data);
                        setCurrentData(data);
                        setPuckKey(prev => prev + 1);
                        setShowTemplateGallery(false);
                    }}
                    onCancel={() => {
                        setShowTemplateGallery(false);
                    }}
                />
            )}

            {/* Editor Toolbar / Header */}
            {!isPreview && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] flex gap-2 items-center glass-panel px-3 py-2 rounded-2xl shadow-xl">
                    {role === 'super_admin' && (
                        <button
                            onClick={saveTemplateToDB}
                            className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/20 text-sm font-medium transition-colors"
                            title="Save as Template"
                        >
                            Save Tpl
                        </button>
                    )}

                    <button
                        onClick={async () => {
                            const id = await handlePublish(currentData, 'draft');
                            if (id) alert('Saved as Draft!');
                        }}
                        className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
                    >
                        Save Draft
                    </button>

                    <button
                        onClick={() => setIsPreview(true)}
                        className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>👁️ Preview</span>
                    </button>

                    <button
                        onClick={async () => {
                            const id = await handlePublish(currentData, 'published');
                            if (id) alert('Published successfully!');
                        }}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                    >
                        Publish
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1"></div>

                    <button
                        onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
                        className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>{orientation === 'landscape' ? '⬒ Landscape' : '⬓ Portrait'}</span>
                    </button>

                    <div className="relative group">
                        <button
                            onClick={() => {
                                let rootElement = document.getElementById('puck-root-canvas');
                                if (!rootElement) {
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && iframe.contentDocument) {
                                        rootElement = iframe.contentDocument.getElementById('puck-root-canvas');
                                    }
                                }
                                if (rootElement) {
                                    rootElement.click();
                                } else {
                                    alert('Could not find the slide canvas. Please click on the background manually.');
                                }
                            }}
                            className="bg-gray-800 text-white border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <span>⚙️ Settings</span>
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/admin/slides')}
                        className="ml-2 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>✕ Close</span>
                    </button>
                </div>
            )}

            {/* Preview Mode UI */}
            {isPreview ? (
                <div className="flex-1 bg-gray-900 flex flex-col relative overflow-hidden">
                    {/* Preview Toolbar */}
                    <div className="glass-panel border-b border-white/10 px-6 py-3 flex justify-between items-center shadow-lg z-10 rounded-none relative">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-white text-glow">Preview Mode</h2>
                            <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'desktop' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Desktop
                                </button>
                                <button
                                    onClick={() => setViewMode('tablet')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'tablet' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Tablet
                                </button>
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'mobile' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Mobile
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPreview(false)}
                            className="text-gray-300 hover:text-white font-medium px-4 py-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                        >
                            Exit Preview
                        </button>
                    </div>

                    {/* Preview Canvas */}
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
                            <Render config={config} data={currentData} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 relative z-10">
                    <Puck
                        key={puckKey}
                        config={config}
                        data={initialData}
                        onPublish={handlePublish}
                        onChange={handleDataChange}
                    />
                </div>
            )}
        </div>
    );
}
