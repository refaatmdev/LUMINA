import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
export type { BillingOrganization } from './billing';
import { type BillingOrganization } from './billing';

export interface OrgUser {
    email: string;
    role: string;
}

export const useTenants = () => {
    return useQuery({
        queryKey: ['tenants'],
        queryFn: async (): Promise<BillingOrganization[]> => {
            const { data, error } = await supabase
                .from('organizations')
                .select(`
                    *,
                    subscription_plans (*),
                    screens: screens(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform to include screen_count and simpler storage_used if needed
            // But supabase types return { screens: [{ count: 5 }] } structure usually
            return data.map((org: any) => ({
                ...org,
                screen_count: org.screens?.[0]?.count || 0,
                storage_used: org.storage_used_bytes || 0 // Correct column name
            }));
        }
    });
};

export const useOrgUsers = (orgId: string | null) => {
    return useQuery({
        queryKey: ['org-users', orgId],
        queryFn: async (): Promise<OrgUser[]> => {
            if (!orgId) return [];

            // 1. Get profiles in org
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, role, role_tier')
                .eq('org_id', orgId);

            if (profilesError) throw profilesError;

            if (!profiles.length) return [];

            // 2. Get emails from auth (Not accessible directly from client usually, 
            // but assuming legacy logic used a view or this is a super admin function that might fail)
            // Replicating legacy logic: "rpc or join?" 
            // Legacy 'TenantsManager.tsx' did:
            // const { data } = await supabase.from('profiles').select('id, role').eq('org_id', orgId);
            // Then loop: supabase.auth.admin.getUserById(p.id) -> this is strictly server-side.
            // 
            // Correction: The legacy code likely FAILED or relied on a specific setup.
            // Checking legacy file content from previous view...
            // It seems it was missing or incomplete in legacy too?
            // "TenantsManager.fetchOrgUsers(orgId: string)"

            // For now, we return profiles with placeholder emails unless we have a view.
            return profiles.map(p => ({
                email: 'hidden@email.com', // Cannot fetch real email from client side securely without edge function
                role: p.role || p.role_tier
            }));
        },
        enabled: !!orgId
    });
};

export const useCreateTenant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ name: _name, email: _email, password: _password, planId: _planId }: any) => {
            // This needs an Edge Function to create Auth User + Org + Profile safely
            // For now, assuming legacy behavior (likely client-side auth.signUp?)

            // 1. SignUp (Client Side) - This logs in the new user immediately, which is bad for admin tools.
            // Ideally this should use supabase.functions.invoke('create-tenant')

            throw new Error("Tenant creation requires a backend function.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
        }
    });
};

export const useUpdateTenantLimits = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, updates }: { orgId: string, updates: Partial<BillingOrganization> }) => {
            const { error } = await supabase
                .from('organizations')
                .update(updates)
                .eq('id', orgId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
        }
    });
};
