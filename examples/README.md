範例均為虛構資料，不是正式名單或觀察。只在測試裝置匯入。

- participants.csv / .json：相同參加者名單。
- instructors.csv：虛構教官名單。
- example.backup.json：1 筆虛構事件，測試正常／重複匯入。修改 observationText 保留 ID 可測衝突。
- 1000-events.backup.json：1000 筆虛構事件，測試匯入、搜尋、編修、分頁與匯出。許多事件時間相近，會出現人工核對提示，這是預期結果。

範例備份省略路線副本，引用 App 預載的正式 GPX SHA；因此需先正常啟動 App 以建立正式路線。實際「完整 JSON 備份」會包含所有原始路線，可還原。可用 `python scripts/generate-examples.py` 重新產生範例；重產會更換測試 UUID。
