import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragEndEvent,
    type DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Clock,
    Calendar,
    Save,
    Trash2,
    Plus,
    ArrowLeft,
    Settings
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// --- Interfaces ---

interface Slide {
    id: string;
    name: string;
    content: any; // thumbnail?
}

interface PlaylistItem {
    id: string; // unique id for the playlist item (client-side temp id or db id)
    slide_id: string;
    slide_name: string;
    order: number;
    duration: number;
    schedule_rules: {
        startTime: string;
        endTime: string;
        days: number[]; // 0-6
    } | null;
}

interface Playlist {
    id: string;
    name: string;
    description: string;
}

// --- Components ---

// Draggable Source Slide Item
function SourceSlideItem({ slide }: { slide: Slide }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `source-${slide.id}`,
        data: { type: 'source', slide },
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing mb-2 flex items-center gap-3"
        >
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                <div className="text-xs font-bold">SLIDE</div>
            </div>
            <span className="font-medium text-gray-700 truncate flex-1">{slide.name}</span>
            <Plus size={16} className="text-gray-400" />
        </div>
    );
}

// Sortable Playlist Item
function SortablePlaylistItem({
    item,
    onRemove,
    onUpdate
}: {
    item: PlaylistItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<PlaylistItem>) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { type: 'item', item } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [showSettings, setShowSettings] = useState(false);

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const toggleDay = (dayIndex: number) => {
        const currentDays = item.schedule_rules?.days || [0, 1, 2, 3, 4, 5, 6];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }

        // If no rules existed, init them
        const currentRules = item.schedule_rules || { startTime: '00:00', endTime: '23:59', days: [] };

        onUpdate(item.id, {
            schedule_rules: {
                ...currentRules,
                days: newDays
            }
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-xl border border-gray-200 shadow-sm mb-3 overflow-hidden group"
        >
            <div className="p-3 flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                >
                    <GripVertical size={20} />
                </div>

                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                    SLIDE
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.slide_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                            <Clock size={12} /> {item.duration}s
                        </span>
                        {item.schedule_rules ? (
                            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                                <Calendar size={12} /> Scheduled
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                <Calendar size={12} /> Always
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {showSettings && (
                <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Duration (seconds)</label>
                            <input
                                type="number"
                                min="1"
                                value={item.duration}
                                onChange={(e) => onUpdate(item.id, { duration: parseInt(e.target.value) || 10 })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700">Schedule Rules</label>
                            {item.schedule_rules && (
                                <button
                                    onClick={() => onUpdate(item.id, { schedule_rules: null })}
                                    className="text-xs text-red-600 hover:text-red-700"
                                >
                                    Clear Schedule
                                </button>
                            )}
                        </div>

                        {!item.schedule_rules ? (
                            <button
                                onClick={() => onUpdate(item.id, { schedule_rules: { startTime: '08:00', endTime: '20:00', days: [0, 1, 2, 3, 4, 5, 6] } })}
                                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
                            >
                                <Plus size={14} /> Add Schedule
                            </button>
                        ) : (
                            <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={item.schedule_rules.startTime}
                                            onChange={(e) => onUpdate(item.id, { schedule_rules: { ...item.schedule_rules!, startTime: e.target.value } })}
                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={item.schedule_rules.endTime}
                                            onChange={(e) => onUpdate(item.id, { schedule_rules: { ...item.schedule_rules!, endTime: e.target.value } })}
                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Active Days</label>
                                    <div className="flex justify-between gap-1">
                                        {days.map((day, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleDay(idx)}
                                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${item.schedule_rules?.days.includes(idx)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Need to import useDraggable from dnd-kit/core for SourceSlideItem
import { useDraggable } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

function DroppablePlaylistArea({ children }: { children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: 'playlist-droppable',
    });

    return (
        <div ref={setNodeRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[500px]">
            {children}
        </div>
    );
}

export default function PlaylistEditor() {
    const { id } = useParams(); // Playlist ID
    const navigate = useNavigate();
    const { orgId } = useUserRole();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [items, setItems] = useState<PlaylistItem[]>([]);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (orgId && id) {
            fetchData();
        }
    }, [orgId, id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Playlist Details
            if (id !== 'new') {
                const { data: plData, error: plError } = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (plError) throw plError;
                setPlaylist(plData);

                // Fetch Playlist Items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('playlist_items')
                    .select(`
                        *,
                        slides (name)
                    `)
                    .eq('playlist_id', id)
                    .order('order', { ascending: true });

                if (itemsError) throw itemsError;

                const formattedItems = itemsData.map((item: any) => ({
                    id: item.id,
                    slide_id: item.slide_id,
                    slide_name: item.slides?.name || 'Unknown Slide',
                    order: item.order,
                    duration: item.duration,
                    schedule_rules: item.schedule_rules
                }));
                setItems(formattedItems);
            } else {
                setPlaylist({ id: 'new', name: 'New Playlist', description: '' });
            }

            // Fetch Available Slides
            const { data: slidesData, error: slidesError } = await supabase
                .from('slides')
                .select('id, name, content')
                .eq('org_id', orgId);

            if (slidesError) throw slidesError;
            setSlides(slidesData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem(active.data.current);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Dropping a Source Slide into the Playlist
        if (active.data.current?.type === 'source' && over.id === 'playlist-droppable') {
            const slide = active.data.current.slide;
            const newItem: PlaylistItem = {
                id: crypto.randomUUID(), // Temp ID
                slide_id: slide.id,
                slide_name: slide.name,
                order: items.length,
                duration: 10,
                schedule_rules: null
            };
            setItems([...items, newItem]);
            return;
        }

        // Dropping a Source Slide over an existing Item (Insert)
        if (active.data.current?.type === 'source' && over.data.current?.type === 'item') {
            const slide = active.data.current.slide;
            const overIndex = items.findIndex(i => i.id === over.id);

            const newItem: PlaylistItem = {
                id: crypto.randomUUID(),
                slide_id: slide.id,
                slide_name: slide.name,
                order: overIndex, // Will be re-indexed later
                duration: 10,
                schedule_rules: null
            };

            const newItems = [...items];
            newItems.splice(overIndex, 0, newItem);
            setItems(newItems);
            return;
        }

        // Reordering Items
        if (active.id !== over.id && active.data.current?.type === 'item') {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const handleUpdateItem = (itemId: string, updates: Partial<PlaylistItem>) => {
        setItems(items.map(i => i.id === itemId ? { ...i, ...updates } : i));
    };

    const handleSave = async () => {
        if (!playlist || !orgId) return;
        setSaving(true);
        try {
            let playlistId = playlist.id;

            // 1. Create/Update Playlist Record
            if (playlistId === 'new') {
                const { data, error } = await supabase
                    .from('playlists')
                    .insert({
                        org_id: orgId,
                        name: playlist.name,
                        description: playlist.description
                    })
                    .select()
                    .single();

                if (error) throw error;
                playlistId = data.id;
                setPlaylist(data);
                // Update URL without reload
                window.history.replaceState(null, '', `/admin/playlists/${playlistId}`);
            } else {
                const { error } = await supabase
                    .from('playlists')
                    .update({
                        name: playlist.name,
                        description: playlist.description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', playlistId);
                if (error) throw error;
            }

            // 2. Sync Items
            // Strategy: Delete all existing items for this playlist and re-insert. 
            // Simple and effective for ordering.

            // First, delete all
            await supabase.from('playlist_items').delete().eq('playlist_id', playlistId);

            // Then insert all
            if (items.length > 0) {
                const itemsToInsert = items.map((item, index) => ({
                    playlist_id: playlistId,
                    slide_id: item.slide_id,
                    order: index,
                    duration: item.duration,
                    schedule_rules: item.schedule_rules
                }));

                const { error: insertError } = await supabase
                    .from('playlist_items')
                    .insert(itemsToInsert);

                if (insertError) throw insertError;
            }

            // Refresh data to get new IDs
            fetchData();
            alert('Playlist saved successfully!');

        } catch (error) {
            console.error('Error saving playlist:', error);
            alert('Failed to save playlist');
        } finally {
            setSaving(false);
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    if (loading) return <LoadingSpinner />;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/playlists')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <input
                                type="text"
                                value={playlist?.name || ''}
                                onChange={(e) => setPlaylist(prev => prev ? { ...prev, name: e.target.value } : null)}
                                placeholder="Playlist Name"
                                className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300"
                            />
                            <input
                                type="text"
                                value={playlist?.description || ''}
                                onChange={(e) => setPlaylist(prev => prev ? { ...prev, description: e.target.value } : null)}
                                placeholder="Add a description..."
                                className="text-sm text-gray-500 border-none focus:ring-0 p-0 w-full placeholder-gray-300"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 mr-4">
                            {items.length} items • {items.reduce((acc, item) => acc + item.duration, 0)}s total duration
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <LoadingSpinner className="w-4 h-4 text-white" /> : <Save size={18} />}
                            Save Playlist
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Source Slides */}
                    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-700">Available Slides</h3>
                            <p className="text-xs text-gray-500">Drag slides to the playlist</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {slides.map(slide => (
                                <SourceSlideItem key={slide.id} slide={slide} />
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Playlist Items */}
                    <div className="flex-1 flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                            <h3 className="font-semibold text-gray-700">Playlist Sequence</h3>
                        </div>

                        <DroppablePlaylistArea>
                            <SortableContext
                                items={items.map(i => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl m-4">
                                        <Plus size={48} className="mb-2 opacity-50" />
                                        <p className="font-medium">Drag slides here to build your playlist</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <SortablePlaylistItem
                                            key={item.id}
                                            item={item}
                                            onRemove={handleRemoveItem}
                                            onUpdate={handleUpdateItem}
                                        />
                                    ))
                                )}
                            </SortableContext>
                        </DroppablePlaylistArea>
                    </div>
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeDragItem ? (
                    activeDragItem.type === 'source' ? (
                        <div className="bg-white p-3 rounded-lg border border-indigo-500 shadow-xl w-72 opacity-90 rotate-2 cursor-grabbing">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-500">
                                    <div className="text-xs font-bold">SLIDE</div>
                                </div>
                                <span className="font-medium text-gray-900">{activeDragItem.slide.name}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-3 rounded-xl border border-indigo-500 shadow-xl w-[600px] opacity-90 rotate-1 cursor-grabbing">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                                    SLIDE
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{activeDragItem.item.slide_name}</h4>
                                </div>
                            </div>
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
