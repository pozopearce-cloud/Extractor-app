import { NextResponse } from 'next/server';

import { buildWorkbookBuffer } from '@/lib/excel';
import { DEFAULT_LANGUAGE, getTranslations, normalizeLanguage } from '@/lib/i18n';
import { validateExportPayload, ValidationError } from '@/lib/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  let language = DEFAULT_LANGUAGE;

  try {
    const json = await request.json();
    language = normalizeLanguage((json as { language?: string })?.language);
    const payload = validateExportPayload(json);
    const workbook = await buildWorkbookBuffer(payload);

    return new NextResponse(workbook.buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${workbook.filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    const i18n = getTranslations(language);
    const message =
      error instanceof ValidationError
        ? error.message
        : i18n.exportFailed;
    const status = error instanceof ValidationError ? 400 : 500;

    console.error('[export] request failed', { error: message });
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
