// Список калькуляторов (редактируйте при необходимости)
const calculators = [
  { id:'glue', name:'Калькулятор клея и раствора', url:'https://calcul-klei.onrender.com', desc:'Подбор количества клея для работ по кирпичу, плитке и керамограниту.', cover:'./covers/glue.webp' },
  { id:'fcs', name:'Калькулятор крепежа для фиброцементного сайдинга', url:'https://calc-fcs.onrender.com', desc:'Расчеты крепежа и клямеров для ФЦС.', cover:'./covers/fcs.webp' },
  { id:'wood-weight', name:'Вес древесины', url:'https://kal-kuliator-vesa-drevesiny.onrender.com', desc:'Определение массы с учетом породы и влажности.', cover:'./covers/weight.webp' },
  { id:'plank-3d', name:'Планка 3D', url:'https://planka3d.onrender.com', desc:'Визуализация и расчет фасонных элементов из металла.', cover:'./covers/3d.webp' },
  { id:'lumber', name:'Пиломатериалы', url:'https://calculator-pilomat.onrender.com', desc:'Объем, количество и стоимость пиломатериалов.', cover:'./covers/lumber.webp' },
  { id:'fasteners', name:'Крепеж', url:'https://calculator-krepega.onrender.com', desc:'Подбор и расчет необходимого крепежа под любой материал.', cover:'./covers/fasteners.webp' }
];

// DOM-узлы
const cardsRoot = document.getElementById('cards');
const tmpl = document.getElementById('cardTemplate');
const modal = document.getElementById('modal');
const iframe = document.getElementById('calcFrame');
const modalTitle = document.getElementById('modalTitle');
const openExternal = document.getElementById('openExternal');
const themeBtn = document.getElementById('themeToggle');
let lastFocused = null;

// Рендер карточек из template
function renderCardsFromTemplate() {
  if (!tmpl || !tmpl.content) {
    console.warn('cardTemplate не найден — рендер по шаблону невозможен.');
    return;
  }
  cardsRoot.setAttribute('aria-busy', 'true');

  const frag = document.createDocumentFragment();
  for (const c of calculators) {
    const node = tmpl.content.cloneNode(true);

    const article = node.querySelector('.card');
    if (article) article.dataset.id = c.id;

    const img = node.querySelector('[data-cover]');
    if (img) {
      img.src = c.cover;
      img.alt = c.name;
    }

    const title = node.querySelector('[data-title]');
    if (title) title.textContent = c.name;

    const desc = node.querySelector('[data-desc]');
    if (desc) desc.textContent = c.desc;

    const btnOpen = node.querySelector('[data-open]');
    if (btnOpen) {
      btnOpen.setAttribute('aria-label', `Открыть ${c.name}`);
      btnOpen.dataset.action = 'open';
      btnOpen.dataset.url = c.url;
    }

    const linkExt = node.querySelector('[data-ext]');
    if (linkExt) {
      linkExt.href = c.url;
      linkExt.setAttribute('aria-label', `Открыть ${c.name} в новой вкладке`);
    }

    const status = node.querySelector('[data-status]');
    if (status) {
      status.textContent = 'Проверка...';
      status.classList.remove('status--up', 'status--down');
      status.setAttribute('aria-label', `${c.name}: проверка доступности`);
    }

    frag.appendChild(node);
  }

  cardsRoot.innerHTML = '';
  cardsRoot.appendChild(frag);
  cardsRoot.setAttribute('aria-busy', 'false');
}
renderCardsFromTemplate();

// Делегирование кликов по кнопкам карточек
cardsRoot.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const card = btn.closest('.card');
  const id = card?.dataset.id;
  const calc = calculators.find(x=>x.id === id);
  if(!calc) return;
  if(action === 'open'){
    e.preventDefault();
    openById(id, true);
  }
});

