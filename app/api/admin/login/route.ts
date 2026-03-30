import { NextResponse } from 'next/server';

import { isAdminConfigured, setAdminCookie, verifyAdminPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'El acceso admin no está configurado.' }, { status: 503 });
  }

  if (!payload?.password) {
    return NextResponse.json({ error: 'Debes indicar la contraseña admin.' }, { status: 400 });
  }

  if (!verifyAdminPassword(payload.password)) {
    return NextResponse.json({ error: 'Contraseña admin incorrecta.' }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
