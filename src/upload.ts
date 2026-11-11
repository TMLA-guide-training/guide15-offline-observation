// 雲端備份：把完整 JSON 備份 POST 到 Apps Script，存進主課的 Google 雲端資料夾。
// 通行碼＝SHA-256("guide15-upload:"+名單密碼)，只存在本機 localStorage（不進 JSON 備份）。
// 離線時只記下「待上傳」，連網後重新產生最新備份再上傳。
import type { Backup } from './types';
const TOKEN_KEY = 'guide15-upload-token', PENDING_KEY = 'guide15-upload-pending', LAST_KEY = 'guide15-upload-last';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* 無法使用 localStorage 時不記錄 */ } };
export async function uploadTokenFor(password: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('guide15-upload:' + password));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function leadTokenFor(password: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('guide15-lead:' + password));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export const uploadState = {
  token: () => get(TOKEN_KEY), setToken: (t: string | null) => set(TOKEN_KEY, t),
  pending: () => get(PENDING_KEY) === '1', setPending: (p: boolean) => set(PENDING_KEY, p ? '1' : null),
  last: (): { at: string; name: string } | null => { try { return JSON.parse(get(LAST_KEY) ?? 'null'); } catch { return null; } },
  setLast: (v: { at: string; name: string }) => set(LAST_KEY, JSON.stringify(v)),
  clear: () => { for (const k of [TOKEN_KEY, PENDING_KEY, LAST_KEY]) set(k, null); },
};
export class UploadError extends Error { constructor(public kind: 'network' | 'auth' | 'invalid' | 'server', message: string) { super(message); } }
export async function uploadBackup(url: string, token: string, backup: Backup, instructorName: string): Promise<string> {
  let res: Response;
  // 不設 Content-Type（預設 text/plain），屬於簡單請求，Apps Script 不需處理 CORS 預檢。
  try { res = await fetch(url, { method: 'POST', body: JSON.stringify({ token, instructor: instructorName, backup }), redirect: 'follow' }); }
  catch { throw new UploadError('network', navigator.onLine ? '無法連到雲端上傳服務，稍後會自動重試' : '目前沒有網路，連網後會自動上傳'); }
  let out: { ok?: boolean; name?: string; error?: string };
  try { out = await res.json(); } catch { throw new UploadError('server', `雲端回應異常（HTTP ${res.status}）`); }
  if (out.ok && out.name) return out.name;
  if (out.error === 'auth') throw new UploadError('auth', '上傳通行碼錯誤或已更換，請重新輸入名單密碼');
  if (out.error === 'invalid' || out.error === 'too_large') throw new UploadError('invalid', '雲端拒絕此備份檔（格式或大小不符）');
  throw new UploadError('server', '雲端暫時無法儲存，稍後會自動重試');
}
// 主課一鍵合併：以主課通行碼向 Apps Script 取回「教官備份上傳」資料夾的備份（每台裝置最新一份）。
export async function fetchCloudBackups(url: string, leadToken: string): Promise<{ total: number; files: { name: string; content: string }[] }> {
  let res: Response;
  try { res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'list', token: leadToken }), redirect: 'follow' }); }
  catch { throw new UploadError('network', '無法連到雲端，請確認網路後再試'); }
  let out: { ok?: boolean; total?: number; files?: { name: string; content: string }[]; error?: string };
  try { out = await res.json(); } catch { throw new UploadError('server', `雲端回應異常（HTTP ${res.status}）`); }
  if (out.ok && Array.isArray(out.files)) return { total: out.total ?? out.files.length, files: out.files };
  if (out.error === 'auth') throw new UploadError('auth', '主課密碼錯誤');
  throw new UploadError('server', '雲端暫時無法讀取備份，請稍後再試');
}
