const calculators = [
  { id:'glue', name:'Калькулятор клея', url:'https://calcul-klei.onrender.com', desc:'Подбор количества клея для работ по дереву и отделке.', cover:'./covers/glue.webp' },
  { id:'fcs', name:'Калькулятор ФКС', url:'https://calc-fcs.onrender.com', desc:'Расчеты для плитных материалов по стандартам ФКС.', cover:'./covers/fcs.webp' },
  { id:'wood-weight', name:'Вес древесины', url:'https://kal-kuliator-vesa-drevesiny.onrender.com', desc:'Определение массы с учетом породы и влажности.', cover:'./covers/weight.webp' },
  { id:'plank-3d', name:'Планка 3D', url:'https://planka3d.onrender.com', desc:'Визуализация и расчет 3D‑планки.', cover:'./covers/3d.webp' },
  { id:'lumber', name:'Пиломатериалы', url:'https://calculator-pilomat.onrender.com', desc:'Объем, количество и стоимость пиломатериалов.', cover:'./covers/lumber.webp' },
  { id:'fasteners', name:'Крепеж', url:'https://calculator-krepega.onrender.com', desc:'Подбор и расчет необходимого крепежа.', cover:'./covers/fasteners.webp' }
];

const cardsRoot = document.getElementById('cards');
const modal = document.getElementById('modal');
const iframe = document.getElementById('calcFrame');
const modalTitle = document.getElementById('modalTitle');
const openExternal = document.getElementById('openExternal');
const themeBtn = document.getElementById('themeToggle');
let lastFocused = null;

function renderCards(){
  cardsRoot.innerHTML = calculators.map(c => `
    <article class="card" data-id="${c.id}">
      <div class="card__media">
        <img src="${c.cover}" alt="${c.name}" loading="lazy" decoding="async" width="1200" height="675">
      </div>
      <div class="card__body">
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <span class="status" aria-live="polite">Проверка...</span>
        <div class="card__actions">
          <button class="btn primary" data-action="open" data-url="${c.url}" aria-label="Открыть ${c.name}">Открыть</button>
          <a class="btn ghost" href="${c.url}" target="_blank" rel="noopener noreferrer" data-action="ext">В новой вкладке</a>
        </div>
      </div>
    </article>
  `).join('');
}
renderCards();

function openModal(title, url){
  modalTitle.textContent = title;
  openExternal.href = url;
  iframe.removeAttribute('src');
  iframe.setAttribute('src', url);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocused = document.activeElement;
  modal.querySelector('.icon-btn').focus();
}
function closeModal(){
  modal.hidden = true;
  document.body.style.overflow = '';
  iframe.removeAttribute('src');
  if(lastFocused) lastFocused.focus();
  if(location.hash.startsWith('#calc/')) history.replaceState(null, '', '#');
}

cardsRoot.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const card = e.target.closest('.card');
  const id = card?.getAttribute('data-id');
  const calc = calculators.find(x=>x.id === id);
  if(!calc) return;
  if(action === 'open'){
    e.preventDefault();
    openById(id, true);
  }
});

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

// Более устойчивый "пинг": считаем ONLINE, если есть сетевое соединение до origin.
// 1) Пытаемся сделать fetch в no-cors (успех = промис resolve).
// 2) Фолбэк: Image-пинг (успех = onload, но часто favicon отсутствует — это ок, у нас есть fetch).
async function pingHost(url, timeout = 6000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);

  try {
    // Делаем запрос на корень с cache-busting, no-cors
    const u = new URL(url);
    const probe = `${u.origin}/?probe=${Date.now()}`;
    // В no-cors промис резолвится даже при непрозрачном (“opaque”) ответе — это и есть наш сигнал "онлайн".
    await fetch(probe, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' });
    clearTimeout(t);
    return true;
  } catch {
    clearTimeout(t);
    // Фолбэк через Image: иногда fetch может падать из-за редких сетевых ограничений.
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('img-timeout')), timeout);
        const img = new Image();
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('img-error')); };
        const u = new URL(url);
        img.src = `${u.origin}/favicon.ico?_=${Date.now()}`;
      });
      return true;
    } catch {
      return false;
    }
  }
}

async function checkAllCalculators(intervalMs = 120000) {
  async function run() {
    const tasks = calculators.map(async (c) => {
      const ok = await pingHost(c.url, 6000);
      const el = document.querySelector(`.card[data-id="${c.id}"] .status`);
      if (!el) return;
      el.textContent = ok ? 'Онлайн' : 'Оффлайн';
      el.classList.toggle('status--up', ok);
      el.classList.toggle('status--down', !ok);
      // Доступное описание для скринридеров
      el.setAttribute('aria-label', ok ? `${c.name}: доступен` : `${c.name}: недоступен`);
    });
    await Promise.allSettled(tasks);
  }
  await run();
  setInterval(run, intervalMs);
}

// Тёмная/светлая тема
(function themeInit(){
  const key='theme', btn=themeBtn, root=document.documentElement;
  function apply(theme){
    if(theme){ root.setAttribute('data-theme', theme); } else { root.removeAttribute('data-theme'); }
    const isDark = (theme==='dark') || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    let meta = document.querySelector('meta[name="theme-color"]');
    if(!meta){ meta = document.createElement('meta'); meta.name='theme-color'; document.head.appendChild(meta); }
    meta.content = isDark ? '#0b0f14' : '#ffffff';
  }
  const stored = localStorage.getItem(key);
  apply(stored || null);
  btn.addEventListener('click', ()=>{
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : current === 'light' ? null : 'dark';
    if(next) localStorage.setItem(key, next); else localStorage.removeItem(key);
    apply(next);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(!localStorage.getItem(key)) apply(null); });
})();
