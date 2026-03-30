import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { list, put } from '@vercel/blob';

import type { HistoryRecord } from '@/types/history';

const LOCAL_HISTORY_FILE = path.join(process.cwd(), '.tmp-history.json');

async function readLocalHistory() {
  try {
    const data = await readFile(LOCAL_HISTORY_FILE, 'utf8');
    return JSON.parse(data) as HistoryRecord[];
  } catch {
    return [];
  }
}

async function writeLocalHistory(records: HistoryRecord[]) {
  await mkdir(path.dirname(LOCAL_HISTORY_FILE), { recursive: true });
  await writeFile(LOCAL_HISTORY_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function readBlobHistory(): Promise<HistoryRecord[]> {
  const listing = await list({
    prefix: 'history/latest.json',
    limit: 1
  });

  const blob = listing.blobs[0];
  if (!blob) {
    return [];
  }

  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok) {
    return [];
  }

  return (await response.json()) as HistoryRecord[];
}

async function writeBlobHistory(records: HistoryRecord[]) {
  await put('history/latest.json', JSON.stringify(records), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json'
  });
}

function canUseBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getHistoryRecords() {
  if (canUseBlob()) {
    return readBlobHistory();
  }

  return readLocalHistory();
}

export async function appendHistoryRecord(record: HistoryRecord) {
  const existing = await getHistoryRecords();
  const next = [record, ...existing].slice(0, 200);

  if (canUseBlob()) {
    await writeBlobHistory(next);
    return;
  }

  await writeLocalHistory(next);
}

export async function getHistoryForCompany(companyId: string) {
  const records = await getHistoryRecords();
  return records.filter((record) => record.companyId === companyId);
}
