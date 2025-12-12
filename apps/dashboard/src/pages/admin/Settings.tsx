import { supabase } from '@lumina/shared/lib';
import { useUserRole } from '../../hooks/useUserRole';
import { LogOut, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@lumina/shared/ui';
import { useNavigate } from 'react-router-dom';
import SuperAdminDashboard from '../../components/admin/SuperAdminDashboard';
import TeamManagement from '../../components/admin/TeamManagement';

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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 capitalize">Role: {role?.replace('_', ' ')}</span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-red-600 transition-colors"
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
