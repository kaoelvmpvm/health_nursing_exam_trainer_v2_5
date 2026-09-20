# v2.1 更新方式

## GitHub Repo

將本資料夾內所有檔案上傳到 Repo 根目錄，直接覆蓋同名檔案。

本版新增一個檔案：

- `remediation.js`：錯後 30 秒補救知識庫

請確認 Repo 根目錄至少有：

- `index.html`
- `app.js`
- `style.css`
- `questions.js`
- `remediation.js`
- `manifest.json`
- `service-worker.js`
- `icon-180.png`
- `icon-192.png`
- `icon-512.png`

## iPhone 已加入主畫面的舊版如何更新

本版已將 Service Worker 快取名稱改為 `hn-exam-v2-2`，正常重新開啟 App 後會接手新版資源。

若仍看到舊版：

1. 先用 Safari 開啟 GitHub Pages 網址並重新整理一次。
2. 完全關閉主畫面上的健護教甄 App，再重新開啟。
3. 若仍未更新，可刪除主畫面舊捷徑後，再由 Safari「加入主畫面」。

作答進度保存在瀏覽器 localStorage；更新前建議先到「設定／匯入」匯出進度 JSON。

## v2.1 核心改動

- 答後「30 秒補救」：核心概念、辨別關鍵、一句記憶、同類題判斷。
- 顯示「你剛才選」與「正確答案」，快速定位錯誤。
- 逐選項檢視改為折疊區，手機不會一口氣出現大量文字。
- 原始題庫解析另放折疊區，與概念補救分離。
- iPhone 題幹／選項字級、行距、留白、按鈕觸控區域全面放大。
- iPhone 長解析時，「鏢靶類題／下一題」固定在底部。
- 支援 Safe Area，避免瀏海與 Home Indicator 壓到內容。
- 設定可切換閱讀字級：緊湊、舒適、大字、特大字。
