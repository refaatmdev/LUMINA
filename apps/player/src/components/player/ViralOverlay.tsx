import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';

interface ViralOverlayProps {
    orgId: string;
    screenId?: string;
}

export default function ViralOverlay({ orgId, screenId }: ViralOverlayProps) {
    // Construct referral URL
    // Fallback to current URL if screenId is missing (though it should be there)
    const referralUrl = `https://luminapp.io/start?ref_org=${orgId}${screenId ? `&ref_screen=${screenId}` : ''}`;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.8, type: "spring" }}
            className="absolute bottom-6 right-6 z-[9999] pointer-events-auto"
        >
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/20 flex items-center gap-4 max-w-xs">
                <div className="bg-white p-1.5 rounded-lg shadow-inner">
                    <QRCode
                        value={referralUrl}
                        size={64}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-xs font-semibold text-gray-900 leading-tight mb-1">
                        Want a screen like this?
                    </p>
                    <p className="text-[10px] text-gray-600 mb-2">
                        Scan to start for free.
                    </p>
                    <div className="flex items-center gap-1.5 opacity-80">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">L</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-900">Powered by Lumina</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
