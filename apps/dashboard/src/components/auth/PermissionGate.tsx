import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import type { Permission } from '../../hooks/usePermission';

interface PermissionGateProps {
    children: React.ReactNode;
    permission?: Permission;
    fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    permission,
    fallback = null
}) => {
    const { can, loading } = usePermission();

    if (loading) {
        // Optional: render loading state or nothing
        return null;
    }

    if (permission && !can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
