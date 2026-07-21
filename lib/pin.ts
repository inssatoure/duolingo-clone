import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;

// Our own PIN hashing, independent of Clerk's password system (which
// enforces a minimum length too long for a 4-digit child-friendly PIN).
// scrypt from node:crypto avoids adding a bcrypt dependency.
export const hashPin = async (pin: string): Promise<string> => {
  const salt = randomBytes(16);
  const derived = await scrypt(pin, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  const [saltHex, keyHex] = hash.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const key = Buffer.from(keyHex, "hex");
  const derived = await scrypt(pin, salt, key.length || KEY_LENGTH);
  return derived.length === key.length && timingSafeEqual(derived, key);
};
