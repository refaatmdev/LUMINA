import type { Config } from "@measured/puck";
import Marquee from "react-fast-marquee";
import { ColorPickerField } from "./components/puck/fields/ColorPickerField";
import { Section } from "./components/puck/blocks/Section";
import { Grid } from "./components/puck/blocks/Grid";
import { FlexContainer } from "./components/puck/blocks/FlexContainer";
import { SmartCard } from "./components/puck/blocks/SmartCard";
import { DynamicFeed } from "./components/puck/blocks/DynamicFeed";
import { UniversalSlider } from "./components/puck/blocks/UniversalSlider";
import { getVideoBlockConfig } from "./components/puck/blocks/Video";
import { baseOptions, BaseWrapper } from "./components/puck/baseOptions";
import { SupabaseImageUpload } from "./components/puck/fields/SupabaseImageUpload";

// Keep existing components for backward compatibility but maybe hide them or categorize them
// For this "Ultimate" version, we'll redefine some using the new system or keep them as "Legacy"

type Props = {
    Section: any;
    Grid: any;
    FlexContainer: any;
    SmartCard: any;
    DynamicFeed: any;
    UniversalSlider: any;
    Ticker: any;
    Video: any;
    Text: { text: string; fontSize: number; align: 'left' | 'center' | 'right';[key: string]: any };
    Image: { imageUrl: string; alt: string; objectFit: 'cover' | 'contain';[key: string]: any };
    Button: { label: string; link: string; variant: 'primary' | 'secondary';[key: string]: any };
};

