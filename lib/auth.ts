import { createHmac, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

import { getCompanyAccountById, getCompanyAccounts } from '@/lib/accounts';
import { verifyPasswordHash } from '@/lib/passwords';
import type { SessionCompany } from '@/types/history';

const SESSION_COOKIE = 'extractor_session';
const ADMIN_COOKIE = 'extractor_admin';

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'dev-auth-secret-change-me';
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
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

export async function setAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, sign('admin'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword());
}

export function verifyAdminPassword(password: string) {
  return Boolean(password) && password === getAdminPassword();
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === sign('admin');
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

  const account = await getCompanyAccountById(decoded.companyId);
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    region: account.region
  };
}

export async function authenticateCompany(companyId: string, password: string) {
  const accounts = await getCompanyAccounts();
  const account = accounts.find((entry) => {
    if (entry.id !== companyId) {
      return false;
    }

    if (entry.passwordHash) {
      return verifyPasswordHash(password, entry.passwordHash);
    }

    return entry.password === password;
  });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    region: account.region
  };
}
