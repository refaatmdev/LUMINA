import type { ComponentConfig } from "@measured/puck";
import { baseOptions, BaseWrapper } from "../baseOptions";
import { SupabaseImageUpload } from "../fields/SupabaseImageUpload";

export interface SmartCardProps {
    image?: string;
    title: string;
    description: string;
    clickable: boolean;
    link?: string;
    [key: string]: any;
}

export const SmartCard: ComponentConfig<SmartCardProps> = {
    fields: {
        ...(baseOptions as any),
        image: {
            type: "custom",
            label: "Image",
            render: ({ value, onChange, field }) => (
                <SupabaseImageUpload value={value} onChange={onChange} label={field.label} />
            ),
        },
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        clickable: {
            type: "radio",
            label: "Make Clickable",
            options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
            ],
        },
        link: {
            type: "text",
            label: "Link URL",
            // We can't easily condition visibility in standard Puck without custom field wrapper or "resolveFields" (if supported)
            // For now, we just show it.
        },
    },
    defaultProps: {
        title: "Card Title",
        description: "Card description goes here.",
        clickable: false,
        padding: '0px',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    render: ({ image, title, description, clickable, link, ...props }) => {
        const Wrapper = clickable && link ? 'a' : 'div';
        const wrapperProps = clickable && link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {};

        return (
            <BaseWrapper
                {...props}
                className="overflow-hidden flex flex-col h-full transition-transform hover:scale-[1.02]"
            >
                {/* @ts-ignore */}
                <Wrapper {...wrapperProps} className="flex flex-col h-full text-inherit no-underline">
                    {image ? (
                        <div className="w-full aspect-video bg-gray-100">
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full aspect-video bg-gray-200 flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
                        <p className="text-gray-600 text-sm flex-1">{description}</p>

                        {clickable && (
                            <div className="mt-4 text-indigo-600 text-sm font-medium">
                                Learn More →
                            </div>
                        )}
                    </div>
                </Wrapper>
            </BaseWrapper>
        );
    },
};
