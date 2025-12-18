import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { Slide } from '../api/playlists';

export function SourceSlideItem({ slide }: { slide: Slide }) {
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
            className="bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing mb-2 flex items-center gap-3 transition-colors hover:border-primary/50"
        >
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                <div className="text-xs font-bold">SLIDE</div>
            </div>
            <span className="font-medium text-foreground truncate flex-1">{slide.name}</span>
            <Plus size={16} className="text-muted-foreground" />
        </div>
    );
}
