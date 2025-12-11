import { useEffect, useState } from 'react';
import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
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

    if (loading || limitsLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading editor...</div>;



    // ...

    return (
        <div className="h-screen w-screen bg-white relative">
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
                        // If cancelling on new slide, maybe go back? 
                        // Or just show blank.
                        setShowTemplateGallery(false);
                    }}
                />
            )}

            {/* ... */}

            {/* Global Settings Helper & Actions */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[100] flex gap-2 items-center">
                {role === 'super_admin' && (
                    <button
                        onClick={saveTemplateToDB}
                        className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm font-medium transition-colors"
                    >
                        Save as Template
                    </button>
                )}

                {/* New Actions */}
                <button
                    onClick={async () => {
                        const id = await handlePublish(currentData, 'draft');
                        if (id) alert('Saved as Draft!');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                    Save (Draft)
                </button>

                <button
                    onClick={async () => {
                        const id = await handlePublish(currentData, 'draft');
                        if (id) {
                            window.open(`/player/preview?previewSlideId=${id}`, '_blank');
                        }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <span>👁️ Live Preview</span>
                </button>

                <button
                    onClick={async () => {
                        const id = await handlePublish(currentData, 'published');
                        if (id) alert('Published successfully!');
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-medium transition-colors"
                >
                    Ready for Publish
                </button>

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <button
                    onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded shadow hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <span>{orientation === 'landscape' ? '⬒ Landscape' : '⬓ Portrait'}</span>
                </button>

                <div className="relative group">
                    <button
                        onClick={() => {
                            // Try to find it in the main document first
                            let rootElement = document.getElementById('puck-root-canvas');

                            // If not found, look inside the Puck iframe
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
                        className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <span>⚙️ Global Settings</span>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        To edit the <strong>Logo</strong>, <strong>Ticker</strong>, <strong>Theme</strong>, or <strong>Watermark</strong>, click on the empty background area of the slide canvas.
                        <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                </div>
            </div>

            <Puck
                key={puckKey}
                config={getEditorConfig(planTier, orientation)}
                data={initialData}
                onPublish={handlePublish}
                onChange={handleDataChange}
            />
        </div>
    );
}
