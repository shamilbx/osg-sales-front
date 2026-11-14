# Sales Management System — фронтенд

Интерфейс системы управления продажами IT-студии: оболочка, дизайн, общие компоненты и разделы
«Сотрудники», «Компании», «Справочники». Бэкенд лежит в репозитории `osg-sales-crm`.

**Стек:** Vue 3 (`<script setup lang="ts">`) · TypeScript · Vite · Tailwind CSS v4 · shadcn-vue / reka-ui ·
lucide (`@lucide/vue`) · `@vueuse/core` · vue-router. Шрифт Inter.

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173
npm run type-check   # vue-tsc --build
npm run lint         # oxlint + eslint
npm run format       # prettier по src/
npm run build
```

Бэкенд ожидается на `VITE_API_URL` (по умолчанию `http://localhost:8080`, см. `.env.example`).
Кнопка «Автозаполнение» на странице входа (только в режиме разработки) берёт логин и пароль из
`.env.local`: `VITE_DEV_USERNAME`, `VITE_DEV_PASSWORD`.

## Структура

```
src/
  api/             http.ts (request, ApiError, токен), клиенты по разделам
  assets/main.css  токены темы, тёмная тема, цвета бренда
  components/
    ui/            shadcn-вью: avatar, badge, button, dialog, input
    form/          поля форм: FormField, SelectField, PhoneField, DatePicker, ToggleSwitch, FormSection…
    common/        FilterDropdown, SideDrawer (карточка справа), TablePagination, InfoCard…
    audit/         AuditTimeline — история изменений записи
    layout/        AppShell, AppHeader, AppSidebar, AppLogo, поиск ⌘K, колокольчик уведомлений, ToastHost
    users/ companies/   карточки, формы и проверка полей разделов
    dashboard/     панели и графики дашборда
  composables/     useAuth, useTheme, useToast, useNotifications, useDictionaries, usePageSize…
  config/navigation.ts   модули и пункты меню (с ограничением по ролям)
  i18n/            ru / en / uz (сейчас заполнен только русский)
  lib/             форматирование, даты, телефон, поиск, утилиты
  router/          маршруты и проверка ролей
  views/           страницы
```

## Как добавлять разделы

1. Страница — `src/views/XxxView.vue`, маршрут в `src/router/index.ts` (при необходимости `meta.roles`).
2. Пункт меню — в `config/navigation.ts` (иконка из lucide, `roles` для ограничения по роли).
3. Запросы к серверу — отдельный файл в `src/api/`, через `request<T>()` из `http.ts`
   (подставляет токен и `Accept-Language`, ошибки приходят с готовым текстом).
4. Общее состояние — композабл с `ref` вне функции (как `useToast`, `useDictionaries`).

## Дизайн

- Светлый холст, белые карточки со скруглением 24–28 px, красный сайдбар в цвет логотипа OSG (`#e12526`);
  тёмная тема переворачивает шкалу zinc (правила в `assets/main.css`).
- Кнопки: высота 36–48 px, `rounded-xl`, основное действие — чёрная (`bg-zinc-950 text-white`),
  второстепенное — белая с рамкой. Конфликтующие классы склеивать через `cn()`.
- Фильтры — выпадающие списки `FilterDropdown`; подтверждения и ошибки действий — всплывающие
  уведомления `useToast()`; карточка записи — справа (`SideDrawer`).
- На страницах со списками заголовок, фильтры и пагинация закреплены, прокручивается только список.
- Формы создания — отдельная страница с блоками `FormSection` (см. `CompanyFormView.vue`).

## Переводы

Исходный русский текст служит ключом: в шаблоне `$t('Текст')`, в скрипте `t('Текст')` из `@/i18n`.
Каталоги `en.ts` и `uz.ts` пока пустые: без перевода показывается русский текст.

## Бэкенд (контракт)

JSON поверх HTTP. Вход: `POST /login` → `{ token, user }`, дальше `Authorization: Bearer <token>`,
остальные пути под `/api`. Ошибки приходят как `{ "error": "готовый текст" }`. Роли: superadmin,
director, manager, accountant.
