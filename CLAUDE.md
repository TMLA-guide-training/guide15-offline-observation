# CLAUDE.md — 15期評測紀錄 PWA

給 Claude（及接手的人）的專案說明。**請用繁體中文回覆使用者。**

## 這是什麼

第15期初級嚮導訓練「素養與體能評測」（2026-12-13）教官用的手機網頁 App（PWA），記錄對參加者的觀察（正向／待改善／安全事件）。不計分、不排名、不判斷錄取。之後第16、17期可能繼續使用。

- 線上網址（固定，**不可更改**）：https://tmla-guide-training.github.io/guide15-offline-observation/
- GitHub repo：`TMLA-guide-training/guide15-offline-observation`（Public，推送帳號 keyw007）
- 純前端 TypeScript + Vite，無框架、無後端、無帳號。資料只存在各手機的 IndexedDB，可離線使用。

## 部署與發版

- 推送到 `main` → GitHub Actions（`.github/workflows/deploy.yml`）在雲端執行 `npm ci`、`npm test`、`npm run build`，**測試通過才部署** GitHub Pages。本機不需要安裝 Node。
- **每次發版都要調高 `package.json` 的 `version`**（App 顯示的版本號來自這裡；`npm version x.y.z --no-git-tag-version` 會同步 lock 檔）。
- 網站在子目錄，所以 build 使用 `vite build --base=./`，所有路徑必須是相對路徑（`./...`），不要寫 `/assets/...` 這類絕對路徑。
- 本機要跑測試時需 Node 22.12+。公司網路有 SSL 攔截，npm 需設 `NODE_USE_SYSTEM_CA=1`。

## 已確定的設計決定（修改前請先確認使用者同意）

1. **名單絕不 commit 進 repo**：repo 與網站都是公開的。正式參加者名單由總教官私下（LINE）傳給教官，在 App 內匯入。`examples/` 只放虛構資料。
   - **內建加密名單（V1.2 起，使用者同意）**：名單以密碼加密（AES-256-GCM、PBKDF2-SHA256 600000 次，`src/rosterCrypto.ts`），加密後的 JSON 存在 GitHub Secret `ROSTER_ENC`，build 時由 `scripts/write-roster.mjs` 寫成 `dist/roster.enc.json`。repo 與 git 歷史都沒有名單。教官在首次設定輸入總教官給的密碼即可載入；檔案匯入仍保留。加密檔在網站上是公開的，密碼須 16 字以上隨機。操作步驟見 `docs/roster-secret.md`。評測結束後刪除 Secret 並重新部署。
