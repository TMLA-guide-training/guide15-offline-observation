// 15期評測紀錄：教官備份上傳（Google Apps Script 網頁應用程式）
// 設定步驟見 docs/cloud-backup.md。
// 部署：執行身分＝我（資料夾擁有者），存取權＝任何人。
// 指令碼屬性 UPLOAD_TOKEN＝教官上傳通行碼（SHA-256("guide15-upload:"+名單密碼) 的 16 進位）。
// 指令碼屬性 LEAD_TOKEN＝總教官讀取通行碼（SHA-256("guide15-lead:"+總教官密碼) 的 16 進位），用於一鍵合併。
const FOLDER_ID = '1qIGi1x7QULrHG33wcs_Vh5bB_rkHROjL'; // 雲端資料夾「04_評測紀錄APP」
const SUBFOLDER = '教官備份上傳';
const MAX_BYTES = 20 * 1024 * 1024;

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > MAX_BYTES) return out({ ok: false, error: 'too_large' });
    const req = JSON.parse(raw);
    if (req.action === 'list') return listBackups(req);
    const expected = PropertiesService.getScriptProperties().getProperty('UPLOAD_TOKEN');
    if (!expected || typeof req.token !== 'string' || req.token !== expected) return out({ ok: false, error: 'auth' });
    const b = req.backup;
    if (!b || b.kind !== 'guide15-backup' || b.schemaVersion !== 1 || !Array.isArray(b.events) || typeof b.deviceId !== 'string') return out({ ok: false, error: 'invalid' });
    const safe = s => String(s || '').replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0, 40) || '未填';
    const when = String(b.exportedAt || '').slice(0, 16).replace('T', '_').replace(':', '');
    const name = `備份_${safe(req.instructor)}_${safe(when)}_${safe(b.deviceId).slice(0, 8)}.json`;
    folder().createFile(name, JSON.stringify(b, null, 2), 'application/json');
    return out({ ok: true, name });
  } catch (err) {
    return out({ ok: false, error: err instanceof SyntaxError ? 'invalid' : 'server' });
  }
}
// 總教官一鍵合併：回傳每台裝置最新的一份備份（依檔名結尾的裝置碼分組、取最新建立者）。
function listBackups(req) {
  const lead = PropertiesService.getScriptProperties().getProperty('LEAD_TOKEN');
  if (!lead || typeof req.token !== 'string' || req.token !== lead) return out({ ok: false, error: 'auth' });
  const latest = {}; let total = 0;
  const it = folder().getFiles();
  while (it.hasNext()) {
    const f = it.next(), name = f.getName();
    if (!/\.json$/i.test(name)) continue;
    total++;
    const m = name.match(/_([^_]+)\.json$/i), device = m ? m[1] : name, created = f.getDateCreated().getTime();
    if (!latest[device] || created > latest[device].created) latest[device] = { file: f, created };
  }
  const files = Object.keys(latest).map(k => ({ name: latest[k].file.getName(), content: latest[k].file.getBlob().getDataAsString('UTF-8') }));
  return out({ ok: true, total, files });
}
function doGet() { return out({ ok: true, service: 'guide15-backup-upload' }); }
function folder() {
  const parent = DriveApp.getFolderById(FOLDER_ID), it = parent.getFoldersByName(SUBFOLDER);
  return it.hasNext() ? it.next() : parent.createFolder(SUBFOLDER);
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
// 在編輯器手動執行一次，以授權雲端硬碟存取並確認資料夾可寫入。
function testSetup() { Logger.log('上傳資料夾：' + folder().getUrl()); Logger.log('UPLOAD_TOKEN 已設定：' + !!PropertiesService.getScriptProperties().getProperty('UPLOAD_TOKEN')); Logger.log('LEAD_TOKEN 已設定：' + !!PropertiesService.getScriptProperties().getProperty('LEAD_TOKEN')); }
