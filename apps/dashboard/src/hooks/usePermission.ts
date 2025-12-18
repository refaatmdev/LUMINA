import { useAuthStore } from '../store/auth-store';
import type { UserRole } from '../store/auth-store';

export type Permission =
    | 'manage_organization'
    | 'manage_users'
    | 'invite_users'
    | 'view_analytics'
    | 'manage_billing'
    | 'manage_content' // General content edit
    | 'publish_content'
    | 'system_admin'; // Super admin stuff

const ROLE_PERMISSIONS: Record<Exclude<UserRole, null>, Permission[]> = {
    'super_admin': [
        'system_admin',
        'manage_organization',
        'manage_users',
        'invite_users',
        'view_analytics',
        'manage_billing',
        'manage_content',
        'publish_content'
    ],
    'org_admin': [
        'manage_organization',
        'manage_users',
        'invite_users',
        'view_analytics',
        'manage_billing',
        'manage_content',
        'publish_content'
    ],
    'editor': [
        'manage_content',
        'publish_content' // Maybe restricted? assuming yes for now
    ]
};

export function usePermission() {
    const { role, loading } = useAuthStore();

    const can = (permission: Permission) => {
        if (!role) return false;
        // Super admin bypass or explicit check
        if (role === 'super_admin') return true;

        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    };

    const hasRole = (targetRole: UserRole) => {
        return role === targetRole;
    };

    return { can, hasRole, role, loading };
}
