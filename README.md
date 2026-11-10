# 高中健護教甄刷題記憶系統 v2.6

GitHub Repo：`health_nursing_exam_trainer_v2_5`

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
- **v2.6 學習筆記**：自行記錄、下次答錯提示、筆記本集中管理

## v2.6 學習筆記流程

1. 每次作答後，保留原本的正解與逐選項詳解，並提供「我的學習筆記」。
2. 可記下錯因、判斷技巧、口訣，輸入時自動儲存在瀏覽器。
3. 再次答錯同一題時，會顯示先前筆記提醒。
4. 錯題本、學習筆記分頁和模擬考檢討均可檢視及編輯筆記。
5. 進度 JSON 備份／還原包含個人筆記，錯題 CSV 也會附上筆記。
6. 取消 v2.5 的 GPT 詳解匯出／匯入流程；既有「待升級」審閱註記會轉入學習筆記。

筆記存在使用者的本機瀏覽器；跨裝置前須先備份進度 JSON。

## GitHub Pages 部署

1. 使用 Repo：`health_nursing_exam_trainer_v2_5`
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
- `app.js`：刷題、記憶、學習筆記
- `style.css`：桌機／iPhone 排版
- `questions.js`：題庫
- `deep_items_112.js`～`deep_items_all_remaining.js`：內建逐題詳解
- `service-worker.js`：PWA 離線快取
- `詳解匯入格式範例.json`：v2.5 留存參考檔，現版不再使用
- `UPDATE_v2.6.md`：本版更新說明
