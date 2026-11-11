// 把參加者名單 CSV 加密成一行 JSON，貼到 GitHub Secret「ROSTER_ENC」。
// 用法：ROSTER_PASSWORD='密碼' node scripts/encrypt-roster.mjs 名單.csv > roster.enc.json
// 未設定 ROSTER_PASSWORD 時會在終端機詢問。輸出檔含加密名單，請勿 commit（.gitignore 已排除 *.enc.json）。
// 需要 Node 22.18+（直接載入 TypeScript 模組）。
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { encryptRoster, decryptRoster } from '../src/rosterCrypto.ts';
const file = process.argv[2];
if (!file) { console.error('用法：node scripts/encrypt-roster.mjs 名單.csv > roster.enc.json'); process.exit(2); }
const bytes = await readFile(file);
let text;
try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { text = new TextDecoder('big5').decode(bytes); }
text = text.replace(/^﻿/, '');
const header = text.split(/\r?\n/, 1)[0].replace(/\s/g, '');
if (!/^(participant_id,name|編號,姓名)$/i.test(header)) { console.error(`第一列必須是 participant_id,name 或 編號,姓名，目前是：${header}`); process.exit(1); }
let password = process.env.ROSTER_PASSWORD;
if (!password) { const rl = createInterface({ input: process.stdin, output: process.stderr }); password = await rl.question('名單密碼：'); rl.close(); }
if (password.length < 16) console.error('警告：密碼少於 16 字。加密檔會公開在網站上，短密碼可能被暴力破解。');
const bundle = await encryptRoster(text, password);
if (await decryptRoster(bundle, password) !== text) throw Error('加密驗證失敗');
const rows = text.split(/\r?\n/).filter(l => l.trim()).length - 1;
console.error(`已加密 ${rows} 位參加者。請把輸出的一行 JSON 完整貼到 GitHub Secret「ROSTER_ENC」。`);
process.stdout.write(JSON.stringify(bundle) + '\n');
