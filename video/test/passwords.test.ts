// Integration test: needs the local MySQL and the Laravel backend on :8000.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { query } from '../capture/db.ts';
import { withTemporaryPasswords, BACKUP_FILE } from '../capture/passwords.ts';

const API = 'http://127.0.0.1:8000/api';
const snapshot = () => query('select id, password from users order by id');

test('restores the original hashes after a successful run, and the temp password logs in', async () => {
  const before = snapshot();
  await withTemporaryPasswords(async (password) => {
    assert.notEqual(snapshot(), before);
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@ptamsar.co.id', password }),
    });
    assert.equal(res.status, 200);
    const { token } = (await res.json()) as { token: string };
    await fetch(`${API}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  });
  assert.equal(snapshot(), before);
  assert.equal(existsSync(BACKUP_FILE), false);
});

test('restores the original hashes when the callback throws', async () => {
  const before = snapshot();
  await assert.rejects(withTemporaryPasswords(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(snapshot(), before);
  assert.equal(existsSync(BACKUP_FILE), false);
});
