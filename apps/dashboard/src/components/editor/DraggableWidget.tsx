import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSlideStore, type Widget } from '../../stores/slideStore';
import { CSS } from '@dnd-kit/utilities';

interface DraggableWidgetProps {
    widget: Widget;
}

export default function DraggableWidget({ widget }: DraggableWidgetProps) {
    const { selectWidget, selectedWidgetId } = useSlideStore();
    const isSelected = selectedWidgetId === widget.id;

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: widget.id,
        data: { type: widget.type, isSidebarItem: false },
    });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: widget.style.left,
        top: widget.style.top,
        width: widget.style.width,
        height: widget.style.height,
        zIndex: widget.style.zIndex,
        transform: CSS.Translate.toString(transform),
        border: isSelected ? '2px solid #3b82f6' : '1px dashed transparent',
        cursor: 'move',
        backgroundColor: widget.style.backgroundColor,
        color: widget.style.color,
        fontSize: widget.style.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectWidget(widget.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
        >
            {widget.type === 'text' && widget.content}
            {widget.type === 'image' && (
                widget.content ? <img src={widget.content} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">No Image</span>
            )}
            {widget.type === 'shape' && ''}
            {widget.type === 'clock' && <span className="font-mono">12:00 PM</span>}
        </div>
    );
}
