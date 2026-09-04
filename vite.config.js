import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  // GitHub Pages 專案頁面會部署在 /my-refrigerator/ 這個子路徑下，
  // 開發模式仍維持根目錄，方便本機 npm run dev
  base: command === 'build' ? '/my-refrigerator/' : '/',
}))
