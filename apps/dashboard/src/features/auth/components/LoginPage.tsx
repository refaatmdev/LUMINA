import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../api/login';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const login = useLogin();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await login.mutateAsync({ email, password });
            // Auth state change is handled by the subscription in auth-store
            // We just need to navigate
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="glass-panel backdrop-blur-xl border border-border p-8 rounded-2xl w-96 relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">Lumina</h1>
                    <p className="text-muted-foreground text-sm">Sign in to your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 text-sm backdrop-blur-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full rounded-xl px-4 py-2.5 outline-none"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full rounded-xl px-4 py-2.5 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={login.isPending}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {login.isPending ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center text-sm text-muted-foreground mt-6">
                        Don't have an organization? <Link to="/register" className="text-primary hover:text-primary/80 transition-colors hover:underline">Create one</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
