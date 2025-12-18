import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'hover' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "glass-panel rounded-2xl p-6 transition-all duration-300",
                    variant === 'hover' && "hover:bg-muted/50 hover:border-border/80",
                    variant === 'interactive' && "hover:bg-muted/50 hover:border-primary/30 cursor-pointer hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = "Card";
