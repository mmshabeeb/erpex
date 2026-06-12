import type { ITrialBalance, IProfitLoss, IBalanceSheet } from '@erpex/shared';
export declare function getTrialBalance(asOfDate: string, startDate?: string): Promise<ITrialBalance>;
export declare function getProfitLoss(periodStart: string, periodEnd: string): Promise<IProfitLoss>;
export declare function getBalanceSheet(asOfDate: string): Promise<IBalanceSheet>;
//# sourceMappingURL=report.service.d.ts.map