# 自動化驗證與實機界線

執行 `npm test` 跑 Vitest；`npm run build` 執行嚴格 TypeScript 與 Vite 生產建置，產生完整 service worker。測試使用虛構資料，不自動匯入正式 App。

- `tests/core.test.ts`：正式原始 GPX 的 SHA、821/22、約 12.51 km、閉合、無海拔、5 個路線外點，保留原始 waypoint 名稱與座標；米制投影與閉合候選；非法 GPX 拒絕；必填、三類及 S99；去重、衝突與跨活動；繁中 CSV 引號／換行／BOM／公式防護；CSV／JSON 名單錯誤；匿名版與備份路線驗證。
- `tests/db.test.ts`：fake-indexeddb 模擬真實 IndexedDB API，新增、編修、軟刪除、關閉重開、過期版本阻擋、原子匯入及歷史、預覽變動後中止、1000 筆、活動隔離、切換來源不改事件、V1→V2 遷移、名單不改 snapshot、資料清除。
- `tests/ui.test.ts`：jsdom 實際載入應用模組，操作三類表單、自訂教官、必填檢查、定位拒絕／逾時、低精度取消推測、編修保留來源、未存變更提示、跨活動及同步阻止表單預設導覽。
- `tests/sw.test.ts`：執行真正 build-sw 產生器，以隔離快取／事件模型模擬 install/activate/fetch；驗證 shell、GPX、JSON、圖示全部預快取，網路失敗可回 index、JS 與 GPX，清理只限此 App 舊版。不把此模擬當作真實瀏覽器或手機測試。

本環境 Sites managed preview 缺少 `cua_repl.js` 瀏覽器控制，按技能限制未另啟預覽或安裝替代瀏覽器。未執行真實 Chrome／Safari 的 service worker、PWA 安裝、背景／程序關閉後重啟與 GNSS 實測；未測 Excel／Google Sheets 真正開檔。這些全部列在 `acceptance.md`。外觀以響應式 CSS 與 DOM 測試驗證，未取得實際手機截圖。30 秒操作目標與 1000 筆真實手機反應時間也尚未量測。

重現時先 `npm ci`，再 `npm test && npm run build`。測試成功僅表示上述自動化範圍通過；實機簽核後才建議用於正式活動。

本次執行結果（2026-11-10）：4 個測試檔、31 項測試通過；TypeScript 檢查與 Vite 生產建置成功，service worker 預快取 8 個資產。無真實手機通過聲明。完整交付 ZIP 包含此次建置的 dist，可直接作 HTTPS 靜態部署。