// Модальное окно
function openModal(title, url){
  modalTitle.textContent = title;
  openExternal.href = url;
  iframe.removeAttribute('src');
  iframe.setAttribute('src', url);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocused = document.activeElement;
  const closeBtn = modal.querySelector('.icon-btn');
  if (closeBtn) closeBtn.focus();
}
function closeModal(){
  modal.hidden = true;
  document.body.style.overflow = '';
  iframe.removeAttribute('src');
  if(lastFocused) lastFocused.focus();
  if(location.hash.startsWith('#calc/')) history.replaceState(null, '', '#');
}
modal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) closeModal(); });
window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && !modal.hidden) closeModal(); });

// Хэш-роутинг
function openById(id, pushHash=false){
  const c = calculators.find(x=>x.id === id);
  if(!c) return;
  openModal(c.name, c.url);
  if(pushHash){
    const newHash = `#calc/${id}`;
    if(location.hash !== newHash) history.replaceState(null, '', newHash);
  }
}
function handleHash(){
  const m = location.hash.match(/^#calc\/([a-z0-9-]+)$/i);
  if(m){ openById(m[1], false); }
}
window.addEventListener('hashchange', handleHash);
window.addEventListener('DOMContentLoaded', handleHash);

// Устойчивый "пинг" доступности origin
async function pingHost(url, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const u = new URL(url);
    const probe = `${u.origin}/?probe=${Date.now()}`;
    await fetch(probe, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return true;
  } catch {
    clearTimeout(timer);
    // Резерв: Image на favicon
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('img-timeout')), timeout);
        const img = new Image();
        img.onload = () => { clearTimeout(t); resolve(); };
        img.onerror = () => { clearTimeout(t); reject(new Error('img-error')); };
        const u = new URL(url);
        img.src = `${u.origin}/favicon.ico?_=${Date.now()}`;
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Проверка статусов с интервалом
async function checkAllCalculators(intervalMs = 120000) {
  async function run() {
    const tasks = calculators.map(async (c) => {
      const ok = await pingHost(c.url, 6000);
      const el = document.querySelector(`.card[data-id="${c.id}"] [data-status]`);
      if (!el) return;
      el.textContent = ok ? 'Онлайн' : 'Оффлайн';
      el.classList.toggle('status--up', ok);
      el.classList.toggle('status--down', !ok);
      el.setAttribute('aria-label', ok ? `${c.name}: доступен` : `${c.name}: недоступен`);
    });
    await Promise.allSettled(tasks);
  }
  await run();
  setInterval(run, intervalMs);
}
checkAllCalculators();

// Переключатель темы с сохранением выбора и обновлением theme-color
(function themeInit(){
  const key='theme', btn=themeBtn, root=document.documentElement;

  function apply(theme){
    if(theme){ root.setAttribute('data-theme', theme); } else { root.removeAttribute('data-theme'); }
    // Вычисляем, темный ли сейчас режим
    const isDark = (theme==='dark') || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
    // Текст на кнопке
    btn.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    // Обновляем мету theme-color для системной панели браузера
    let meta = document.querySelector('meta[name="theme-color"]');
    if(!meta){ meta = document.createElement('meta'); meta.name='theme-color'; document.head.appendChild(meta); }
    meta.content = isDark ? '#0b0f14' : '#ffffff';
  }

  // Инициализация: берём сохранённое значение или авто
  const stored = localStorage.getItem(key);
  apply(stored || null);

  // Клик по кнопке: dark -> light -> auto (null) -> dark ...
  btn.addEventListener('click', ()=>{
    const current = root.getAttribute('data-theme'); // 'dark' | 'light' | null
    const next = current === 'dark' ? 'light' : current === 'light' ? null : 'dark';
    if(next) localStorage.setItem(key, next); else localStorage.removeItem(key);
    apply(next);
  });

  // Реакция на смену системной темы (только если пользователь не зафиксировал выбор)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if(!localStorage.getItem(key)) apply(null);
  });
})();
