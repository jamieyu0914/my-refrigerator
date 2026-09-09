import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())

const authStore = useAuthStore()

authStore.init().finally(() => {
  app.use(router).mount('#app')
})
