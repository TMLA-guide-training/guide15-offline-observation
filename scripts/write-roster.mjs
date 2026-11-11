// build 時把 GitHub Secret「ROSTER_ENC」（加密名單 JSON）寫成 dist/roster.enc.json。
// 未設定時不產生檔案，App 只提供檔案匯入。名單本身不存在 repo 裡。
import { writeFile } from 'node:fs/promises';
import { isEncryptedRoster } from '../src/rosterCrypto.ts';
const raw = (process.env.ROSTER_ENC ?? '').trim();
if (!raw) { console.log('未設定 ROSTER_ENC：此版本不含內建加密名單'); process.exit(0); }
let bundle;
try { bundle = JSON.parse(raw); } catch { console.error('ROSTER_ENC 不是有效的 JSON，請重新貼上 encrypt-roster.mjs 的完整輸出'); process.exit(1); }
if (!isEncryptedRoster(bundle)) { console.error('ROSTER_ENC 格式不正確，請重新貼上 encrypt-roster.mjs 的完整輸出'); process.exit(1); }
await writeFile('dist/roster.enc.json', JSON.stringify(bundle));
console.log('已加入內建加密名單 dist/roster.enc.json');
