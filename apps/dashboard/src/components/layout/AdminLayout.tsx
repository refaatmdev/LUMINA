import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Monitor,
    Image as ImageIcon,
    Settings,
    LogOut,
    CreditCard,
    Shield,
    List,
    Megaphone,
    TrendingUp,
    Activity,
    HardDrive
} from 'lucide-react';
import TrialGuard from '../auth/TrialGuard';
import { useAuth } from '@lumina/shared/hooks';
import { useUserRole } from '../../hooks/useUserRole';
import ImpersonationBanner from '../admin/ImpersonationBanner';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, actions }: AdminLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();
    const { role } = useUserRole();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { icon: Monitor, label: 'Screens', path: '/admin' },

        { icon: ImageIcon, label: 'Slides Library', path: '/admin/slides' },
        { icon: HardDrive, label: 'Media Library', path: '/admin/media' },
        { icon: CreditCard, label: 'Billing', path: '/admin/billing' },
        { icon: Shield, label: 'Tenants', path: '/admin/tenants' }, // Super Admin only (ideally hidden)
        { icon: List, label: 'Plans', path: '/admin/plans' },
        { icon: Megaphone, label: 'Marketing', path: '/admin/marketing' },
        { icon: TrendingUp, label: 'Finance', path: '/admin/finance' },
        { icon: Activity, label: 'Stats', path: '/admin/stats' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    // Filter nav items based on role if needed, or just show all for now
    // The 'Screens' path is '/admin' which is the default dashboard in this app structure

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <ImpersonationBanner />
            <div className="flex flex-1">
                {/* Glassmorphism Sidebar */}
                <aside className="w-64 fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col transition-all duration-300">
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-200">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            LUMINA
                        </span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.filter(item => {
                            // Super Admin sees everything
                            if (role === 'super_admin') return true;

                            // Org Admin sees everything EXCEPT Tenants, Plans, Marketing, Finance, and Stats
                            if (role === 'org_admin') {
                                return !['/admin/tenants', '/admin/plans', '/admin/marketing', '/admin/finance', '/admin/stats'].includes(item.path);
                            }

                            // Editor sees ONLY Screens and Slides
                            if (role === 'editor') {
                                return ['/admin', '/admin/slides'].includes(item.path);
                            }

                            // Default (e.g. 'admin' or unknown) - restrictive
                            return ['/admin'].includes(item.path);
                        }).map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon
                                        size={18}
                                        className={`mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                                            }`}
                                    />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                                <p className="text-xs text-gray-500 truncate capitalize">{role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={18} className="mr-3" />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 min-h-screen transition-all duration-300">
                    <header className="h-16 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
                        <div className="flex items-center gap-4">
                            {actions}
                        </div>
                    </header>
                    <div className="p-8 max-w-7xl mx-auto">
                        <TrialGuard>
                            {children}
                        </TrialGuard>
                    </div>
                </main>
            </div>
        </div>
    );
}
