import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Type, Image, Square, Clock } from 'lucide-react';
import type { WidgetType } from '../../stores/slideStore';

interface SidebarItemProps {
    type: WidgetType;
    label: string;
    icon: React.ReactNode;
}

function SidebarItem({ type, label, icon }: SidebarItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `sidebar-${type}`,
        data: { type, isSidebarItem: true },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex items-center p-3 mb-2 bg-gray-800 rounded shadow-sm cursor-grab hover:bg-gray-700 border border-gray-700 transition-colors"
        >
            <div className="mr-3 text-gray-400">{icon}</div>
            <span className="text-sm font-medium text-gray-200">{label}</span>
        </div>
    );
}

export default function Sidebar() {
    return (
        <div className="w-64 bg-gray-800/50 backdrop-blur-md border-r border-gray-700 p-4 flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Widgets</h2>
            <SidebarItem type="text" label="Text" icon={<Type size={20} />} />
            <SidebarItem type="image" label="Image" icon={<Image size={20} />} />
            <SidebarItem type="shape" label="Shape" icon={<Square size={20} />} />
            <SidebarItem type="clock" label="Clock" icon={<Clock size={20} />} />
        </div>
    );
}
