# 第15期初級嚮導訓練｜15期評測紀錄

可實際儲存資料的手機優先、純前端 TypeScript + Vite PWA。事件、名單、路線及匯入歷史存於 IndexedDB，無帳號、應用伺服器、雲端同步、外部分析、CDN 或持續位置追蹤。事件不計分、不排名、不判斷錄取。

## 安裝與啟動

需要 Node.js 22.12+（本次使用 24.22.1）及 npm。

```sh
npm install
npm test
npm run build
npm run preview
```

依終端網址開啟。開發使用 `npm run dev`；**離線驗收必須使用 build 後的 dist，不使用 Vite 開發模式**。`npm ci` 可用鎖檔重現依賴。npm 快取目錄無寫入權時可加 `--cache ./work/npm-cache`。

`npm run build` 先執行 TypeScript 檢查，再產出 `dist/`，最後依所有資產內容雜湊生成 `dist/sw.js`。所有關鍵資源與正式 GPX／route_data 預快取；安裝任何一個資產失敗，整個 service worker 安裝就不會完成。App 顯示「離線資源已就緒」後仍應先試一次離線重開。

## GitHub Pages 部署（目前採用）

`npm run build` 使用 `--base=./`，產出的所有路徑都是相對路徑，可部署在專案網址子目錄，例如 `https://帳號.github.io/guide15/`。

推送到 `main` 分支後，`.github/workflows/deploy.yml` 會在 GitHub 雲端自動執行 `npm ci`、`npm test`、`npm run build`，測試通過才部署 `dist/`；本機不需安裝 Node。首次使用需到 repo 的 Settings → Pages → Source 選「GitHub Actions」。

注意：repo 為公開時，**切勿 commit 真實教官或參加者名單**；正式名單請私下傳給教官，在 App 內匯入；或以密碼加密後放在 GitHub Secret，見 `docs/roster-secret.md`。GitHub Pages 無法自訂快取標頭，新版發佈後教官端最多約 10 分鐘才取得新的 index.html。不要更改 repo 名稱或網址，換網址等於換一份本機資料。

## HTTPS 部署

將 **dist 目錄內的全部檔案** 原樣部署到任一靜態 HTTPS 網站的獨立來源根目錄。不需要 Node 伺服器、不需要環境變數或資料庫服務。建議每個活動使用固定 HTTPS origin，避免改網域造成另一份本機資料。

伺服器需正確提供 `.js` 為 JavaScript、`.webmanifest` 為 `application/manifest+json`、GPX 為 XML，並讓不存在的資產回傳 404，避免 HTML 被當成 JavaScript。對 `index.html`、`sw.js` 設 `Cache-Control: no-cache`；雜湊命名的 `assets/*` 可設長期快取。先部署所有新版資產，再切換 index 與 sw；保留舊 assets 供開啟中的舊版使用。Service worker 不強制更新現場未存表單；關閉所有 App 分頁與獨立視窗後重開才切換新 worker。正式部署建議採 origin 根目錄；子目錄部署需自行設定 Vite base，並重新驗證 scope／資產路徑。

手機透過 Wi-Fi 連電腦的 `http://LAN-IP` **不是**安全來源，通常無法啟用 service worker／GPS。不要用這個方式判斷離線安裝失敗。localhost 可供本機測試；真實手機請使用 HTTPS。

### iPhone／iPad

1. 用 Safari 開啟 HTTPS 網址，等待「離線資源已就緒」。
2. 分享 → 加入主畫面 → 加入；再從主畫面啟動。
3. 設定教官、匯入正式名單、確認路線；做一次 JSON 備份。
4. 按 docs/acceptance.md 驗證飛航模式。一般 Safari 與主畫面模式都需驗收，兩者儲存空間在部分系統情況可能分離，不可假定資料互通。

### Android

1. 用 Chrome 開啟 HTTPS 網址，等待「離線資源已就緒」。
2. 瀏覽器選單 → 安裝應用程式／加到主畫面。
3. 從圖示開啟並設定、匯入名單；再執行飛航模式驗收。

## 操作與合併

