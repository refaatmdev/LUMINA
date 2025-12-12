import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden selection:bg-violet-500/30">

      {/* Background Gradients */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}

// Components defined in same file for single-file requirement compliance, 
// usually these would be separate files.

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-lg" />
          <span className="text-xl font-bold font-heading tracking-tight">Lumina</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <button className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
          Get Started
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-violet-300 mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          v2.0 is now live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent max-w-4xl mx-auto">
          Turn Any Screen into a <br />
          <span className="text-glow bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Communication Powerhouse</span>
        </h1>

        <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
          Manage thousands of screens remotely with enterprise-grade reliability.
          Push content in real-time, schedule campaigns, and analyze performance from one dashboard.
        </p>

        <div className="flex items-center justify-center gap-4 mb-20">
          <button className="px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full font-semibold text-white hover:opacity-90 transition-opacity shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]">
            Start Free Trial
          </button>
          <button className="px-8 py-4 border border-white/10 rounded-full font-semibold text-white hover:bg-white/5 transition-colors">
            Book Demo
          </button>
        </div>

        {/* 3D Tilted Visual */}
        <div className="relative max-w-5xl mx-auto perspective-1000 group">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-600/20 to-transparent blur-3xl -z-10 group-hover:blur-[100px] transition-all duration-700" />
          <div className="relative transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0B0F19]">
            <img
              src="https://placehold.co/1200x800/1e1e2e/FFF?text=Lumina+Dashboard+Preview"
              alt="Dashboard Interface"
              className="w-full h-auto opacity-90"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { title: "Remote Management", desc: "Control screens anywhere in the world instantly.", col: "col-span-12 md:col-span-8" },
    { title: "Real-time Analytics", desc: "Track engagement and playback status.", col: "col-span-12 md:col-span-4" },
    { title: "4K Support", desc: "Crystal clear native 4K rendering engine.", col: "col-span-12 md:col-span-4" },
    { title: "Smart Scheduling", desc: "Automate content based on time, weather, or triggers.", col: "col-span-12 md:col-span-8" },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Built for Scale</h2>
        <div className="grid grid-cols-12 gap-6">
          {features.map((f, i) => (
            <div key={i} className={`${f.col} glass-card p-8 rounded-3xl hover:bg-white/10 transition-colors group`}>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-violet-300 transition-colors">{f.title}</h3>
              <p className="text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Starter", price: "$0", feats: ["1 Screen", "720p Output", "Community Support"] },
            { name: "Pro", price: "$29", feats: ["10 Screens", "4K Output", "Analytics", "Priority Support"], highlight: true },
            { name: "Enterprise", price: "Custom", feats: ["Unlimited", "SLA", "Dedicated Manager", "white-label"] },
          ].map((plan, i) => (
            <div key={i} className={`p-8 rounded-3xl border flex flex-col ${plan.highlight ? 'bg-white/5 border-violet-500/50 shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]' : 'bg-transparent border-white/10'}`}>
              <h3 className="text-xl font-medium text-white/70 mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-lg text-white/30 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.feats.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-white/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.highlight ? 'bg-white text-black hover:bg-gray-200' : 'border border-white/20 hover:bg-white/5'}`}>
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 text-center text-white/30 text-sm">
      <p>&copy; 2025 Lumina Inc. All rights reserved.</p>
    </footer>
  );
}
