interface SuperAdminTokenPayload {
    type: 'super_admin';
    id: string;
    email: string;
}
interface UserTokenPayload {
    type: 'user';
    id: string;
    email: string;
    companyId: string;
    companySlug: string;
    role: string;
}
type TokenPayload = SuperAdminTokenPayload | UserTokenPayload;
declare function verifyToken(token: string): TokenPayload;
declare function bootstrapSuperAdmin(): Promise<void>;
declare function superAdminLogin(email: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        type: "super_admin";
    };
}>;
declare function companyUserLogin(email: string, password: string, companySlug?: string): Promise<{
    requireCompanySelection: boolean;
    companies: {
        slug: string;
        name: string;
    }[];
    token?: undefined;
    refreshToken?: undefined;
    user?: undefined;
} | {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        type: "user";
        company: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            currencySymbol: string;
            country: string;
        };
    };
    requireCompanySelection?: undefined;
    companies?: undefined;
}>;
declare function refreshAccessToken(refreshToken: string): Promise<{
    token: string;
}>;
declare function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<{
    message: string;
}>;
declare function getProfile(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    type: "user";
    company: {
        id: string;
        name: string;
        slug: string;
        currency: string;
        currencySymbol: string;
        country: string;
        gstin: string | null;
    };
}>;
declare function impersonateCompany(companyId: string): Promise<{
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        type: "user";
        company: {
            id: string;
            name: string;
            slug: string;
        };
    };
}>;
export declare const authService: {
    bootstrapSuperAdmin: typeof bootstrapSuperAdmin;
    superAdminLogin: typeof superAdminLogin;
    companyUserLogin: typeof companyUserLogin;
    refreshAccessToken: typeof refreshAccessToken;
    changeUserPassword: typeof changeUserPassword;
    getProfile: typeof getProfile;
    verifyToken: typeof verifyToken;
    impersonateCompany: typeof impersonateCompany;
};
export {};
//# sourceMappingURL=auth.service.d.ts.map