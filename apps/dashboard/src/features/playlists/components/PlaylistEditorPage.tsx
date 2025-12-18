import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth-store';
import { useSlides as useAllSlides } from '../../slides/api/slides'; // reusing slides api
import { usePlaylist, usePlaylistItems, useSavePlaylist, type PlaylistItem, type Playlist } from '../api/playlists';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save, Plus } from 'lucide-react';

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
    useDroppable
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SourceSlideItem } from './SourceSlideItem';
import { SortablePlaylistItem } from './SortablePlaylistItem';

// Helper component for droppable area
function DroppablePlaylistArea({ children }: { children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: 'playlist-droppable',
    });

    return (
        <div ref={setNodeRef} className="flex-1 overflow-y-auto p-4 min-h-[500px]">
            {children}
        </div>
    );
}

export const PlaylistEditorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orgId } = useAuthStore();

    // -- Data Queries --
    const { data: fetchedPlaylist, isLoading: playlistLoading } = usePlaylist(id);
    const { data: fetchedItems, isLoading: itemsLoading } = usePlaylistItems(id);
    const { data: slides } = useAllSlides(orgId); // Reuse hook from slides feature

    const saveMutation = useSavePlaylist();

    // -- Local State --
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [items, setItems] = useState<PlaylistItem[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    // -- Sync State with Data --
    useEffect(() => {
        if (id === 'new') {
            setPlaylist({ id: 'new', name: 'New Playlist', description: '', org_id: orgId || '' });
            setItems([]);
        } else if (fetchedPlaylist && fetchedItems) {
            setPlaylist(fetchedPlaylist);
            setItems(fetchedItems);
        }
    }, [id, fetchedPlaylist, fetchedItems, orgId]);

    // -- DnD Sensors --
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // -- Handlers --

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
                id: crypto.randomUUID(),
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
                order: overIndex,
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

        try {
            const result = await saveMutation.mutateAsync({
                playlist,
                items,
                orgId
            });

            alert('Playlist saved successfully!');

            if (id === 'new' && result.playlistId) {
                navigate(`/admin/playlists/${result.playlistId}`, { replace: true });
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save playlist');
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: { opacity: '0.5' },
            },
        }),
    };

    if ((id !== 'new' && (playlistLoading || itemsLoading))) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-background">
                {/* Header */}
                <div className="bg-card/50 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/playlists')} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <input
                                type="text"
                                value={playlist?.name || ''}
                                onChange={(e) => setPlaylist(prev => prev ? { ...prev, name: e.target.value } : null)}
                                placeholder="Playlist Name"
                                className="text-xl font-bold text-foreground border-none focus:ring-0 p-0 placeholder:text-muted-foreground/50 w-full bg-transparent"
                            />
                            <input
                                type="text"
                                value={playlist?.description || ''}
                                onChange={(e) => setPlaylist(prev => prev ? { ...prev, description: e.target.value } : null)}
                                placeholder="Add a description..."
                                className="text-sm text-muted-foreground border-none focus:ring-0 p-0 w-full placeholder:text-muted-foreground/50 bg-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground mr-4">
                            {items.length} items • {items.reduce((acc, item) => acc + item.duration, 0)}s total duration
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? <LoadingSpinner className="w-4 h-4 text-primary-foreground" /> : <Save size={18} />}
                            Save Playlist
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Source Slides */}
                    <div className="w-80 bg-card border-r border-border flex flex-col">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Available Slides</h3>
                            <p className="text-xs text-muted-foreground">Drag slides to the playlist</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {slides?.map(slide => (
                                <SourceSlideItem key={slide.id} slide={slide} />
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Playlist Items */}
                    <div className="flex-1 flex flex-col bg-muted/10">
                        <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
                            <h3 className="font-semibold text-foreground">Playlist Sequence</h3>
                        </div>

                        <DroppablePlaylistArea>
                            <SortableContext
                                items={items.map(i => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl m-4 bg-card/20">
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
                        <div className="bg-card p-3 rounded-lg border border-primary shadow-xl w-72 opacity-90 rotate-2 cursor-grabbing">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                                    <div className="text-xs font-bold">SLIDE</div>
                                </div>
                                <span className="font-medium text-foreground">{activeDragItem.slide.name}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card p-3 rounded-xl border border-primary shadow-xl w-[600px] opacity-90 rotate-1 cursor-grabbing">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                                    SLIDE
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{activeDragItem.item.slide_name}</h4>
                                </div>
                            </div>
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
