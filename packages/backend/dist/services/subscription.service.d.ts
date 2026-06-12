declare function seedDefaultPlans(): Promise<void>;
declare function listPlans(): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    displayName: string;
    maxUsers: number;
    maxBranches: number;
    maxItems: number;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string | null;
}[]>;
declare function assignPlan(companyId: string, planId: string): Promise<{
    plan: {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        displayName: string;
        maxUsers: number;
        maxBranches: number;
        maxItems: number;
        monthlyPrice: number;
        yearlyPrice: number;
        features: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    companyId: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    planId: string;
}>;
declare function getCompanySubscription(companyId: string): Promise<({
    plan: {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        displayName: string;
        maxUsers: number;
        maxBranches: number;
        maxItems: number;
        monthlyPrice: number;
        yearlyPrice: number;
        features: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    companyId: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    planId: string;
}) | null>;
export declare const subscriptionService: {
    seedDefaultPlans: typeof seedDefaultPlans;
    listPlans: typeof listPlans;
    assignPlan: typeof assignPlan;
    getCompanySubscription: typeof getCompanySubscription;
};
export {};
//# sourceMappingURL=subscription.service.d.ts.map