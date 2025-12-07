
import { useDroppable } from '@dnd-kit/core';
import { useSlideStore } from '../../stores/slideStore';
import DraggableWidget from './DraggableWidget';

export default function Canvas() {
    const { setNodeRef } = useDroppable({
        id: 'canvas',
    });
    const { widgets, selectWidget } = useSlideStore();

    return (
        <div
            className="flex-1 bg-gray-900 flex items-center justify-center overflow-hidden p-8"
            onClick={() => selectWidget(null)}
        >
            <div
                ref={setNodeRef}
                className="bg-white shadow-2xl relative overflow-hidden"
                style={{
                    width: '960px', // 16:9 aspect ratio base
                    height: '540px',
                    transform: 'scale(1)', // Could implement zoom later
                }}
            >
                {widgets.map((widget) => (
                    <DraggableWidget key={widget.id} widget={widget} />
                ))}
            </div>
        </div>
    );
}
