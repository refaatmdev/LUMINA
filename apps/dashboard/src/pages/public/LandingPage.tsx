import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    Monitor,
    Zap,
    Smartphone,
    Layout,
    Play,
    ArrowRight,
    Menu,
    X,
    Cpu,
    Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Reusable Components ---

interface NeonButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
    onClick?: () => void;
    to?: string;
}

const NeonButton = ({ children, variant = 'primary', className = '', onClick, to }: NeonButtonProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) onClick();
        if (to) navigate(to);
    };

    const baseStyles = "relative px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden group";

    const variants = {
        primary: "text-white shadow-[0_0_20px_rgba(127,0,255,0.3)] hover:shadow-[0_0_30px_rgba(127,0,255,0.6)] hover:scale-105 border border-transparent",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
    };

    const bgGradient = variant === 'primary'
        ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_auto] animate-gradient"
        : "";

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`${baseStyles} ${variants[variant]} ${bgGradient} ${className}`}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
};

const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 ${className}`}
        >
            {children}
        </motion.section>
    );
};

// --- Main Landing Page Component ---

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Features Data
    const features = [
        {
            title: "Drag & Drop Editor",
            description: "Design beautiful slides in seconds with our intuitive editor.",
            icon: Layout,
            span: "col-span-1 md:col-span-2 lg:col-span-2",
            color: "from-violet-500 to-fuchsia-500",
            visual: (
                <div className="relative h-32 w-full mt-4 bg-gray-900/50 rounded-lg border border-white/5 overflow-hidden group-hover:border-violet-500/30 transition-colors">
                    <div className="absolute top-4 left-4 w-20 h-16 bg-white/10 rounded-md border border-white/10 animate-pulse"></div>
                    <div className="absolute top-10 left-10 w-20 h-16 bg-violet-500/20 rounded-md border border-violet-500/30 backdrop-blur-sm transform rotate-6 group-hover:rotate-12 transition-transform"></div>
                    <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
            )
        },
        {
            title: "Mobile Remote",
            description: "Control everything from your phone.",
            icon: Smartphone,
            span: "col-span-1 md:col-span-1 lg:col-span-1",
            color: "from-cyan-500 to-blue-500",
            visual: (
                <div className="flex justify-center mt-4">
                    <div className="w-16 h-32 border-2 border-white/10 rounded-xl bg-black relative shadow-lg group-hover:border-cyan-500/30 transition-colors">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 border border-white/20 rounded-full"></div>
                        <div className="absolute inset-2 top-4 bottom-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded flex items-center justify-center">
                            <Wifi size={16} className="text-cyan-400 animate-ping" />
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Real-time Sync",
            description: "Updates reflect instantly across all 100+ screens.",
            icon: Zap,
            span: "col-span-1 md:col-span-3 lg:col-span-1",
            color: "from-green-400 to-emerald-500",
            visual: (
                <div className="flex items-center justify-center mt-8 gap-4">
                    <Monitor className="text-gray-600" size={24} />
                    <div className="h-1 flex-1 bg-white/10 rounded relative overflow-hidden">
                        <div className="absolute inset-0 bg-green-500/50 w-full animate-progress origin-left"></div>
                    </div>
                    <Monitor className="text-green-400" size={24} />
                </div>
            )
        },
        {
            title: "AI Scheduling",
            description: "Let AI optimize your content playback for maximum engagement.",
            icon: Cpu,
            span: "col-span-1 md:col-span-3 lg:col-span-2",
            color: "from-amber-400 to-orange-500",
            visual: (
                <div className="mt-4 flex gap-2 overflow-hidden opacity-70">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 w-16 bg-white/5 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2 group-hover:border-amber-500/30 transition-colors">
                            <div className="w-8 h-1 bg-white/10 rounded"></div>
                            <div className="w-6 h-1 bg-white/10 rounded"></div>
                            <div className="w-8 h-1 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            )
        }
    ];

    // Pricing Data
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-violet-500/30 overflow-x-hidden">

            {/* Background Ambient Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] left-[20%] w-[30vw] h-[30vw] bg-fuchsia-900/10 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F19]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0B0F19]/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(127,0,255,0.5)]">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Lumina
                            </span>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</a>
                            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Login
                            </button>
                            <NeonButton variant="primary" to="/register" className="!py-2 !px-4 text-sm">
                                Get Started
                            </NeonButton>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white">
                                {isMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-b border-white/10 bg-[#0B0F19]"
                        >
                            <div className="px-4 py-6 space-y-4">
                                <a className="block text-slate-300 hover:text-white" href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
                                <a className="block text-slate-300 hover:text-white" href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</a>
                                <a className="block text-slate-300 hover:text-white" href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                                    <button onClick={() => navigate('/login')} className="w-full text-left text-slate-300 hover:text-white">Login</button>
                                    <NeonButton to="/register" className="w-full justify-center">Get Started</NeonButton>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <span className="text-xs font-semibold text-cyan-100 tracking-wide uppercase">New: AI-Powered Scheduling</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6 max-w-4xl"
                    >
                        Turn Any Screen into a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
                            Communication Powerhouse
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
                    >
                        Control 100+ screens from your laptop. No specialized hardware required.
                        Setup your entire network in less than 60 seconds.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4 mb-20"
                    >
                        <NeonButton variant="primary" to="/register" className="w-full sm:w-auto min-w-[160px]">
                            Start for Free <ArrowRight size={18} />
                        </NeonButton>
                        <NeonButton variant="secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto min-w-[160px]">
                            See How It Works
                        </NeonButton>
                    </motion.div>

                    {/* 3D Dashboard Visual */}
                    <motion.div
                        initial={{ opacity: 0, rotateX: 20, z: -100 }}
                        animate={{ opacity: 1, rotateX: 10, z: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        className="relative w-full max-w-5xl mx-auto perspective-1000 group"
                    >
                        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0f1420] transform transition-transform duration-700 hover:rotate-x-0 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent pointer-events-none"></div>

                            {/* Browser Header */}
                            <div className="h-8 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                <div className="ml-4 px-3 py-1 rounded bg-black/50 text-[10px] text-gray-500 font-mono w-64">lumina.app/dashboard</div>
                            </div>

                            {/* Dashboard Mockup Content - Using a placeholder layout or image */}
                            <div className="aspect-[16/9] w-full bg-slate-900/50 relative p-6 flex gap-6">
                                {/* Sidebar */}
                                <div className="w-16 md:w-64 h-full bg-black/20 rounded-lg border border-white/5 hidden md:block"></div>

                                {/* Main Content */}
                                <div className="flex-1 h-full flex flex-col gap-6">
                                    {/* Top Bar */}
                                    <div className="h-24 w-full bg-white/5 rounded-lg border border-white/5 flex items-center p-6 justify-between">
                                        <div className="h-8 w-32 bg-white/10 rounded"></div>
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"></div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-32 bg-white/5 rounded-lg border border-white/5 p-4 relative overflow-hidden">
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-50"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Big Chart */}
                                    <div className="flex-1 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden p-6 flex items-end gap-2">
                                        {[40, 65, 50, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                                            <div key={i} className="flex-1 bg-violet-500/20 rounded-t hover:bg-violet-500/40 transition-colors" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"></div>
                        </div>

                        {/* Glow under dashboard */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-violet-600/30 blur-[60px] rounded-full -z-10"></div>
                    </motion.div>
                </div>
            </section>

            {/* Features (Bento Grid) */}
            <Section id="features">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything you need to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scale Your Screens</span></h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Powerful features wrapped in a stunningly simple interface.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(200px,auto)]">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className={`relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden group hover:border-white/20 transition-all ${feature.span}`}
                        >
                            {/* Hover Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="text-white" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                                <div className="mt-auto">
                                    {feature.visual}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* How It Works (Scrollytelling) */}
            <Section id="how-it-works">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Setup in 60 Seconds</h2>
                    <p className="text-slate-400">No IT degree required.</p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-cyan-500 to-transparent opacity-30 md:-translate-x-1/2"></div>

                    {[
                        {
                            title: "Connect",
                            desc: "Open browser on your tailored Screen. Go to lumina.tv and enter pairing code.",
                            icon: Monitor
                        },
                        {
                            title: "Create",
                            desc: "Drag and drop your content in our editor. Use images, videos, or live data.",
                            icon: Layout
                        },
                        {
                            title: "Cast",
                            desc: "Hit publish. Your content streams instantly to any screen, anywhere.",
                            icon: Play
                        }
                    ].map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            className={`relative flex flex-col md:flex-row gap-8 items-start md:items-center mb-24 last:mb-0 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
                        >
                            {/* Step Number/Icon */}
                            <div className="absolute left-0 md:left-1/2 w-10 h-10 rounded-full bg-black border-2 border-violet-500 flex items-center justify-center z-10 md:-translate-x-1/2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                                <step.icon size={20} className="text-violet-400" />
                            </div>

                            {/* Content Side */}
                            <div className="ml-16 md:ml-0 md:flex-1 text-left md:text-right md:pr-16">
                                {idx % 2 === 0 && (
                                    <>
                                        <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                                        <p className="text-slate-400">{step.desc}</p>
                                    </>
                                )}
                            </div>

                            {/* Empty Side for alignment (Desktop only) */}
                            <div className="hidden md:block md:flex-1 md:pl-16">
                                {idx % 2 !== 0 && (
                                    <div className="text-left">
                                        <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                                        <p className="text-slate-400">{step.desc}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* Pricing */}
            <Section id="pricing">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Simple Pricing, No Surprises</h2>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Yearly <span className="text-[10px] ml-1 bg-black/20 px-1 rounded">Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            name: "Starter",
                            price: "Free",
                            desc: "Perfect for testing.",
                            features: ["1 Screen", "Basic Templates", "720p Quality", "Community Support"],
                            cta: "Start Free",
                            popular: false
                        },
                        {
                            name: "Pro",
                            price: billingCycle === 'monthly' ? "$15" : "$12",
                            period: "/screen/mo",
                            desc: "For growing businesses.",
                            features: ["Unlimited Screens", "Premium Templates", "4K Quality", "Priority Support", "Remove Branding", "AI Scheduling"],
                            cta: "Start Trial",
                            popular: true
                        },
                        {
                            name: "Enterprise",
                            price: "Custom",
                            desc: "For large organizations.",
                            features: ["Dedicated Server", "SLA 99.9%", "Custom Integrations", "White Label", "Role Management"],
                            cta: "Contact Sales",
                            popular: false
                        }
                    ].map((plan, idx) => (
                        <div key={idx} className="relative">
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded-full shadow-lg z-20">
                                    MOST POPULAR
                                </div>
                            )}
                            <div className={`h-full relative bg-white/5 backdrop-blur-md border rounded-2xl p-8 flex flex-col ${plan.popular ? 'border-violet-500/50 shadow-[0_0_30px_rgba(127,0,255,0.1)]' : 'border-white/10 hover:border-white/20'} transition-all`}>
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                                </div>
                                <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>

                                <div className="flex-1 space-y-3 mb-8">
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-green-400">
                                                <Check size={12} />
                                            </div>
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                <NeonButton
                                    variant={plan.popular ? 'primary' : 'secondary'}
                                    className="w-full justify-center"
                                    to={plan.cta === "Start Free" || plan.cta === "Start Trial" ? "/register" : "/contact"}
                                >
                                    {plan.cta}
                                </NeonButton>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Footer CTA */}
            <section className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19] via-violet-900/10 to-black z-0"></div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                        Ready to light up <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">your screens?</span>
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 flex-1 transition-all"
                        />
                        <NeonButton variant="primary">
                            Get Started
                        </NeonButton>
                    </div>
                    <p className="mt-6 text-sm text-slate-500">No credit card required. Cancel anytime.</p>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="border-t border-white/5 py-12 bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">L</span>
                        </div>
                        <span className="text-white font-bold">Lumina</span>
                    </div>

                    <div className="flex gap-8 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    </div>

                    <div className="text-xs text-slate-600">
                        © 2024 Lumina Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
