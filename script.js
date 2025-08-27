// script.js
// Данные калькуляторов
const calculators = [
  { id:'glue', name:'Калькулятор клея и раствора', url:'https://calcul-klei.onrender.com', desc:'Расчет количества клея, раствора для работ с плиткой, керамогранитом и кирпичом.', cover:'./covers/glue.webp' },
  { id:'fcs', name:'Калькулятор крепежа для ФЦС', url:'https://calc-fcs.onrender.com', desc:'Расчеты крепежа и клямеров для фиброцементного сайдинга.', cover:'./covers/fcs.webp' },
  { id:'wood-weight', name:'Вес древесины', url:'https://kal-kuliator-vesa-drevesiny.onrender.com', desc:'Определение массы с учетом породы и влажности.', cover:'./covers/weight.webp' },
  { id:'plank-3d', name:'Планка 3D (фасонные элементы из металла)', url:'https://planka3d.onrender.com', desc:'Визуализация и расчет фасонных элементов из металла.', cover:'./covers/3d.webp' },
  { id:'lumber', name:'Пиломатериалы', url:'https://calculator-pilomat.onrender.com', desc:'Объем, количество и стоимость пиломатериалов.', cover:'./covers/lumber.webp' },
  { id:'fasteners', name:'Крепеж', url:'https://calculator-krepega.onrender.com', desc:'Подбор и расчет необходимого крепежа для любого материала.', cover:'./covers/fasteners.webp' }
];

// DOM
const cardsRoot = document.getElementById('cards');
const tmpl = document.getElementById('cardTemplate');
const modal = document.getElementById('modal');
const iframe = document.getElementById('calcFrame');
const modalTitle = document.getElementById('modalTitle');
const openExternal = document.getElementById('openExternal');
const openExternalFooter = document.getElementById('openExternalFooter');
const copyLinkBtn = document.getElementById('copyLink');
const frameWrap = document.getElementById('frameWrap');
const frameNotice = document.getElementById('frameNotice');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('search');
let lastFocused = null;
let iframeTimeoutId;

// Render cards from template
function renderCards(list) {
  cardsRoot.setAttribute('aria-busy', 'true');
  const frag = document.createDocumentFragment();
  for (const c of list) {
    const node = tmpl.content.cloneNode(true);
    const article = node.querySelector('.card');
    article.dataset.id = c.id;

    const img = node.querySelector('[data-cover]');
    img.src = c.cover;
    img.alt = c.name;

    node.querySelector('[data-title]').textContent = c.name;
    node.querySelector('[data-desc]').textContent = c.desc;

    const btnOpen = node.querySelector('[data-open]');
    btnOpen.setAttribute('aria-label', `Открыть ${c.name}`);
    btnOpen.dataset.action = 'open';
    btnOpen.dataset.url = c.url;

    const linkExt = node.querySelector('[data-ext]');
    linkExt.href = c.url;
    linkExt.setAttribute('aria-label', `Открыть ${c.name} в новой вкладке`);

    const status = node.querySelector('[data-status]');
    status.textContent = 'Проверка...';
    status.classList.remove('status--up', 'status--down');
    status.setAttribute('aria-label', `${c.name}: проверка доступности`);

    frag.appendChild(node);
  }
  cardsRoot.innerHTML = '';
  cardsRoot.appendChild(frag);
  cardsRoot.setAttribute('aria-busy', 'false');
}

// Initial render
function initRender() {
  renderCards(calculators);
}
initRender();

// Filter/search
function applyFilter() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const list = q
    ? calculators.filter(c =>
        c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
    : calculators;
  renderCards(list);
  // После ререндера — обновим статусы для видимых карточек
  checkCalculators(list);
}
filterForm?.addEventListener('input', (e) => {
  if (e.target === searchInput) applyFilter();
});
filterForm?.addEventListener('reset', () => {
  setTimeout(applyFilter, 0);
});

