import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
// We are temporarily importing legacy components that haven't been migrated yet to avoid breaking changes.
// In a full migration, these would also be moved or refactored.
import ImpersonationBanner from '../../../components/admin/ImpersonationBanner';
import TrialGuard from '../../../components/auth/TrialGuard';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title, subtitle, actions }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background font-sans text-foreground flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            {/* Background Gradients */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-background to-background pointer-events-none dark:from-violet-900/20"></div>
            <div className="fixed top-0 left-0 w-full h-[500px] bg-violet-600/5 blur-[100px] pointer-events-none dark:bg-violet-600/10"></div>

            <ImpersonationBanner />

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex flex-1 relative z-10">
                {/* Main Content */}
                <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300 flex flex-col">
                    <Header actions={actions} setIsMobileMenuOpen={setIsMobileMenuOpen} />

                    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-foreground dark:text-white dark:text-glow transition-all duration-300 text-black ">
                                    {title}
                                </h1>
                                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                            </div>
                        )}
                        <TrialGuard>
                            {children}
                        </TrialGuard>
                    </div>
                </main>
            </div>
        </div>
    );
};
