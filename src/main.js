import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#app')

// 开发模式下检测 electronAPI
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[Dev Check] window.electronAPI:', window.electronAPI)
  console.log('[Dev Check] saveSitesConfig exists:', !!window.electronAPI?.saveSitesConfig)
}
