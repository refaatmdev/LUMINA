import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Data } from '@measured/puck';
import { X, Layout } from 'lucide-react';

type Template = {
    id: string;
    name: string;
    category: string;
    thumbnail_url: string;
    content: Data;
};

type Props = {
    onSelect: (data: Data) => void;
    onCancel: () => void;
};

export default function TemplateGallery({ onSelect, onCancel }: Props) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [categories, setCategories] = useState<string[]>(['All']);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_public', true);

            if (error) throw error;

            if (data) {
                setTemplates(data);
                const uniqueCategories = ['All', ...new Set(data.map((t: Template) => t.category))];
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = selectedCategory === 'All'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transform transition-all scale-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
                        <p className="text-gray-500 mt-1">Start with a pre-made design or build from scratch.</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* Blank Template Option */}
                        <div
                            onClick={() => onSelect({ content: [], root: { props: { title: 'Untitled Slide' } } })}
                            className="group cursor-pointer bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col items-center justify-center h-64 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/30 transition-colors duration-300" />
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 text-gray-400 group-hover:text-indigo-600 shadow-sm">
                                <Layout size={32} />
                            </div>
                            <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Start from Blank</span>
                            <span className="text-xs text-gray-500 mt-1">Empty canvas</span>
                        </div>

                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-sm h-64 animate-pulse border border-gray-100" />
                            ))
                        ) : (
                            filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => onSelect(template.content)}
                                    className="group cursor-pointer bg-white rounded-2xl border border-gray-200 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col h-64"
                                >
                                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                                        {template.thumbnail_url ? (
                                            <img
                                                src={template.thumbnail_url}
                                                alt={template.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                <Layout size={32} className="opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                        {/* Hover Overlay Button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-lg font-medium text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                Use Template
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col justify-center flex-1 bg-white relative z-10">
                                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 self-start px-2 py-0.5 rounded-md">{template.category}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
