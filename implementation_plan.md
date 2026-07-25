# 線上即時投票系統 (Live Poll App) 實作計畫

本專案旨在建立一個視覺效果優美、支援即時更新 (Real-Time Live Sync) 的線上投票 Web 應用程式。發起人需登入 Google 帳號，投票人無須登入即可進行投票，並有防止重複投票機制、時間限制、以及「投票前是否可觀看即時結果」的設定。

特別針對 **GitHub Pages 靜態託管** 進行 URL 路由設計，確保透過專屬連結或 QR Code 分享時不會發生 404 錯誤。

---

## 🌐 GitHub Pages 相容與連結分享機制 (GitHub Pages Routing)

1. **靜態託管 404 防禦**：
   - 使用 **URL Query Parameter (例如：`?poll=POLL_ID`)** 或 **Hash Routing (例如：`/#poll/POLL_ID`)**。
   - 不論網址包含任何投票 ID，重新整理頁面或以任何手機瀏覽器開啟時，GitHub Pages 都能完美載入 `index.html` 並自動識別投票 ID 展現該投票頁面。
2. **一鍵複製與 QR Code 分享**：
   - 建立投票成功後自動彈出「分享與 QR Code 視圖」。
   - 提供「一鍵複製連結」按鈕，產生的 URL 會自動包含當前網站完整 Base Domain 與 Query/Hash Path。
   - 支援動態繪製 Mobile QR Code，方便現場相機掃碼直接進入投票。

---

## 💡 即時同步說明 (不需要 SignalR / 自訂 Server)

本專案使用 **Firebase Cloud Firestore 的 `onSnapshot()` 即時監聽機制**。
- 內部自動維護 WebSocket / HTTP 長輪詢雙向通道，當有任何參與者投票時，Firestore 會在幾毫秒內主動將最新票數推送給所有正在瀏覽該投票頁面的手機/電腦用戶。
- **完全不需要架設 SignalR、Node.js 伺服器或自訂 Backend**，純前端 (React + Firebase Web SDK) 即可實現完全即時的實時票數刷新。

---

## 🎯 需求規格與設計目標

1. **🔗 GitHub Pages 專屬分享連結 (Share Link)**：
   - 發起投票後可產生直接點擊即進入該投票的獨特網址 (`https://<user>.github.io/live-poll/?poll=xxx`)。
2. **🔒 投票前結果可視度設定 (Results Visibility Control)**：
   - 發起人在建立投票時可勾選設定：
     - **預設 (投票後解鎖)**：「未投票前隱藏結果」— 參與者必須完成投票（或投票已截止）才能解鎖查看統計圖表。
     - **開放式 (隨時可看)**：「投票前即可查看結果」— 提供「查看即時票數」按鈕，讓尚未投票的人也能隨時看最新的動態統計。
3. **📱 手機端極致優化 (Mobile-First UI/UX)**：
   - 滿版與大觸控區塊 (48px+ Touch Targets)，方便在智慧型手機上順暢投票與點擊。
   - 票數統計圖表與長條圖自動適應小螢幕，避免溢出或文字擠壓。
   - 導覽列與彈窗 (Modal) 在手機端自動轉換為底部 Sheet 樣式或全螢幕流暢動畫。
4. **🔐 發起人認證 (Creator Auth)**：
   - 發起投票人需登入 Google 帳號 (使用 Firebase Auth Google Provider)。
5. **🔥 Firebase 模組化與 Mock 設定 (Firebase Config)**：
   - 預設提供結構完整之配置檔，使用者未來只需替換 Firebase API Keys 即可直接運作。
6. **🚫 免登入單次投票 (Anonymous Single Vote)**：
   - 投票者不需要登入即可參與投票。
   - **雙重防重複投票機制**：結合瀏覽器 `localStorage` 紀錄與 Firebase Firestore 裝置 Fingerprint ID 紀錄，防止同一個瀏覽器/裝置重複投票。
7. **⏱️ 投票時間限制 (Time-Limited Polls)**：
   - 發起人可選擇「不限時間」或設定「截止時間」（例如：10分鐘、1小時、24小時或自訂日期時間）。
   - 投票頁面包含動態倒數計時器，過期後自動鎖定並顯示「投票已截止」。
