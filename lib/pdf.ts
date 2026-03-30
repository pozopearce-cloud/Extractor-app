import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { MAX_PDF_PAGES } from '@/lib/constants';

export class PdfExtractionError extends Error {}

export async function extractPdfText(
  buffer: Buffer,
  messages?: {
    noText?: string;
    unreadable?: string;
  }
) {
  try {
    const document = await getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;

    const pagesToRead = Math.min(document.numPages, MAX_PDF_PAGES);
    let text = '';

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      text += `${pageText}\n`;
    }

    const normalized = text.trim();

    if (!normalized) {
      throw new PdfExtractionError(
        messages?.noText ||
          'No se pudo extraer texto legible del PDF. Esta versión no soporta OCR.'
      );
    }

    return {
      text: normalized,
      pagesRead: pagesToRead
    };
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      throw error;
    }

    throw new PdfExtractionError(
      messages?.unreadable || 'No se pudo leer el PDF. Verifica que no esté corrupto.'
    );
  }
}
