import type { ExtractSummary, ExtractedLine } from '@/types/extractor';

export function buildSummary(items: ExtractedLine[]): ExtractSummary {
  return {
    facturas: new Set(items.map((item) => item.factura).filter(Boolean)).size,
    lineas: items.length,
    unidades: items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0),
    total: items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  };
}

export function detectYearFromDate(date: string) {
  if (!date) {
    return null;
  }

  const match = date.match(/\b(20\d{2})\b/);
  return match ? match[1] : null;
}
