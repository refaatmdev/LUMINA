import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'org_admin' | 'editor' | null;

interface UserRoleData {
    role: UserRole;
    orgId: string | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    loading: boolean;
}

export function useUserRole(): UserRoleData {
    const [role, setRole] = useState<UserRole>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                console.log('Fetching user role for:', user.id);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role, org_id')
                    .eq('id', user.id)
                    .maybeSingle(); // Use maybeSingle to avoid error if no row found

                if (error) {
                    console.error('Error fetching user role:', error);
                    setLoading(false);
                    return;
                }

                if (data) {
                    console.log('User role found:', data);
                    setRole(data.role as UserRole);
                    setOrgId(data.org_id);
                } else {
                    console.warn('No user role found in profiles table for ID:', user.id);
                    // Fallback: If no user record, maybe they are a legacy user?
                    // We could try to fetch from profiles or just stop loading.
                }
            } catch (error) {
                console.error('Error in useUserRole:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, []);

    return {
        role,
        orgId,
        isAdmin: role === 'super_admin' || role === 'org_admin',
        isSuperAdmin: role === 'super_admin',
        loading
    };
}
