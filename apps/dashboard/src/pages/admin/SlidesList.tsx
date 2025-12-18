import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Plus, Layout, Trash2, Monitor } from 'lucide-react';
import { Render } from "@measured/puck";
import config from '../../puck.config';
// import "@measured/puck/puck.css";
import AdminLayout from '../../components/layout/AdminLayout';
import AssignSlideModal from '../../components/admin/AssignSlideModal';
import CreateSlideModal from '../../components/admin/CreateSlideModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Slide {
    id: string;
    name: string;
    content: any;
    updated_at: string;
}

export default function SlidesList() {
    const { orgId, loading: roleLoading } = useUserRole();
    const navigate = useNavigate();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignModalSlide, setAssignModalSlide] = useState<{ id: string, name: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (roleLoading) return;

        if (orgId) {
            fetchSlides();
        } else {
            setLoading(false);
        }
    }, [orgId, roleLoading]);

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabase
                .from('slides')
                .select('id, name, updated_at, content')
                .eq('org_id', orgId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            const { error } = await supabase
                .from('slides')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
            alert('Error deleting slide');
        }
    };

    return (
        <AdminLayout
            title="Slides Library"
            actions={
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all duration-200 font-medium text-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Create New Slide
                </button>
            }
        >
            {loading || roleLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : slides.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-xl border border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Layout size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white text-glow">No slides yet</h3>
                    <p className="text-gray-400 mt-1 mb-6">Create your first digital signage slide.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        <Plus size={18} className="mr-1" />
                        Create Slide
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slides.map((slide) => (
                        <div key={slide.id} className="glass-panel rounded-xl overflow-hidden group flex flex-col h-full hover:border-violet-500/30 transition-all duration-300">
                            {/* Thumbnail */}
                            <div className="aspect-[16/11] bg-black/40 relative overflow-hidden border-b border-white/5">
                                {slide.content && Object.keys(slide.content).length > 0 ? (
                                    <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left transform scale-[0.25] pointer-events-none select-none bg-gray-900">
                                        <Render config={config} data={slide.content} />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Layout size={40} className="text-gray-600" />
                                    </div>
                                )}

                                /* Hover Overlay */
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 z-10">
                                    <button
                                        onClick={() => navigate(`/admin/editor?id=${slide.id}`)}
                                        className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/20 transition-colors shadow-lg"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setAssignModalSlide({ id: slide.id, name: slide.name })}
                                        className="bg-violet-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-violet-700 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white truncate pr-2 group-hover:text-violet-300 transition-colors">{slide.name}</h3>
                                </div>
                                <p className="text-xs text-gray-400 mb-4">
                                    Last updated: {new Date(slide.updated_at).toLocaleDateString()}
                                </p>

                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                    <button
                                        onClick={() => setAssignModalSlide({ id: slide.id, name: slide.name })}
                                        className="text-sm font-medium text-violet-400 hover:text-violet-300 flex items-center transition-colors"
                                    >
                                        <Monitor size={16} className="mr-1.5" />
                                        Assign to Screen
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slide.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                        title="Delete Slide"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {assignModalSlide && (
                <AssignSlideModal
                    onClose={() => setAssignModalSlide(null)}
                    slideId={assignModalSlide.id}
                    slideName={assignModalSlide.name}
                />
            )}

            {showCreateModal && (
                <CreateSlideModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={(name, orientation) => {
                        setShowCreateModal(false);
                        navigate('/admin/editor', { state: { name, orientation } });
                    }}
                />
            )}
        </AdminLayout>
    );
}
