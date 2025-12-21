import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'org_admin' | 'editor' | null;

interface AuthState {
    session: Session | null;
    user: User | null;
    role: UserRole;
    orgId: string | null;
    loading: boolean;
    initialized: boolean;
    setSession: (session: Session | null) => void;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    role: null,
    orgId: null,
    loading: true,
    initialized: false,
    setSession: (session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
            get().refreshProfile();
        } else {
            set({ role: null, orgId: null, loading: false });
        }
    },
    initialize: async () => {
        try {
            set({ loading: true });
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user ?? null });

            if (session?.user) {
                await get().refreshProfile();
            }

            set({ initialized: true });

            // Listen for changes
            supabase.auth.onAuthStateChange((_event, session) => {
                const currentUser = get().user;
                set({ session, user: session?.user ?? null });

                // Only refresh profile if user changed or signed in
                if (session?.user?.id !== currentUser?.id) {
                    if (session?.user) {
                        get().refreshProfile();
                    } else {
                        set({ role: null, orgId: null });
                    }
                }
                set({ loading: false });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false });
        }
    },
    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, org_id')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const impersonatedOrgId = sessionStorage.getItem('impersonated_org_id');
                if (data.role === 'super_admin' && impersonatedOrgId) {
                    set({ role: 'org_admin', orgId: impersonatedOrgId });
                } else {
                    set({ role: data.role as UserRole, orgId: data.org_id });
                }
            } else {
                // Fallback or handle missing profile
                set({ role: null, orgId: null });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            set({ role: null, orgId: null });
        }
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, role: null, orgId: null });
    },
}));
