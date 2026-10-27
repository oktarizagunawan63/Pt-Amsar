import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RoleId } from '../src/content/types.ts';
import { bcrypt, query } from './db.ts';

export const ACCOUNTS: { role: RoleId; email: string }[] = [
  { role: 'sales', email: 'ramaatteriza17@gmail.com' },
  { role: 'sales_manager', email: 'timothilois007@gmail.com' },
  { role: 'site_manager', email: 'oktarizagunawan63@gmail.com' },
  { role: 'engineer', email: 'starsszscor@gmail.com' },
  { role: 'administrator', email: 'admin@ptamsar.co.id' },
];

export const BACKUP_FILE = join(dirname(fileURLToPath(import.meta.url)), '.backup', 'passwords.json');

type Backup = { id: number; password: string }[];

const emailList = () => ACCOUNTS.map((a) => `'${a.email}'`).join(',');

const BCRYPT = /^\$2y\$\d{2}\$[./A-Za-z0-9]{53}$/;

function readHashes(): Backup {
  // mysql.exe ends lines with CRLF on Windows; a stray \r would corrupt the hash on write-back.
  return query(`select id, password from users where email in (${emailList()}) order by id`)
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const [id, password] = line.split('\t');
      return { id: Number(id), password };
    });
}

function writeHashes(rows: Backup): void {
  for (const r of rows) {
    if (!BCRYPT.test(r.password)) throw new Error(`Hash user ${r.id} bukan bcrypt yang valid; tidak ditulis`);
  }
  query(rows.map((r) => `update users set password = '${r.password}' where id = ${r.id};`).join('\n'));
}

/** Puts the backed-up hashes back and checks them byte for byte; keeps the backup file if they don't match. */
export function restoreFromBackup(): void {
  const backup: Backup = JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));
  writeHashes(backup);
  const now = readHashes();
  if (JSON.stringify(now) !== JSON.stringify(backup)) {
    throw new Error(`Restore password tidak cocok dengan backup; backup tetap di ${BACKUP_FILE}`);
  }
  rmSync(BACKUP_FILE);
}

/**
 * Gives the five demo accounts one random temporary password for the duration of `fn`,
 * then restores the original hashes even if `fn` throws.
 */
export async function withTemporaryPasswords<T>(fn: (password: string) => Promise<T>): Promise<T> {
  if (existsSync(BACKUP_FILE)) {
    throw new Error(`Backup password lama masih ada (${BACKUP_FILE}). Jalankan dulu: node capture/passwords.ts --restore`);
  }
  const original = readHashes();
  if (original.length !== ACCOUNTS.length) {
    throw new Error(`Diharapkan ${ACCOUNTS.length} akun, ditemukan ${original.length}`);
  }
  mkdirSync(dirname(BACKUP_FILE), { recursive: true });
  writeFileSync(BACKUP_FILE, JSON.stringify(original));

  const password = randomBytes(18).toString('base64url');
  try {
    const hash = bcrypt(password);
    writeHashes(original.map((r) => ({ id: r.id, password: hash })));
    return await fn(password);
  } finally {
    restoreFromBackup();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--restore')) {
  restoreFromBackup();
  console.log('Password asli sudah dikembalikan.');
}
