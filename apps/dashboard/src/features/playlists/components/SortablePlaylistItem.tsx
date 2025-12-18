import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Calendar, Settings, Trash2, Plus } from 'lucide-react';
import type { PlaylistItem } from '../api/playlists';

interface SortablePlaylistItemProps {
    item: PlaylistItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<PlaylistItem>) => void;
}

export function SortablePlaylistItem({
    item,
    onRemove,
    onUpdate
}: SortablePlaylistItemProps) {
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
            className="bg-card rounded-xl border border-border shadow-sm mb-3 overflow-hidden group hover:border-primary/50 transition-colors"
        >
            <div className="p-3 flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                    <GripVertical size={20} />
                </div>

                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                    SLIDE
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{item.slide_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                            <Clock size={12} /> {item.duration}s
                        </span>
                        {item.schedule_rules ? (
                            <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20">
                                <Calendar size={12} /> Scheduled
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                <Calendar size={12} /> Always
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {showSettings && (
                <div className="bg-muted/30 border-t border-border p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Duration (seconds)</label>
                            <input
                                type="number"
                                min="1"
                                value={item.duration}
                                onChange={(e) => onUpdate(item.id, { duration: parseInt(e.target.value) || 10 })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-muted-foreground">Schedule Rules</label>
                            {item.schedule_rules && (
                                <button
                                    onClick={() => onUpdate(item.id, { schedule_rules: null })}
                                    className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                                >
                                    Clear Schedule
                                </button>
                            )}
                        </div>

                        {!item.schedule_rules ? (
                            <button
                                onClick={() => onUpdate(item.id, { schedule_rules: { startTime: '08:00', endTime: '20:00', days: [0, 1, 2, 3, 4, 5, 6] } })}
                                className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                <Plus size={14} /> Add Schedule
                            </button>
                        ) : (
                            <div className="space-y-3 bg-card p-3 rounded-lg border border-border">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={item.schedule_rules.startTime}
                                            onChange={(e) => onUpdate(item.id, { schedule_rules: { ...item.schedule_rules!, startTime: e.target.value } })}
                                            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={item.schedule_rules.endTime}
                                            onChange={(e) => onUpdate(item.id, { schedule_rules: { ...item.schedule_rules!, endTime: e.target.value } })}
                                            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Active Days</label>
                                    <div className="flex justify-between gap-1">
                                        {days.map((day, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleDay(idx)}
                                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all border-2 ${item.schedule_rules?.days.includes(idx)
                                                    ? 'bg-primary text-primary-foreground border-primary-foreground shadow-md scale-105'
                                                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
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
