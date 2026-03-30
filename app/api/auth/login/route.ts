import { NextResponse } from 'next/server';

import { authenticateCompany, setSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { companyId?: string; password?: string }
    | null;

  if (!payload?.companyId || !payload.password) {
    return NextResponse.json(
      { error: 'Debes indicar empresa y contraseña.' },
      { status: 400 }
    );
  }

  const session = await authenticateCompany(payload.companyId, payload.password);
  if (!session) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas.' },
      { status: 401 }
    );
  }

  await setSessionCookie(session.id);
  return NextResponse.json({ session });
}
