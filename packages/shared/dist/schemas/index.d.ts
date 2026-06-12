import { z } from 'zod';
import { AccountType, VoucherType, VoucherStatus, TaxType } from '../constants/index.js';
export declare const createAccountSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof AccountType>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isCashOrBank: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: AccountType;
    name: string;
    code: string;
    isCashOrBank: boolean;
    description?: string | undefined;
    parentId?: string | null | undefined;
}, {
    type: AccountType;
    name: string;
    code: string;
    description?: string | undefined;
    parentId?: string | null | undefined;
    isCashOrBank?: boolean | undefined;
}>;
export declare const updateAccountSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isCashOrBank: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
    parentId?: string | null | undefined;
    isCashOrBank?: boolean | undefined;
    isActive?: boolean | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
    parentId?: string | null | undefined;
    isCashOrBank?: boolean | undefined;
    isActive?: boolean | undefined;
}>;
export declare const journalItemSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    accountId: z.ZodString;
    debit: z.ZodDefault<z.ZodNumber>;
    credit: z.ZodDefault<z.ZodNumber>;
    narration: z.ZodOptional<z.ZodString>;
    taxConfigId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    debit: number;
    credit: number;
    taxConfigId?: string | undefined;
    narration?: string | undefined;
}, {
    accountId: string;
    taxConfigId?: string | undefined;
    debit?: number | undefined;
    credit?: number | undefined;
    narration?: string | undefined;
}>, {
    accountId: string;
    debit: number;
    credit: number;
    taxConfigId?: string | undefined;
    narration?: string | undefined;
}, {
    accountId: string;
    taxConfigId?: string | undefined;
    debit?: number | undefined;
    credit?: number | undefined;
    narration?: string | undefined;
}>, {
    accountId: string;
    debit: number;
    credit: number;
    taxConfigId?: string | undefined;
    narration?: string | undefined;
}, {
    accountId: string;
    taxConfigId?: string | undefined;
    debit?: number | undefined;
    credit?: number | undefined;
    narration?: string | undefined;
}>;
export declare const createJournalSchema: z.ZodEffects<z.ZodObject<{
    date: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodNativeEnum<typeof VoucherType>;
    status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof VoucherStatus>>>;
    narration: z.ZodOptional<z.ZodString>;
    currencyCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    exchangeRate: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    items: z.ZodArray<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        accountId: z.ZodString;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        narration: z.ZodOptional<z.ZodString>;
        taxConfigId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accountId: string;
        debit: number;
        credit: number;
        taxConfigId?: string | undefined;
        narration?: string | undefined;
    }, {
        accountId: string;
        taxConfigId?: string | undefined;
        debit?: number | undefined;
        credit?: number | undefined;
        narration?: string | undefined;
    }>, {
        accountId: string;
        debit: number;
        credit: number;
        taxConfigId?: string | undefined;
        narration?: string | undefined;
    }, {
        accountId: string;
        taxConfigId?: string | undefined;
        debit?: number | undefined;
        credit?: number | undefined;
        narration?: string | undefined;
    }>, {
        accountId: string;
        debit: number;
        credit: number;
        taxConfigId?: string | undefined;
        narration?: string | undefined;
    }, {
        accountId: string;
        taxConfigId?: string | undefined;
        debit?: number | undefined;
        credit?: number | undefined;
        narration?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: VoucherType;
    status: VoucherStatus;
    date: string;
    currencyCode: string;
    exchangeRate: number;
    items: {
        accountId: string;
        debit: number;
        credit: number;
        taxConfigId?: string | undefined;
        narration?: string | undefined;
    }[];
    narration?: string | undefined;
}, {
    type: VoucherType;
    date: string;
    items: {
        accountId: string;
        taxConfigId?: string | undefined;
        debit?: number | undefined;
        credit?: number | undefined;
        narration?: string | undefined;
    }[];
    status?: VoucherStatus | undefined;
    narration?: string | undefined;
    currencyCode?: string | undefined;
    exchangeRate?: number | undefined;
}>, {
    type: VoucherType;
    status: VoucherStatus;
    date: string;
    currencyCode: string;
    exchangeRate: number;
    items: {
        accountId: string;
        debit: number;
        credit: number;
        taxConfigId?: string | undefined;
        narration?: string | undefined;
    }[];
    narration?: string | undefined;
}, {
    type: VoucherType;
    date: string;
    items: {
        accountId: string;
        taxConfigId?: string | undefined;
        debit?: number | undefined;
        credit?: number | undefined;
        narration?: string | undefined;
    }[];
    status?: VoucherStatus | undefined;
    narration?: string | undefined;
    currencyCode?: string | undefined;
    exchangeRate?: number | undefined;
}>;
export declare const createContraSchema: z.ZodEffects<z.ZodObject<{
    date: z.ZodEffects<z.ZodString, string, string>;
    fromAccountId: z.ZodString;
    toAccountId: z.ZodString;
    amount: z.ZodNumber;
    narration: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    date: string;
    fromAccountId: string;
    toAccountId: string;
    narration?: string | undefined;
}, {
    amount: number;
    date: string;
    fromAccountId: string;
    toAccountId: string;
    narration?: string | undefined;
}>, {
    amount: number;
    date: string;
    fromAccountId: string;
    toAccountId: string;
    narration?: string | undefined;
}, {
    amount: number;
    date: string;
    fromAccountId: string;
    toAccountId: string;
    narration?: string | undefined;
}>;
export declare const createTaxConfigSchema: z.ZodObject<{
    name: z.ZodString;
    taxType: z.ZodNativeEnum<typeof TaxType>;
    rate: z.ZodNumber;
    effectiveFrom: z.ZodEffects<z.ZodString, string, string>;
    effectiveTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    accountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rate: number;
    name: string;
    accountId: string;
    taxType: TaxType;
    effectiveFrom: string;
    effectiveTo?: string | undefined;
}, {
    rate: number;
    name: string;
    accountId: string;
    taxType: TaxType;
    effectiveFrom: string;
    effectiveTo?: string | undefined;
}>;
export declare const updateTaxConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    rate: z.ZodOptional<z.ZodNumber>;
    effectiveTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rate?: number | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    effectiveTo?: string | undefined;
}, {
    rate?: number | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    effectiveTo?: string | undefined;
}>;
export declare const createFiscalYearSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
}, {
    name: string;
    startDate: string;
    endDate: string;
}>, {
    name: string;
    startDate: string;
    endDate: string;
}, {
    name: string;
    startDate: string;
    endDate: string;
}>;
export declare const dateRangeSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const journalFilterSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodOptional<z.ZodNativeEnum<typeof VoucherType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof VoucherStatus>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: VoucherType | undefined;
    status?: VoucherStatus | undefined;
    search?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: VoucherType | undefined;
    status?: VoucherStatus | undefined;
    search?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const bankStatementUploadSchema: z.ZodObject<{
    accountId: z.ZodString;
    periodStart: z.ZodEffects<z.ZodString, string, string>;
    periodEnd: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    periodStart: string;
    periodEnd: string;
}, {
    accountId: string;
    periodStart: string;
    periodEnd: string;
}>;
export declare const reconcileMatchSchema: z.ZodObject<{
    matches: z.ZodArray<z.ZodObject<{
        systemEntryId: z.ZodString;
        statementLineId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        systemEntryId: string;
        statementLineId: string;
    }, {
        systemEntryId: string;
        statementLineId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    matches: {
        systemEntryId: string;
        statementLineId: string;
    }[];
}, {
    matches: {
        systemEntryId: string;
        statementLineId: string;
    }[];
}>;
export declare const reconcileClearSchema: z.ZodObject<{
    statementLineIds: z.ZodArray<z.ZodString, "many">;
    bankChargeAmount: z.ZodOptional<z.ZodNumber>;
    bankChargeAccountId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    statementLineIds: string[];
    bankChargeAmount?: number | undefined;
    bankChargeAccountId?: string | undefined;
}, {
    statementLineIds: string[];
    bankChargeAmount?: number | undefined;
    bankChargeAccountId?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map