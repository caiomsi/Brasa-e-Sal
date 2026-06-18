// Brasa & Sal — shared Supabase client + helpers (vanilla ESM, no build step)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Project config (demo mode: publishable/anon key is safe to expose) ------
export const SUPA_URL = 'https://hktzefkarulgoqueotun.supabase.co';
export const SUPA_KEY = 'sb_publishable_r_fUYlKJgWOgNqUEGQ9SKQ_TaY1zDBz';

export const db = createClient(SUPA_URL, SUPA_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

// Table names (brasa_ prefixed so the project can be shared cleanly)
export const T = {
  items:    'brasa_menu_items',
  tables:   'brasa_restaurant_tables',
  orders:   'brasa_orders',
  oitems:   'brasa_order_items',
  expenses: 'brasa_expenses',
  closings: 'brasa_daily_closings',
};

// Station metadata
export const STATIONS = {
  cozinha:       { label: 'Cozinha',       icon: '🍳' },
  churrasqueira: { label: 'Churrasqueira',  icon: '🔥' },
  bar:           { label: 'Bar',           icon: '🍺' },
};

// --- Formatting --------------------------------------------------------------
export const brl = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Human "há 3 min" from an ISO timestamp
export function elapsed(iso) {
  if (!iso) return '';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `há ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  return `há ${h}h${String(mins % 60).padStart(2, '0')}`;
}

// Color band by waiting time (for KDS urgency)
export function urgency(iso) {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins >= 15) return 'late';
  if (mins >= 8) return 'warn';
  return 'fresh';
}

// --- Sound -------------------------------------------------------------------
let _ac;
function ctx() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}
// Short pleasant chime; `kind` tweaks the pitch (new vs ready).
export function beep(kind = 'new') {
  try {
    const ac = ctx();
    const notes = kind === 'ready' ? [880, 1320] : [660, 990];
    notes.forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const t0 = ac.currentTime + i * 0.14;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(ac.destination);
      o.start(t0);
      o.stop(t0 + 0.24);
    });
  } catch (_) { /* audio not allowed yet */ }
}

// Many browsers block audio until the first user gesture — unlock on first tap.
export function armAudioOnFirstGesture() {
  const unlock = () => { try { ctx(); } catch (_) {} window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock, { once: true });
}

// --- DOM helpers -------------------------------------------------------------
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
