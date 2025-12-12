import { DropZone } from "@measured/puck";
import type { ComponentConfig } from "@measured/puck";
import { baseOptions, BaseWrapper } from "../baseOptions";
import { SupabaseImageUpload } from "../fields/SupabaseImageUpload";

export interface SectionProps {
    backgroundImage?: string;
    overlayOpacity?: number;
    overlayColor?: string;
    [key: string]: any;
}

export const Section: ComponentConfig<SectionProps> = {
    fields: {
        ...(baseOptions as any),
        backgroundImage: {
            type: "custom",
            label: "Background Image",
            render: ({ value, onChange, field }) => (
                <SupabaseImageUpload value={value} onChange={onChange} label={field.label} />
            ),
        },
        overlayColor: {
            type: "custom",
            label: "Overlay Color",
            render: ({ value, onChange, field }) => (
                // Reusing ColorPickerField but maybe with opacity support later
                // For now, simple color picker
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                    />
                </div>
            )
        },
        overlayOpacity: {
            type: "number",
            label: "Overlay Opacity (0-1)",
            min: 0,
            max: 1,
            step: 0.1,
        },
    },
    defaultProps: {
        overlayOpacity: 0.5,
        overlayColor: '#000000',
        padding: '40px',
    },
    render: ({ backgroundImage, overlayOpacity, overlayColor, ...props }) => {
        return (
            <BaseWrapper
                {...props}
                className="relative w-full min-h-[300px] flex flex-col"
            >
                {backgroundImage && (
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                    />
                )}

                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundColor: overlayColor,
                        opacity: overlayOpacity
                    }}
                />

                <div className="relative z-10 w-full h-full flex-1">
                    <DropZone zone="content" />
                </div>
            </BaseWrapper>
        );
    },
};
