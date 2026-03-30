import type { ProductType } from '@/types/extractor';

export const MAX_FILES = 5;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 8;
export const ANTHROPIC_TIMEOUT_MS = 45_000;

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  filtros: 'Filtros',
  refrigeracion: 'Refrigeracion',
  vehiculos: 'Vehiculos',
  todo: 'Completo',
  custom: 'Custom'
};

export const YEAR_OPTIONS = [
  'auto',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030'
] as const;
