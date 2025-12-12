"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Play, Monitor, Globe, BarChart3, Wifi, Layers } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// --- Components ---

const Navbar = () => {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-3">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Lumina</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#components" className="hover:text-white transition-colors">Components</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="http://app.lumina.com/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
            Login
          </Link>
          <Link href="http://app.lumina.com/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Turn Any Screen into a <br />
            <span className="text-indigo-400">Communication Powerhouse</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Control your digital signage from anywhere. Engage your audience with dynamic content, real-time updates, and stunning visuals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="http://app.lumina.com/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link
              href="#"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} className="fill-white" /> Watch Demo
            </Link>
          </div>
        </motion.div>

        {/* 3D Tilted Visual */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 10 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 mx-auto max-w-5xl"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative rounded-xl bg-[#131722] border border-white/10 shadow-2xl overflow-hidden aspect-video transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px -10px rgba(79, 70, 229, 0.3)"
            }}
          >
            {/* Fake UI */}
            <div className="absolute top-0 inset-x-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="absolute inset-0 pt-8 flex">
              <div className="w-64 border-r border-white/5 p-4 space-y-3">
                <div className="h-2 w-24 bg-white/10 rounded" />
                <div className="h-8 w-full bg-indigo-500/20 rounded flex items-center px-3 border border-indigo-500/30">
                  <div className="h-2 w-16 bg-indigo-400/50 rounded" />
                </div>
                <div className="h-8 w-full bg-white/5 rounded" />
                <div className="h-8 w-full bg-white/5 rounded" />
              </div>
              <div className="flex-1 p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 h-32 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-lg border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Summer Sale Live</div>
                  </div>
                </div>
                <div className="h-32 bg-white/5 rounded-lg border border-white/10" />
                <div className="h-32 bg-white/5 rounded-lg border border-white/10" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group"
  >
    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
      <Icon className="text-indigo-400" size={24} />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <br /> captivate your audience</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Built for reliability, designed for engagement. Lumina provides all the tools you need to manage screens at scale.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Monitor}
            title="Remote Management"
            description="Control screens in Tokyo, New York, and London from a single dashboard. Real-time status updates and screenshots."
            delay={0.1}
          />
          <FeatureCard
            icon={Layers}
            title="Drag & Drop Builder"
            description="Create stunning layouts without coding. Use our visual editor to arrange images, videos, and dynamic widgets."
            delay={0.2}
          />
          <FeatureCard
            icon={Globe}
            title="Offline Support"
            description="Never go dark. Content is cached locally on the player, ensuring playback continues even if the internet drops."
            delay={0.3}
          />
          <FeatureCard
            icon={BarChart3}
            title="Smart Analytics"
            description="Know what's playing and when. Track impressions and playback duration to optimize your content strategy."
            delay={0.4}
          />
          <FeatureCard
            icon={Wifi}
            title="Live Data Feeds"
            description="Connect to RSS, Social Media, Weather, and News APIs to keep your content fresh and relevant automatically."
            delay={0.5}
          />
          <FeatureCard
            icon={Check}
            title="Enterprise Security"
            description="Role-based access control, SSO, and audit logs. Built for teams that demand security and compliance."
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ title, price, features, recommended = false, delay }: { title: string, price: string, features: string[], recommended?: boolean, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className={clsx(
      "p-8 rounded-3xl border relative flex flex-col",
      recommended
        ? "bg-indigo-900/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10"
        : "bg-white/5 border-white/10"
    )}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Free' && <span className="text-gray-400">/screen/mo</span>}
      </div>
    </div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feat, i) => (
        <li key={i} className="flex items-center gap-3 text-gray-300">
          <Check size={18} className="text-indigo-400 flex-shrink-0" />
          <span className="text-sm">{feat}</span>
        </li>
      ))}
    </ul>
    <button className={clsx(
      "w-full py-3 rounded-xl font-medium transition-all",
      recommended
        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
        : "bg-white text-black hover:bg-gray-200"
    )}>
      Choose {title}
    </button>
  </motion.div>
);

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
          <p className="text-gray-400 text-lg">Start for free, scale as you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Free"
            price="Free"
            features={["1 Screen", "Basic Layouts", "100MB Storage", "Community Support"]}
            delay={0.1}
          />
          <PricingCard
            title="Pro"
            price="$15"
            recommended
            features={["Unlimited Screens", "Advanced Scheduler", "10GB Storage", "Priority Support", "Analytics", "Live Data Feeds"]}
            delay={0.2}
          />
          <PricingCard
            title="Enterprise"
            price="Custom"
            features={["SSO & SAML", "Unlimited Storage", "Dedicated Account Manager", "SLA", "Custom Integrations", "Audit Logs"]}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/10 bg-[#05080F]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <span className="font-bold text-lg text-white">Lumina</span>
        </div>
        <div className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Lumina. All rights reserved.
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-white overflow-x-hidden selection:bg-indigo-500/30 font-sans">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
