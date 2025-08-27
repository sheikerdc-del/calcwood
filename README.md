# CalcWood — лендинг с набором калькуляторов

Современный адаптивный лендинг, который открывает внешние калькуляторы в модалке, поддерживает темную/светлую тему, PWA-офлайн для лендинга, индикацию онлайн/оффлайн и прямые ссылки вида `#calc/<id>`.

## Структура
- `index.html` — страница лендинга
- `styles.css` — стили, темы
- `script.js` — логика карточек, модалки, роутинга, аптайма, темы
- `sw.js` — сервис-воркер (офлайн для статики)
- `manifest.webmanifest` — PWA манифест
- `icons/` — иконки PWA (PNG)
- `covers/` — обложки карточек (WebP)
- `logo.svg`, `hero.webp` — CalcWood — лендинг с набором калькуляторов

Коротко
- Единая тёмная тема (переключателя тем нет).
- Открытие внешних калькуляторов в модалке с iframe и фолбэком при CSP/X-Frame-Options.
- Прямые ссылки на калькуляторы через hash-маршрут #calc/<id>.
- Индикация доступности калькуляторов (Онлайн/Оффлайн) с периодической проверкой.
- PWA: офлайн для лендинга (статические ресурсы, offline.html), манифест и иконки.
- Автосборка ассетов (иконки и обложки) из SVG через sharp, авто-коммит из GitHub Actions.

Структура проекта
- index.html — главная страница лендинга
- styles.css — стили, единая тёмная тема, сетки/карточки/модалка
- script.js — логика карточек, модалки, hash-роутинг, пинг аптайма, копирование ссылок
- sw.js — сервис-воркер (офлайн для статики, разные стратегии для HTML и ассетов)
- manifest.webmanifest — PWA-манифест (иконки, цвета, start_url)
- offline.html — офлайн-страница с ссылкой «На главную»
- icons/ — сгенерированные иконки PWA (PNG, ICO), а также apple-touch-icon
- covers/ — обложки карточек (WebP, 1200×675)
- hero.webp, og-image.jpg — изображения для hero и Open Graph
- sprite.svg (или logo.svg) — ресурс логотипа для шапки/офлайн-страницы
- tools/
  - build-icons.mjs — генерация иконок/фавикона из SVG
  - build-images.mjs — генерация обложек/hero/OG из SVG
- .github/workflows/build-assets-commit.yml — CI: сборка ассетов и авто-коммит
- package.json — скрипты сборки, devDependencies (sharp)

Возможности
- Карточки калькуляторов рендерятся из массива calculators в script.js.
- Открытие в модалке:
  - iframe с таймаутом 12 секунд и сообщением, если сайт запрещает встраивание (CSP/frame-ancestors/X-Frame-Options).
  - Ссылки «Открыть в новой вкладке» в хедере/футере модалки.
- Хеш‑маршрутизация:
  - Переход по #calc/<id> автоматически открывает модалку нужного калькулятора.
  - Кнопка «Скопировать ссылку» формирует корректную глубокую ссылку.
- Статус доступности:
  - Параллельные проверки (ограничение конкуренции) через fetch no-cors и fallback на favicon.ico.
  - Автообновление каждые 120 секунд, а также при фильтрации карточек.
- PWA/офлайн:
  - Навигация (HTML) — стратегия network-first с офлайн‑фолбэком.
  - Статика (CSS/JS/изображения/иконки) — стратегия stale-while-revalidate.
  - Предкэш критически важной статики.
- Доступность и UX:
  - Клавиатурная навигация и фокус‑ловушка в модалке, закрытие по ESC/оверлею/кнопке.
  - prefers-reduced-motion: уменьшение анимаций.

Установка и сборка ассетов
Требования: Node.js 18.17+ или 20.x, npm 9+, установленная библиотека sharp (ставится автоматически).

- Установка зависимостей
```bash
bash
npm ci
```

- Сборка ассетов (иконки, обложки, hero, OG)
```bash
bash
npm run assets:all
# или по частям:
npm run assets:icons
npm run assets:images
```

- Запуск простого локального сервера (опционально)
Можно использовать любой статический сервер. Пример с http-server:
```bash
bash
npx http-server -c-1 -p 8080 .
```
Откройте http://localhost:8080.

Сервис‑воркер и офлайн
- sw.js предкэширует ключевые файлы и применяет разные стратегии:
  - HTML/навигация — network-first, при офлайне: offline.html.
  - Статика — stale-while-revalidate (быстрый ответ из кэша + фоновое обновление).
- При каждом изменении набора статики увеличивайте константу версии кэша в sw.js (например, calcwood-v9), чтобы активировать новую статику и очистить старые кэши.
- Регистрация SW находится в index.html (если включена). Если регистрация не добавлена, вставьте:
```html
html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }
</script>
```

