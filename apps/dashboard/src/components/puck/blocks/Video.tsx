import type { ComponentConfig } from "@measured/puck";
import { VideoUploadField } from "../fields/VideoUploadField";
import { baseOptions, BaseWrapper } from "../baseOptions";

export interface VideoBlockProps {
    source: string;
    objectFit: 'cover' | 'contain';
    autoPlay: boolean;
    loop: boolean;
    muted: boolean;
    showControls: boolean;
    [key: string]: any;
}

// We export a function to create the config so we can pass context like plan limits
export const getVideoBlockConfig = (maxSizeMB: number = 20): ComponentConfig<VideoBlockProps> => ({
    fields: {
        ...(baseOptions as any),
        source: {
            type: "custom",
            label: "Video Source",
            render: ({ value, onChange, field }) => (
                <VideoUploadField
                    value={value}
                    onChange={onChange}
                    label={field.label}
                    maxSizeMB={maxSizeMB}
                />
            ),
        },
        objectFit: {
            type: "select",
            label: "Object Fit",
            options: [
                { label: "Cover", value: "cover" },
                { label: "Contain", value: "contain" },
            ],
        },
        autoPlay: {
            type: "radio",
            label: "Autoplay",
            options: [
                { label: "On", value: true },
                { label: "Off", value: false },
            ],
        },
        loop: {
            type: "radio",
            label: "Loop",
            options: [
                { label: "On", value: true },
                { label: "Off", value: false },
            ],
        },
        muted: {
            type: "radio",
            label: "Muted",
            options: [
                { label: "On", value: true },
                { label: "Off", value: false },
            ],
        },
        showControls: {
            type: "radio",
            label: "Show Controls",
            options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
            ],
        },
    },
    defaultProps: {
        source: "",
        objectFit: "cover",
        autoPlay: true,
        loop: true,
        muted: true,
        showControls: false,
    },
    render: ({ source, objectFit, autoPlay, loop, muted, showControls, ...props }) => {
        return (
            <BaseWrapper {...props} className="w-full h-full min-h-[200px] overflow-hidden bg-black">
                {source ? (
                    <video
                        src={source}
                        className="w-full h-full"
                        style={{ objectFit }}
                        autoPlay={autoPlay}
                        loop={loop}
                        muted={muted}
                        controls={showControls}
                        playsInline
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50 bg-gray-900">
                        <p>No video selected</p>
                    </div>
                )}
            </BaseWrapper>
        );
    }
});
