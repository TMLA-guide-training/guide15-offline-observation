# 資料與離線設計

- `src/types.ts` 定義事件 schemaVersion=1、教官、參加者、GPS、路線與完整備份。
- IndexedDB `guide15-observation`，資料庫 version=2。V1 建立基本 object stores；V2 以 additive migration 補匯入歷史時間索引。既有事件不刪除；versionchange 關閉舊 connection，升級 blocked 提醒關閉其他分頁。
- events 主鍵是 `[assessmentId,eventId]`，以活動篩選。事件 UUIDv4、姓名 snapshot、建立時間及來源路線版本在編修時保留；事件時間可人工修正，未改時保留原字串與 offset。
- settings 儲存裝置 UUID、教官、活動、路線及工程門檻；participants、instructors、routes、history 都使用 IndexedDB，沒有 localStorage 事件副本。
- 儲存只在 transaction.oncomplete 回報成功。更新以原始事件內容作樂觀併發檢查，過期分頁不會覆寫；衝突時表單保留，使用者需先複製文字後重新開啟最新事件。
- JSON 備份採跨 stores 的同一唯讀交易，取得一致快照。完整匯入先驗格式、事件、原始 GPX 的 SHA 與幾何，再預覽，不寫入資料。確認後在單一跨 stores 交易檢查事件快照是否仍一致，再寫事件、補缺少的名單／路線及記錄歷史；中止時全部回滾。
- 名單直接匯入具預覽，錯誤／檔內重複阻止寫入；同編號姓名變更顯示於預覽。手動更正同編號需確認。事件 snapshot 獨立保存。名單匯入為一個 store 的交易，歷史另存；若歷史寫入失敗，名單可能已完成，重試前先查名單。
- GPX 原始 XML 保留；SHA-256 對原始 UTF-8 內容計算，讀檔保留 BOM。拒絕多條 track／多個 segment，避免跨斷段連線。2D 距離用球面 haversine；點到線段採 GPS 緯度的米制 equirectangular 局部投影，適用本次小區域路線，非專業測量。
- GPS 只按鈕單次取得，保存完整原始 lat/lon、accuracyM 及擷取時間。多個接近線段按距離容差篩選，里程相差 >150 m 保留為不同候選；閉合起終點可有 0 km 與全程候選。這是工程啟發式，仍可能遺漏近距離複雜折返，須教官確認文字地點。差精度與離軌只顯示提醒，絕不自動填肯定路段。
- service worker 由 build 生成，以所有資產的內容雜湊分版。install 原子預快取 shell、JS/CSS、圖示、GPX 與 route_data；cache-first 提供同來源已快取資源，離線導覽回 App shell。只在 activate 刪此 App 舊 cache，不清除 IndexedDB；不 skipWaiting 強迫現場更新。
- 清除資料須兩次確認，清空所有 object stores 後載入內建路線，形成新 deviceId。不刪靜態快取，故離線亦可重新準備。此操作無還原功能，請先備份。

不建立外部資料收集、後端或資料自動上傳。Sites 僅提供靜態檔案託管；姓名、事件與備份不會送給 Sites API。下載檔案仍需要使用者實際另存，不能以觸發下載就保證備份成功。
