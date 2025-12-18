import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Onboarding() {
    const { user } = useAuth();
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user) {
            setError("No user found. Please login again.");
            setLoading(false);
            return;
        }

        try {
            // 1. Create Organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert([{ name: orgName, status: 'active' }])
                .select()
                .single();

            if (orgError) throw orgError;

            // 2. Update Profile with Org ID and Role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    org_id: org.id,
                    role: 'org_admin'
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Reload window to refresh AuthContext/UserRole
            window.location.href = '/admin';

        } catch (err: any) {
            console.error('Onboarding Error:', err);
            setError(err.message || "Failed to create organization.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-4 text-center">Welcome!</h1>
                <p className="text-gray-600 mb-6 text-center text-sm">
                    Please complete your profile by providing your Institution Name.
                </p>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 border p-2"
                            placeholder="e.g. Lincoln High School"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 text-white py-2 px-4 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Setting up...' : 'Get Started'}
                    </button>
                </form>
            </div>
        </div>
    );
}
