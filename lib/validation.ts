import { z } from 'zod';

import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  YEAR_OPTIONS
} from '@/lib/constants';
import { DEFAULT_LANGUAGE, normalizeLanguage } from '@/lib/i18n';
import type {
  AppLanguage,
  CurrencyCode,
  ExportRequest,
  ProductType,
  YearMode
} from '@/types/extractor';

export class ValidationError extends Error {}

const productTypeSchema = z.enum([
  'filtros',
  'refrigeracion',
  'vehiculos',
  'todo',
  'custom'
]);

const yearModeSchema = z.enum(YEAR_OPTIONS);

const exportSchema: z.ZodType<ExportRequest> = z.object({
  productType: productTypeSchema,
  yearMode: yearModeSchema,
  currency: z.enum(['EUR', 'XAF', 'XOF']),
  items: z.array(
    z.object({
      factura: z.string(),
      fecha: z.string(),
      destino: z.string(),
      ref_interna: z.string(),
      tipo: z.string(),
      modelo: z.string(),
      cantidad: z.number(),
      precio_unitario: z.number(),
      total: z.number(),
      source_file: z.string()
    })
  )
});

export interface ValidatedExtractInput {
  language: AppLanguage;
  productType: ProductType;
  customDescription?: string;
  yearMode: YearMode;
  currency: CurrencyCode;
  files: File[];
}

export function validateExtractFormData(
  formData: FormData,
  messages?: {
    noPdf?: string;
    tooManyFiles?: (count: number) => string;
    invalidPdf?: (name: string) => string;
    fileTooLarge?: (name: string, maxMb: number) => string;
    customDescriptionRequired?: string;
  }
): ValidatedExtractInput {
  const language = normalizeLanguage(formData.get('language') || DEFAULT_LANGUAGE);
  const productType = productTypeSchema.parse(formData.get('productType'));
  const yearMode = yearModeSchema.parse(formData.get('yearMode'));
  const currency = z.enum(['EUR', 'XAF', 'XOF']).parse(formData.get('currency') || 'EUR');
  const customDescription = String(formData.get('customDescription') || '').trim();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File);

  if (!files.length) {
    throw new ValidationError(messages?.noPdf || 'Debes subir al menos un PDF.');
  }

  if (files.length > MAX_FILES) {
    throw new ValidationError(
      messages?.tooManyFiles?.(MAX_FILES) ||
        `Solo se permiten hasta ${MAX_FILES} PDFs por envío.`
    );
  }

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      throw new ValidationError(
        messages?.invalidPdf?.(file.name) || `"${file.name}" no es un PDF válido.`
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(
        messages?.fileTooLarge?.(
          file.name,
          Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)
        ) ||
          `"${file.name}" supera el límite de ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB.`
      );
    }
  }

  if (productType === 'custom' && !customDescription) {
    throw new ValidationError(
      messages?.customDescriptionRequired ||
        'Debes describir qué productos quieres extraer.'
    );
  }

  return {
    language,
    productType,
    customDescription: customDescription || undefined,
    yearMode,
    currency,
    files
  };
}

export function validateExportPayload(payload: unknown) {
  const parsed = exportSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Los datos para exportar el Excel no son válidos.');
  }

  return parsed.data;
}
