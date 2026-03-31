import { NextResponse } from 'next/server';

import {
  getCompanyAccounts,
  removeCompanyAccount,
  slugifyCompanyId,
  upsertCompanyAccount
} from '@/lib/accounts';
import { hasAdminSession } from '@/lib/auth';
import { PersistenceError } from '@/lib/persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function forbidden() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
}

function sanitizeCompany(company: {
  id: string;
  name: string;
  region?: string;
  creditsRemaining?: number;
  creditUnit?: 'facturas' | 'paginas';
}) {
  return {
    id: company.id,
    name: company.name,
    region: company.region || '',
    creditsRemaining:
      'creditsRemaining' in company && typeof company.creditsRemaining === 'number'
        ? company.creditsRemaining
        : 50,
    creditUnit:
      'creditUnit' in company && company.creditUnit ? company.creditUnit : 'facturas'
  };
}

export async function GET() {
  try {
    if (!(await hasAdminSession())) {
      return forbidden();
    }

    const companies = await getCompanyAccounts();
    return NextResponse.json({
      companies: companies.map(sanitizeCompany)
    });
  } catch (error) {
    console.error('[admin/companies][GET]', error);
    return NextResponse.json(
      { error: 'No se pudo cargar la lista de empresas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return forbidden();
    }

    const payload = (await request.json().catch(() => null)) as
      | {
          id?: string;
          name?: string;
          region?: string;
          password?: string;
          creditsRemaining?: number;
          creditUnit?: 'facturas' | 'paginas';
        }
      | null;

    const name = payload?.name?.trim();
    const id = slugifyCompanyId(payload?.id?.trim() || payload?.name?.trim() || '');
    const password = payload?.password?.trim();
    const existing = (await getCompanyAccounts()).find((company) => company.id === id);

    if (!name) {
      return NextResponse.json(
        { error: 'Debes indicar el nombre de la empresa.' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'No se pudo generar un identificador válido.' },
        { status: 400 }
      );
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
      password: password || undefined,
      creditsRemaining:
        typeof payload?.creditsRemaining === 'number' ? payload.creditsRemaining : undefined,
      creditUnit: payload?.creditUnit || undefined
    });

    return NextResponse.json({
      company: sanitizeCompany({
        id,
        name,
        region: payload?.region?.trim() || '',
        creditsRemaining:
          typeof payload?.creditsRemaining === 'number' ? payload.creditsRemaining : 50,
        creditUnit: payload?.creditUnit || 'facturas'
      })
    });
  } catch (error) {
    console.error('[admin/companies][POST]', error);
    if (error instanceof PersistenceError) {
      return NextResponse.json(
        {
          error:
            'No se pudieron guardar los cambios porque el almacenamiento persistente del servidor no está disponible.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'No se pudo guardar la empresa.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return forbidden();
    }

    const payload = (await request.json().catch(() => null)) as { id?: string } | null;
    const id = payload?.id?.trim();

    if (!id) {
      return NextResponse.json(
        { error: 'Debes indicar la empresa a eliminar.' },
        { status: 400 }
      );
    }

    await removeCompanyAccount(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/companies][DELETE]', error);
    if (error instanceof PersistenceError) {
      return NextResponse.json(
        {
          error:
            'No se pudieron guardar los cambios porque el almacenamiento persistente del servidor no está disponible.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'No se pudo eliminar la empresa.' },
      { status: 500 }
    );
  }
}
