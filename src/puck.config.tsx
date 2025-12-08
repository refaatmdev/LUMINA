import type { Config } from "@measured/puck";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, EffectCube, EffectCoverflow } from 'swiper/modules';
import ViralOverlay from './components/player/ViralOverlay';
import { getStyleFields } from './puck.config.helper';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-coverflow';

type Props = {
    Hero: { title: string; subtitle: string; backgroundImage: string;[key: string]: any };
    SplitScreen: { leftImage: string; rightText: string;[key: string]: any };
    Notice: { type: "info" | "warning" | "success"; text: string;[key: string]: any };
    Video: { videoUrl: string;[key: string]: any };
    Ticker: { text: string; speed: number;[key: string]: any };
    ImageSlider: {
        slides: { imageUrl: string; caption?: string }[];
        effect: 'slide' | 'fade' | 'cube' | 'coverflow';
        autoplaySpeed: number;
        showPagination: boolean;
        [key: string]: any;
    };
    Text: { text: string; fontSize: number; align: 'left' | 'center' | 'right';[key: string]: any };
    Image: { imageUrl: string; alt: string; objectFit: 'cover' | 'contain';[key: string]: any };
    Container: { flexDirection: 'row' | 'column'; gap: number; alignItems: 'start' | 'center' | 'end';[key: string]: any };
};

// Helper to apply styles
const getStyleProps = (props: any) => ({
    backgroundColor: props.backgroundColor,
    color: props.textColor,
    padding: props.padding,
    borderRadius: props.borderRadius,
    // Animation styles would need a wrapper or class application
});

const AnimationWrapper = ({ children, animation, animationDelay, className = "" }: any) => {
    // Simple animation mapping (requires global CSS or Tailwind classes)
    // For now, we'll just pass the class if it exists, or use inline styles for demonstration
    const style: any = {};
    if (animationDelay) style.animationDelay = `${animationDelay}ms`;

    // We assume 'animate-fade-in' etc. exist in global CSS or we use inline styles
    // Let's use a data attribute for the Player to pick up, or simple classes
    return (
        <div
            className={`${className} ${animation !== 'none' ? `animate-${animation}` : ''}`}
            style={style}
            data-animation={animation}
        >
            {children}
        </div>
    );
};

