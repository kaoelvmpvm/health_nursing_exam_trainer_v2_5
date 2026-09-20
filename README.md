# 高中健護教甄刷題記憶系統 v2.5

建議 GitHub Repo：`health-nursing-exam-trainer`

## 題庫規模

- 近年高中健康與護理科真題：576 題
- 其中新北市高中聯招 112～115：200 題
- 自編仿真題：90 題
- App 可作答題庫總數：666 題
- 複選題：9 題

## 主要功能

- 今日智慧練習：到期複習 → 高信心答錯 → 弱點 → 新題
- 新北 112～115 真題專區、全部高中健護真題、近期真題與來源／年份／領域練習
- 單選與複選題
- 錯題本、高信心答錯盲點、錯因分類
- 知識點鏢靶練習、間隔複習、熟練度
- 模擬考、知識地圖、來源別統計
- 576 題真題題目級深度解析：核心概念 → 套回本題 → 逐選項 → 考場帶走
- 法規、政策、篩檢資格、指引與統計等時效題警示
- PWA，可加入 iPhone／iPad 主畫面
- 進度 JSON 備份／還原、錯題 CSV 匯出
- **v2.5 詳解升級工作台**：可把解析不足題標記後交給 GPT 重寫，再匯回 App

## v2.5 詳解升級流程

1. 刷題後若覺得解析不夠細，按 **「標記詳解需加深」**。
2. 到 **「詳解升級」** 分頁。
3. 可複製待升級題號、複製完整 GPT 任務，或下載 Markdown 任務檔。
4. GPT 依固定 JSON 結構回傳：`id / teach / solve / options / memory / sourceNote`。
5. 將 JSON 貼回 App，或匯入 JSON 檔。
6. 下次再刷到同一題，系統會優先顯示 **「自訂升級詳解」**。
7. 若新版不理想，可在工作台一鍵「還原內建詳解」。

自訂詳解只改解析，不會修改原題、選項或公布答案。標記、註記與自訂詳解都包含在「匯出進度 JSON」中，可一起備份。

## GitHub Pages 部署

1. 建立 Repo：`health-nursing-exam-trainer`
2. 將此資料夾內所有檔案上傳到 Repo 根目錄。
3. GitHub → **Settings → Pages**。
4. **Build and deployment → Source** 選 `Deploy from a branch`。
5. Branch 選 `main`、資料夾選 `/(root)`，儲存。
6. 等 GitHub Pages 網址出現後，以 Safari 開啟。

## iPhone / iPad 安裝

1. 用 Safari 開啟 GitHub Pages 網址。
2. 點「分享」。
3. 選「加入主畫面」。
4. 更新程式碼時，一般不會清掉 localStorage；但清除 Safari 網站資料、刪除站點資料或換裝置前，建議先匯出進度 JSON。

## 重要檔案

- `index.html`：入口與分頁
- `app.js`：刷題、記憶、詳解升級工作台
- `style.css`：桌機／iPhone 排版
- `questions.js`：題庫
- `deep_items_112.js`～`deep_items_all_remaining.js`：內建逐題詳解
- `service-worker.js`：PWA 離線快取
- `詳解匯入格式範例.json`：GPT 詳解回填格式示例
- `UPDATE_v2.5.md`：本版更新說明
