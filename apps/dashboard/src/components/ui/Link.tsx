import React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface LinkProps extends RouterLinkProps {
    variant?: 'default' | 'subtle';
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <RouterLink
                ref={ref}
                className={cn(
                    "transition-colors",
                    variant === 'default' && "text-primary hover:text-primary/80",
                    variant === 'subtle' && "text-muted-foreground hover:text-foreground",
                    className
                )}
                {...props}
            />
        );
    }
);

Link.displayName = "Link";