2. **首次開啟強制設定**：必須先輸入教官姓名、匯入參加者名單才能使用（`needsSetup()`／`renderSetup()`）；完成後不再要求。
3. **教官自行輸入姓名**，不建教官名單。改名只更新同一個 instructorId 的 displayName，已存事件保留姓名快照。
4. **名單格式**：CSV 第一列 `participant_id,name`（也接受 `編號,姓名`），UTF-8／BOM 或 Big5 皆可（`decodeText`、`parseRoster` in `src/core.ts`）；或 JSON 陣列。
5. **事件地標選單**：全部原始地標與路線外參考點，但排除名稱以「人形立牌」「平等里」開頭者（`MENU_EXCLUDE` in `src/core.ts`），目前 11 個。不需總教官勾選核定。
6. **沒有「路線資料」頁**：GPX 另由總教官在 LINE 提供。App 仍內建 `public/route.gpx` 做 GPS 位置推測。
7. **`public/route.gpx`、`public/route_data.json` 位元組不可修改**：App 啟動時核對 SHA-256（`d96b8cf3…5c4ac`）、點數與距離；`.gitattributes` 設為 binary 防止換行轉換。換路線須兩檔一起換並重新核對。
8. **自動更新**：App 啟動、回到前景、恢復連網、每 30 分鐘檢查新版 service worker；沒有未儲存表單／匯入預覽時自動 `SKIP_WAITING` 並重新載入，否則顯示提示，儲存後才更新。設定頁有「檢查更新」按鈕。**絕不在教官填表時強制重新載入。**
9. 主畫面名稱「15期評測紀錄」（`public/manifest.webmanifest` 的 name/short_name 與 `index.html` 的 `apple-mobile-web-app-title`）。
10. 已移除「安裝與開發交付檔案（連網下載）」區塊；`scripts/package-delivery.py` 已不需要。
11. **備份頁以完整 JSON 為主**（V1.2.1）：事件 CSV 與匿名討論版收在摺疊的「總教官整理用」。
12. **雲端備份上傳**（V1.3）：按「完整 JSON 備份（上傳雲端）」時只 POST 到 Google Apps Script（不下載，避免 iOS 跳出預覽；另有「另存到手機」按鈕）（`src/upload.ts`、`src/upload-config.ts`、`scripts/apps-script/Code.gs`），存進雲端資料夾「04_評測紀錄APP / 教官備份上傳」。離線時提醒並標記待上傳，連網後自動補傳。通行碼由名單密碼推導，只存在 localStorage。設定見 `docs/cloud-backup.md`。
13. **總教官一鍵合併**（V1.4）：總教官密碼（`LEAD_TOKEN`，與名單密碼分開）向 Apps Script 取回每台裝置最新一份備份，`combineBackups`（`src/backup.ts`）合併成一次預覽後沿用原本的合併流程。檔案匯入也可一次多選。
14. **稱謂一律用「總教官」**（V1.5，原「主課」）。程式內部識別名稱（`LEAD_TOKEN`、`notifiedLead`、`leadTokenFor`）不改。
15. **「是否已通知總教官」只用於安全事件**（V1.5）：待改善不顯示，儲存為 `notifiedLead: null`（未記錄）；舊資料不改寫。
16. **「教官備份上傳」資料夾沿用上層分享（使用者決定）**：教官（上層資料夾編輯者）可在雲端硬碟直接看到彼此的備份；總教官密碼只限制 App 內的一鍵合併。不要擅自改資料夾權限。
17. **V1.6**：儲存／刪除事件後自動背景上傳（`afterEventChange`、`syncUpload`，待上傳標記為變更戳記，上傳中有新變更會再傳）；頂端「☁ 已同步／N 筆待上傳」；雲端每支手機一份檔（Apps Script 依裝置碼覆寫）；合併衝突可一鍵「全部採用最後修改的版本」；啟動時自動請求永久儲存；事件 CSV 改為中文欄位與選項、依編號→時間排序、不含已刪除事件。
18. **文字地點選填**（V1.7）：`validateEvent` 只要求字串型別；地點與 GPS 皆空時表單顯示提醒（不阻擋），清單與 CSV 顯示「未填地點」。

## 程式結構

- `src/main.ts`：全部 UI（字串模板 render）、首次設定、版本更新。
- `src/core.ts`：GPX 解析、GPS 路段推測、CSV／名單解析、合併計畫、CSV 匯出。
- `src/db.ts`：IndexedDB（`guide15-observation`，version 2）。修改 schema 必須是 additive migration，不可刪除既有事件。
- `src/backup.ts`：JSON 備份驗證與匿名匯出。
- `scripts/build-sw.mjs`：build 後依內容雜湊產生 `dist/sw.js`（預快取全部資產）。
- `tests/`：Vitest + jsdom + fake-indexeddb。改功能時同步更新／新增測試；`npm test` 必須全過。

## 驗收

- 實機驗收清單：`docs/acceptance.md`（iOS Safari、Android Chrome，一般分頁與主畫面安裝，飛航模式）。
- 教官操作說明：`docs/instructor.md`。Service worker 與離線行為只能在真實手機（HTTPS）驗證，桌面模擬不算數。

## 換期別（第16期之後）

保持同一網址。需更新：活動識別碼 `ASSESSMENT`（`src/types.ts`）、側欄的期別與日期文字（`src/main.ts`）、主畫面名稱、如有新路線則更換 GPX 與 route_data（見第 7 點）。請教官先匯出 JSON 備份，再於設定頁清除舊資料、匯入新名單。
