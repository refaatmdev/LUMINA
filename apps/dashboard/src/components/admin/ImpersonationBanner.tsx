import { Eye, X } from 'lucide-react';

export default function ImpersonationBanner() {
    const impersonatedOrgId = sessionStorage.getItem('impersonated_org_id');

    if (!impersonatedOrgId) return null;

    const handleExit = () => {
        sessionStorage.removeItem('impersonated_org_id');
        window.location.reload();
    };

    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-[60]">
            <div className="flex items-center gap-2 font-medium">
                <Eye size={18} />
                <span>You are currently impersonating a client organization.</span>
            </div>
            <button
                onClick={handleExit}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
                EXIT MODE
                <X size={16} />
            </button>
        </div>
    );
}
