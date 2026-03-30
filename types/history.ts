import type { CurrencyCode, ExtractSummary, ExtractedLine, ProductType, YearMode } from '@/types/extractor';

export type CreditUnit = 'facturas' | 'paginas';

export interface CompanyAccount {
  id: string;
  name: string;
  password?: string;
  passwordHash?: string;
  region?: string;
  creditsRemaining?: number;
  creditUnit?: CreditUnit;
}

export interface SessionCompany {
  id: string;
  name: string;
  region?: string;
  creditsRemaining?: number;
  creditUnit?: CreditUnit;
}

export interface HistoryRecord {
  id: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  productType: ProductType;
  yearMode: YearMode;
  currency: CurrencyCode;
  sourceFiles: string[];
  summary: ExtractSummary;
  items: ExtractedLine[];
}
