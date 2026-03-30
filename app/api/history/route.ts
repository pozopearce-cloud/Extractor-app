import { NextResponse } from 'next/server';

import { getSessionCompany } from '@/lib/auth';
import { getHistoryForCompany } from '@/lib/history-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const company = await getSessionCompany();

  if (!company) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const records = await getHistoryForCompany(company.id);
  return NextResponse.json({ records });
}
