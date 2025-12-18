import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "glass-input w-full rounded-xl px-4 py-2.5 outline-none text-foreground placeholder:text-muted-foreground transition-all",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
