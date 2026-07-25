# 🗳️ 線上即時投票系統 (Live Poll Web Application)

> 🔗 **線上體驗網址**：[https://MarcoChiu.github.io/livepoll/](https://MarcoChiu.github.io/livepoll/)

視覺效果精美、響應式 (Mobile-First) 且支援 **純前端即時同步 (Real-Time)** 的線上投票系統。

發起投票者可透過 Google 帳號登入；投票參與者不需要登入即可直接進行投票。系統具備雙重防重複投票機制、時間限制倒數、投票前結果可視度開關、一鍵連結與手機現場 QR Code 分享功能。

---

## ✨ 特點與亮點

- 🔐 **Google 帳號登入發起**：整合 Firebase Auth，發起人管理專屬投票卡片。
- 🚫 **免登入單次投票**：結合瀏覽器 `localStorage` 與裝置 Fingerprint ID，防止重複刷票。
- ⚡ **純前端即時同步 (Real-Time Live Sync)**：基於 Firebase Firestore `onSnapshot` 雙向通道，其他人的投票會在幾毫秒內自動觸發長條圖平滑動畫，無須 SignalR 或自訂 Backend。
- 📱 **手機端極致優化 (Mobile-First UI/UX)**：針對 iPhone/Android 手機螢幕優化大觸控區域 (Min 48px)、手機 Bottom Sheet 與長條圖排版。
- 🔒 **結果可視度彈性設定**：可自由選擇「投票後才解鎖結果」或「投票前即可預覽即時結果」。
- ⏱️ **時間限制與倒數**：可選擇不限時、15分鐘、1小時、24小時或自訂截止時間。
- 📲 **GitHub Pages 靜態託管完美相容**：採用 Query/Hash 網址解析，分享連結與相機掃描 QR Code 開啟絕不 404。
- 🧪 **內建 Mock 預覽模式**：在尚未填入真實 Firebase Config 之前，系統能自動切換為本地預覽模式，供直接體驗完整 UI 互動。

---

## 🛠️ Firebase 申請與設定步驟

當您準備好將專案連接至您的 Firebase 帳號時，請按照以下步驟完成設定：

### 步驟 1：建立 Firebase 專案
1. 開啟 [Firebase Console](https://console.firebase.google.com/)。
2. 點擊 **「新增專案」 (Add Project)**，輸入專案名稱（例如 `my-live-poll`）並完成建立。

### 步驟 2：啟用 Google Authentication
1. 在 Firebase 主控台左側選單，點擊 **Build > Authentication**。
2. 點擊 **Get Started**，在 **Sign-in method** 列表中選擇 **Google**。
3. 開啟 **啟用 (Enable)**，設定專案支援 Email 並儲存。

### 步驟 3：建立 Cloud Firestore 資料庫
1. 在左側選單點擊 **Build > Firestore Database**。
2. 點擊 **Create Database**（選擇離您最近的伺服器位置，例如 `asia-east1` 台灣/香港）。
3. 選擇 **Start in test mode** 完成建立。
4. 點擊上方的 **Rules** 頁籤，將本專案根目錄的 `firebase.rules` 內容複製貼上並發佈 (Publish)。

### 步驟 4：取得 SDK 設定值並貼入專案
1. 點擊左上角齒輪圖示 ⚙️ **Project settings (專案設定)**。
2. 在下方 **Your apps** 區域，點擊 `</>` (Web) 圖示新增網頁應用程式。
3. 複製 `const firebaseConfig = { ... }` 裡面的設定值。
4. 開啟本專案的 [src/config/firebase.js](file:///c:/Marco/DeveloperAI/live-poll/src/config/firebase.js) 檔案，將裡面的 placeholder 替換為您剛剛複製的實際設定即可！

---

## 🚀 開發與部署指令

對齊 DeveloperAI 團隊專案規範：

### 啟動本地開發伺服器
```bash
npm run dev
```
開啟瀏覽器前往 `http://localhost:3003`

### 建置正式產出檔
```bash
npm run build
```

### 發佈至 GitHub Pages
```bash
npm run deploy
```
*執行此指令會自動進行正式 bundle 建置、發布至 `gh-pages` 分支，並自動透過 `postdeploy.js` 將原始碼 commit 及 push 至 `main` 分支。*

---

## 📂 專案架構說明

```
live-poll/
├── public/
├── src/
│   ├── css/
│   │   ├── variables.css      # 設計系統主題、色彩與 Glassmorphism
│   │   ├── base.css           # 全局樣式與字型設定
│   │   ├── layout.css         # 卡片、按鈕、統計圖表與彈窗 Layout
│   │   └── responsive.css     # 手機版 Mobile-First 響應式優化
│   ├── components/
│   │   ├── Navbar.jsx         # 導覽列 (Google 登入狀態)
│   │   ├── CreatePollModal.jsx# 建立投票彈窗
│   │   ├── PollCard.jsx       # 投票小卡
│   │   ├── PollVoteView.jsx   # 投票與結果主頁面
│   │   ├── PollResults.jsx    # 即時票數動態長條圖
│   │   ├── ShareModal.jsx     # 網址複製與 QR Code 分享彈窗
│   │   └── MyPollsView.jsx    # 發起人的個人投票管理
│   ├── config/
│   │   └── firebase.js        # Firebase 設定檔 (含 Mock 自動退回機制)
│   ├── utils/
│   │   ├── voterId.js         # 匿名裝置防重複投票 ID 產生器
│   │   └── qrcode.js          # SVG QR Code 自動繪製工具
│   ├── App.jsx                # 主應用程式與 URL 路由解析
│   └── main.jsx
├── firebase.rules             # Cloud Firestore 安全規則範例
├── postdeploy.js              # 自動 Git Commit & Push 腳本
├── package.json
└── vite.config.js
```
>>>>>>> 54f66e5 (initial commit: livepoll application)
