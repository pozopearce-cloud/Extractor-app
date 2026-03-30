import type { AppLanguage, CurrencyCode, ExtractSummary, ExtractedLine } from '@/types/extractor';
import { LANGUAGE_LOCALES } from '@/lib/i18n';

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';
export const CFA_RATE = 655.957;

export const CURRENCY_OPTIONS: CurrencyCode[] = ['EUR', 'XAF', 'XOF'];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: '€',
  XAF: 'FCFA',
  XOF: 'FCFA'
};

export function formatCurrencyValue(
  value: number,
  locale: string,
  currency: CurrencyCode
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'EUR' ? 'symbol' : 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

export function getCurrencyLocale(language: AppLanguage) {
  return LANGUAGE_LOCALES[language];
}

export function convertEuroAmount(value: number, currency: CurrencyCode) {
  if (currency === 'EUR') {
    return value;
  }

  return value * CFA_RATE;
}

export function convertExtractedItemsCurrency(
  items: ExtractedLine[],
  currency: CurrencyCode
): ExtractedLine[] {
  if (currency === 'EUR') {
    return items;
  }

  return items.map((item) => ({
    ...item,
    precio_unitario: convertEuroAmount(item.precio_unitario, currency),
    total: convertEuroAmount(item.total, currency)
  }));
}

export function convertSummaryCurrency(
  summary: ExtractSummary,
  currency: CurrencyCode
): ExtractSummary {
  if (currency === 'EUR') {
    return summary;
  }

  return {
    ...summary,
    total: convertEuroAmount(summary.total, currency)
  };
}

export function getExcelCurrencyNumberFormat(currency: CurrencyCode) {
  if (currency === 'EUR') {
    return '#,##0.00 [$EUR]';
  }

  return '#,##0.00 "FCFA"';
}
