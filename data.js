// ─────────────────────────────────────────────────────────────────────────────
//  APP LOGIC — Guatemala Trip
//  Do not edit for content changes — use data.js instead.
// ─────────────────────────────────────────────────────────────────────────────

const selected = { ...DEFAULTS };

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getHotel(night) {
  return HOTELS[night].find(h => h.id === selected[night]);
}
function starsHtml(r) {
  if (!r) return '';
  const f = Math.floor(r), h = r % 1 >= .5 ? '½' : '';
  return `<span class="stars">${'★'.repeat(f)}${h}</span> ${r}`;
}
function linkIcon() {
  return `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7 2h3v3M10 2L5.5 6.5M5 3H2v7h7V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function arrowIcon() {
  return `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ── NOTES ─────────────────────────────────────────────────────────────────────
// In-memory notes per activity item, keyed by "dayId-periodIdx-itemIdx"
// Persisted to localStorage so notes survive page refreshes.
let notes = {};

function loadNotes() {
  try { notes = JSON.parse(localStorage.getItem('gua-trip-notes') || '{}'); } catch { notes = {}; }
}
function saveNotes() {
  try { localStorage.setItem('gua-trip-notes', JSON.stringify(notes)); } catch {}
}

function noteKey(dayId, pi, ii) { return `${dayId}-${pi}-${ii}`; }

function toggleNotes(key, event) {
  if (event) event.stopPropagation();
  const wrap = document.getElementById('nw-' + key);
  if (!wrap) return;
  const opening = !wrap.classList.contains('open');
  wrap.classList.toggle('open', opening);
  if (opening) setTimeout(() => { const el = document.getElementById('na-' + key); if (el) el.focus(); }, 180);
}

function addNote(key, inputEl) {
  const val = inputEl.value.trim();
  if (!val) return;
  if (!notes[key]) notes[key] = [];
  notes[key].push(val);
  saveNotes();
  inputEl.value = '';
  renderNoteList(key);
  syncIndicator(key);
}

function deleteNote(key, idx) {
  if (!notes[key]) return;
  notes[key].splice(idx, 1);
  saveNotes();
  renderNoteList(key);
  syncIndicator(key);
}

function renderNoteList(key) {
  const list = document.getElementById('nl-' + key);
  if (!list) return;
  list.innerHTML = (notes[key] || []).map((n, i) => `
    <li class="note-item">
      <span class="note-bullet">—</span>
      <input class="note-input" value="${n.replace(/"/g, '&quot;')}"
             onclick="event.stopPropagation()"
             onchange="notes['${key}'][${i}]=this.value;syncIndicator('${key}')">
      <button class="note-delete" onclick="event.stopPropagation();deleteNote('${key}',${i})" aria-label="Remove">×</button>
    </li>`).join('');
}

function syncIndicator(key) {
  const el = document.getElementById('ni-' + key);
  if (!el) return;
  const n = (notes[key] || []).length;
  el.textContent = n ? `${n} note${n > 1 ? 's' : ''}` : '';
  el.style.display = n ? 'inline-flex' : 'none';
}

// ── VERTICAL PHOTO GALLERY ────────────────────────────────────────────────────
// Photos stack top-to-bottom at their true 1200×915 aspect ratio.
// The picker panel handles all scrolling — no fixed heights involved.
function buildPhotoGalleryHtml(imgs) {
  return `
    <div class="photo-gallery">
      ${imgs.map((src, i) => `
        <div class="photo-gallery-item">
          <img src="${src}" alt="Photo ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}"
               onload="this.classList.add('loaded')">
          <div class="photo-badge">${i + 1} / ${imgs.length}</div>
        </div>
      `).join('')}
    </div>`;
}


// ── RENDER DAYS ───────────────────────────────────────────────────────────────
function renderDays() {
  document.getElementById('days-container').innerHTML = DAYS.map(day => `
    <div class="card reveal" id="${day.id}">
      <div class="card-header">
        <div class="card-header-left">
          <div class="card-day-num">${day.num}</div>
          <div>
            <div class="card-date">${day.date}</div>
            <div class="card-title">${day.title}</div>
          </div>
        </div>
        <div class="card-loc">${day.loc}</div>
      </div>
      <div class="card-body">
        ${day.periods.map((p, pi) => `
          <div class="period">
            <div class="period-label">${p.label}</div>
            <div class="period-items">${p.items.map((item, ii) => renderItem(item, noteKey(day.id, pi, ii))).join('')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderItem(item, key) {
  if (item.isAccom) return renderAccomRow(item.isAccom);
  const badgeMap = { 'Free':'badge-free', 'Optional':'badge-optional', 'Book ahead':'badge-book' };
  const bc = badgeMap[item.tag] || '';
  return `
    <div class="activity-wrap">
      <div class="activity" onclick="toggleNotes('${key}', event)">
        <div class="activity-left">
          <div class="activity-dot"></div>
          <div class="activity-body">
            <div class="activity-name">${item.name}</div>
            ${item.sub ? `<div class="activity-sub">${item.sub}</div>` : ''}
            ${item.bookUrl ? `<div class="activity-cta-row"><a class="btn-cta" href="${item.bookUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${item.bookLabel || 'Book'} ${linkIcon()}</a></div>` : ''}
          </div>
        </div>
        <div class="activity-right">
          ${item.tag ? `<span class="badge ${bc}">${item.tag}</span>` : ''}
          ${item.cost ? `<span class="activity-cost">${item.cost}</span>` : ''}
          <span class="note-indicator" id="ni-${key}" style="display:none"></span>
        </div>
      </div>
      <div class="notes-wrap" id="nw-${key}">
        <div class="notes-inner">
          <div class="notes-panel">
            <ul class="note-list" id="nl-${key}"></ul>
            <input class="note-add" id="na-${key}" placeholder="Add a note…"
                   onclick="event.stopPropagation()"
                   onkeydown="if(event.key==='Enter'){addNote('${key}',this);event.preventDefault()}"
                   onblur="if(this.value.trim())addNote('${key}',this)">
          </div>
        </div>
      </div>
    </div>`;
}

function renderAccomRow(night) {
  const h = getHotel(night);
  return `
    <div class="accom-row" id="accom-row-${night}">
      <img class="accom-thumb" id="accom-thumb-${night}"
           src="${h.imgs[0]}" alt="${h.name}">
      <div class="accom-info">
        <div class="accom-name-inline" id="accom-name-${night}">${h.name}</div>
        <div class="accom-platform-inline" id="accom-platform-${night}">${h.platform}</div>
        <div class="accom-prices-row">
          <span class="accom-price-inline" id="accom-pp-${night}">$${h.pp}/pp</span>
          <span class="accom-price-sep">·</span>
          <span class="accom-price-total" id="accom-total-${night}">$${h.total} total</span>
        </div>
      </div>
      <button class="btn-change" onclick="openPicker('${night}')">Change ${arrowIcon()}</button>
    </div>`;
}

function updateAccomRow(night) {
  const h = getHotel(night);
  const $ = id => document.getElementById(id);
  if ($(`accom-thumb-${night}`))    $(`accom-thumb-${night}`).src = h.imgs[0];
  if ($(`accom-name-${night}`))     $(`accom-name-${night}`).textContent = h.name;
  if ($(`accom-platform-${night}`)) $(`accom-platform-${night}`).textContent = h.platform;
  if ($(`accom-pp-${night}`))       $(`accom-pp-${night}`).textContent = `$${h.pp}/pp`;
  if ($(`accom-total-${night}`))    $(`accom-total-${night}`).textContent = `$${h.total} total`;
  const row = document.getElementById(`accom-row-${night}`);
  if (row) row.classList.add('confirmed');
}

// ── HOTEL PICKER ──────────────────────────────────────────────────────────────
function openPicker(night) {
  document.getElementById('slide-eyebrow').textContent =
    night === 'antigua' ? 'Antigua · Mon May 11' : 'Lake Atitlán · Thu May 14';
  document.getElementById('slide-title').textContent =
    night === 'antigua' ? 'Choose your Antigua stay' : 'Choose your Atitlán stay';

  document.getElementById('slide-body').innerHTML =
    HOTELS[night].map(h => renderHotelCard(h, night)).join('');

  document.getElementById('overlay').classList.add('open');
  document.getElementById('slide-over').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePicker() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('slide-over').classList.remove('open');
  document.body.style.overflow = '';
}

function renderHotelCard(h, night) {
  const isSel = selected[night] === h.id;
  return `
    <div class="hotel-card ${isSel ? 'selected' : ''}" id="hcard-${h.id}">
      ${buildPhotoGalleryHtml(h.imgs)}
      <div class="hotel-body">
        <div class="hotel-top">
          <div class="hotel-name">${h.name}</div>
          <div class="hotel-price-col">
            <div class="hotel-pp">$${h.pp}<span style="font-size:12px;font-weight:400;color:var(--p-text-subdued)">/pp</span></div>
            <div class="hotel-total">$${h.total} total</div>
          </div>
        </div>
        <div class="hotel-meta">
          <span class="hotel-platform-badge">${h.platform}</span>
          ${h.rating ? `<span class="hotel-rating">${starsHtml(h.rating)} <span style="color:var(--p-text-disabled)">(${h.ratingCount})</span></span>` : ''}
        </div>
        <ul class="hotel-highlights">
          ${h.highlights.map(hl => `<li>${hl}</li>`).join('')}
        </ul>
        <div class="hotel-footer">
          <button class="btn-select ${isSel ? 'active' : ''}"
                  onclick="chooseHotel('${night}','${h.id}')">
            ${isSel ? '✓ Selected' : 'Select'}
          </button>
          ${h.url ? `<a class="btn-view-listing" href="${h.url}" target="_blank" rel="noopener">View listing ${linkIcon()}</a>` : ''}
        </div>
      </div>
    </div>`;
}

function chooseHotel(night, id) {
  selected[night] = id;
  document.querySelectorAll('.hotel-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.btn-select').forEach(b => { b.classList.remove('active'); b.textContent = 'Select'; });
  const card = document.getElementById('hcard-' + id);
  if (card) {
    card.classList.add('selected');
    const btn = card.querySelector('.btn-select');
    if (btn) { btn.classList.add('active'); btn.textContent = '✓ Selected'; }
  }
  updateAccomRow(night);
  renderSummary();
  setTimeout(closePicker, 450);
}

// ── COST SUMMARY ──────────────────────────────────────────────────────────────
function renderSummary() {
  const ha = getHotel('antigua'), ht = getHotel('atitlan');
  const accomPp = ha.pp + ht.pp;

  document.getElementById('sum-accom-rows').innerHTML = `
    <div class="cost-row">
      <span class="cost-row-label">Antigua — ${ha.name}</span>
      <span class="cost-row-amount">$${ha.pp}</span>
    </div>
    <div class="cost-row">
      <span class="cost-row-label">Atitlán — ${ht.name}</span>
      <span class="cost-row-amount">$${ht.pp}</span>
    </div>`;
  document.getElementById('sum-accom-total').textContent = `$${accomPp}`;

  const actFixed = COSTS.activities.filter(a => !a.optional).reduce((s,a) => s + a.amount, 0);
  const actOpt   = COSTS.activities.filter(a =>  a.optional).reduce((s,a) => s + a.amount, 0);
  document.getElementById('sum-act-rows').innerHTML = COSTS.activities.map(a =>
    `<div class="cost-row">
      <span class="cost-row-label">${a.label}</span>
      <span class="cost-row-amount ${a.optional ? 'optional' : ''}">$${a.amount}${a.optional ? ' (opt.)' : ''}</span>
    </div>`).join('');
  document.getElementById('sum-act-total').textContent = `$${actFixed}–$${actFixed + actOpt}`;

  let tLow = 0, tHigh = 0;
  document.getElementById('sum-trans-rows').innerHTML = COSTS.transport.map(t => {
    if (t.amountLow !== undefined) {
      tLow += t.amountLow; tHigh += t.amountHigh;
      return `<div class="cost-row"><span class="cost-row-label">${t.label}</span><span class="cost-row-amount">$${t.amountLow}–$${t.amountHigh}</span></div>`;
    } else {
      tLow += t.amount; tHigh += t.amount;
      return `<div class="cost-row"><span class="cost-row-label">${t.label}</span><span class="cost-row-amount">$${t.amount}</span></div>`;
    }
  }).join('');
  document.getElementById('sum-trans-total').textContent =
    tLow === tHigh ? `$${tLow}` : `$${tLow}–$${tHigh}`;
  document.getElementById('sum-flights-total').textContent = `$${COSTS.flights}`;

  const totalLow  = accomPp + actFixed       + tLow  + COSTS.flights;
  const totalHigh = accomPp + actFixed + actOpt + tHigh + COSTS.flights;
  const totalStr  = totalLow === totalHigh ? `$${totalLow}` : `$${totalLow}–$${totalHigh}`;
  ['grand-total','grand-total-hero','grand-total-box'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = totalStr;
  });
  const sub = document.getElementById('grand-accom');
  if (sub) sub.textContent = `$${accomPp} accommodation`;
}

// ── SCROLL REVEAL + NAV ───────────────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.05 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

function initNavHighlight() {
  const tabs = document.querySelectorAll('.nav-tab');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tabs.forEach(t => t.classList.remove('active'));
        const m = document.querySelector(`.nav-tab[href="#${e.target.id}"]`);
        if (m) m.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('[id]').forEach(s => obs.observe(s));
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderDays();
  renderSummary();
  initReveal();
  initNavHighlight();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });
});