export const getEditorConfig = (planTier: string = 'free', orientation: 'landscape' | 'portrait' = 'landscape'): Config<Props> => {
    // Determine video limit based on plan
    const videoLimitMB = ['pro', 'enterprise'].includes(planTier) ? 500 : 20;

    return {
        categories: {
            layout: {
                components: ["Section", "Grid", "FlexContainer"],
                title: "Layout Structure"
            },
            content: {
                components: ["Text", "Image", "Video", "SmartCard", "UniversalSlider", "Ticker", "Button"],
                title: "Content Blocks"
            },
            dynamic: {
                components: ["DynamicFeed"],
                title: "Dynamic Data"
            }
        },
        components: {
            Section,
            Grid,
            FlexContainer,
            SmartCard,
            DynamicFeed,
            UniversalSlider,
            Video: getVideoBlockConfig(videoLimitMB),
            Ticker: {
                fields: {
                    ...(baseOptions as any),
                    text: { type: "textarea", label: "Ticker Text" },
                    backgroundColor: {
                        type: "custom",
                        label: "Background Color",
                        render: ({ value, onChange, field }: any) => (
                            <ColorPickerField value={value} onChange={onChange} label={field.label} />
                        ),
                    },
                    textColor: {
                        type: "custom",
                        label: "Text Color",
                        render: ({ value, onChange, field }: any) => (
                            <ColorPickerField value={value} onChange={onChange} label={field.label} />
                        ),
                    },
                    speed: { type: "number", label: "Speed (default 50)" },
                    direction: {
                        type: "radio",
                        label: "Direction",
                        options: [
                            { label: "Left", value: "left" },
                            { label: "Right", value: "right" },
                        ],
                    },
                    padding: {
                        type: "select",
                        label: "Padding",
                        options: [
                            { label: "None", value: "0px" },
                            { label: "Small", value: "8px" },
                            { label: "Medium", value: "16px" },
                        ],
                    },
                },
                defaultProps: {
                    text: "Breaking News: This is a draggable ticker block...",
                    backgroundColor: "#000000",
                    textColor: "#ffffff",
                    speed: 50,
                    direction: "left",
                    padding: "8px",
                },
                render: ({ text, backgroundColor, textColor, speed, direction, padding, ...props }) => (
                    <BaseWrapper {...props} className="w-full overflow-hidden">
                        <div style={{ backgroundColor, color: textColor, padding }}>
                            <Marquee
                                speed={speed || 50}
                                direction={direction || 'left'}
                                gradient={false}
                                className="font-medium"
                            >
                                <span className="mx-4">{text}</span>
                            </Marquee>
                        </div>
                    </BaseWrapper>
                )
            },
            Text: {
                fields: {
                    ...(baseOptions as any),
                    text: { type: "textarea", label: "Content" },
                    fontSize: { type: "number", label: "Font Size (px)" },
                    align: {
                        type: "radio",
                        options: [
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
                        ]
                    },
                },
                defaultProps: {
                    text: "Enter text here",
                    fontSize: 24,
                    align: "left",
                    padding: "10px",
                },
                render: ({ text, fontSize, align, ...props }) => (
                    <BaseWrapper {...props} style={{ textAlign: align }}>
                        <p style={{ fontSize: `${fontSize}px` }}>{text}</p>
                    </BaseWrapper>
                )
            },
            Image: {
                fields: {
                    ...(baseOptions as any),
                    imageUrl: {
                        type: "custom",
                        label: "Image",
                        render: ({ value, onChange, field }: any) => (
                            <SupabaseImageUpload value={value} onChange={onChange} label={field.label} />
                        ),
                    },
                    alt: { type: "text", label: "Alt Text" },
                    objectFit: {
                        type: "select",
                        options: [
                            { label: "Cover", value: "cover" },
                            { label: "Contain", value: "contain" },
                        ]
                    },
                },
                defaultProps: {
                    imageUrl: "https://via.placeholder.com/600x400",
                    alt: "Image",
                    objectFit: "cover",
                },
                render: ({ imageUrl, alt, objectFit, ...props }) => (
                    <BaseWrapper {...props} className="w-full h-full min-h-[200px]">
                        <img
                            src={imageUrl}
                            alt={alt}
                            className="w-full h-full"
                            style={{ objectFit }}
                        />
                    </BaseWrapper>
                )
            },
            Button: {
                fields: {
                    ...(baseOptions as any),
                    label: { type: "text", label: "Label" },
                    link: { type: "text", label: "Link URL" },
                    variant: {
                        type: "radio",
                        options: [
                            { label: "Primary", value: "primary" },
                            { label: "Secondary", value: "secondary" },
                        ]
                    }
                },
                defaultProps: {
                    label: "Click Me",
                    link: "#",
                    variant: "primary",
                    padding: "10px 20px",
                },
                render: ({ label, link, variant, ...props }) => {
                    const baseClass = "inline-block rounded font-medium transition-colors";
                    const variantClass = variant === 'primary'
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300";

                    return (
                        <BaseWrapper {...props}>
                            <a href={link} className={`${baseClass} ${variantClass} px-6 py-2`}>
                                {label}
                            </a>
                        </BaseWrapper>
                    );
                }
            }
        },
        root: {
            fields: {
                title: { type: "text", label: "Slide Title" },
                backgroundColor: { type: "text", label: "Page Background" }, // Could use ColorPicker
                showGlobalTicker: {
                    type: "radio",
                    label: "Show Global News Ticker",
                    options: [
                        { label: "On", value: true },
                        { label: "Off", value: false },
                    ],
                },
                globalTickerText: { type: "textarea", label: "Global Ticker Text" },
                globalTickerBg: {
                    type: "custom",
                    label: "Global Ticker Background",
                    render: ({ value, onChange, field }: any) => (
                        <ColorPickerField value={value} onChange={onChange} label={field.label} />
                    ),
                },
                globalTickerColor: {
                    type: "custom",
                    label: "Global Ticker Text Color",
                    render: ({ value, onChange, field }: any) => (
                        <ColorPickerField value={value} onChange={onChange} label={field.label} />
                    ),
                },
                globalTickerPosition: {
                    type: "radio",
                    label: "Position",
                    options: [
                        { label: "Bottom", value: "bottom" },
                        { label: "Top", value: "top" },
                    ],
                },
                tickerSpeed: { type: "number", label: "Speed (default 50)" },
                tickerDirection: {
                    type: "radio",
                    label: "Direction",
                    options: [
                        { label: "Left", value: "left" },
                        { label: "Right", value: "right" },
                    ],
                },
            },
            defaultProps: {
                title: "Untitled Slide",
                backgroundColor: "#ffffff",
                showGlobalTicker: false,
                globalTickerText: "Breaking News: Welcome to Lumina Digital Signage...",
                globalTickerBg: "#cc0000",
                globalTickerColor: "#ffffff",
                globalTickerPosition: "bottom",
                tickerSpeed: 50,
                tickerDirection: "left",
            },
            render: ({ children, backgroundColor, showGlobalTicker, globalTickerText, globalTickerBg, globalTickerColor, globalTickerPosition, tickerSpeed, tickerDirection }) => (
                <div
                    id="puck-root-canvas"
                    className="mx-auto shadow-2xl overflow-hidden relative"
                    style={{
                        aspectRatio: orientation === 'portrait' ? "9/16" : "16/9",
                        width: "100%",
                        backgroundColor: backgroundColor || "#ffffff",
                    }}
                >
                    {children}

                    {/* Global News Ticker */}
                    {showGlobalTicker && (
                        <div
                            className={`absolute left-0 w-full z-50 flex ${globalTickerPosition === 'top' ? 'top-0' : 'bottom-0'}`}
                            style={{ backgroundColor: globalTickerBg || '#cc0000', color: globalTickerColor || '#ffffff' }}
                        >
                            <div className="flex-shrink-0 px-4 py-2 bg-black/20 font-bold uppercase tracking-wider flex items-center z-10">
                                NEWS
                            </div>
                            <Marquee
                                speed={tickerSpeed || 50}
                                direction={tickerDirection || 'left'}
                                gradient={false}
                                className="py-2 font-bold uppercase"
                            >
                                <span className="mx-4 text-lg md:text-xl">{globalTickerText || "Breaking News: Welcome to Lumina Digital Signage..."}</span>
                            </Marquee>
                        </div>
                    )}

                    {/* Watermark Logic */}
                    {/* @ts-ignore */}
                    {(!['free', 'basic', 'custom'].includes(planTier)) && (
                        <div className="absolute bottom-4 right-4 z-[9999] pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">L</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900">Powered by Lumina</span>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
    };
};

export const config = getEditorConfig('free');
export default config;
