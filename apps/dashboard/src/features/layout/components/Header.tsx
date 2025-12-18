import React from 'react';

// import { clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// function cn(...inputs: (string | undefined | null | false)[]) {
//   return twMerge(clsx(inputs));
// }

interface HeaderProps {
    title?: string;
    actions?: React.ReactNode;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, actions, setIsMobileMenuOpen }) => {
    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
                {actions}
            </div>
        </header>
    );
};
