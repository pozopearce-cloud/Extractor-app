import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${digest}`;
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const [algorithm, salt, digest] = passwordHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !digest) {
    return false;
  }

  const expected = Buffer.from(digest, 'hex');
  const actual = scryptSync(password, salt, 64);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
