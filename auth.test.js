import test from 'node:test';
import assert from 'node:assert/strict';

import { authenticateUser, sanitizeUser } from './auth.ts';

test('sanitizeUser removes password field', () => {
  const user = { id: 'u-1', username: 'admin', password: '123456', fullName: 'Admin' };
  assert.deepEqual(sanitizeUser(user), { id: 'u-1', username: 'admin', fullName: 'Admin' });
});

test('authenticateUser accepts valid credentials and ignores case', () => {
  const users = [{ id: 'u-1', username: 'admin', password: '123456', fullName: 'Admin' }];
  assert.deepEqual(authenticateUser(users, 'ADMIN', '123456'), { id: 'u-1', username: 'admin', password: '123456', fullName: 'Admin' });
});

test('authenticateUser rejects wrong password', () => {
  const users = [{ id: 'u-1', username: 'admin', password: '123456', fullName: 'Admin' }];
  assert.equal(authenticateUser(users, 'admin', 'wrong'), null);
});
