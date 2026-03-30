import { createHmac, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

import { getCompanyAccountById, getCompanyAccounts } from '@/lib/accounts';
import type { SessionCompany } from '@/types/history';

const SESSION_COOKIE = 'extractor_session';

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'dev-auth-secret-change-me';
}

function sign(value: string) {
  return createHmac('sha256', getAuthSecret()).update(value).digest('hex');
}

function encodeSession(companyId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      companyId,
      issuedAt: Date.now()
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      companyId: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function createSessionToken(companyId: string) {
  return encodeSession(companyId);
}

export async function setSessionCookie(companyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(companyId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionCompany(): Promise<SessionCompany | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const decoded = decodeSession(token);
  if (!decoded?.companyId) {
    return null;
  }

  const account = getCompanyAccountById(decoded.companyId);
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    region: account.region
  };
}

export function authenticateCompany(companyId: string, password: string) {
  const account = getCompanyAccounts().find(
    (entry) => entry.id === companyId && entry.password === password
  );

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    region: account.region
  };
}