// Delegated clicks
cardsRoot.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const card = btn.closest('.card');
  const id = card?.dataset.id;
  if(!id) return;
  e.preventDefault();
  openById(id, true);
});

// Modal open/close + focus trap + iframe timeout fallback
function openModal(title, url){
  modalTitle.textContent = title;
  openExternal.href = url;
  openExternalFooter.href = url;

  // iframe loading state
  frameWrap.setAttribute('aria-busy','true');
  frameNotice.hidden = true;

  // Сброс предыдущего состояния iframe
  iframe.onload = null;
  iframe.removeAttribute('src');

  // Таймаут на случай CSP/frame-ancestors или сетевых проблем
  clearTimeout(iframeTimeoutId);
  iframeTimeoutId = setTimeout(() => {
    frameWrap.setAttribute('aria-busy','false');
    frameNotice.hidden = false;
  }, 12000);

  iframe.onload = () => {
    clearTimeout(iframeTimeoutId);
    frameWrap.setAttribute('aria-busy','false');
  };
  iframe.src = url;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocused = document.activeElement;
  const closeBtn = modal.querySelector('.icon-btn[data-close], [data-close].icon-btn');
  if (closeBtn) closeBtn.focus();
}
function closeModal(){
  modal.hidden = true;
  document.body.style.overflow = '';
  iframe.onload = null;
  iframe.removeAttribute('src');
  clearTimeout(iframeTimeoutId);
  if(lastFocused) lastFocused.focus();
  if(location.hash.startsWith('#calc/')) history.replaceState(null, '', '#');
}
// Закрытие по клику: у оверлея и кнопок стоит data-close
modal.addEventListener('click', (e)=>{
  if(e.target.hasAttribute('data-close')) closeModal();
});
window.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && !modal.hidden) closeModal();
});

// Focus trap in modal
modal.addEventListener('keydown', (e)=>{
  if(e.key !== 'Tab' || modal.hidden) return;
  const focusables = modal.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
  if(!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length-1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

// Copy deep link
copyLinkBtn?.addEventListener('click', async ()=>{
  const m = location.hash.match(/^#calc\/([a-z0-9-]+)$/i);
  if(!m) return;
  const url = `${location.origin}${location.pathname}#calc/${m[1]}`;
  try {
    await navigator.clipboard.writeText(url);
    copyLinkBtn.textContent = 'Ссылка скопирована';
    setTimeout(()=>copyLinkBtn.textContent='Скопировать ссылку', 2000);
  } catch {
    prompt('Скопируйте ссылку:', url);
  }
});

// Hash routing
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

// Robust ping with concurrency limit
async function pingHost(url, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const origin = new URL(url).origin;
  try {
    const probe = `${origin}/?probe=${Date.now()}`;
    await fetch(probe, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return true;
  } catch {
    clearTimeout(timer);
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('img-timeout')), timeout);
        const img = new Image();
        img.onload = () => { clearTimeout(t); resolve(); };
        img.onerror = () => { clearTimeout(t); reject(new Error('img-error')); };
        img.src = `${origin}/favicon.ico?_=${Date.now()}`;
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Limit concurrent pings
async function checkCalculators(list = calculators, intervalMs) {
  const concurrency = 3;
  const queue = list.slice();
  const workers = Array.from({length: concurrency}, async () => {
    while (queue.length) {
      const c = queue.shift();
      const ok = await pingHost(c.url, 6000);
      const el = document.querySelector(`.card[data-id="${c.id}"] [data-status]`);
      if (!el) continue;
      el.textContent = ok ? 'Онлайн' : 'Оффлайн';
      el.classList.toggle('status--up', ok);
      el.classList.toggle('status--down', !ok);
      el.setAttribute('aria-label', ok ? `${c.name}: доступен` : `${c.name}: недоступен`);
    }
  });
  await Promise.all(workers);
  if (intervalMs) setTimeout(()=>checkCalculators(calculators, intervalMs), intervalMs);
}
// initial and periodic checks
checkCalculators(calculators, 120000);