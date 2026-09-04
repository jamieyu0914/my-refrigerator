# 本地開發文件

```
my-refrigerator/
├── index.html              # Vite 進入點 HTML，掛載 <div id="app"> 並載入 src/main.js
├── vite.config.js          # Vite 設定，套用 @vitejs/plugin-vue
├── package.json            # npm scripts（dev / build / preview）與相依套件
├── package-lock.json       # 鎖定版本，安裝時請用 npm ci 或 npm install
├── public/
│   └── favicon.svg          # 靜態資源，原樣複製到build輸出目錄
└── src/                     # 前端原始碼（詳見 documents/frontend.md）
    ├── main.js               # createApp(App).use(router).mount('#app')
    ├── App.vue
    ├── components/
    ├── composables/
    ├── router/
    ├── views/
    └── style.css
```

## 環境需求

- Node.js（本機驗證版本：v24.7.0，建議使用 18+ 的 LTS 版本即可執行 Vite 8）
- npm（本機驗證版本：11.5.1）
- 目前專案**沒有後端**，也沒有 `.env` 設定檔——`src/composables/useAuth.js` 的登入只是把假 token 寫進 `localStorage`（見程式內 `// TODO: replace with a real API call once a backend exists`），所以開發時不需要另外啟動 API 伺服器或設定環境變數

## 安裝與啟動

```bash
# 1. 安裝相依套件（第一次 clone 下來，或 package-lock.json 有變動時執行）
npm install

# 2. 啟動本地開發伺服器（Vite，預設 http://localhost:5173，含熱更新 HMR）
npm run dev

# 3. 打包正式版（輸出到 dist/）
npm run build

# 4. 在本地預覽 build 後的結果（預設 http://localhost:4173）
npm run preview
```

執行 `npm run dev` 後，終端機會顯示實際的本地網址（若 5173 被占用，Vite 會自動換下一個可用埠號），用瀏覽器打開該網址即可看到頁面。

## 重點功能

- **啟動指令來源**：`package.json` 的 `scripts` 欄位定義了 `dev`（`vite`）、`build`（`vite build`）、`preview`（`vite preview`）三個指令，皆透過 `npm run <script>` 執行
- **Vite 設定**：`vite.config.js` 使用 `defineConfig` 並套用 `@vitejs/plugin-vue`，讓 `.vue` 單檔元件可以被解析與編譯，開發模式下提供 HMR
- **無需後端**：`src/composables/useAuth.js` 目前以 `localStorage` 模擬登入狀態（假 token），不會呼叫任何 API，因此 `npm run dev` 即可獨立啟動整個前端，不依賴其他服務
- **靜態資源**：`public/` 內的檔案（如 `favicon.svg`）在 `npm run dev` / `npm run build` 時會直接以原始路徑提供，`index.html` 透過 `/favicon.svg` 引用
