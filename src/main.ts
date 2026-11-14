import '@fontsource/inter/cyrillic-ext-400.css'
import '@fontsource/inter/cyrillic-400.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/cyrillic-ext-500.css'
import '@fontsource/inter/cyrillic-500.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/cyrillic-ext-600.css'
import '@fontsource/inter/cyrillic-600.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/cyrillic-ext-700.css'
import '@fontsource/inter/cyrillic-700.css'
import '@fontsource/inter/latin-ext-700.css'
import '@fontsource/inter/latin-700.css'
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
