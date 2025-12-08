export const PLANS = {
    FREE: {
        name: 'Free',
        maxScreens: 1,
        storageGB: 0.5,
    },
    BASIC: {
        name: 'Basic',
        maxScreens: 5,
        storageGB: 1,
    },
    MEDIUM: {
        name: 'Medium',
        maxScreens: 20,
        storageGB: 5,
    },
    PRO: {
        name: 'Pro',
        maxScreens: 100,
        storageGB: 20,
    },
    ENTERPRISE: {
        name: 'Enterprise',
        maxScreens: Infinity,
        storageGB: Infinity,
    },
} as const;

export type PlanTier = keyof typeof PLANS;

export const getPlanLimits = (tier: string) => {
    const normalizedTier = tier.toUpperCase();
    return PLANS[normalizedTier as PlanTier] || PLANS.FREE;
};
