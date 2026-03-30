import { NextResponse } from 'next/server';

import {
  getCompanyAccounts,
  removeCompanyAccount,
  slugifyCompanyId,
  upsertCompanyAccount
} from '@/lib/accounts';
import { hasAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function forbidden() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
}

function sanitizeCompany(company: { id: string; name: string; region?: string }) {
  return {
    id: company.id,
    name: company.name,
    region: company.region || ''
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return forbidden();
  }

  const companies = await getCompanyAccounts();
  return NextResponse.json({
    companies: companies.map(sanitizeCompany)
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return forbidden();
  }

  const payload = (await request.json().catch(() => null)) as
    | { id?: string; name?: string; region?: string; password?: string }
    | null;

  const name = payload?.name?.trim();
  const id = slugifyCompanyId(payload?.id?.trim() || payload?.name?.trim() || '');
  const password = payload?.password?.trim();
  const existing = (await getCompanyAccounts()).find((company) => company.id === id);

  if (!name) {
    return NextResponse.json({ error: 'Debes indicar el nombre de la empresa.' }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: 'No se pudo generar un identificador válido.' }, { status: 400 });
  }

  if (!existing && !password) {
    return NextResponse.json(
      { error: 'Debes indicar una contraseña para la nueva empresa.' },
      { status: 400 }
    );
  }

  await upsertCompanyAccount({
    id,
    name,
    region: payload?.region?.trim() || '',
    password: password || undefined
  });

  return NextResponse.json({
    company: sanitizeCompany({
      id,
      name,
      region: payload?.region?.trim() || ''
    })
  });
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return forbidden();
  }

  const payload = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = payload?.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Debes indicar la empresa a eliminar.' }, { status: 400 });
  }

  await removeCompanyAccount(id);
  return NextResponse.json({ ok: true });
}
