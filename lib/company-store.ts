import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { list, put } from '@vercel/blob';

import { PersistenceError } from '@/lib/persistence';
import type { CompanyAccount } from '@/types/history';

const LOCAL_COMPANY_FILE = path.join(process.cwd(), '.tmp-companies.json');

async function readLocalCompanies() {
  try {
    const data = await readFile(LOCAL_COMPANY_FILE, 'utf8');
    return JSON.parse(data) as CompanyAccount[];
  } catch {
    return null;
  }
}

async function writeLocalCompanies(records: CompanyAccount[]) {
  try {
    await mkdir(path.dirname(LOCAL_COMPANY_FILE), { recursive: true });
    await writeFile(LOCAL_COMPANY_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (error) {
    throw new PersistenceError(
      'No se pudo guardar la lista de empresas en el almacenamiento local del servidor.',
      { cause: error }
    );
  }
}

async function readBlobCompanies(): Promise<CompanyAccount[] | null> {
  try {
    const listing = await list({
      prefix: 'companies/latest.json',
      limit: 1
    });

    const blob = listing.blobs[0];
    if (!blob) {
      return null;
    }

    const blobUrl = blob.downloadUrl || blob.url;
    if (!blobUrl) {
      return null;
    }

    const response = await fetch(blobUrl, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CompanyAccount[];
  } catch (error) {
    console.error('[companies] Unable to read persisted companies', error);
    return null;
  }
}

async function writeBlobCompanies(records: CompanyAccount[]) {
  try {
    await put('companies/latest.json', JSON.stringify(records), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
  } catch (error) {
    throw new PersistenceError(
      'No se pudo guardar la lista de empresas en Vercel Blob.',
      { cause: error }
    );
  }
}

function canUseBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getPersistedCompanyAccounts() {
  if (canUseBlob()) {
    return readBlobCompanies();
  }

  return readLocalCompanies();
}

export async function setPersistedCompanyAccounts(records: CompanyAccount[]) {
  if (canUseBlob()) {
    await writeBlobCompanies(records);
    return;
  }

  await writeLocalCompanies(records);
}
