import { z } from 'zod';

import type { ExtractedLine } from '@/types/extractor';

const extractedLineSchema = z.object({
  factura: z.string().optional().default(''),
  fecha: z.string().optional().default(''),
  destino: z.string().optional().default(''),
  ref_interna: z.string().optional().default(''),
  tipo: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  cantidad: z.union([z.number(), z.string()]).optional().default(0),
  precio_unitario: z.union([z.number(), z.string()]).optional().default(0),
  total: z.union([z.number(), z.string()]).optional().default(0)
});

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeReference(value: string | undefined) {
  const normalized = (value || '').trim().replace(/\s+/g, ' ');

  if (normalized.endsWith('-')) {
    console.warn('[normalize] suspicious truncated ref_interna', normalized);
    return '';
  }

  return normalized;
}

export function normalizeClaudePayload(
  payload: unknown,
  fallbackFactura: string,
  sourceFile: string
): ExtractedLine[] {
  if (!Array.isArray(payload)) {
    throw new Error('Claude no devolvió un array JSON válido.');
  }

  return payload.map((entry) => {
    const parsed = extractedLineSchema.parse(entry);

    return {
      factura: parsed.factura || fallbackFactura,
      fecha: parsed.fecha || '',
      destino: parsed.destino || '',
      ref_interna: normalizeReference(parsed.ref_interna),
      tipo: parsed.tipo || '',
      modelo: parsed.modelo || '',
      cantidad: toNumber(parsed.cantidad),
      precio_unitario: toNumber(parsed.precio_unitario),
      total: toNumber(parsed.total),
      source_file: sourceFile
    };
  });
}

export function parseClaudeJson(
  rawText: string,
  invalidJsonMessage = 'Claude devolvió JSON inválido.'
) {
  const cleaned = rawText.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(invalidJsonMessage);
  }
}
