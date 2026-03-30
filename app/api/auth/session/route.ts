import { NextResponse } from 'next/server';

import { getCompanyAccounts } from '@/lib/accounts';
import { getSessionCompany } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionCompany();

  return NextResponse.json({
    session,
    companies: getCompanyAccounts().map((company) => ({
      id: company.id,
      name: company.name,
      region: company.region
    }))
  });
}