- 教官快速指南：[docs/instructor.md](docs/instructor.md)
- 總教官合併資料指南：[docs/merge-guide.md](docs/merge-guide.md)
- 實機驗收表：[docs/acceptance.md](docs/acceptance.md)
- 測試與已知界線：[docs/testing.md](docs/testing.md)
- 資料設計與遷移：[docs/architecture.md](docs/architecture.md)
- 本次正式 GPX 核對：[docs/gpx-verification.json](docs/gpx-verification.json)

範例名單與備份在 `examples/`，全部為明確標示的虛構資料，不會自動匯入。正式教官、參加者名單由總教官提供。

## 資料來源與路線替換

`public/route.gpx` 是使用者上傳的原始「15期素養體能評測.GPX」，**未修改位元組**。`public/route_data.json` 是上傳的 route_data_v1 原檔。初次啟動解析 GPX，核對 JSON 的 SHA、點數及距離後存入 IndexedDB。已建立資料庫的裝置可直接使用本機路線。

核對結果：821 trackpoints、22 waypoints、約 12.512139 km、閉合、沒有 track ele，track time 僅 1 點，不能推導實際速度／步行時間。SHA-256：`d96b8cf34706833050d37bffc542b9108315acc186b75b71796925687e15c4ac`。12.84 km 等人工統計不混入幾何資料。介面保留 5 個離軌地標及全部原始座標。

V1.1 起 App 不再提供「路線資料」頁，GPX 另由總教官在 LINE 提供；App 仍使用內建 GPX 做 GPS 位置推測。事件地標選單固定為全部原始地標與路線外參考點，但排除「人形立牌」與「平等里(公車撤退點-303/小19)」（規則在 `src/core.ts` 的 `MENU_EXCLUDE`）。未有原始 waypoint 的位置可直接手填文字，不捏造座標。

## 備份與限制

完整 JSON：所有活動、事件與軟刪除標記、名單、原始路線、設定、匯入歷史。CSV：目前活動的事件，中文欄位與選項、依參加者編號→時間排序、不含已刪除事件（刪除紀錄保留在完整 JSON），UTF-8 BOM、完整 quote／換行處理、公式字元防護。匿名討論版省略自由文字、姓名、GPS、裝置及路線，避免姓名藏在自由文字；保留參加者編號，不可作還原檔。

匯入採 `assessmentId + eventId` 去重，同 ID 不同內容需逐筆選擇；不同 ID 的同人同類、5 分鐘內事件會保留並提示人工核對。這是提示，不是重複事件判定。預覽後若其他分頁變更事件，交易中止，須重新預覽。匯入名單不更動事件姓名快照；備份內同 ID 名單／路線已有版本則保留本機，新增缺少項目。恢復到新裝置時保留新的來源裝置 ID，不採用來源手機的活動／教官設定，請再手動選擇。

本機儲存不等於永久備份，瀏覽器清理、私人模式、換網域或裝置遺失都可能造成無法取回。資料不加密；請使用裝置鎖定並由總教官控管備份檔。保留期限由總教官訂定，設定頁提供雙重確認清除。首次載入需要網路，GPS 不成功仍能存文字紀錄。實機測試狀態請看 testing.md，不宣稱已驗證所有手機。

## 首次設定、名單與版本更新（V1.1）

- 第一次開啟必須先輸入教官姓名、匯入參加者名單才能使用；資料存在 IndexedDB，之後開啟不需再設定。教官不另建名單。
- 參加者名單 CSV：第一列 `participant_id,name`（也接受 `編號,姓名`），UTF-8（含 BOM）或 Big5 皆可；也可用 JSON 陣列 `[{"participant_id":"A01","name":"王小明"}]`。範例見 `examples/participants.csv`，App 內也可下載範例。
- 版本號來自 `package.json` 的 `version`，顯示於選單下方與設定頁。發佈新版時請一併調高版本號。
- App 啟動、回到前景、恢復連網及每 30 分鐘會檢查新版 service worker；有新版且沒有未儲存表單或匯入預覽時自動套用並重新載入，否則顯示提示，儲存／取消後再更新。設定頁有「檢查更新」按鈕。

Sites 私人託管網址的入口可能要求 ChatGPT 擁有者登入；那是託管平台存取控制，App 本身沒有帳號或登入流程。教官們正式使用無帳號的純前端部署時，請依上方 HTTPS 指南將 dist 部署到總教官選定的固定來源，不需任何 Sites API。
