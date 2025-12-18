
import { useUserRole } from '../../hooks/useUserRole';
import SuperAdminDashboard from '../../components/admin/SuperAdminDashboard';
import TeamManagement from '../../components/admin/TeamManagement';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { role, isSuperAdmin, loading } = useUserRole();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <header className="glass-panel border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-white text-glow">Settings</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 capitalize bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            Role: <span className="text-violet-300">{role?.replace('_', ' ')}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-white/10 rounded-lg"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isSuperAdmin ? (
                    <SuperAdminDashboard />
                ) : (
                    <TeamManagement />
                )}
            </main>
        </div>
    );
}
