import { NextResponse } from 'next/server';

import { requestClaudeJson, requestClaudeJsonFromPdf } from '@/lib/anthropic';
import { getSessionCompany } from '@/lib/auth';
import { consumeCompanyCredits } from '@/lib/accounts';
import { getTranslations, normalizeLanguage } from '@/lib/i18n';
import { appendHistoryRecord } from '@/lib/history-store';
import { parseClaudeJson, normalizeClaudePayload } from '@/lib/normalize';
import {
  extractPdfText,
  getPdfPageCount,
  TypedPdfExtractionError
} from '@/lib/pdf';
import {
  buildDocumentExtractionPrompt,
  buildExtractionPrompt
} from '@/lib/prompts';
import { buildSummary } from '@/lib/summary';
import {
  validateExtractFormData,
  ValidationError
} from '@/lib/validation';
import type { ExtractResponse, ExtractResponseFile, ExtractedLine } from '@/types/extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  let language = normalizeLanguage('es');

  try {
    const company = await getSessionCompany();
    if (!company) {
      return NextResponse.json(
        { error: 'No autenticado.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    const formData = await request.formData();
    language = normalizeLanguage(formData.get('language'));
    const i18n = getTranslations(language);
    const input = validateExtractFormData(formData, {
      noPdf: i18n.serverNoPdf,
      tooManyFiles: i18n.validationTooManyFiles,
      invalidPdf: i18n.validationInvalidPdf,
      fileTooLarge: i18n.validationFileTooLarge,
      customDescriptionRequired: i18n.serverCustomDescriptionRequired
    });
    const fileBuffers = await Promise.all(
      input.files.map(async (file) => ({
        file,
        buffer: Buffer.from(await file.arrayBuffer())
      }))
    );
    const creditsNeededByFile = await Promise.all(
      fileBuffers.map(async ({ file, buffer }) => {
        if (company.creditUnit === 'paginas') {
          const pages = await getPdfPageCount(buffer, {
            unreadable: i18n.serverPdfUnreadable
          });
          return {
            file,
            buffer,
            creditsNeeded: pages
          };
        }

        return {
          file,
          buffer,
          creditsNeeded: 1
        };
      })
    );
    const totalCreditsNeeded = creditsNeededByFile.reduce(
      (sum, entry) => sum + entry.creditsNeeded,
      0
    );
    const creditsRemaining =
      typeof company.creditsRemaining === 'number' ? company.creditsRemaining : 50;

    if (creditsRemaining < totalCreditsNeeded) {
      return NextResponse.json(
        {
          error:
            company.creditUnit === 'paginas'
              ? `No tienes suficientes créditos. Este envío necesita ${totalCreditsNeeded} página(s) y te quedan ${creditsRemaining}.`
              : `No tienes suficientes créditos. Este envío necesita ${totalCreditsNeeded} factura(s) y te quedan ${creditsRemaining}.`
        },
        {
          status: 402,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    await consumeCompanyCredits(company.id, totalCreditsNeeded);
    const items: ExtractedLine[] = [];
    const files: ExtractResponseFile[] = [];

    for (const { file, buffer } of creditsNeededByFile) {
      try {
        console.info('[extract] processing file', { name: file.name, size: file.size });
        let rawResponse = '';

        try {
          const pdf = await extractPdfText(buffer, {
            noText: i18n.serverPdfNoText,
            unreadable: i18n.serverPdfUnreadable
          });
          const prompt = buildExtractionPrompt({
            productType: input.productType,
            customDescription: input.customDescription,
            filename: file.name,
            text: pdf.text
          });
          rawResponse = await requestClaudeJson(prompt, {
            configInvalid: i18n.serverClaudeConfigInvalid,
            rateLimited: i18n.serverClaudeRateLimited,
            failed: i18n.serverClaudeFailed
          });
        } catch (error) {
          if (!(error instanceof TypedPdfExtractionError) || error.code !== 'no_text') {
            throw error;
          }

          const prompt = buildDocumentExtractionPrompt({
            productType: input.productType,
            customDescription: input.customDescription,
            filename: file.name
          });
          rawResponse = await requestClaudeJsonFromPdf(buffer, prompt, {
            configInvalid: i18n.serverClaudeConfigInvalid,
            rateLimited: i18n.serverClaudeRateLimited,
            failed: i18n.serverClaudeFailed
          });
        }

        const parsed = parseClaudeJson(rawResponse, i18n.serverClaudeInvalidJson);
        const normalized = normalizeClaudePayload(
          parsed,
          file.name.replace(/\.pdf$/i, ''),
          file.name
        );

        items.push(...normalized);
        files.push({
          name: file.name,
          status: 'done',
          extractedCount: normalized.length
        });
      } catch (error) {
        const message =
          error instanceof TypedPdfExtractionError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'No se pudo procesar este archivo.';

        console.error('[extract] file failed', {
          name: file.name,
          error: message
        });

        files.push({
          name: file.name,
          status: 'error',
          extractedCount: 0,
          errorMessage: message
        });
      }
    }

    const payload: ExtractResponse = {
      items,
      files,
      summary: buildSummary(items)
    };

    await appendHistoryRecord({
      id: crypto.randomUUID(),
      companyId: company.id,
      companyName: company.name,
      createdAt: new Date().toISOString(),
      productType: input.productType,
      yearMode: input.yearMode,
      currency: input.currency,
      sourceFiles: input.files.map((file) => file.name),
      summary: payload.summary,
      items
    });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    const i18n = getTranslations(language);
    const message =
      error instanceof ValidationError
        ? error.message
        : error instanceof Error &&
            error.message.includes('ANTHROPIC_API_KEY no está configurada')
          ? i18n.serverMissingApiKey
          : i18n.serverRequestInvalid;
    const status = error instanceof ValidationError ? 400 : 500;

    console.error('[extract] request failed', { error: message });
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
