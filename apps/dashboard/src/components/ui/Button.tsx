import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] border border-transparent",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary",
            ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
            danger: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
            outline: "border border-border text-foreground hover:bg-muted hover:text-foreground"
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs rounded-lg",
            md: "px-4 py-2.5 text-sm rounded-xl",
            lg: "px-6 py-3 text-base rounded-xl",
            icon: "p-2 rounded-lg"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
