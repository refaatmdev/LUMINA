
import { useEffect, useState } from 'react';
import { Puck, type Data, Render } from "@measured/puck";
import "@measured/puck/puck.css";
import { getEditorConfig } from '../../puck.config';
import { supabase } from '@lumina/shared/lib';
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
                navigate(`/ admin / editor ? id = ${insertedData.id} `, { replace: true });
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

    if (loading || limitsLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading editor...</div>;



    // ...

    return (
        <div className="h-screen w-screen bg-white relative flex flex-col">
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
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[100] flex gap-2 items-center bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-200">
                    {role === 'super_admin' && (
                        <button
                            onClick={saveTemplateToDB}
                            className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
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
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                        Save Draft
                    </button>

                    <button
                        onClick={() => setIsPreview(true)}
                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>👁️ Preview</span>
                    </button>

                    <button
                        onClick={async () => {
                            const id = await handlePublish(currentData, 'published');
                            if (id) alert('Published successfully!');
                        }}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm"
                    >
                        Publish
                    </button>

                    <div className="h-5 w-px bg-gray-300 mx-1"></div>

                    <button
                        onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
                        className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors flex items-center gap-2"
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
                            className="bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <span>⚙️ Settings</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Mode UI */}
            {isPreview ? (
                <div className="flex-1 bg-gray-100 flex flex-col relative overflow-hidden">
                    {/* Preview Toolbar */}
                    <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-800">Preview Mode</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={`px - 3 py - 1.5 rounded - md text - sm font - medium transition - all ${viewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'} `}
                                >
                                    Desktop
                                </button>
                                <button
                                    onClick={() => setViewMode('tablet')}
                                    className={`px - 3 py - 1.5 rounded - md text - sm font - medium transition - all ${viewMode === 'tablet' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'} `}
                                >
                                    Tablet
                                </button>
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={`px - 3 py - 1.5 rounded - md text - sm font - medium transition - all ${viewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'} `}
                                >
                                    Mobile
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPreview(false)}
                            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Exit Preview
                        </button>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                        <div
                            className="bg-white shadow-2xl transition-all duration-300 overflow-hidden relative"
                            style={{
                                width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '100%',
                                height: viewMode === 'mobile' ? '667px' : viewMode === 'tablet' ? '1024px' : '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                                transform: viewMode === 'desktop' ? 'scale(0.9)' : 'none'
                            }}
                        >
                            <Render config={getEditorConfig(planTier, orientation)} data={currentData} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 relative">
                    <Puck
                        key={puckKey}
                        config={getEditorConfig(planTier, orientation)}
                        data={initialData}
                        onPublish={handlePublish}
                        onChange={handleDataChange}
                    />
                </div>
            )}
        </div>
    );
}
