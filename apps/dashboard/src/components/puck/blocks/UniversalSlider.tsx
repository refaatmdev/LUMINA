import type { ComponentConfig } from "@measured/puck";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade, EffectCube, EffectCoverflow } from 'swiper/modules';
import { SupabaseImageUpload } from "../fields/SupabaseImageUpload";
import { ColorPickerField } from "../fields/ColorPickerField";
import { baseOptions } from "../baseOptions";

// Import Swiper styles
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-coverflow';

export interface UniversalSliderProps {
    height: '400px' | '600px' | '100vh';
    effect: 'slide' | 'fade' | 'cube' | 'coverflow';
    autoplayDelay: number;
    showDots: boolean;
    slides: {
        backgroundType: 'image' | 'color';
        backgroundImage?: string;
        backgroundColor?: string;
        overlayColor?: string;
        title?: string;
        subtitle?: string;
        alignContent: 'center' | 'left' | 'right' | 'bottom-left';
        textColor?: string;
    }[];
    [key: string]: any;
}

export const UniversalSlider: ComponentConfig<UniversalSliderProps> = {
    fields: {
        ...(baseOptions as any), // Inherit base options like ID, padding, etc.
        height: {
            type: "select",
            label: "Height",
            options: [
                { label: "400px", value: "400px" },
                { label: "600px", value: "600px" },
                { label: "Full Screen", value: "100vh" },
            ],
        },
        effect: {
            type: "select",
            label: "Transition Effect",
            options: [
                { label: "Slide", value: "slide" },
                { label: "Fade", value: "fade" },
                { label: "Cube", value: "cube" },
                { label: "Coverflow", value: "coverflow" },
            ],
        },
        autoplayDelay: {
            type: "number",
            label: "Autoplay Delay (ms)",
        },
        showDots: {
            type: "radio",
            label: "Show Pagination Dots",
            options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
            ],
        },
        slides: {
            type: "array",
            label: "Slides",
            arrayFields: {
                backgroundType: {
                    type: "custom",
                    label: "Background Type",
                    render: ({ value, onChange, field }) => {
                        return (
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${value === 'image' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => onChange('image')}
                                    >
                                        Image
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${value === 'color' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => onChange('color')}
                                    >
                                        Color
                                    </button>
                                </div>
                            </div>
                        );
                    }
                },
                backgroundImage: {
                    type: "custom",
                    label: "Background Image",
                    render: ({ value, onChange, field }) => (
                        <SupabaseImageUpload value={value} onChange={onChange} label={field.label} />
                    ),
                },
                backgroundColor: {
                    type: "custom",
                    label: "Background Color",
                    render: ({ value, onChange, field }) => (
                        <ColorPickerField value={value} onChange={onChange} label={field.label} />
                    ),
                },
                overlayColor: {
                    type: "custom",
                    label: "Overlay Color (e.g. rgba(0,0,0,0.5))",
                    render: ({ value, onChange, field }) => (
                        <ColorPickerField value={value} onChange={onChange} label={field.label} />
                    ),
                },
                title: { type: "text", label: "Title" },
                subtitle: { type: "textarea", label: "Subtitle" },
                alignContent: {
                    type: "select",
                    label: "Content Alignment",
                    options: [
                        { label: "Center", value: "center" },
                        { label: "Left", value: "left" },
                        { label: "Right", value: "right" },
                        { label: "Bottom Left", value: "bottom-left" },
                    ],
                },
                textColor: {
                    type: "custom",
                    label: "Text Color",
                    render: ({ value, onChange, field }) => (
                        <ColorPickerField value={value} onChange={onChange} label={field.label} />
                    ),
                },
            },
            getItemSummary: (item: any) => item.title || "Untitled Slide",
        },
    },
    defaultProps: {
        height: "600px",
        effect: "slide",
        autoplayDelay: 5000,
        showDots: true,
        slides: [
            {
                backgroundType: 'color',
                backgroundColor: '#4f46e5',
                title: 'Welcome to Lumina',
                subtitle: 'The ultimate digital signage solution.',
                alignContent: 'center',
                textColor: '#ffffff',
            },
            {
                backgroundType: 'image',
                backgroundImage: 'https://via.placeholder.com/1920x1080',
                overlayColor: 'rgba(0,0,0,0.4)',
                title: 'Stunning Visuals',
                subtitle: 'Captivate your audience with high-quality images.',
                alignContent: 'left',
                textColor: '#ffffff',
            }
        ],
    },
    render: ({ height, effect, autoplayDelay, showDots, slides }) => {
        return (
            <div className="w-full relative group" style={{ height }}>
                <Swiper
                    modules={[Autoplay, Pagination, Navigation, EffectFade, EffectCube, EffectCoverflow]}
                    effect={effect}
                    spaceBetween={0}
                    slidesPerView={1}
                    autoplay={{
                        delay: autoplayDelay,
                        disableOnInteraction: false,
                    }}
                    pagination={showDots ? { clickable: true } : false}
                    navigation={true}
                    loop={true}
                    className="w-full h-full"
                    fadeEffect={{ crossFade: true }}
                    cubeEffect={{ shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 }}
                    coverflowEffect={{ rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true }}
                >
                    {slides.map((slide, index) => {
                        // Alignment Logic
                        let alignClass = "flex flex-col justify-center items-center text-center"; // Default center
                        if (slide.alignContent === 'left') alignClass = "flex flex-col justify-center items-start text-left pl-20";
                        if (slide.alignContent === 'right') alignClass = "flex flex-col justify-center items-end text-right pr-20";
                        if (slide.alignContent === 'bottom-left') alignClass = "flex flex-col justify-end items-start text-left pb-20 pl-20";

                        return (
                            <SwiperSlide key={index} className="relative w-full h-full overflow-hidden">
                                {/* Background */}
                                {slide.backgroundType === 'image' && slide.backgroundImage && (
                                    <img
                                        src={slide.backgroundImage}
                                        alt={slide.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                {slide.backgroundType === 'color' && (
                                    <div
                                        className="absolute inset-0 w-full h-full"
                                        style={{ backgroundColor: slide.backgroundColor || '#000' }}
                                    />
                                )}

                                {/* Overlay */}
                                {slide.overlayColor && (
                                    <div
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        style={{ backgroundColor: slide.overlayColor }}
                                    />
                                )}

                                {/* Content */}
                                <div className={`absolute inset-0 w-full h-full p-10 z-10 ${alignClass}`}>
                                    <div className="max-w-4xl animate-in slide-in-from-bottom-10 fade-in duration-700 delay-200">
                                        {slide.title && (
                                            <h2
                                                className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg"
                                                style={{ color: slide.textColor || '#fff' }}
                                            >
                                                {slide.title}
                                            </h2>
                                        )}
                                        {slide.subtitle && (
                                            <p
                                                className="text-xl md:text-2xl font-light opacity-90 drop-shadow-md max-w-2xl"
                                                style={{ color: slide.textColor || '#fff' }}
                                            >
                                                {slide.subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        );
    }
};
