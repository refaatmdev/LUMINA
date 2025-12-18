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
import { useAuth } from '../../contexts/AuthContext';
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-background font-sans text-foreground flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-background to-background pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-[500px] bg-violet-600/5 blur-[100px] pointer-events-none"></div>

            <ImpersonationBanner />

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="flex flex-1 relative z-10">
                {/* Glassmorphism Sidebar */}
                <aside className={`
                    w-64 fixed inset-y-0 left-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="h-16 flex items-center px-6 border-b border-white/5 justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                                <span className="text-white font-bold text-xl">L</span>
                            </div>
                            <span className="text-lg font-bold text-white text-glow tracking-wide">
                                LUMINA
                            </span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navItems.filter(item => {
                            if (role === 'super_admin') return true;
                            if (role === 'org_admin') {
                                return !['/admin/tenants', '/admin/plans', '/admin/marketing', '/admin/finance', '/admin/stats'].includes(item.path);
                            }
                            if (role === 'editor') {
                                return ['/admin', '/admin/slides'].includes(item.path);
                            }
                            return ['/admin'].includes(item.path);
                        }).map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-violet-600/10 text-violet-400 border border-violet-600/20 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon
                                        size={18}
                                        className={`mr-3 transition-colors ${isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
                                            }`}
                                    />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black/50">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">{user?.email}</p>
                                <p className="text-xs text-violet-400 truncate capitalize">{role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                        >
                            <LogOut size={18} className="mr-3" />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300 flex flex-col">
                    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-[#0B0F19]/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {actions}
                        </div>
                    </header>
                    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                        <TrialGuard>
                            {children}
                        </TrialGuard>
                    </div>
                </main>
            </div>
        </div>
    );
}