8. **📊 即時動態票數更新 (Real-Time Live Results)**：
   - 使用 Firebase Firestore `onSnapshot` 實現無重新整理的票數即時更新。
   - 票數長條圖帶有百分比與平滑動畫。
9. **📖 README.md 與 專案架構對齊**：
   - 撰寫完整且清晰的 `README.md`（包含專案簡介、Firebase Console 設定步驟、Firestore Security Rules、開發與部署指令）。

---

## 🛠 技術棧與架構設計

- **前端框架**：React 19 + Vite
- **UI & 樣式架構**：
  - 參考 `youtubegetlink` 專案樣式分層模式：
    - `variables.css`: 色彩變數、字型、圓角、Glassmorphism 設定
    - `base.css`: 全局 reset 與字型設定
    - `layout.css`: 卡片、按鈕、圖表與彈窗佈局
    - `responsive.css`: 手機版 (`@media (max-width: 768px)` / `480px`) 專屬媒體查詢與觸控優化
- **後端服務**：Firebase Authentication + Cloud Firestore (Real-time listener)
- **套件對齊**：
  - `package.json` 包含 `dev`, `build`, `preview`, `predeploy`, `deploy`, `postdeploy`
  - `vite.config.js` 包含 `server.port`, `base: './'`, `define: { __BUILD_TIME__ }`
  - `postdeploy.js` 自動 Git commit & push 腳本
- **圖示與輔助**：Lucide React 圖示庫、QRCode 繪製元件、Canvas Confetti 投票成功慶祝特效

---

## 📂 擬建立之專案結構 (`c:\Marco\DeveloperAI\live-poll`)

```
live-poll/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── css/
│   │   ├── variables.css         # 設計系統色彩、變數與主題
│   │   ├── base.css              # 基礎重置與排版
│   │   ├── layout.css            # 卡片、按鈕、圖表與彈窗佈局
│   │   └── responsive.css        # 手機端適應 (768px, 480px) 與 Touch Targets
│   ├── components/
│   │   ├── Navbar.jsx            # 手機版可摺疊/響應式導覽列 (Google 登入狀態)
│   │   ├── CreatePollModal.jsx   # 建立投票彈窗 (題目、選項、時效、單/多選、結果預覽開關)
│   │   ├── PollCard.jsx          # 投票卡片元件
│   │   ├── PollVoteView.jsx      # 投票視圖 (大按鈕、選項選擇、結果觀看切換、倒數計時)
│   │   ├── PollResults.jsx       # 即時統計長條圖 (手機適應版型)
│   │   ├── ShareModal.jsx        # 分享與 Mobile QR Code 彈窗
│   │   └── MyPollsView.jsx       # 發起人的個人投票管理面板
│   ├── config/
│   │   └── firebase.js           # Firebase 初始化 (提供假 Key 與詳細註解)
│   ├── utils/
│   │   └── voterId.js            # 產生/取得匿名投票者裝置 Fingerprint ID
│   ├── App.jsx                   # 主頁面與 URL Query 投票 ID 自動識別解析
│   ├── index.css                 # 匯入 css/*
│   └── main.jsx
├── firebase.rules                # Firestore 安全規則範例
├── postdeploy.js                 # 發佈自動 commit & push 腳本
├── README.md                     # 詳細設定與使用說明文件
├── index.html
├── package.json
└── vite.config.js
```

---

## 🧪 驗證與測試計畫

### 1. 自動化/建置驗證 (Automated Verification)
- 執行 `npm run build` 確保 React 專案語法與型態無誤，無 Bundle 錯誤。
- 啟動開發伺服器 `npm run dev` 驗證前端畫面呈現。

### 2. 手動功能驗證 (Manual Verification)
- **GitHub Pages 網址解析測試**：測試透過 `?poll=ID` 或 `/#poll/ID` 開啟網址，能否正確自動進入該投票畫面。
- **一鍵複製與 QR Code 測試**：測試點擊分享按鈕後複製的網址是否包含完整域名，以及手機掃描 QR Code 能否直接跳轉投票。
- **即時同步測試**：開啟兩個分頁，在一端投票後，觀察另一端是否自動即時更新票數。
