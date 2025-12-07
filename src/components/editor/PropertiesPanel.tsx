
import { useSlideStore } from '../../stores/slideStore';

export default function PropertiesPanel() {
    const { widgets, selectedWidgetId, updateWidget, removeWidget } = useSlideStore();
    const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

    if (!selectedWidget) {
        return (
            <div className="w-64 bg-gray-800/50 backdrop-blur-md border-l border-gray-700 p-4">
                <p className="text-gray-500 text-sm text-center mt-10">Select an item to edit properties</p>
            </div>
        );
    }

    return (
        <div className="w-64 bg-gray-800/50 backdrop-blur-md border-l border-gray-700 p-4 flex flex-col h-full overflow-y-auto text-gray-200">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Properties</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                    <div className="text-sm font-medium text-gray-200 capitalize">{selectedWidget.type}</div>
                </div>

                {selectedWidget.type === 'text' && (
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Content</label>
                        <input
                            type="text"
                            value={selectedWidget.content}
                            onChange={(e) => updateWidget(selectedWidget.id, { content: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                )}

                {selectedWidget.type === 'image' && (
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Image URL</label>
                        <input
                            type="text"
                            value={selectedWidget.content}
                            onChange={(e) => updateWidget(selectedWidget.id, { content: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="https://..."
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">X</label>
                        <input
                            type="number"
                            value={selectedWidget.style.left}
                            onChange={(e) => updateWidget(selectedWidget.id, { left: parseInt(e.target.value) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Y</label>
                        <input
                            type="number"
                            value={selectedWidget.style.top}
                            onChange={(e) => updateWidget(selectedWidget.id, { top: parseInt(e.target.value) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Width</label>
                        <input
                            type="number"
                            value={selectedWidget.style.width}
                            onChange={(e) => updateWidget(selectedWidget.id, { width: parseInt(e.target.value) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Height</label>
                        <input
                            type="number"
                            value={selectedWidget.style.height}
                            onChange={(e) => updateWidget(selectedWidget.id, { height: parseInt(e.target.value) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {selectedWidget.type === 'text' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Font Size</label>
                            <input
                                type="number"
                                value={selectedWidget.style.fontSize}
                                onChange={(e) => updateWidget(selectedWidget.id, { fontSize: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Color</label>
                            <input
                                type="color"
                                value={selectedWidget.style.color}
                                onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                                className="w-full h-8 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-sm"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Background</label>
                    <input
                        type="color"
                        value={selectedWidget.style.backgroundColor}
                        onChange={(e) => updateWidget(selectedWidget.id, { backgroundColor: e.target.value })}
                        className="w-full h-8 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Animation</label>
                    <select
                        value={selectedWidget.style.animation || 'none'}
                        onChange={(e) => updateWidget(selectedWidget.id, { animation: e.target.value as any })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="none">None</option>
                        <option value="fadeIn">Fade In</option>
                        <option value="slideUp">Slide Up</option>
                        <option value="scaleIn">Scale In</option>
                    </select>
                </div>

                <button
                    onClick={() => removeWidget(selectedWidget.id)}
                    className="w-full bg-red-900/30 text-red-400 border border-red-900/50 rounded px-4 py-2 text-sm hover:bg-red-900/50 mt-8 transition-colors"
                >
                    Delete Widget
                </button>
            </div>
        </div>
    );
}

