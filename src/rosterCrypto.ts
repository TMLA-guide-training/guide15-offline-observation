// 內建加密名單：AES-256-GCM，金鑰由密碼以 PBKDF2-SHA256 推導。
// 加密檔是公開的，安全性完全取決於密碼強度；請用 16 字以上的隨機密碼。
// 本檔不 import 其他模組，scripts/encrypt-roster.mjs 也直接使用它。
export interface EncryptedRoster { format: 'guide15-roster'; v: 1; kdf: 'PBKDF2-SHA256'; iterations: number; salt: string; iv: string; ciphertext: string }
export const ROSTER_ITERATIONS = 600000;
const b64e = (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s); };
const b64d = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(password: string, salt: Uint8Array, iterations: number, usage: KeyUsage) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
}
export function isEncryptedRoster(x: unknown): x is EncryptedRoster {
  const o = x as EncryptedRoster;
  return !!o && o.format === 'guide15-roster' && o.v === 1 && o.kdf === 'PBKDF2-SHA256' && Number.isInteger(o.iterations) && o.iterations >= 100000
    && [o.salt, o.iv, o.ciphertext].every(s => typeof s === 'string' && /^[A-Za-z0-9+/]+=*$/.test(s));
}
export async function encryptRoster(text: string, password: string, iterations = ROSTER_ITERATIONS): Promise<EncryptedRoster> {
  if (!password) throw Error('密碼不可空白');
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations, 'encrypt');
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
  return { format: 'guide15-roster', v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: b64e(salt), iv: b64e(iv), ciphertext: b64e(ct) };
}
export async function decryptRoster(bundle: unknown, password: string): Promise<string> {
  if (!isEncryptedRoster(bundle)) throw Error('內建名單格式不正確');
  if (!password) throw Error('請輸入名單密碼');
  const key = await deriveKey(password, b64d(bundle.salt), bundle.iterations, 'decrypt');
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(bundle.iv) as BufferSource }, key, b64d(bundle.ciphertext) as BufferSource);
    return new TextDecoder().decode(plain);
  } catch { throw Error('密碼錯誤，請確認後再試'); }
}
