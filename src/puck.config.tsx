import type { Config } from "@measured/puck";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, EffectCube, EffectCoverflow } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-coverflow';

type Props = {
    Hero: { title: string; subtitle: string; backgroundImage: string };
    SplitScreen: { leftImage: string; rightText: string };
    Notice: { type: "info" | "warning" | "success"; text: string };
    Video: { videoUrl: string };
    Ticker: { text: string; speed: number };
    ImageSlider: {
        slides: { imageUrl: string; caption?: string }[];
        effect: 'slide' | 'fade' | 'cube' | 'coverflow';
        autoplaySpeed: number;
        showPagination: boolean;
    };
};

export const config: Config<Props> = {
    components: {
        Hero: {
            fields: {
                title: { type: "text" },
                subtitle: { type: "text" },
                backgroundImage: { type: "text" },
            },
            defaultProps: {
                title: "Welcome to Lumina",
                subtitle: "Digital Signage Solutions",
                backgroundImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=80",
            },
            render: ({ title, subtitle, backgroundImage }) => (
                <div
                    className="relative w-full h-[600px] flex flex-col items-center justify-center text-center text-white bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 p-8">
                        <h1 className="text-6xl font-bold mb-4">{title}</h1>
                        <p className="text-2xl">{subtitle}</p>
                    </div>
                </div>
            ),
        },
        SplitScreen: {
            fields: {
                leftImage: { type: "text" },
                rightText: { type: "textarea" },
            },
            defaultProps: {
                leftImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
                rightText: "Insert your text here...",
            },
            render: ({ leftImage, rightText }) => (
                <div className="flex w-full h-[500px]">
                    <div
                        className="w-1/2 h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${leftImage})` }}
                    />
                    <div className="w-1/2 h-full flex items-center justify-center bg-white p-12">
                        <p className="text-3xl text-gray-800 font-medium leading-relaxed">{rightText}</p>
                    </div>
                </div>
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
            },
            defaultProps: {
                type: "info",
                text: "Important Announcement",
            },
            render: ({ type, text }) => {
                const colors = {
                    info: "bg-blue-600",
                    warning: "bg-red-600",
                    success: "bg-green-600",
                };
                return (
                    <div className={`${colors[type]} w-full p-8 flex items-center justify-center text-white shadow-lg`}>
                        <span className="text-4xl font-bold uppercase tracking-wider">{text}</span>
                    </div>
                );
            },
        },
        Video: {
            fields: {
                videoUrl: { type: "text" },
            },
            defaultProps: {
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            },
            render: ({ videoUrl }) => (
                <div className="w-full h-full min-h-[400px] bg-black">
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            ),
        },
        Ticker: {
            fields: {
                text: { type: "text" },
                speed: { type: "number" },
            },
            defaultProps: {
                text: "Breaking News: Lumina Digital Signage is now live! Update your screens instantly.",
                speed: 10,
            },
            render: ({ text, speed }) => (
                <div className="w-full bg-black text-yellow-400 py-4 overflow-hidden whitespace-nowrap border-t-4 border-yellow-500">
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
                </div>
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
                showPagination: { type: "select", options: [{ label: "Yes", value: true }, { label: "No", value: false }] }, // Puck boolean field support varies, select is safer or custom
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
            render: ({ slides, effect, autoplaySpeed, showPagination }) => (
                <div className="w-full h-[600px] bg-black">
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
                </div>
            ),
        },
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
            }
        },
        defaultProps: {
            title: "Untitled Slide",
            showTicker: false,
            tickerText: "Welcome to Lumina Digital Signage",
            tickerBackground: "#000000",
            overlayTheme: "none",
        },
        render: ({ children, institutionLogo, showTicker, tickerText, tickerBackground, overlayTheme }) => (
            <div
                id="puck-root-canvas"
                className="mx-auto shadow-2xl bg-white overflow-hidden relative"
                style={{
                    aspectRatio: "16/11",
                    width: "100%",
                }}
            >
                {/* Main Content */}
                {children}

                {/* Overlays */}

                {/* Logo */}
                {institutionLogo && (
                    <img
                        src={institutionLogo}
                        className="absolute top-8 right-8 w-24 h-auto z-50 object-contain drop-shadow-lg"
                        alt="Logo"
                    />
                )}

                {/* Ticker */}
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
                        {/* Ensure animation style is available if not already globally defined */}
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

                {/* Theme Overlay */}
                {overlayTheme === 'dark-gradient' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-40" />
                )}
                {overlayTheme === 'holiday-frame' && (
                    <div className="absolute inset-0 border-[20px] border-red-600 pointer-events-none z-40 opacity-80" />
                )}
            </div>
        ),
    },
};

export default config;
