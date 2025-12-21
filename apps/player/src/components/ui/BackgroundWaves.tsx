

const css = `
@keyframes blob-bounce {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes blob-drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(50px, 50px) rotate(180deg); }
  100% { transform: translate(0, 0) rotate(360deg); }
}
@keyframes blob-pulse {
  0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
  50% { transform: scale(1.2) translate(-30px, 30px); opacity: 0.5; }
  100% { transform: scale(1) translate(0, 0); opacity: 0.8; }
}
.animate-blob-1 { animation: blob-bounce 20s infinite ease-in-out; }
.animate-blob-2 { animation: blob-drift 25s infinite linear; }
.animate-blob-3 { animation: blob-pulse 15s infinite ease-in-out; }
`;

export default function BackgroundWaves() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#0B0F19]">
      <style>{css}</style>

      {/* Ambient Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19] via-[#0F1221] to-[#0B0F19] z-0" />

      {/* Moving Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-violet-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob-1" />

      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-cyan-500/15 blur-[120px] rounded-full mix-blend-screen animate-blob-2" />

      <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] bg-fuchsia-600/15 blur-[110px] rounded-full mix-blend-screen animate-blob-3" />

      {/* Subtle Noise for texture/anti-banding */}
      <div className="absolute inset-0 opacity-[0.03] z-[1]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
