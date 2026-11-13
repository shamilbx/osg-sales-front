import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { locale, t } from './i18n'

const app = createApp(App)

app.use(router)

// В шаблонах перевод вызывается как $t('Русский текст')
app.config.globalProperties.$t = t
document.documentElement.lang = locale().value

// Ждем первую навигацию, чтобы не мигала оболочка CRM на странице входа
router.isReady().then(() => app.mount('#app'))
