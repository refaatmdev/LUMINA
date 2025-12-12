import { create } from 'zustand';

export type WidgetType = 'text' | 'image' | 'video' | 'shape' | 'clock';

export interface WidgetStyle {
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    zIndex: number;
    borderRadius?: number;
    animation?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'none';
}

export interface Widget {
    id: string;
    type: WidgetType;
    content: string;
    style: WidgetStyle;
}

interface SlideState {
    widgets: Widget[];
    selectedWidgetId: string | null;

    addWidget: (type: WidgetType, position: { x: number; y: number }) => void;
    updateWidget: (id: string, updates: Partial<Widget> | Partial<WidgetStyle>) => void;
    removeWidget: (id: string) => void;
    selectWidget: (id: string | null) => void;
    setWidgets: (widgets: Widget[]) => void;
}

export const useSlideStore = create<SlideState>((set) => ({
    widgets: [],
    selectedWidgetId: null,

    addWidget: (type, position) => {
        const newWidget: Widget = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? 'New Text' : '',
            style: {
                left: position.x,
                top: position.y,
                width: type === 'text' ? 200 : 100,
                height: type === 'text' ? 50 : 100,
                fontSize: 16,
                color: '#000000',
                backgroundColor: type === 'shape' ? '#3b82f6' : 'transparent',
                zIndex: 1,
                animation: 'none',
            },
        };
        set((state) => ({ widgets: [...state.widgets, newWidget], selectedWidgetId: newWidget.id }));
    },

    updateWidget: (id, updates) => {
        set((state) => ({
            widgets: state.widgets.map((w) => {
                if (w.id !== id) return w;

                // Check if updates are for style or top-level properties
                // This is a bit loose, but works for now. 
                // Ideally we separate updateWidgetStyle and updateWidgetContent.
                const isStyleUpdate = 'left' in updates || 'top' in updates || 'width' in updates || 'height' in updates || 'color' in updates || 'fontSize' in updates || 'backgroundColor' in updates || 'animation' in updates;

                if (isStyleUpdate) {
                    return { ...w, style: { ...w.style, ...updates } };
                }
                return { ...w, ...updates };
            }),
        }));
    },

    removeWidget: (id) => {
        set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== id),
            selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
        }));
    },

    selectWidget: (id) => {
        set({ selectedWidgetId: id });
    },

    setWidgets: (widgets) => {
        set({ widgets });
    },
}));
