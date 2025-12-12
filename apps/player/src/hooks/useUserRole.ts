import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'org_admin' | 'editor' | null;

interface UserRoleData {
    role: UserRole;
    orgId: string | null;
    orgStatus: 'active' | 'suspended' | 'archived' | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    loading: boolean;
}

export function useUserRole(): UserRoleData {
    const [role, setRole] = useState<UserRole>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [orgStatus, setOrgStatus] = useState<'active' | 'suspended' | 'archived' | null>(null);
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
                    .select(`
                        role, 
                        org_id,
                        organization:organizations (
                            status
                        )
                    `)
                    .eq('id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching user role:', error);
                    setLoading(false);
                    return;
                }

                if (data) {
                    console.log('User role found:', data);

                    // Impersonation Logic
                    const impersonatedOrgId = sessionStorage.getItem('impersonated_org_id');
                    if (data.role === 'super_admin' && impersonatedOrgId) {
                        console.log('Impersonating Org:', impersonatedOrgId);
                        setRole('org_admin'); // Temporarily act as org admin
                        setOrgId(impersonatedOrgId);
                        setOrgStatus('active'); // Impersonation always assumes active for now, or we could fetch it
                    } else {
                        setRole(data.role as UserRole);
                        setOrgId(data.org_id);
                        // @ts-ignore - Supabase types might not know about the relation yet
                        setOrgStatus(data.organization?.status || 'active');
                    }
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
        orgStatus,
        isAdmin: role === 'super_admin' || role === 'org_admin',
        isSuperAdmin: role === 'super_admin',
        loading
    };
}
