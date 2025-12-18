import { useState } from 'react';
import { useCompleteOnboarding } from '../api/onboarding';
import { useNavigate } from 'react-router-dom';


export const OnboardingPage = () => {
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const completeOnboarding = useCompleteOnboarding();
    const navigate = useNavigate();

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await completeOnboarding.mutateAsync(orgName);
            // profile refresh happens in the hook
            navigate('/admin');
        } catch (err: any) {
            console.error('Onboarding Error:', err);
            setError(err.message || "Failed to create organization.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to Lumina</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Please complete your profile by providing your Institution Name.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreateOrg} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-4 outline-none border transition-colors"
                            placeholder="e.g. Lincoln High School"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={completeOnboarding.isPending}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center"
                    >
                        {completeOnboarding.isPending ? 'Setting up...' : 'Get Started'}
                    </button>
                </form>
            </div>
        </div>
    );
};