PWA‑манифест и иконки
- manifest.webmanifest содержит иконки 192/256/384/512 и maskable (512):
  - icons/icon-192.png
  - icons/icon-256.png
  - icons/icon-384.png
  - icons/icon-512.png
  - icons/icon-512-maskable.png (purpose: maskable any)
- Рекомендуемые теги в <head>:
```html
html
<link rel="manifest" href="./manifest.webmanifest" type="application/manifest+json">
<link rel="icon" href="./icons/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
<meta name="theme-color" content="#0b0f14">
```
- Генерация иконок/фавикона:
  - tools/build-icons.mjs использует sharp и png-to-ico (настройки выровнены с манифестом/SW).
  - Maskable‑иконка должна иметь «безопасную зону» в исходном SVG.

Скрипты npm (пример)
```json
json
{
  "scripts": {
    "assets:icons": "node tools/build-icons.mjs",
    "assets:images": "node tools/build-images.mjs",
    "assets:all": "npm run assets:icons && npm run assets:images",
    "build": "npm run assets:all",
    "prepare": "npm run build"
  }
}
```

GitHub Actions (автогенерация ассетов)
- .github/workflows/build-assets-commit.yml:
  - Триггеры: изменения в src-svg/**, tools/**, package.json, сам workflow.
  - Шаги: checkout, setup-node (20), npm ci, генерация ассетов, авто‑коммит и пуш (с защитой от гонок).
- Результат: icons/, covers/, hero.webp, og-image.jpg и package-lock.json коммитятся автоматически при изменении исходников.

Статусы/проверка доступности
- Реализована комбинированная проверка:
  - fetch к /?probe=timestamp (no-cors, no-store).
  - При ошибке — загрузка origin/favicon.ico через Image().
- Ограничение конкуренции запросов снижает нагрузку при большом списке калькуляторов.
- Таймауты 6 сек на пинг и 12 сек на загрузку в iframe.

Ограничения и важные нюансы
- Модалка с iframe подчиняется CSP и X-Frame-Options внешних сайтов. Если они запрещают встраивание, отображается уведомление и доступны кнопки «Открыть в новой вкладке».
- При офлайне доступны только закэшированные страницы и статика лендинга. Внешние калькуляторы офлайн не работают по определению.
- При изменении путей к иконкам/изображениям не забудьте:
  - Обновить manifest.webmanifest, sw.js (список предкэша), offline.html (иконка/логотип).
  - Увеличить версию кэша SW.

Доступность
- Навигация по клавиатуре: фокус‑ловушка в модалке, закрытие по ESC.
- Явные фокус‑стили и aria‑атрибуты для статусов и кнопок.
- prefers-reduced-motion: отключение анимаций и тяжелых переходов.

Производительность
- Изображения: обложки в WebP (1200×675), hero.webp, og-image.jpg с прогрессивным JPEG.
- CSS/JS минимальны по количеству, сетка на CSS Grid и Flex.
- Кэширование SW ускоряет повторные загрузки.

Локальная разработка и деплой
- Локально: соберите ассеты, поднимите статический сервер, откройте главную.
- GitHub Pages: используйте относительные пути ./… (уже настроено), зарегистрируйте SW на загрузке страницы.
- После деплоя проверьте:
  - Application → Manifest/Service Worker (DevTools) без ошибок.
  - Предкэш прогружен, offline.html открывается при офлайне.
  - Модалка и статусы работают.

Чек‑лист перед релизом
-  assets:all выполнены, файлы в icons/ и covers/ актуальны.
-  manifest.webmanifest указывает на существующие иконки (включая maskable).
-  sw.js с обновлённой версией кэша и валидным списком предкэша.
-  offline.html корректно отображает лого (sprite.svg или валидный logo.svg).
-  script.js не содержит кода переключения темы.
-  Lighthouse: PWA/Accessibility/Best Practices в зелёной зоне.

Примеры кода

- Пример массива калькуляторов (script.js):
```javascript
javascript
const calculators = ;
```

- Пример HTML‑шаблона карточки:
```html
html
<template id="cardTemplate">
  <article class="card" data-id="">
    <div class="card__media">
      <img data-cover src="" alt="">
    </div>
    <div class="card__body">
      <h3 data-title></h3>
      <p data-desc></p>
      <div class="card__bottom">
        <div class="card__actions">
          <button class="btn" data-open>
            <svg class="icon" aria-hidden="true"><use href="./sprite.svg#open"></use></svg>
            Открыть
          </button>
          <a class="btn" data-ext target="_blank" rel="noopener">В новой вкладке</a>
        </div>
        <span class="status" data-status>Проверка...</span>
      </div>
    </div>
  </article>
</template>
```

- Подключение манифеста и иконок в head:
```html
html
<link rel="manifest" href="./manifest.webmanifest" type="application/manifest+json">
<link rel="icon" href="./icons/favicon.ico">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
<meta name="theme-color" content="#0b0f14">
```
бренд-активы
- `privacy.html`, `terms.html`
