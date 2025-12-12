import type { ComponentConfig } from "@measured/puck";
import { baseOptions, BaseWrapper } from "../baseOptions";
import { supabase } from '../../../lib/supabase';

export interface DynamicFeedProps {
    source: 'announcements' | 'menu';
    items: any[];
    [key: string]: any;
}

export const DynamicFeed: ComponentConfig<DynamicFeedProps> = {
    fields: {
        ...(baseOptions as any),
        source: {
            type: "select",
            label: "Data Source",
            options: [
                { label: "System Announcements", value: "announcements" },
                { label: "Cafeteria Menu (Mock)", value: "menu" },
            ],
        },
    },
    defaultProps: {
        source: 'announcements',
        items: [],
        padding: '20px',
        backgroundColor: '#ffffff',
    },
    resolveData: async ({ props }) => {
        if (props.source === 'announcements') {
            const { data } = await supabase
                .from('system_announcements')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(5);

            return {
                ...props,
                items: data || [],
            } as any;
        }

        if (props.source === 'menu') {
            // Mock data for menu
            return {
                ...props,
                items: [
                    { id: 1, title: "Grilled Salmon", description: "Fresh salmon with asparagus", price: "$12.99" },
                    { id: 2, title: "Caesar Salad", description: "Romaine lettuce, croutons, parmesan", price: "$8.99" },
                    { id: 3, title: "Vegetable Stir Fry", description: "Mixed vegetables with tofu", price: "$10.99" },
                ],
            } as any;
        }

        return props as any;
    },
    render: ({ source, items, ...props }) => {
        return (
            <BaseWrapper
                {...props}
                className="w-full"
            >
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">
                        {source === 'announcements' ? 'Latest Announcements' : 'Today\'s Menu'}
                    </h3>

                    {items.length === 0 ? (
                        <p className="text-gray-500 italic">No items found.</p>
                    ) : (
                        <div className="grid gap-4">
                            {((items as unknown as any[]) || []).map((item: any) => (
                                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{item.title || item.message}</h4>
                                        {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                                        {item.type && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mt-1 inline-block">{item.type}</span>}
                                    </div>
                                    {item.price && (
                                        <span className="font-bold text-indigo-600">{item.price}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </BaseWrapper>
        );
    },
};
