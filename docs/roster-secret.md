# 內建加密名單（GitHub Secret `ROSTER_ENC`）

教官在首次設定輸入密碼，就能載入參加者名單，不用另外傳檔案。

- 名單**不放進 repo**，git 歷史裡也沒有。加密後的內容存在 GitHub Secret `ROSTER_ENC`，部署時才寫成網站上的 `roster.enc.json`。
- `roster.enc.json` 是公開的，任何人都能下載，但沒有密碼解不開。**安全性完全取決於密碼**：請用 16 字以上的隨機密碼，只透過 LINE 私下給教官。
- 加密方式：AES-256-GCM，金鑰由密碼以 PBKDF2-SHA256（600000 次）推導（`src/rosterCrypto.ts`）。

## 設定或更新名單

1. 準備 CSV，第一列 `participant_id,name`（或 `編號,姓名`），UTF-8 或 Big5。**不要放進 repo 資料夾**。
2. 加密（需要 Node 22.18+，或請 Claude 代做）：
   ```
   ROSTER_PASSWORD='你的密碼' node scripts/encrypt-roster.mjs 名單.csv > roster.enc.json
   ```
   輸出是一行 JSON。`*.enc.json` 已列入 `.gitignore`。
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**（已存在則點 `ROSTER_ENC` 的鉛筆圖示更新）。名稱 `ROSTER_ENC`，值貼上整行 JSON。
4. 重新部署：**Actions → 測試並部署到 GitHub Pages → Run workflow**（或推送任何更新到 `main`）。
5. 部署完成後，用手機開啟 App（已設定過的手機到「名單與設定」）確認密碼可以解鎖。

更換名單或密碼都重做 2–4。已匯入名單的手機不會自動改變，需要在「名單與設定」重新輸入密碼匯入。

## 評測結束後刪除

1. 刪除 Secret `ROSTER_ENC`。
2. 重新部署（步驟 4）。新版網站不再有 `roster.enc.json`，手機自動更新後快取也會移除。
3. 請教官匯出 JSON 備份交給總教官後，在「名單與設定」清除此裝置全部資料。

上線期間已被下載走的加密檔無法收回，所以密碼不要沿用到其他地方。
