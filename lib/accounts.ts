import type { CompanyAccount } from '@/types/history';

const fallbackAccounts: CompanyAccount[] = [
  {
    id: 'demo',
    name: 'Demo Company',
    password: 'changeme',
    region: 'Internal'
  }
];

export function getCompanyAccounts() {
  const raw = process.env.CLIENT_ACCOUNTS_JSON;

  if (!raw) {
    return fallbackAccounts;
  }

  try {
    const parsed = JSON.parse(raw) as CompanyAccount[];
    if (!Array.isArray(parsed) || !parsed.length) {
      return fallbackAccounts;
    }

    return parsed.filter((account) => account.id && account.name && account.password);
  } catch {
    return fallbackAccounts;
  }
}

export function getCompanyAccountById(id: string) {
  return getCompanyAccounts().find((account) => account.id === id) || null;
}
