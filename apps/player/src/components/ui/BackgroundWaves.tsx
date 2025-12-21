


export default function BackgroundWaves() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#0B0F19]">
      {/* Ambient Base Gradient - removed z-0 to respect stacking context */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19] via-[#0F1221] to-[#0B0F19]" />

      {/* Moving Gradient Orbs - Increased opacity, removed mix-blend-screen to guarantee visibility against dark bg */}
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-600/40 blur-[100px] rounded-full animate-blob-1" />

      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-cyan-500/30 blur-[120px] rounded-full animate-blob-2" />

      <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] bg-fuchsia-600/30 blur-[110px] rounded-full animate-blob-3" />

      {/* Subtle Noise for texture/anti-banding - z-[1] ensures it's on top */}
      <div className="absolute inset-0 opacity-[0.03] z-[1]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
