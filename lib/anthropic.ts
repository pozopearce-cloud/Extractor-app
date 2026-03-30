import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';

import { ANTHROPIC_TIMEOUT_MS } from '@/lib/constants';

let client: Anthropic | null = null;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada en el servidor.');
  }

  if (!client) {
    client = new Anthropic({
      apiKey,
      timeout: ANTHROPIC_TIMEOUT_MS
    });
  }

  return client;
}

export function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
}

async function createMessage(
  inputMessages: MessageParam[],
  messages?: {
    configInvalid?: string;
    rateLimited?: string;
    failed?: string;
  }
) {
  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 4096,
      messages: inputMessages
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!text.trim()) {
      throw new Error('Claude no devolvió contenido.');
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('api key') || message.includes('authentication')) {
        throw new Error(
          messages?.configInvalid ||
            'La configuración de Anthropic en el servidor no es válida.'
        );
      }

      if (message.includes('rate limit')) {
        throw new Error(
          messages?.rateLimited ||
            'Anthropic ha rechazado temporalmente la petición. Inténtalo de nuevo.'
        );
      }
    }

    throw new Error(messages?.failed || 'No se pudo completar la extracción con Claude.');
  }
}

export async function requestClaudeJson(
  prompt: string,
  messages?: {
    configInvalid?: string;
    rateLimited?: string;
    failed?: string;
  }
) {
  return createMessage(
    [
      {
        role: 'user',
        content: prompt
      }
    ],
    messages
  );
}

export async function requestClaudeJsonFromPdf(
  pdfBuffer: Buffer,
  prompt: string,
  messages?: {
    configInvalid?: string;
    rateLimited?: string;
    failed?: string;
  }
) {
  return createMessage(
    [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBuffer.toString('base64')
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ],
    messages
  );
}
