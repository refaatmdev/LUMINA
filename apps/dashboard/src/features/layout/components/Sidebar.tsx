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
import { useAuthStore } from '../../../store/auth-store';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role, signOut } = useAuthStore();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { icon: Monitor, label: 'Screens', path: '/admin' },
        { icon: ImageIcon, label: 'Slides Library', path: '/admin/slides' },
        { icon: HardDrive, label: 'Media Library', path: '/admin/media' },
        { icon: CreditCard, label: 'Billing', path: '/admin/billing' },
        { icon: Shield, label: 'Tenants', path: '/admin/tenants' },
        { icon: List, label: 'Playlists', path: '/admin/playlists' },
        { icon: List, label: 'Plans', path: '/admin/plans' },
        { icon: Megaphone, label: 'Marketing', path: '/admin/marketing' },
        { icon: TrendingUp, label: 'Finance', path: '/admin/finance' },
        { icon: Activity, label: 'Stats', path: '/admin/stats' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!role) return false;
        if (role === 'super_admin') return true;
        if (role === 'org_admin') {
            return !['/admin/tenants', '/admin/plans', '/admin/marketing', '/admin/finance', '/admin/stats'].includes(item.path);
        }
        if (role === 'editor') {
            return ['/admin', '/admin/slides', '/admin/playlists'].includes(item.path);
        }
        return ['/admin'].includes(item.path);
    });

    return (
        <aside className={cn(
            "w-64 fixed inset-y-0 left-0 z-50 bg-background/80 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
            <div className="h-16 flex items-center px-6 border-b border-border justify-between">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                        <span className="text-primary-foreground font-bold text-xl">L</span>
                    </div>
                    <span className="text-lg font-bold text-foreground tracking-wide">
                        LUMINA
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon
                                size={18}
                                className={cn(
                                    "mr-3 transition-colors",
                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                )}
                            />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-muted/50 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black/50">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">{role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <div className="mb-2">
                    <ThemeToggle />
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300"
                >
                    <LogOut size={18} className="mr-3" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};
