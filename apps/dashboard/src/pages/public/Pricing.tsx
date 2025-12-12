import { useEffect, useState } from 'react';
import { supabase } from '@lumina/shared/lib';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    limits_config: {
        max_screens: number;
        storage_gb: number;
    };
    is_featured: boolean;
    display_order: number;
}

export default function Pricing() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-gray-600">Choose the plan that fits your needs.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-2xl p-8 shadow-xl relative flex flex-col ${plan.is_featured ? 'border-2 border-indigo-600 transform scale-105 z-10' : 'border border-gray-100'
                                    }`}
                            >
                                {plan.is_featured && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                        POPULAR
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900">${plan.price_monthly}</span>
                                        <span className="text-gray-500">/month</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex items-center gap-3 text-gray-700">
                                        <div className="p-1 bg-green-100 rounded-full text-green-600">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span className="font-medium">
                                            {plan.limits_config.max_screens >= 999999 ? 'Unlimited' : plan.limits_config.max_screens} Screens
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700">
                                        <div className="p-1 bg-green-100 rounded-full text-green-600">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span>{plan.limits_config.storage_gb >= 999999 ? 'Unlimited' : `${plan.limits_config.storage_gb} GB`} Storage</span>
                                    </li>
                                    {/* Add more generic features or fetch from DB if we add a features column later */}
                                    <li className="flex items-center gap-3 text-gray-700">
                                        <div className="p-1 bg-green-100 rounded-full text-green-600">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span>Standard Support</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => navigate('/admin/login')} // Or sign up
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${plan.is_featured
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
