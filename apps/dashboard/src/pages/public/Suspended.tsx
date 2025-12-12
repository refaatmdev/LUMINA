
import { Ban, LogOut } from 'lucide-react';
import { useAuth } from '@lumina/shared/hooks';
import { useNavigate } from 'react-router-dom';

export default function Suspended() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                    <Ban size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
                <p className="text-gray-600 mb-8">
                    Your organization's account has been suspended. Please contact support or your administrator for assistance.
                </p>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