export const getEditorConfig = (planTier: string = 'free', orientation: 'landscape' | 'portrait' = 'landscape'): Config<Props> => {
    const styleFields = getStyleFields(planTier);

    return {
        components: {
            Hero: {
                fields: {
                    title: { type: "text" },
                    subtitle: { type: "text" },
                    backgroundImage: { type: "text" },
                    ...styleFields,
                },
                defaultProps: {
                    title: "Welcome to Lumina",
                    subtitle: "Digital Signage Solutions",
                    backgroundImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=80",
                    animation: "fade-in",
                },
                render: ({ title, subtitle, backgroundImage, ...props }) => (
                    <AnimationWrapper {...props} className="relative w-full h-[600px] flex flex-col items-center justify-center text-center text-white bg-cover bg-center">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                zIndex: 0
                            }}
                        />
                        <div className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />
                        <div className="relative z-10 p-8" style={getStyleProps(props)}>
                            <h1 className="text-6xl font-bold mb-4">{title}</h1>
                            <p className="text-2xl">{subtitle}</p>
                        </div>
                    </AnimationWrapper>
                ),
            },
            SplitScreen: {
                fields: {
                    leftImage: { type: "text" },
                    rightText: { type: "textarea" },
                    ...styleFields,
                },
                defaultProps: {
                    leftImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
                    rightText: "Insert your text here...",
                },
                render: ({ leftImage, rightText, ...props }) => (
                    <AnimationWrapper {...props} className="flex w-full h-[500px]">
                        <div
                            className="w-1/2 h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${leftImage})` }}
                        />
                        <div
                            className="w-1/2 h-full flex items-center justify-center bg-white p-12"
                            style={getStyleProps(props)}
                        >
                            <p className="text-3xl text-gray-800 font-medium leading-relaxed">{rightText}</p>
                        </div>
                    </AnimationWrapper>
                ),
            },
            Notice: {
                fields: {
                    type: {
                        type: "select",
                        options: [
                            { label: "Info (Blue)", value: "info" },
                            { label: "Warning (Red)", value: "warning" },
                            { label: "Success (Green)", value: "success" },
                        ],
                    },
                    text: { type: "text" },
                    ...styleFields,
                },
                defaultProps: {
                    type: "info",
                    text: "Important Announcement",
                },
                render: ({ type, text, ...props }) => {
                    const colors = {
                        info: "bg-blue-600",
                        warning: "bg-red-600",
                        success: "bg-green-600",
                    };
                    return (
                        <AnimationWrapper {...props} className={`${colors[type]} w-full p-8 flex items-center justify-center text-white shadow-lg`} style={getStyleProps(props)}>
                            <span className="text-4xl font-bold uppercase tracking-wider">{text}</span>
                        </AnimationWrapper>
                    );
                },
            },
            Video: {
                fields: {
                    videoUrl: { type: "text" },
                    ...styleFields,
                },
                defaultProps: {
                    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                },
                render: ({ videoUrl, ...props }) => (
                    <AnimationWrapper {...props} className="w-full h-full min-h-[400px] bg-black">
                        <video
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={getStyleProps(props)}
                        />
                    </AnimationWrapper>
                ),
            },
            Ticker: {
                fields: {
                    text: { type: "text" },
                    speed: { type: "number" },
                    ...styleFields,
                },
                defaultProps: {
                    text: "Breaking News: Lumina Digital Signage is now live! Update your screens instantly.",
                    speed: 10,
                },
                render: ({ text, speed, ...props }) => (
                    <AnimationWrapper {...props} className="w-full bg-black text-yellow-400 py-4 overflow-hidden whitespace-nowrap border-t-4 border-yellow-500" style={getStyleProps(props)}>
                        <div
                            className="inline-block animate-marquee"
                            style={{ animationDuration: `${200 / speed}s` }}
                        >
                            <span className="text-3xl font-mono font-bold mx-4">{text}</span>
                            <span className="text-3xl font-mono font-bold mx-4">{text}</span>
                            <span className="text-3xl font-mono font-bold mx-4">{text}</span>
                            <span className="text-3xl font-mono font-bold mx-4">{text}</span>
                        </div>
                        <style>{`
                @keyframes marquee {
                  0% { transform: translate3d(0, 0, 0); }
                  100% { transform: translate3d(-50%, 0, 0); }
                }
                .animate-marquee {
                  animation: marquee linear infinite;
                }
              `}</style>
                    </AnimationWrapper>
                ),
            },
            ImageSlider: {
                fields: {
                    slides: {
                        type: "array",
                        arrayFields: {
                            imageUrl: { type: "text" },
                            caption: { type: "text" },
                        },
                    },
                    effect: {
                        type: "select",
                        options: [
                            { label: "Slide", value: "slide" },
                            { label: "Fade", value: "fade" },
                            { label: "Cube", value: "cube" },
                            { label: "Coverflow", value: "coverflow" },
                        ],
                    },
                    autoplaySpeed: { type: "number" },
                    showPagination: { type: "select", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
                    ...styleFields,
                },
                defaultProps: {
                    slides: [
                        { imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80", caption: "Beautiful Landscape" },
                        { imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1600&q=80", caption: "Serene Nature" },
                        { imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80", caption: "Misty Mountains" },
                    ],
                    effect: "fade",
                    autoplaySpeed: 3000,
                    showPagination: true,
                },
                render: ({ slides, effect, autoplaySpeed, showPagination, ...props }) => (
                    <AnimationWrapper {...props} className="w-full h-[600px] bg-black">
                        <Swiper
                            modules={[Autoplay, EffectFade, Pagination, EffectCube, EffectCoverflow]}
                            effect={effect}
                            spaceBetween={0}
                            slidesPerView={1}
                            autoplay={{
                                delay: autoplaySpeed,
                                disableOnInteraction: false,
                            }}
                            pagination={showPagination ? { clickable: true } : false}
                            loop={true}
                            className="w-full h-full"
                            style={getStyleProps(props)}
                        >
                            {slides.map((slide, index) => (
                                <SwiperSlide key={index}>
                                    <div className="relative w-full h-full">
                                        <img
                                            src={slide.imageUrl}
                                            alt={slide.caption || `Slide ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {slide.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 text-center backdrop-blur-sm">
                                                <p className="text-xl font-medium">{slide.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </AnimationWrapper>
                ),
            },
            Text: {
                fields: {
                    text: { type: "textarea" },
                    fontSize: { type: "number" },
                    align: {
                        type: "radio",
                        options: [
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
                        ]
                    },
                    ...styleFields,
                },
                defaultProps: {
                    text: "Enter text here",
                    fontSize: 24,
                    align: "left",
                },
                render: ({ text, fontSize, align, ...props }) => (
                    <AnimationWrapper {...props} className="w-full p-4" style={{ ...getStyleProps(props), textAlign: align }}>
                        <p style={{ fontSize: `${fontSize}px` }}>{text}</p>
                    </AnimationWrapper>
                )
            },
            Image: {
                fields: {
                    imageUrl: { type: "text" },
                    alt: { type: "text" },
                    objectFit: {
                        type: "select",
                        options: [
                            { label: "Cover", value: "cover" },
                            { label: "Contain", value: "contain" },
                        ]
                    },
                    ...styleFields,
                },
                defaultProps: {
                    imageUrl: "https://via.placeholder.com/600x400",
                    alt: "Image",
                    objectFit: "cover",
                },
                render: ({ imageUrl, alt, objectFit, ...props }) => (
                    <AnimationWrapper {...props} className="w-full h-full min-h-[200px]" style={getStyleProps(props)}>
                        <img
                            src={imageUrl}
                            alt={alt}
                            className="w-full h-full"
                            style={{ objectFit }}
                        />
                    </AnimationWrapper>
                )
            },
            Container: {
                fields: {
                    flexDirection: {
                        type: "radio",
                        options: [
                            { label: "Row", value: "row" },
                            { label: "Column", value: "column" },
                        ]
                    },
                    gap: { type: "number" },
                    alignItems: {
                        type: "select",
                        options: [
                            { label: "Start", value: "start" },
                            { label: "Center", value: "center" },
                            { label: "End", value: "end" },
                        ]
                    },
                    ...styleFields,
                },
                defaultProps: {
                    flexDirection: "column",
                    gap: 16,
                    alignItems: "start",
                },
                render: ({ flexDirection, gap, alignItems, children, ...props }) => (
                    <AnimationWrapper {...props} className="w-full p-4 flex" style={{
                        ...getStyleProps(props),
                        flexDirection,
                        gap: `${gap}px`,
                        alignItems
                    }}>
                        {children}
                    </AnimationWrapper>
                )
            }
        },
        root: {
            fields: {
                title: { type: "text" },
                institutionLogo: { type: "text" },
                showTicker: {
                    type: "select",
                    options: [
                        { label: "Show", value: true },
                        { label: "Hide", value: false }
                    ]
                },
                tickerText: { type: "text" },
                tickerBackground: { type: "text" },
                overlayTheme: {
                    type: "select",
                    options: [
                        { label: "None", value: "none" },
                        { label: "Dark Gradient", value: "dark-gradient" },
                        { label: "Holiday Frame", value: "holiday-frame" },
                    ]
                },
                showWatermark: {
                    type: "radio",
                    options: [
                        { label: "Show", value: true },
                        { label: "Hide", value: false }
                    ]
                }
            },
            defaultProps: {
                title: "Untitled Slide",
                showTicker: false,
                tickerText: "Welcome to Lumina Digital Signage",
                tickerBackground: "#000000",
                overlayTheme: "none",
                showWatermark: true,
            },
            render: ({ children, institutionLogo, showTicker, tickerText, tickerBackground, overlayTheme, ...props }) => (
                <div
                    id="puck-root-canvas"
                    className="mx-auto shadow-2xl bg-white overflow-hidden relative"
                    style={{
                        aspectRatio: orientation === 'portrait' ? "9/16" : "16/9",
                        width: "100%",
                    }}
                >
                    {children}

                    {institutionLogo && (
                        <img
                            src={institutionLogo}
                            className="absolute top-8 right-8 w-24 h-auto z-50 object-contain drop-shadow-lg"
                            alt="Logo"
                        />
                    )}

                    {showTicker && (
                        <div
                            className="absolute bottom-0 left-0 right-0 z-50 py-3 overflow-hidden whitespace-nowrap"
                            style={{ backgroundColor: tickerBackground || '#000000' }}
                        >
                            <div
                                className="inline-block animate-marquee text-white text-xl font-bold"
                                style={{ animationDuration: '20s' }}
                            >
                                <span className="mx-8">{tickerText}</span>
                                <span className="mx-8">{tickerText}</span>
                                <span className="mx-8">{tickerText}</span>
                                <span className="mx-8">{tickerText}</span>
                            </div>
                            <style>{`
                                @keyframes marquee {
                                    0% { transform: translate3d(0, 0, 0); }
                                    100% { transform: translate3d(-50%, 0, 0); }
                                }
                                .animate-marquee {
                                    animation: marquee linear infinite;
                                }
                            `}</style>
                        </div>
                    )}

                    {overlayTheme === 'dark-gradient' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-40" />
                    )}
                    {overlayTheme === 'holiday-frame' && (
                        <div className="absolute inset-0 border-[20px] border-red-600 pointer-events-none z-40 opacity-80" />
                    )}

                    {/* @ts-ignore */}
                    {['free', 'basic'].includes(props.planTier) && props.orgId && (
                        <ViralOverlay orgId={props.orgId} screenId={props.screenId} />
                    )}

                    {/* @ts-ignore */}
                    {(props.showWatermark !== false && !['free', 'basic', 'custom'].includes(props.planTier)) && (
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

// Default export for backward compatibility if needed, but we should switch to using the function
export const config = getEditorConfig('free');
export default config;
