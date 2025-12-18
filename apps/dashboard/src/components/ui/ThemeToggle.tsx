import { Moon, Sun, Laptop } from 'lucide-react';
import { useThemeStore } from '../../store/theme-store';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);

    const icons = {
        light: <Sun size={18} />,
        dark: <Moon size={18} />,
        system: <Laptop size={18} />,
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-gray-400 hover:text-white hover:bg-white/5"
            >
                <div className="flex items-center gap-2">
                    {icons[theme]}
                    <span className="capitalize">{theme} Theme</span>
                </div>
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1A1F2E] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 flex flex-col">
                        {(['light', 'dark', 'system'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setTheme(t);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-left",
                                    theme === t ? "text-violet-400 bg-violet-500/10" : "text-gray-400"
                                )}
                            >
                                {icons[t]}
                                <span className="capitalize">{t}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
