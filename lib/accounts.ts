import { getPersistedCompanyAccounts, setPersistedCompanyAccounts } from '@/lib/company-store';
import { hashPassword } from '@/lib/passwords';
import type { CompanyAccount } from '@/types/history';

const fallbackAccounts: CompanyAccount[] = [
  {
    id: 'demo',
    name: 'Demo Company',
    password: 'changeme',
    region: 'Internal'
  }
];

function sanitizeAccounts(accounts: CompanyAccount[]) {
  return accounts.filter(
    (account) =>
      account.id &&
      account.name &&
      (typeof account.password === 'string' || typeof account.passwordHash === 'string')
  );
}

function getConfiguredCompanyAccounts() {
  const raw = process.env.CLIENT_ACCOUNTS_JSON;

  if (!raw) {
    return fallbackAccounts;
  }

  try {
    const parsed = JSON.parse(raw) as CompanyAccount[];
    if (!Array.isArray(parsed)) {
      return fallbackAccounts;
    }

    return sanitizeAccounts(parsed);
  } catch {
    return fallbackAccounts;
  }
}

function normalizeStoredAccount(account: CompanyAccount): CompanyAccount {
  if (account.passwordHash) {
    return {
      id: account.id,
      name: account.name,
      region: account.region,
      passwordHash: account.passwordHash
    };
  }

  return {
    id: account.id,
    name: account.name,
    region: account.region,
    passwordHash: hashPassword(account.password || 'changeme')
  };
}

export async function getCompanyAccounts() {
  const stored = await getPersistedCompanyAccounts();
  if (stored) {
    return sanitizeAccounts(stored);
  }

  return getConfiguredCompanyAccounts();
}

export async function getCompanyAccountById(id: string) {
  const accounts = await getCompanyAccounts();
  return accounts.find((account) => account.id === id) || null;
}

export async function saveCompanyAccounts(accounts: CompanyAccount[]) {
  await setPersistedCompanyAccounts(accounts.map(normalizeStoredAccount));
}

export async function upsertCompanyAccount(account: CompanyAccount) {
  const accounts = await getCompanyAccounts();
  const existingIndex = accounts.findIndex((entry) => entry.id === account.id);

  if (existingIndex >= 0) {
    const existing = accounts[existingIndex];
    accounts[existingIndex] = {
      ...existing,
      id: account.id,
      name: account.name,
      region: account.region,
      password: account.password || existing.password,
      passwordHash: account.password ? undefined : existing.passwordHash
    };
  } else {
    accounts.unshift(account);
  }

  await saveCompanyAccounts(accounts);
}

export async function removeCompanyAccount(id: string) {
  const accounts = await getCompanyAccounts();
  const next = accounts.filter((entry) => entry.id !== id);
  await saveCompanyAccounts(next);
}

export function slugifyCompanyId(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}
