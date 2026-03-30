import { NextResponse } from 'next/server';

import { getCompanyAccounts } from '@/lib/accounts';
import { getSessionCompany, hasAdminSession, isAdminConfigured } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionCompany();
  const companies = await getCompanyAccounts();

  return NextResponse.json({
    session,
    isAdmin: await hasAdminSession(),
    adminConfigured: isAdminConfigured(),
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
      region: company.region
    }))
  });
}
