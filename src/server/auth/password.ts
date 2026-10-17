/**
 * Password hashing with scrypt (memory-hard KDF from Node's standard library —
 * no native add-ons, works on every Node host).
 *
 * Stored format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
 * Parameters are stored per hash so they can be raised later without breaking
 * existing passwords (`needsRehash` reports outdated hashes).
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize("NFKC"), salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

const maxmem = (n: number, r: number) => 128 * n * r * 2;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { N: n, r, p, maxmem: maxmem(n, r) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function needsRehash(stored: string): boolean {
  const [scheme, n, r, p] = stored.split("$");
  return scheme !== "scrypt" || Number(n) !== N || Number(r) !== R || Number(p) !== P;
}

/**
 * A valid hash of a random value, used to keep login timing uniform when the
 * email address does not exist.
 */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

export const PASSWORD_RULES = {
  minLength: 10,
  maxLength: 128,
  description: "حداقل ۱۰ نویسه، شامل حرف و عدد.",
};

export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_RULES.minLength) return "رمز عبور باید حداقل ۱۰ نویسه باشد.";
  if (password.length > PASSWORD_RULES.maxLength) return "رمز عبور حداکثر ۱۲۸ نویسه باشد.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.";
  return null;
}
