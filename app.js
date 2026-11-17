/* Muffin Study Game: giao diện, lưu trữ, PWA. Luật chơi nằm trong rules.js */
(function () {
  'use strict';
  const M = window.MuffinRules;
  const R = M.RULES;
  const APP_VERSION = '1.5.1';
  const KEY = 'muffin.state';
  const BK_KEY = 'muffin.backups';
  const THEME_KEY = 'muffin.theme';
  const MAIN_TABS = ['today', 'goals', 'shop', 'streak', 'bag'];
  const TAB_LABEL = { today: 'Hôm nay', goals: 'Mục tiêu', shop: 'Cửa hàng', streak: 'Chuỗi', bag: 'Túi đồ' };

  /* ================= Biểu tượng (SVG nét) ================= */
  const I = (p, sw) => '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ICON = {
    today: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    goals: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    shop: I('<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
    streak: I('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.5 1.5 2 2.5 2C11.5 7.5 11 5 12 3z"/>'),
    bag: I('<path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6M8 13h8v4"/>'),
    stats: I('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
    log: I('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6M12 17h.01"/>'),
    settings: I('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    back: I('<path d="M15 18l-6-6 6-6"/>', 2.4),
    chev: I('<path d="M9 6l6 6-6 6"/>'),
    undo: I('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>', 2.6),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
    del: I('<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>'),
    vault: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="12" cy="12" r="3"/><path d="M12 9v-.5M7 19v1.5M17 19v1.5"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    muffin: I('<path d="M5.5 12h13l-1.5 8.1a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9z"/><path d="M5 12a3 3 0 0 1 1.2-5.6A4.2 4.2 0 0 1 12 4a4.2 4.2 0 0 1 5.8 2.4A3 3 0 0 1 19 12"/><path d="M10 12l.5 9M14 12l-.5 9"/>'),
    gift: I('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>'),
    home: I('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    class: I('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'),
    work: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    gym: I('<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>'),
    coffee: I('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
    game: I('<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13.5h.01"/>'),
    food: I('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>'),
    film: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
    tag: I('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    gem: I('<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/>'),
    sparkle: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    plane: I('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
    star: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    sprout: I('<path d="M12 21v-9M12 12C12 7 8 5 4 5c0 4 3 7 8 7zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/>'),
    upload: I('<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    // Mục giải trí (icon nét tự vẽ, không phải logo)
    a_tiktok: I('<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>'),
    a_youtube: I('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'),
    a_facebook: I('<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>'),
    a_instagram: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
    a_threads: I('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'),
    a_game: I('<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13.5h.01"/>'),
    a_web: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21a14 14 0 0 1-3.5-9A14 14 0 0 1 12 3z"/>'),
  };
  // Màu từng mục giải trí
  const APP_COLOR = { tiktok: '#06B6D4', youtube: '#FF0033', facebook: '#1877F2', instagram: '#E1306C', threads: 'var(--ink)', game: '#8B5CF6', web: '#0EA5E9' };
  const ic = (name) => ICON[name] || '';
  const tone = (t) => '--c:var(--' + t + ');--cbg:var(--' + t + '-bg)';
  const CAT_COLOR = { home: '#3B82F6', class: '#A855F7', work: '#F97316', gym: '#F43F5E' };
  // Biểu tượng và màu cho từng món trong Cửa hàng (rules.js giữ emoji gốc, ở đây dùng icon nét)
  const ITEM_LOOK = {
    cafe: ['coffee', 'work'], net: ['game', 'class'], food: ['food', 'gym'], movie: ['film', 'home'],
    buy100: ['tag', 'kho'], buy150: ['tag', 'kho'], buy250: ['tag', 'kho'], buy350: ['tag', 'kho'],
    buy500: ['gift', 'bx'], buy700: ['gift', 'bx'], buy1m: ['gem', 'class'], buy1m5: ['gem', 'class'], buy2m5: ['gem', 'class'],
    skate: ['sparkle', 'home'], travel: ['plane', 'kho'], wish: ['star', 'fl'],
  };
  const itemLook = (id) => ITEM_LOOK[id] || ['tag', 'kho'];
  const GROUP_LABEL = { small: 'Giải trí', shopping: 'Mua sắm', big: 'Trải nghiệm' };

  /* ================= Lưu trữ (luôn bọc try/catch) ================= */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); return true; }
    catch (e) { toast('Không lưu được dữ liệu (bộ nhớ đầy hoặc bị chặn). Hãy xuất JSON để sao lưu.', 'error'); return false; }
  }
  function loadState() {
    const raw = lsGet(KEY);
    if (!raw) return M.createInitialState(Date.now());
    try { return M.migrate(JSON.parse(raw), Date.now()); }
    catch (e) {
      lsSet('muffin.corrupt.' + Date.now(), raw);
      setTimeout(() => toast('Dữ liệu cũ bị lỗi nên app khởi tạo lại. Bản lỗi đã được giữ riêng; hãy nhập JSON sao lưu nếu có.', 'error', null, 8000), 300);
      return M.createInitialState(Date.now());
    }
  }
  function save() { return lsSet(KEY, JSON.stringify(state)); }
  function getBackups() { try { const l = JSON.parse(lsGet(BK_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  // Tự sao lưu trước mọi thao tác phá hủy (giữ 5 bản gần nhất)
  function autoBackup(reason) {
    const list = getBackups();
    list.unshift({ at: Date.now(), reason: reason, data: state });
    let keep = list.slice(0, 5);
    try { localStorage.setItem(BK_KEY, JSON.stringify(keep)); return true; }
    catch (e) {
      keep = list.slice(0, 1);
      try { localStorage.setItem(BK_KEY, JSON.stringify(keep)); return true; } catch (e2) { return false; }
    }
  }

  /* ================= Giao diện sáng / tối ================= */
  const darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function themePref() { const v = lsGet(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'auto'; }
  function applyTheme() {
    const p = themePref();
    const root = document.documentElement;
    if (p === 'auto') delete root.dataset.theme; else root.dataset.theme = p;
    const dark = p === 'dark' || (p === 'auto' && darkMQ && darkMQ.matches);
    const meta = document.getElementById('themeColor');
    if (meta) meta.setAttribute('content', dark ? '#0B0E13' : '#FAF5EE');
  }
  applyTheme();
  if (darkMQ) { const f = () => applyTheme(); darkMQ.addEventListener ? darkMQ.addEventListener('change', f) : darkMQ.addListener(f); }

  /* ================= Trạng thái ================= */
  let state = loadState();
  let view = 'today';
  let rootTab = 'today';
  let stack = [];
  const todayKey = () => M.dateKey(Date.now());
  let lastToday = todayKey();
  const ui = { statsRange: 7, logLimit: 60, bump: false, goalDate: lastToday, shopGroup: 'small', streakTab: 'day' };
  state = M.pruneGoalDays(state, lastToday);

  function ctx() {
    let rand = Math.random();
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); rand = a[0] / 4294967296; } catch (e) { /* dùng Math.random */ }
    return { now: Date.now(), id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), rand: rand };
  }

  // Áp dụng kết quả hành động: lưu, vẽ lại, báo toast (kèm nút Hoàn tác nếu có bản ghi)
  function commit(res, msg, opts) {
    opts = opts || {};
    if (!res.ok) { toast(res.error, 'error'); return false; }
    state = res.state;
    save();
    if (opts.render !== false) render();
    if (msg) {
      const entry = res.entry;
      toast(msg, 'success', entry && opts.undo !== false ? { label: 'Hoàn tác', fn: () => undoEntry(entry.id) } : null);
    }
    return true;
  }
  function undoEntry(id) {
    const e = state.log.find((x) => x.id === id);
    if (!e) { toast('Bản ghi này không còn nữa.', 'error'); return; }
    const res = M.deleteEntry(state, id);
    if (commit(res)) toast('Đã hoàn tác: ' + M.describeEntry(e), 'info');
  }

  /* ================= Tiện ích giao diện ================= */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const $ = (sel, root) => (root || document).querySelector(sel);
  function fmtDate(key) { const p = key.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fmtShort(key) { const p = key.split('-'); return p[2] + '/' + p[1]; }
  function dow(key) { return new Date(key + 'T00:00:00Z').getUTCDay(); }
  function weekday(key) { return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dow(key)]; }
  function weekdayLong(key) { return ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dow(key)]; }
  function fmtTime(ms) { const d = new Date(ms + R.TZ_OFFSET_HOURS * 3600000); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
  function dayLabel(key) {
    const t = todayKey();
    if (key === t) return 'Hôm nay';
    if (key === M.addDays(t, -1)) return 'Hôm qua';
    return weekday(key) + ', ' + fmtDate(key);
  }
  function pct(a, b) { return Math.max(0, Math.min(100, b ? (a / b) * 100 : 0)); }
  const ib = (attrs, icon, label, cls) => '<button type="button" class="ib' + (cls ? ' ' + cls : '') + '" ' + attrs + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + icon + '</button>';
  const goBtn = (v, icon, label) => ib('data-act="go" data-view="' + v + '"', icon, label);
  function topMain(title, sub, right) {
    return '<header class="top"><div class="tt">' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '<h1>' + esc(title) + '</h1></div>' +
      (right ? '<div class="ibs">' + right + '</div>' : '') + '</header>';
  }
  function topSub(title, right) {
    return '<header class="top">' + ib('data-act="back"', ICON.back, 'Quay lại') + '<div class="tt"><h1>' + esc(title) + '</h1></div>' +
      (right ? '<div class="ibs">' + right + '</div>' : '') + '</header>';
  }
  function bar(val, max, color, label) {
    return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + Math.min(val, max) + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' +
      '<span style="width:' + pct(val, max) + '%' + (color ? ';background:' + color : '') + '"></span></div>';
  }
  function ringSVG(size, sw, frac, inner) {
    const r = (size - sw) / 2, c = 2 * Math.PI * r, h = size / 2;
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" style="stroke:var(--soft)" stroke-width="' + sw + '"/>' +
      (frac > 0 ? '<circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" style="stroke:var(--ok)" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (c * Math.min(1, frac)).toFixed(1) + ' ' + c.toFixed(1) + '"/>' : '') +
      '</svg><b>' + inner + '</b></div>';
  }

  /* ================= Toast ================= */
  function toast(msg, type, action, ms) {
    const box = $('#toasts');
    if (!box) return;
    while (box.children.length >= 2) box.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = '<span></span>';
    el.firstChild.textContent = msg;
    if (action) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = action.label;
      b.addEventListener('click', () => { close(); action.fn(); });
      el.appendChild(b);
    }
    box.appendChild(el);
    const timer = setTimeout(close, ms || (action ? 5000 : 3200));
    function close() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      el.classList.add('out');
      setTimeout(() => el.remove(), 200);
    }
  }

  /* ================= Bảng trượt: xác nhận ================= */
  let modalOpen = null;
  function confirmBox(opts) {
    return new Promise((resolve) => {
      const root = $('#modalRoot');
      const wrap = document.createElement('div');
      wrap.className = 'backdrop';
      wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="grab"></div>' +
        '<h3 id="mTitle">' + esc(opts.title) + '</h3><div class="body">' + (opts.html || '') + '</div>' +
        '<div class="btn-row">' +
        (opts.cancel === false ? '' : '<button type="button" class="btn" data-m="no">' + esc(opts.cancelLabel || 'Hủy') + '</button>') +
        '<button type="button" class="btn ' + (opts.danger ? 'danger' : 'pri') + '" data-m="yes">' + esc(opts.okLabel || 'Đồng ý') + '</button>' +
        '</div></div>';
      const prevFocus = document.activeElement;
      function done(v) {
        document.removeEventListener('keydown', onKey);
        wrap.remove(); modalOpen = null;
        if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') done(opts.dismissValue != null ? opts.dismissValue : false); }
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap) return done(opts.dismissValue != null ? opts.dismissValue : false);
        const b = e.target.closest('[data-m]');
        if (b) done(b.dataset.m === 'yes');
      });
      document.addEventListener('keydown', onKey);
      root.appendChild(wrap);
      modalOpen = wrap;
      const yes = wrap.querySelector('[data-m=yes]');
      setTimeout(() => yes.focus({ preventScroll: true }), 30);
      if (opts.onMount) opts.onMount(wrap, done);
    });
  }

  /* ================= Bảng trượt: bàn phím số =================
     o: { title, sub, icon, tone, unit, quick:[{v,label}], initial, hint, check(v) → {err} | {html}, okLabel(v),
          pick: { label, items:[{id, name, icon, color}], value } }  (pick.value cập nhật khi chọn; chưa chọn thì chưa bấm được)
     Trả về số đã chọn hoặc null nếu đóng. */
  function numPad(o) {
    return new Promise((resolve) => {
      const root = $('#modalRoot');
      const wrap = document.createElement('div');
      wrap.className = 'backdrop';
      let val = o.initial ? String(o.initial) : '';
      const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button type="button" data-k="' + n + '">' + n + '</button>').join('') +
        '<span></span><button type="button" data-k="0">0</button><button type="button" class="e" data-k="del" aria-label="Xóa 1 số">' + ICON.del + '</button>';
      const pk = o.pick;
      wrap.innerHTML = '<div class="sheet' + (pk ? ' has-pick' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '" style="' + tone(o.tone || 'ok') + '"><div class="grab"></div>' +
        '<div class="np-hd"><div class="np-ic">' + o.icon + '</div><div class="np-tt"><b>' + esc(o.title) + '</b>' + (o.sub ? '<span>' + esc(o.sub) + '</span>' : '') + '</div>' +
        '<button type="button" class="np-x" data-np="x" aria-label="Đóng">' + ICON.x + '</button></div>' +
        (pk ? '<div class="apps-lb" id="npPl">' + esc(pk.label) + '</div><div class="apps" role="radiogroup" aria-labelledby="npPl">' + pk.items.map((it) =>
          '<button type="button" class="pk" role="radio" data-pick="' + esc(it.id) + '" style="--a:' + it.color + '">' + it.icon + '<span>' + esc(it.name) + '</span></button>').join('') + '</div>' : '') +
        '<div class="np-disp"><div class="np-n num" id="npN"></div><div class="np-g" id="npG" aria-live="polite"></div></div>' +
        (o.quick && o.quick.length ? '<div class="np-qc">' + o.quick.map((q) => '<button type="button" data-q="' + q.v + '">' + esc(q.label || q.v) + '</button>').join('') + '</div>' : '') +
        '<div class="np-kp">' + keys + '</div>' +
        '<button type="button" class="btn pri np-go" data-np="ok"></button></div>';
      const nEl = $('#npN', wrap), gEl = $('#npG', wrap), go = $('[data-np=ok]', wrap);
      let valid = false;
      function upd() {
        const v = val ? parseInt(val, 10) : 0;
        nEl.className = 'np-n num' + (v ? '' : ' zero');
        nEl.innerHTML = fmt(v) + '<small>' + esc(o.unit) + '</small>';
        const r = v ? (o.check ? o.check(v) : {}) : { html: o.hint ? esc(o.hint) : '' };
        valid = v > 0 && !r.err && (!pk || !!pk.value);
        gEl.className = 'np-g' + (r.err ? ' err' : v ? ' ok' : '');
        gEl.innerHTML = r.err ? esc(r.err) : (r.html || '');
        gEl.style.visibility = gEl.innerHTML ? 'visible' : 'hidden';
        go.disabled = !valid;
        go.textContent = o.okLabel ? o.okLabel(v) : 'Xong';
        wrap.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('on', parseInt(b.dataset.q, 10) === v));
        wrap.querySelectorAll('[data-pick]').forEach((b) => { const on = !!pk && b.dataset.pick === pk.value; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      }
      function press(k) {
        if (k === 'del') val = val.slice(0, -1);
        else if (val.length < 4) val = (val === '0' ? '' : val) + k;
        if (val === '0') val = '';
        upd();
      }
      const prevFocus = document.activeElement;
      function done(v) {
        document.removeEventListener('keydown', onKey);
        wrap.remove(); modalOpen = null;
        if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ }
        resolve(v);
      }
      function onKey(e) {
        if (e.key === 'Escape') return done(null);
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
        else if (e.key === 'Enter' && valid) { e.preventDefault(); done(parseInt(val, 10)); }
      }
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap) return done(null);
        const k = e.target.closest('[data-k]');
        if (k) return press(k.dataset.k);
        const q = e.target.closest('[data-q]');
        if (q) { val = q.dataset.q; return upd(); }
        const p = e.target.closest('[data-pick]');
        if (p && pk) { pk.value = p.dataset.pick; return upd(); }
        const b = e.target.closest('[data-np]');
        if (!b) return;
        if (b.dataset.np === 'x') done(null);
        else if (valid) done(parseInt(val, 10));
      });
      document.addEventListener('keydown', onKey);
      root.appendChild(wrap);
      modalOpen = wrap;
      upd();
      setTimeout(() => { try { $('[data-np=x]', wrap).focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }, 30);
    });
  }

  /* ================= Vẽ ================= */
  function render() {
    const t = todayKey();
    // ngày đang xem mục tiêu phải nằm trong [hôm nay, hôm nay + 6]
    const gd = M.daysBetween(t, ui.goalDate);
    if (gd < 0 || gd >= R.GOAL_PLAN_DAYS) ui.goalDate = t;
    renderTabs();
    const v = $('#view');
    v.innerHTML = (VIEWS[view] || VIEWS.today)();
    if (VIEW_AFTER[view]) VIEW_AFTER[view]();
    ui.bump = false;
  }

  function readyCounts() {
    const t = todayKey();
    const day = M.milestoneStatus(R.DAY_STREAK_REWARDS, M.computeDayStreak(state, t), state.dayStreak.claims).filter((m) => m.status === 'ready').length;
    let habit = 0;
    state.habits.forEach((h) => { habit += M.milestoneStatus(R.HABIT_STREAK_REWARDS, M.computeHabitStreak(h, t), h.claims).filter((m) => m.status === 'ready').length; });
    return { day: day, habit: habit };
  }

  function renderTabs() {
    const ready = readyCounts();
    const badges = { streak: ready.day + ready.habit, bag: M.boxInfo(state, todayKey()).available };
    $('#tabs').innerHTML = MAIN_TABS.map((v) => {
      const on = rootTab === v;
      const b = badges[v] || 0;
      return '<button type="button" class="tab' + (on ? ' on' : '') + '" data-act="go" data-view="' + v + '" aria-label="' + TAB_LABEL[v] + (b ? ' (' + b + ' mục chờ)' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' +
        ICON[v] + '<span class="tl" aria-hidden="true">' + TAB_LABEL[v] + '</span>' + (b && !on ? '<span class="badge" aria-hidden="true">' + b + '</span>' : '') + '</button>';
    }).join('');
  }

  const VIEWS = {};
  const VIEW_AFTER = {};

  /* ---------- Hôm nay ---------- */
  VIEWS.today = function () {
    const t = todayKey();
    const day = state.days[t] || {};
    const total = M.dayTotal(day);
    const st = M.computeDayStreak(state, t);
    const fi = M.funConvertInfo(state, t);
    let h = topMain('Hôm nay', weekdayLong(t) + ', ' + fmtShort(t), goBtn('stats', ICON.stats, 'Thống kê') + goBtn('settings', ICON.settings, 'Cài đặt'));
    if (M.needsBackupReminder(state, Date.now())) {
      const last = state.meta.lastExport;
      const days = Math.floor((Date.now() - (last || state.createdAt)) / 86400000);
      h += '<div class="banner"><span>' + (last ? days + ' ngày chưa sao lưu' : 'Chưa sao lưu lần nào') + '</span><button type="button" class="btn sm pri" data-act="export">Sao lưu</button></div>';
    }
    if (!state.meta.setupDone && !state.meta.welcomeDismissed) {
      h += '<section class="card welcome"><h3>Chào mừng tới Muffin</h3><p>Có Muffin, Kho hay chuỗi từ bản cũ thì nhập trước nhé.</p>' +
        '<div class="btn-row"><button type="button" class="btn pri" data-act="go" data-view="setup">Nhập số dư</button><button type="button" class="btn" data-act="dismiss-welcome">Bắt đầu từ 0</button></div></section>';
    }
    const need = Math.max(0, st.min - total);
    h += '<section class="hero"><div class="hlb"><span>' + ICON.muffin + 'Muffin</span>' + (day.earned ? '<span class="earn">+' + fmt(day.earned) + ' hôm nay</span>' : '') + '</div>' +
      '<div class="hv num' + (ui.bump ? ' bump' : '') + '">' + fmt(state.muffin) + '</div><div class="chips">' +
      '<button type="button" class="hchip" data-act="go" data-view="streak" aria-label="Chuỗi ngày ' + st.count + ' trên ' + R.DAY_STREAK_CYCLE_DAYS + (st.todayDone ? ', hôm nay đã tính' : ', còn ' + need + ' phút') + '">' +
      ICON.streak + st.count + '/' + R.DAY_STREAK_CYCLE_DAYS + (st.todayDone ? ICON.check : ' · còn ' + need + '\'') + '</button>' +
      '<button type="button" class="hchip" data-act="go" data-view="shop" aria-label="Gửi Kho hôm nay ' + fi.deposited + ' trên ' + fi.needKho + '">' +
      ICON.vault + 'Kho ' + fi.deposited + '/' + fi.needKho + (fi.khoOk ? ICON.check : '') + '</button></div></section>';
    h += '<div class="sec"><h2>Ghi phút</h2><span>' + fmt(total) + '\' hôm nay</span></div><div class="lst">' + M.CATS.map((c) => {
      const m = day[c] || 0;
      return '<button type="button" class="lr" data-act="log-open" data-cat="' + c + '" style="' + tone(c) + '" aria-label="Ghi phút ' + M.CAT_LABEL[c] + ', hôm nay ' + m + ' phút">' +
        '<span class="lic">' + ICON[c] + '</span><span class="lnm">' + M.CAT_SHORT[c] + '</span><span class="lm' + (m ? ' has' : '') + '">' + fmt(m) + '\'</span>' +
        '<span class="ladd">' + ICON.plus + '</span></button>';
    }).join('') + '</div>';
    return h;
  };

  async function openLog(cat) {
    const t = todayKey();
    const rate = R.MINUTES_PER_MUFFIN[cat];
    const before = state.acc[cat];
    const v = await numPad({
      title: M.CAT_LABEL[cat], sub: 'Hôm nay ' + fmt((state.days[t] || {})[cat] || 0) + '\'', icon: ICON[cat], tone: cat, unit: 'phút',
      quick: [15, 30, 45, 60, 90].map((m) => ({ v: m, label: m + '\'' })),
      hint: rate + ' phút = 1 Muffin',
      check: (v) => {
        if (v > R.MAX_MINUTES_PER_ENTRY) return { err: 'Mỗi lần ghi tối đa ' + R.MAX_MINUTES_PER_ENTRY + ' phút' };
        const g = Math.floor((before + v) / rate) - Math.floor(before / rate);
        let box = false;
        if (cat === 'home') { const bi = M.boxInfo(state, t); box = !bi.opened && bi.home < bi.per && bi.home + v >= bi.per; }
        return { html: ICON.muffin + '+' + g + ' Muffin' + (box ? ' · mở được hộp' : '') };
      },
      okLabel: (v) => v ? 'Ghi ' + fmt(v) + ' phút' : 'Ghi',
    });
    if (v) doLog(cat, v);
  }
  function doLog(cat, minutes) {
    const res = M.logMinutes(state, cat, minutes, ctx());
    if (!res.ok) return toast(res.error, 'error');
    const e = res.entry;
    ui.bump = e.gained > 0;
    commit(res, M.CAT_SHORT[cat] + ' +' + minutes + '\' → +' + e.gained + ' Muffin' + (e.boxGained ? ' · mở được hộp' : ''));
  }

  /* ---------- Mục tiêu ---------- */
  function planLabel(d, t) {
    const diff = M.daysBetween(t, d);
    return diff === 0 ? 'Nay' : diff === 1 ? 'Mai' : weekday(d);
  }
  function goalBonusHTML() {
    const b = M.goalBonusInfo(state, todayKey());
    const shown = Math.min(b.done, b.need);
    return '<section class="card ringcard" id="goalBonus" aria-label="Tiến độ thưởng mục tiêu ' + shown + ' trên ' + b.need + '">' +
      ringSVG(56, 6, shown / b.need, shown + '/' + b.need) +
      '<div><div class="rt1">' + (b.got ? 'Đã nhận +' + b.got + ' Muffin' : 'Xong ' + b.need + ' mục → +' + b.reward + ' Muffin') + '</div>' +
      '<div class="rt2">' + (b.got ? 'Hôm nay đã đủ ' + b.need + ' mục' : 'Còn ' + (b.need - shown) + ' mục') + '</div></div></section>';
  }
  VIEWS.goals = function () {
    const t = todayKey();
    const d = ui.goalDate;
    const items = M.goalsOf(state, d);
    const isToday = d === t;
    const sub = isToday ? 'Hôm nay, ' + fmtShort(d) : (M.daysBetween(t, d) === 1 ? 'Ngày mai, ' : weekdayLong(d) + ', ') + fmtShort(d);
    let h = topMain('Mục tiêu', sub, goBtn('tasks', ICON.log, 'Kho nhiệm vụ'));
    h += '<div class="days" role="group" aria-label="Chọn ngày">' + M.planDates(t).map((x) => {
      const n = M.goalsOf(state, x).length;
      return '<button type="button" class="' + (x === d ? 'on' : '') + '" data-act="goal-day" data-date="' + x + '" aria-pressed="' + (x === d) + '" aria-label="' + dayLabel(x) + ', ' + n + ' mục">' +
        planLabel(x, t) + '<b>' + fmtShort(x).slice(0, 2) + '</b><i class="' + (n ? '' : 'no') + '"></i></button>';
    }).join('') + '</div>';
    if (isToday) h += goalBonusHTML();
    h += '<section class="card" id="goalsCard" style="padding:0"><ul class="glist">' + items.map((g, i) =>
      '<li class="goal' + (g.done ? ' done' : '') + '">' +
      (isToday
        ? '<label class="chk"><input type="checkbox" data-goal-check="' + esc(g.id) + '"' + (g.done ? ' checked' : '') + ' aria-label="Hoàn thành: ' + esc(g.text) + '"><i></i></label>'
        : '<span class="gnum" aria-hidden="true">' + (i + 1) + '</span>') +
      '<input class="gtext" data-goal-edit="' + esc(g.id) + '" value="' + esc(g.text) + '" maxlength="80" enterkeyhint="done" aria-label="Sửa mục tiêu ' + (i + 1) + '">' +
      ib('data-act="goal-del" data-id="' + esc(g.id) + '"', ICON.x, 'Xóa mục tiêu ' + g.text, 'plain') + '</li>').join('') +
      '<li><form class="gadd" data-form="goal-add"><span class="plus" aria-hidden="true"><i>' + ICON.plus + '</i></span>' +
      '<input class="gtext" name="text" maxlength="80" autocomplete="off" placeholder="Thêm mục tiêu" aria-label="Thêm mục tiêu mới" enterkeyhint="done"></form></li></ul></section>';
    if (!items.length) {
      let prev = null;
      for (let i = 1; i <= 14 && !prev; i++) { const p = M.addDays(d, -i); if (M.goalsOf(state, p).length) prev = p; }
      if (prev) h += '<div class="copy-row"><button type="button" class="btn sm" data-act="goal-copy" data-from="' + prev + '">' + ICON.undo + 'Chép từ ' + dayLabel(prev).toLowerCase() + '</button></div>';
    }
    const have = items.map((g) => g.text.toLowerCase());
    const free = state.tasks.filter((k) => have.indexOf(k.text.toLowerCase()) < 0);
    h += '<div class="sec"><h2>Từ Kho nhiệm vụ</h2><span>' + free.length + '</span></div><div class="bank">' +
      (state.tasks.length
        ? free.slice(0, 8).map((k) => '<button type="button" data-act="bank-add" data-id="' + esc(k.id) + '" aria-label="Thêm ' + esc(k.text) + '">' + ICON.plus + '<span>' + esc(k.text) + '</span></button>').join('') +
          (free.length > 8 ? '<button type="button" class="more" data-act="goal-pick">Tất cả ' + free.length + '</button>' : '') +
          (!free.length ? '<span class="muted small">Đã thêm hết</span>' : '')
        : '<button type="button" class="more" data-act="go" data-view="tasks">' + ICON.plus + '<span>Tạo Kho nhiệm vụ</span></button>') + '</div>';
    return h;
  };

  // Bảng chọn nhiều nhiệm vụ từ Kho để thêm vào ngày đang chọn
  async function pickFromBank() {
    const t = todayKey();
    const d = ui.goalDate;
    const have = M.goalsOf(state, d).map((g) => g.text.toLowerCase());
    let wrapEl = null;
    const yes = await confirmBox({
      title: 'Thêm vào ' + dayLabel(d).toLowerCase(),
      html: '<ul class="pick-list">' + state.tasks.map((k) => {
        const exists = have.indexOf(k.text.toLowerCase()) >= 0;
        return '<li><label class="pick' + (exists ? ' off' : '') + '"><input type="checkbox" value="' + esc(k.id) + '"' + (exists ? ' checked disabled' : '') + '><span>' + esc(k.text) + '</span></label></li>';
      }).join('') + '</ul>',
      okLabel: 'Thêm',
      onMount: (wrap) => {
        wrapEl = wrap;
        const btn = wrap.querySelector('[data-m=yes]');
        const upd = () => {
          const n = wrap.querySelectorAll('.pick-list input:checked:not(:disabled)').length;
          btn.textContent = n ? 'Thêm ' + n + ' mục' : 'Thêm';
          btn.disabled = n === 0;
        };
        wrap.addEventListener('change', upd); upd();
      },
    });
    if (!yes || !wrapEl) return;
    const ids = [...wrapEl.querySelectorAll('.pick-list input:checked:not(:disabled)')].map((i) => i.value);
    const res = M.addTasksToDay(state, ids, d, t, ctx());
    if (commit(res)) toast('Đã thêm ' + res.added + ' mục tiêu', 'success');
  }

  /* ---------- Cửa hàng ---------- */
  VIEWS.shop = function () {
    const fi = M.funConvertInfo(state, todayKey());
    const locked = !fi.khoOk || fi.leftMin <= 0;
    let h = topMain('Cửa hàng', fmt(state.muffin) + ' Muffin · Kho ' + fmt(state.kho));
    h += '<div class="two">' +
      '<section class="card"><div class="kh" style="color:var(--kho)">' + ICON.vault + 'Gửi Kho</div>' +
      '<div class="kv num">' + fi.deposited + '<small>/' + fi.needKho + '</small></div>' + bar(fi.deposited, fi.needKho, 'var(--kho)', 'Gửi Kho hôm nay') +
      '<button type="button" class="btn sm pri" data-act="deposit-open"' + (state.muffin > 0 ? '' : ' disabled') + '>Gửi</button></section>' +
      '<section class="card"><div class="kh" style="color:var(--bx)">' + ICON.clock + 'Đổi phút</div>' +
      '<div class="kv num">' + fi.converted + '<small>/' + fi.maxMin + '</small></div>' + bar(fi.converted, fi.maxMin, 'var(--bx)', 'Phút đã đổi hôm nay') +
      '<button type="button" class="btn sm ' + (locked ? '' : 'pri') + '" data-act="convert-open"' + (locked || state.muffin <= 0 ? ' disabled' : '') + '>' +
      (!fi.khoOk ? ICON.lock + 'Gửi Kho trước' : fi.leftMin <= 0 ? 'Hết lượt hôm nay' : 'Đổi') + '</button></section></div>';
    h += '<div class="filt" role="tablist">' + M.SHOP_GROUPS.map((g) =>
      '<button type="button" role="tab" class="' + (ui.shopGroup === g.id ? 'on' : '') + '" aria-selected="' + (ui.shopGroup === g.id) + '" data-act="shop-group" data-g="' + g.id + '">' + (GROUP_LABEL[g.id] || g.name) + '</button>').join('') + '</div>';
    h += '<div class="grid2">' + R.SHOP.filter((it) => it.group === ui.shopGroup).map((it) => {
      const p = M.purchasePreview(state, it.id);
      const look = itemLook(it.id);
      return '<div class="it' + (p.can ? '' : ' cant') + '" style="' + tone(look[1]) + '"><span class="iic">' + ic(look[0]) + '</span><span class="inm">' + esc(it.name) + '</span>' +
        '<button type="button" class="pbtn" data-act="buy" data-item="' + it.id + '" aria-label="Mua ' + esc(it.name) + ', giá ' + it.price + ' Muffin' + (p.can ? '' : ', còn thiếu ' + p.short) + '">' + ICON.muffin + fmt(it.price) + '</button></div>';
    }).join('') + '</div>';
    return h;
  };

  async function openDeposit() {
    const fi = M.funConvertInfo(state, todayKey());
    const need = Math.max(0, fi.needKho - fi.deposited);
    const quick = [need, 10, 20, 50].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4);
    const v = await numPad({
      title: 'Gửi Kho', sub: 'Hôm nay ' + fi.deposited + '/' + fi.needKho + ' · Kho ' + fmt(state.kho), icon: ICON.vault, tone: 'kho', unit: 'Muffin',
      initial: need && need <= state.muffin ? need : '',
      quick: quick.map((q) => ({ v: q, label: q === need && need ? 'Đủ ' + q : String(q) })),
      hint: 'Có ' + fmt(state.muffin) + ' Muffin thường',
      check: (v) => v > state.muffin ? { err: 'Chỉ có ' + fmt(state.muffin) + ' Muffin thường' } : { html: ICON.vault + 'Kho ' + fmt(state.kho) + ' → ' + fmt(state.kho + v) },
      okLabel: (v) => v ? 'Gửi ' + fmt(v) + ' Muffin' : 'Gửi',
    });
    if (v) { ui.bump = true; commit(M.deposit(state, v, ctx()), 'Đã gửi ' + v + ' Muffin vào Kho'); }
  }
  async function openConvert() {
    const fi = M.funConvertInfo(state, todayKey());
    const per = R.FUN_MINUTES_PER_MUFFIN;
    const quick = [5, 10, fi.maxMuffin].filter((v, i, a) => v > 0 && v <= fi.maxMuffin && a.indexOf(v) === i);
    const v = await numPad({
      title: 'Đổi phút giải trí', sub: 'Hôm nay đã đổi ' + fi.converted + '/' + fi.maxMin + '\'', icon: ICON.clock, tone: 'bx', unit: 'Muffin',
      quick: quick.map((q) => ({ v: q, label: q === fi.maxMuffin ? 'Tối đa ' + q : String(q) })),
      hint: '1 Muffin = ' + per + ' phút',
      check: (v) => {
        if (v > state.muffin) return { err: 'Chỉ có ' + fmt(state.muffin) + ' Muffin thường' };
        if (v * per > fi.leftMin) return { err: 'Hôm nay còn đổi được ' + fi.leftMin + ' phút (' + Math.floor(fi.leftMin / per) + ' Muffin)' };
        return { html: ICON.clock + '= ' + fmt(v * per) + ' phút giải trí' };
      },
      okLabel: (v) => v ? 'Đổi ' + fmt(v) + ' Muffin' : 'Đổi',
    });
    if (v) { ui.bump = true; commit(M.convertFun(state, v, ctx()), 'Đã đổi ' + v + ' Muffin → ' + (v * per) + ' phút giải trí'); }
  }

  async function doBuy(id) {
    const it = M.ITEM[id];
    const p = M.purchasePreview(state, id);
    if (!p.can) return toast('Còn thiếu ' + p.short + ' Muffin để mua "' + it.name + '"', 'error');
    const parts = [];
    if (p.fromKho) parts.push('<b>' + p.fromKho + '</b> trong Kho');
    if (p.fromMuffin) parts.push('<b>' + p.fromMuffin + '</b> Muffin thường');
    const yes = await confirmBox({
      title: 'Mua "' + it.name + '"?',
      html: '<p>Trừ ' + parts.join(' + ') + '.</p><p class="muted">Sau khi mua: Kho ' + fmt(state.kho - p.fromKho) + ', thường ' + fmt(state.muffin - p.fromMuffin) + '.</p>',
      okLabel: 'Mua · ' + fmt(it.price),
    });
    if (yes) commit(M.buyItem(state, id, ctx()), 'Đã mua "' + it.name + '", xem ở Túi đồ');
  }

  /* ---------- Chuỗi (Chuỗi ngày + Thói quen) ---------- */
  VIEWS.streak = function () {
    const t = todayKey();
    const st = M.computeDayStreak(state, t);
    const ready = readyCounts();
    let h = topMain('Chuỗi', null, '<span class="pill fl">Chu kì ' + st.cycles + '</span>');
    const tab = (id, label, n) => '<button type="button" class="' + (ui.streakTab === id ? 'on' : '') + '" role="tab" aria-selected="' + (ui.streakTab === id) + '" data-act="streak-tab" data-tab="' + id + '">' + label + (n ? ' · ' + n : '') + '</button>';
    h += '<div class="seg" role="tablist">' + tab('day', 'Chuỗi ngày', ready.day) + tab('habit', 'Thói quen', ready.habit) + '</div>';
    return h + (ui.streakTab === 'habit' ? habitsHTML(t) : dayStreakHTML(t, st));
  };
  function dayStreakHTML(t, st) {
    const N = R.DAY_STREAK_CYCLE_DAYS;
    const ms = M.milestoneStatus(R.DAY_STREAK_REWARDS, st, state.dayStreak.claims);
    const next = ms.find((m) => m.status === 'locked');
    const start = M.addDays(t, -27);
    let head = '', heat = '';
    for (let i = 0; i < 7; i++) head += '<span>' + weekday(M.addDays(start, i)) + '</span>';
    for (let i = 0; i < 28; i++) {
      const d = M.addDays(start, i);
      const tot = M.dayTotal(state.days[d]);
      heat += '<i class="' + (tot >= st.min ? 'b' : tot > 0 ? 'a' : '') + (d === t ? ' t' : '') + '" title="' + fmtShort(d) + ': ' + tot + ' phút"></i>';
    }
    let h = '<section class="card"><div class="flame"><div class="fic">' + ICON.streak + '</div><div><div class="fnum num">' + st.count + '<small>/' + N + '</small></div>' +
      (st.todayDone ? '<span class="pill ok">' + ICON.check + 'Hôm nay đã tính</span>' : '<span class="pill warn">Còn ' + Math.max(0, st.min - st.todayMinutes) + ' phút hôm nay</span>') + '</div></div>' +
      '<div class="heat-h" aria-hidden="true">' + head + '</div><div class="heat" role="img" aria-label="Lịch 4 tuần gần nhất">' + heat + '</div></section>';
    h += '<div class="sec"><h2>Mốc thưởng</h2><span>' + (next ? 'Còn ' + (next.at - st.count) + ' ngày tới mốc ' + next.at : 'Đã qua mọi mốc') + '</span></div>' +
      '<div class="hs" id="msScroll">' + ms.map((m) =>
        '<div class="mc ' + m.status + '"><div class="at num">' + m.at + '<small> ngày</small></div><div class="rw">' + esc(M.rewardText(m.reward)) + '</div>' +
        (m.status === 'ready' ? '<button type="button" class="btn" data-act="claim-day" data-at="' + m.at + '">Nhận</button>'
          : '<button type="button" class="btn" disabled>' + (m.status === 'claimed' ? 'Đã nhận' : 'Còn ' + (m.at - st.count) + ' ngày') + '</button>') + '</div>').join('') + '</div>';
    return h;
  }
  VIEW_AFTER.streak = function () {
    const sc = $('#msScroll');
    if (!sc) return;
    const c = sc.querySelector('.mc.ready') || sc.querySelector('.mc.locked');
    if (c) sc.scrollLeft = Math.max(0, c.offsetLeft - sc.offsetLeft - 18);
  };
  function habitsHTML(t) {
    const y = M.addDays(t, -1);
    let h = '<section class="card"><form class="row" data-form="habit-add"><input class="inp" name="name" maxlength="60" autocomplete="off" placeholder="Thói quen mới" aria-label="Tên thói quen mới" enterkeyhint="done">' +
      '<button class="btn pri" type="submit">Thêm</button></form></section>';
    if (!state.habits.length) return h + '<section class="card empty">Chưa có thói quen nào</section>';
    state.habits.forEach((hb) => {
      const st = M.computeHabitStreak(hb, t);
      const ms = M.milestoneStatus(R.HABIT_STREAK_REWARDS, st, hb.claims);
      const ready = ms.filter((m) => m.status === 'ready');
      const next = ms.find((m) => m.status === 'locked');
      const done = {}; hb.done.forEach((d) => { done[d] = true; });
      // Ngày khai từ bản cũ (số dư ban đầu) cũng hiện là đã xong
      if (hb.anchor && hb.anchor.count > 0) {
        for (let i = 0; i < Math.min(hb.anchor.count, 7); i++) done[M.addDays(hb.anchor.endDate, -i)] = true;
      }
      let week = '';
      for (let i = 6; i >= 0; i--) {
        const d = M.addDays(t, -i);
        const editable = d === t || d === y;
        const isDone = !!done[d];
        week += '<button type="button" class="wd' + (isDone ? ' done' : '') + (d === t ? ' today' : '') + (editable ? ' editable' : '') + '"' +
          (editable ? ' data-act="habit-toggle" data-id="' + esc(hb.id) + '" data-day="' + d + '"' : ' disabled') +
          ' aria-label="' + (d === t ? 'Hôm nay' : weekday(d) + ' ' + fmtShort(d)) + ': ' + (isDone ? 'đã xong' : 'chưa xong') + '"' + (editable ? ' aria-pressed="' + isDone + '"' : '') + '>' +
          '<span>' + (d === t ? 'Nay' : weekday(d)) + '</span><i></i></button>';
      }
      const doneToday = !!done[t];
      h += '<section class="card habit"><div class="hh"><b>' + esc(hb.name) + '</b><span class="pill ok">' + ICON.sprout + st.count + ' ngày</span>' +
        ib('data-act="habit-del" data-id="' + esc(hb.id) + '"', ICON.trash, 'Xóa thói quen ' + hb.name, 'plain') + '</div>' +
        '<div class="week">' + week + '</div>' +
        '<button type="button" class="btn block ' + (doneToday ? 'done-soft' : 'pri') + '" data-act="habit-toggle" data-id="' + esc(hb.id) + '" data-day="' + t + '" aria-pressed="' + doneToday + '">' +
        (doneToday ? ICON.check + 'Đã xong hôm nay' : 'Xong hôm nay') + '</button>' +
        ready.map((m) => '<div class="claim-box"><span>Mốc ' + m.at + ': ' + esc(M.rewardText(m.reward)) + '</span>' +
          (m.reward.choice
            ? m.reward.choice.map((c) => '<button type="button" class="btn sm" data-act="claim-habit" data-id="' + esc(hb.id) + '" data-at="' + m.at + '" data-choice="' + c + '">' + esc(M.ITEM[c].name) + '</button>').join('')
            : '<button type="button" class="btn sm" data-act="claim-habit" data-id="' + esc(hb.id) + '" data-at="' + m.at + '">Nhận</button>') + '</div>').join('') +
        (next ? '<p class="next">Mốc ' + next.at + ' ngày: ' + esc(M.rewardText(next.reward)) + '</p>' : '') +
        '</section>';
    });
    return h;
  }

  /* ---------- Túi đồ (có Mở hộp) ---------- */
  VIEWS.bag = function () {
    const bi = M.boxInfo(state, todayKey());
    let h = topMain('Túi đồ');
    h += '<section class="fund"><div class="flb">Quỹ giải trí</div><div class="fv num">' + fmt(state.fun) + '<small> phút</small></div>' +
      '<button type="button" class="btn hl block" data-act="spend-open"' + (state.fun > 0 ? '' : ' disabled') + '>Tiêu phút</button></section>';
    const fu = M.funUseInfo(state, todayKey());
    if (fu.total) {
      h += '<section class="card spent"><div class="hd"><b>Hôm nay đã tiêu</b><span>' + fmt(fu.total) + ' phút</span></div>' +
        '<div class="stack" role="img" aria-label="Tỷ lệ phút giải trí theo mục">' + fu.list.map((x) => '<i style="--a:' + APP_COLOR[x.id] + ';flex:' + x.minutes + '"></i>').join('') + '</div>' +
        fu.list.map((x) => '<div class="rx" style="--a:' + APP_COLOR[x.id] + '"><span class="dot">' + ic('a_' + x.id) + '</span><span class="nm">' + esc(x.name) + '</span>' +
          '<span class="mn">' + fmt(x.minutes) + "'</span><span class=\"pc\">" + Math.round(x.minutes * 100 / fu.total) + '%</span></div>').join('') + '</section>';
    }
    h += '<section class="card boxc" style="margin-top:12px"><span class="bic">' + ICON.gift + '</span><div class="bt"><b>Hộp Huyền Thoại</b>' +
      '<span>' + (bi.opened ? 'Hôm nay đã mở' : bi.ready ? 'Sẵn sàng mở!' : 'Hôm nay ' + fmt(bi.progress) + '/' + bi.per + '\' ở nhà') + '</span>' + bar(bi.progress, bi.per, null, 'Phút học ở nhà hôm nay cho Hộp Huyền Thoại') + '</div>' +
      '<button type="button" class="btn sm gold" data-act="open-box"' + (bi.available ? '' : ' disabled') + '>Mở</button></section>';
    const owned = R.SHOP.filter((it) => (state.inventory[it.id] || 0) > 0);
    const total = owned.reduce((s, it) => s + state.inventory[it.id], 0);
    h += '<div class="sec"><h2>Đồ đang có</h2><span>' + total + ' món</span></div>';
    if (!owned.length) return h + '<section class="card empty">Chưa có món nào</section>';
    h += '<section class="card list">' + owned.map((it) => {
      const n = state.inventory[it.id];
      const look = itemLook(it.id);
      return '<div class="li" style="' + tone(look[1]) + '"><span class="iic">' + ic(look[0]) + '</span><div class="li-main"><b>' + esc(it.bagName) + '</b>' +
        (n > 1 ? '<span class="li-sub">x' + n + '</span>' : '') + '</div>' +
        '<button type="button" class="btn sm pri" data-act="use" data-item="' + it.id + '" aria-label="Dùng ' + esc(it.bagName) + '">Dùng</button></div>';
    }).join('') + '</section>';
    return h;
  };

  const FUN_APP_NAME = {};
  R.FUN_APPS.forEach((a) => { FUN_APP_NAME[a.id] = a.name; });
  async function openSpend() {
    const last = state.meta.lastFunApp;
    const pick = {
      label: 'Dùng cho', value: FUN_APP_NAME[last] ? last : null,
      items: R.FUN_APPS.map((a) => ({ id: a.id, name: a.name, icon: ic('a_' + a.id), color: APP_COLOR[a.id] || 'var(--ink)' })),
    };
    const v = await numPad({
      title: 'Tiêu phút giải trí', sub: 'Quỹ còn ' + fmt(state.fun) + "'", icon: ICON.clock, tone: 'ok', unit: 'phút', pick: pick,
      quick: [5, 15, 30, 45].filter((q) => q <= state.fun).map((q) => ({ v: q, label: q + "'" })),
      check: (v) => v > state.fun ? { err: 'Quỹ chỉ còn ' + fmt(state.fun) + ' phút' } : { html: 'Còn lại ' + fmt(state.fun - v) + ' phút' },
      okLabel: (v) => !pick.value ? 'Chọn mục giải trí' : v ? 'Tiêu ' + fmt(v) + ' phút · ' + FUN_APP_NAME[pick.value] : 'Tiêu',
    });
    if (v && pick.value) commit(M.spendFun(state, v, ctx(), pick.value), 'Tiêu ' + v + "' · " + FUN_APP_NAME[pick.value] + '. Chơi vui!');
  }

  function giftHTML(cls) {
    return '<div class="gift ' + (cls || '') + '" aria-hidden="true"><div class="g-body"></div><div class="g-rib-v"></div>' +
      '<div class="g-lid-wrap"><div class="g-lid"></div><div class="g-rib-l"></div><div class="g-bow"></div></div></div>';
  }
  async function doOpenBox() {
    const res = M.openBox(state, ctx());
    if (!res.ok) return toast(res.error, 'error');
    // Lưu ngay rồi mới chạy hiệu ứng (đóng app giữa chừng cũng không mất thưởng)
    ui.bump = true;
    commit(res, null);
    const reward = res.entry.reward;
    const entryId = res.entry.id;
    const colors = ['#F59E0B', '#16A34A', '#2563EB', '#E11D48', '#9333EA', '#14B8A6'];
    let confetti = '';
    for (let i = 0; i < 22; i++) {
      const a = (Math.PI * 2 * i) / 22, d = 90 + Math.random() * 70;
      confetti += '<i class="confetti" style="background:' + colors[i % colors.length] + ';--dx:' + Math.round(Math.cos(a) * d) + 'px;--dy:' + Math.round(Math.sin(a) * d - 40) + 'px;--rot:' + Math.round(Math.random() * 540) + 'deg"></i>';
    }
    const ok = await confirmBox({
      title: 'Hộp Huyền Thoại',
      html: '<div class="box-stage">' + giftHTML('shake') + confetti + '<div class="reward-pop" aria-live="polite">+' + reward + ' Muffin</div><p class="muted" id="boxMsg">Đang mở…</p></div>',
      okLabel: 'Tuyệt!', cancelLabel: 'Hoàn tác', cancel: true, dismissValue: true,
      onMount: (wrap) => {
        const gift = wrap.querySelector('.gift');
        setTimeout(() => { gift.classList.remove('shake'); gift.classList.add('open'); }, 900);
        setTimeout(() => {
          wrap.querySelector('.reward-pop').classList.add('show');
          wrap.querySelectorAll('.confetti').forEach((c) => c.classList.add('go'));
          const m = wrap.querySelector('#boxMsg'); if (m) m.textContent = 'Bạn nhận được ' + reward + ' Muffin thường!';
          if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) { /* bỏ qua */ }
        }, 1150);
      },
    });
    if (!ok) undoEntry(entryId);
  }

  /* ---------- Kho nhiệm vụ ---------- */
  VIEWS.tasks = function () {
    const t = todayKey();
    const todayTexts = M.goalsOf(state, t).map((g) => g.text.toLowerCase());
    let h = topSub('Kho nhiệm vụ') +
      '<section class="card"><form data-form="task-add"><textarea name="text" rows="4" placeholder="Mỗi dòng 1 nhiệm vụ" aria-label="Nhiệm vụ mới, mỗi dòng 1 nhiệm vụ"></textarea>' +
      '<button class="btn pri block" type="submit" style="margin-top:10px">Thêm vào kho</button></form></section>';
    h += '<div class="sec"><h2>Trong kho</h2><span>' + state.tasks.length + '</span></div>';
    if (!state.tasks.length) return h + '<section class="card empty">Kho đang trống</section>';
    h += '<section class="card list">' + state.tasks.map((k) => {
      const inToday = todayTexts.indexOf(k.text.toLowerCase()) >= 0;
      return '<div class="li"><input class="gtext" data-task-edit="' + esc(k.id) + '" value="' + esc(k.text) + '" maxlength="80" enterkeyhint="done" aria-label="Sửa nhiệm vụ">' +
        (inToday ? '<span class="pill ok">' + ICON.check + 'Hôm nay</span>' : '<button type="button" class="btn sm" data-act="task-today" data-id="' + esc(k.id) + '" aria-label="Thêm ' + esc(k.text) + ' vào mục tiêu hôm nay">' + ICON.plus + 'Hôm nay</button>') +
        ib('data-act="task-del" data-id="' + esc(k.id) + '"', ICON.trash, 'Xóa nhiệm vụ ' + k.text, 'plain') + '</div>';
    }).join('') + '</section>';
    return h;
  };

  /* ---------- Thống kê ---------- */
  VIEWS.stats = function () {
    const n = ui.statsRange;
    const data = M.statsRange(state, todayKey(), n);
    const sum = { home: 0, class: 0, work: 0, gym: 0, earned: 0, spent: 0, total: 0 };
    data.forEach((d) => Object.keys(sum).forEach((k) => { sum[k] += d[k] || 0; }));
    const all = M.statsAllTime(state);
    const active = data.filter((d) => d.total > 0).length;
    return topSub('Thống kê', goBtn('log', ICON.log, 'Nhật ký')) +
      '<div class="seg" role="tablist"><button type="button" role="tab" aria-selected="' + (n === 7) + '" class="' + (n === 7 ? 'on' : '') + '" data-act="stats-range" data-n="7">7 ngày</button>' +
      '<button type="button" role="tab" aria-selected="' + (n === 30) + '" class="' + (n === 30 ? 'on' : '') + '" data-act="stats-range" data-n="30">30 ngày</button></div>' +
      '<section class="card"><div class="sec" style="margin:0 0 4px"><h2>Phút theo ngày</h2><span>' + fmt(sum.total) + '\'</span></div>' + chartSVG(data) +
      '<div class="legend">' + M.CATS.map((c) => '<span><i style="background:' + CAT_COLOR[c] + '"></i>' + M.CAT_SHORT[c] + ' <b>' + fmt(sum[c]) + '</b></span>').join('') + '</div></section>' +
      '<section class="card"><div class="tiles">' +
      '<div class="tile g"><span>Kiếm được</span><b>+' + fmt(sum.earned) + '</b></div>' +
      '<div class="tile r"><span>Đã tiêu</span><b>-' + fmt(sum.spent) + '</b></div>' +
      '<div class="tile"><span>Ngày có ghi</span><b>' + active + '/' + n + '</b></div>' +
      '<div class="tile"><span>TB mỗi ngày</span><b>' + fmt(Math.round(sum.total / n)) + '\'</b></div>' +
      '</div><p class="muted small" style="margin-top:10px">Từ trước tới nay: kiếm ' + fmt(all.earned) + ', tiêu ' + fmt(all.spent) + ' Muffin</p></section>';
  };

  function chartSVG(data) {
    const W = 340, H = 210, L = 34, Rr = 6, T = 10, B = 26;
    const pw = W - L - Rr, ph = H - T - B;
    const maxV = Math.max(60, ...data.map((d) => d.total));
    const step = maxV <= 120 ? 30 : maxV <= 300 ? 60 : maxV <= 600 ? 120 : 240;
    const top = Math.ceil(maxV / step) * step;
    const y = (v) => T + ph - (v / top) * ph;
    let g = '';
    for (let v = 0; v <= top; v += step) {
      g += '<line class="' + (v ? 'gl' : 'g0') + '" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke-width="1"' + (v ? ' stroke-dasharray="3 3"' : '') + '/>' +
        '<text x="' + (L - 5) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    }
    const slot = pw / data.length;
    const bw = Math.max(4, Math.min(26, slot * 0.62));
    const minLine = M.computeDayStreak(state, todayKey()).min;
    data.forEach((d, i) => {
      const x = L + slot * i + (slot - bw) / 2;
      let acc = 0, bars = '';
      M.CATS.forEach((c) => {
        const v = d[c];
        if (!v) return;
        const y0 = y(acc), y1 = y(acc + v);
        acc += v;
        bars += '<rect x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0.5, y0 - y1).toFixed(1) + '" fill="' + CAT_COLOR[c] + '"' + (acc === d.total ? ' rx="3"' : '') + '/>';
      });
      const title = fmtDate(d.date) + ': ' + d.total + ' phút (' + M.CATS.map((c) => M.CAT_SHORT[c] + ' ' + d[c]).join(', ') + ')';
      g += '<g><title>' + esc(title) + '</title><rect x="' + (L + slot * i).toFixed(1) + '" y="' + T + '" width="' + slot.toFixed(1) + '" height="' + ph + '" fill="transparent"/>' + bars + '</g>';
      const showLabel = data.length <= 7 || i % 5 === (data.length - 1) % 5;
      if (showLabel) g += '<text x="' + (L + slot * i + slot / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + (data.length <= 7 ? weekday(d.date) : fmtShort(d.date)) + '</text>';
    });
    if (minLine <= top) g += '<line class="ml" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(minLine).toFixed(1) + '" y2="' + y(minLine).toFixed(1) + '" stroke-width="1.5" stroke-dasharray="6 4"/>' +
      '<text class="mlt" x="' + (L + 4) + '" y="' + (y(minLine) - 4).toFixed(1) + '" text-anchor="start">Ngưỡng chuỗi ' + minLine + '\'</text>';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ cột phút ghi nhận theo ngày, chia theo 4 loại">' + g + '</svg>';
  }

  /* ---------- Nhật ký ---------- */
  VIEWS.log = function () {
    const last = state.log[state.log.length - 1];
    let h = topSub('Nhật ký') + '<section class="card"><button type="button" class="btn block ' + (last ? 'pri' : '') + '" data-act="undo"' + (last ? '' : ' disabled') + '>' + ICON.undo + 'Hoàn tác gần nhất</button>' +
      (last ? '<p class="muted small" style="margin-top:8px">' + esc(M.describeEntry(last)) + '</p>' : '') + '</section>';
    if (!state.log.length) return h + '<section class="card empty">Chưa có hoạt động nào</section>';
    const items = state.log.slice(-ui.logLimit).reverse();
    let cur = null;
    items.forEach((e) => {
      if (e.date !== cur) {
        if (cur) h += '</section>';
        cur = e.date;
        h += '<div class="sec"><h2>' + dayLabel(e.date) + '</h2></div><section class="card list">';
      }
      h += '<div class="li"><time>' + fmtTime(e.t) + '</time><div class="li-main txt">' + esc(M.describeEntry(e)) + '</div>' +
        ib('data-act="log-del" data-id="' + esc(e.id) + '"', ICON.trash, 'Xóa bản ghi', 'plain') + '</div>';
    });
    h += '</section>';
    if (state.log.length > ui.logLimit) h += '<button type="button" class="btn block" style="margin-top:12px" data-act="log-more">Xem thêm (' + (state.log.length - ui.logLimit) + ')</button>';
    return h;
  };

  /* ---------- Luật chơi ---------- */
  VIEWS.help = function () {
    const tbl = (rows) => '<table class="rt"><tbody>' + rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</tbody></table>';
    const min = M.computeDayStreak(state, todayKey()).min;
    return topSub('Luật chơi') + '<div class="rules">' +
      '<section class="card"><h3>1. Kiếm Muffin</h3>' + tbl(M.CATS.map((c) => [M.CAT_LABEL[c], R.MINUTES_PER_MUFFIN[c] + ' phút = 1 Muffin'])) +
      '<p class="muted small" style="margin-top:8px">Phút lẻ chưa đủ 1 Muffin được giữ lại, cộng dồn lần sau (mỗi loại riêng). Mỗi lần ghi tối đa ' + R.MAX_MINUTES_PER_ENTRY + ' phút.</p></section>' +
      '<section class="card"><h3>2. Muffin Thường và Kho</h3><ul>' +
      '<li><b>Muffin Thường</b>: đổi ra phút giải trí (1 Muffin = ' + R.FUN_MINUTES_PER_MUFFIN + ' phút) hoặc mua đồ.</li>' +
      '<li><b>Gửi Kho</b> (một chiều): Muffin trong Kho chỉ dùng mua đồ ở Cửa hàng, KHÔNG đổi ra phút giải trí.</li>' +
      '<li><b>Mua đồ</b>: trừ Kho trước, thiếu thì trừ thêm Muffin thường. App hiện trước số bị trừ.</li>' +
      '<li>Phút giải trí vào <b>Quỹ giải trí</b>; tiêu bằng nút “Tiêu phút” ở Túi đồ.</li>' +
      '<li><b>Mỗi ngày phải gửi ít nhất ' + R.DAILY_KHO_MIN + ' Muffin vào Kho</b>. Chưa gửi đủ thì chưa đổi được phút giải trí (vẫn mua đồ bình thường).</li>' +
      '<li><b>Mỗi ngày đổi tối đa ' + R.FUN_CONVERT_MAX_MINUTES_PER_DAY + ' phút giải trí</b> (2 tiếng, tức ' + Math.floor(R.FUN_CONVERT_MAX_MINUTES_PER_DAY / R.FUN_MINUTES_PER_MUFFIN) + ' Muffin). Phút thưởng từ chuỗi không tính vào giới hạn này.</li></ul></section>' +
      '<section class="card"><h3>3. Hộp Huyền Thoại</h3><ul><li>Trong 1 ngày <b>học ở nhà đủ ' + R.BOX.HOME_MINUTES_PER_DAY + ' phút</b> thì được mở hộp 1 lần (ở tab Túi đồ).</li>' +
      '<li><b>Mỗi ngày chỉ mở 1 lần</b>, học nhiều hơn cũng không thêm lượt. Qua 0:00 đếm lại từ 0; không mở trong ngày thì mất lượt hôm đó.</li>' +
      '<li>Mỗi lượt: ngẫu nhiên ' + R.BOX.REWARDS.map((r) => r.muffin).join(', ') + ' Muffin thường, cơ hội ngang nhau.</li></ul></section>' +
      '<section class="card"><h3>4. Cửa hàng</h3>' + tbl(R.SHOP.map((it) => [esc(it.name), fmt(it.price) + ' Muffin'])) + '</section>' +
      '<section class="card"><h3>5. Chuỗi ngày</h3><ul>' +
      '<li>Một ngày được tính khi tổng phút ghi nhận (mọi loại) ≥ <b>' + min + ' phút</b> (đổi được trong Cài đặt).</li>' +
      '<li>Ngày tính theo giờ Việt Nam (Asia/Ho_Chi_Minh), qua 0:00 là sang ngày mới.</li>' +
      '<li>Bỏ lỡ 1 ngày thì chuỗi về 0. Hôm nay chưa đủ thì chuỗi vẫn giữ tới hết ngày.</li>' +
      '<li><b>Chu kì</b>: mỗi lần chuỗi đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày thì Chu kì +1, ngày thứ ' + (R.DAY_STREAK_CYCLE_DAYS + 1) + ' quay về ngày 1 của chu kì mới và mọi mốc thưởng nhận lại được từ đầu. Chu kì là tổng số lần đã đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày, đứt chuỗi cũng không mất.</li></ul>' +
      tbl(R.DAY_STREAK_REWARDS.map((m) => [m.at + ' ngày', esc(M.rewardText(m.reward))])) + '</section>' +
      '<section class="card"><h3>6. Chuỗi thói quen</h3><ul><li>Mỗi thói quen có chuỗi riêng: tick hoàn thành trong ngày thì +1, bỏ lỡ 1 ngày thì về 0.</li>' +
      '<li>Được tick bù cho hôm qua nếu quên.</li></ul>' +
      tbl(R.HABIT_STREAK_REWARDS.map((m) => [m.at + ' ngày', esc(M.rewardText(m.reward))])) + '</section>' +
      '<section class="card"><h3>7. Nhận thưởng</h3><ul>' +
      '<li>Mỗi mốc nhận được 1 lần trong một lượt chuỗi (với Chuỗi ngày là 1 lần mỗi chu kì). Chuỗi đứt rồi đạt lại thì được nhận lại.</li>' +
      '<li>Thưởng phút → Quỹ giải trí. Thưởng là món → Túi đồ. Muffin từ hộp → Muffin thường.</li></ul></section>' +
      '<section class="card"><h3>8. Mục tiêu, nhật ký, sao lưu</h3><ul>' +
      '<li><b>Mục tiêu</b>: mỗi ngày thêm bao nhiêu mục cũng được. Chọn ngày ở dải ngày để sửa mục tiêu của hôm nay và ' + (R.GOAL_PLAN_DAYS - 1) + ' ngày tới. Chỉ tick được mục tiêu của hôm nay.</li>' +
      '<li><b>Thưởng mục tiêu</b>: hoàn thành đủ <b>' + R.GOAL_BONUS_COUNT + ' mục tiêu</b> trong ngày → tự cộng <b>+' + R.GOAL_BONUS_MUFFIN + ' Muffin thường</b> (mỗi ngày 1 lần). Bỏ tick xuống dưới ' + R.GOAL_BONUS_COUNT + ' thì bị trừ lại.</li>' +
      '<li><b>Kho nhiệm vụ</b>: điền sẵn nhiều nhiệm vụ (mỗi dòng 1 cái), rồi chạm để lấy ra làm mục tiêu cho ngày đang chọn.</li>' +
      '<li>Mọi hành động đều vào Nhật ký; có Hoàn tác và xóa từng bản ghi (tự cộng/trừ lại điểm).</li>' +
      '<li>Dữ liệu chỉ nằm trên máy này. Nên Xuất JSON ít nhất mỗi tuần (app sẽ nhắc sau ' + R.BACKUP_REMIND_DAYS + ' ngày).</li></ul></section>' +
      '</div>';
  };

  /* ---------- Cài đặt ---------- */
  VIEWS.settings = function () {
    const last = state.meta.lastExport;
    const backups = getBackups();
    const p = themePref();
    const th = (v, label) => '<button type="button" class="' + (p === v ? 'on' : '') + '" role="radio" aria-checked="' + (p === v) + '" data-act="theme" data-v="' + v + '">' + label + '</button>';
    const nav = (v, icon, label, tn) => '<button type="button" class="li navrow" data-act="go" data-view="' + v + '" style="' + tone(tn) + '"><span class="iic">' + icon + '</span><span class="li-main">' + label + '</span><span class="chev">' + ICON.chev + '</span></button>';
    return topSub('Cài đặt') +
      '<section class="card"><h3>Giao diện</h3><div class="seg three" role="radiogroup" aria-label="Giao diện">' + th('auto', 'Tự động') + th('light', 'Sáng') + th('dark', 'Tối') + '</div></section>' +
      '<section class="card list">' + nav('help', ICON.help, 'Luật chơi', 'home') + nav('tasks', ICON.log, 'Kho nhiệm vụ', 'work') + nav('log', ICON.undo, 'Nhật ký', 'class') + nav('setup', ICON.upload, 'Nhập số dư ban đầu', 'kho') + '</section>' +
      '<section class="card"><h3>Sao lưu</h3><p class="muted small">Lần xuất gần nhất: <b>' + (last ? dayLabel(M.dateKey(last)) + ' ' + fmtTime(last) : 'chưa có') + '</b></p>' +
      '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn pri" data-act="export">Xuất JSON</button><button type="button" class="btn" data-act="import">Nhập JSON</button></div></section>' +
      '<section class="card"><h3>Ngưỡng Chuỗi ngày</h3>' +
      '<form class="row" data-form="streak-min"><input class="inp" name="v" inputmode="numeric" pattern="[0-9]*" value="' + M.computeDayStreak(state, todayKey()).min + '" aria-label="Số phút tối thiểu mỗi ngày">' +
      '<button class="btn pri" type="submit">Lưu</button></form><p class="muted small" style="margin-top:8px">Phút tối thiểu mỗi ngày (mặc định ' + R.STREAK_MIN_MINUTES + ')</p></section>' +
      '<section class="card"><h3>Bản sao lưu tự động</h3>' +
      (backups.length ? '<div class="list" style="padding:0">' + backups.map((b, i) =>
        '<div class="li"><div class="li-main"><b>' + esc(b.reason) + '</b><span class="li-sub">' + dayLabel(M.dateKey(b.at)) + ' ' + fmtTime(b.at) + '</span></div>' +
        '<button type="button" class="btn sm" data-act="restore" data-i="' + i + '">Khôi phục</button></div>').join('') + '</div>' : '<p class="muted small">Chưa có bản nào</p>') + '</section>' +
      '<section class="card danger-zone"><h3>Xóa dữ liệu</h3><button type="button" class="btn block ghost-danger" data-act="reset">Reset dữ liệu</button></section>' +
      '<p class="ver">Muffin v' + APP_VERSION + (persisted ? ' · đã xin lưu bền vững' : '') + '</p>';
  };

  /* ---------- Số dư ban đầu ---------- */
  VIEWS.setup = function () {
    const t = todayKey();
    const st = M.computeDayStreak(state, t);
    const maxClaim = (list, streak, claims) => {
      let m = 0;
      M.milestoneStatus(list, streak, claims).forEach((x) => { if (x.status === 'claimed') m = Math.max(m, x.at); });
      return m;
    };
    const f = (name, label, val, small) => '<div class="field"><label for="f_' + name + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</label>' +
      '<input id="f_' + name + '" name="' + name + '" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="' + val + '"></div>';
    const chk = (name, label, checked) => '<div class="field"><label for="f_' + name + '">' + label + '</label><input type="checkbox" id="f_' + name + '" name="' + name + '"' + (checked ? ' checked' : '') + '></div>';
    let h = topSub('Nhập số dư ban đầu') +
      '<p class="muted small" style="margin:0 4px 12px">Ô để trống = 0. Lưu sẽ thay số dư hiện tại và xóa nhật ký hoàn tác (app tự sao lưu trước).</p>' +
      '<form data-form="setup">' +
      '<section class="card"><h3>Muffin</h3>' +
      f('muffin', 'Muffin Thường', state.muffin) + f('kho', 'Muffin Trong Kho', state.kho) + f('fun', 'Quỹ giải trí', state.fun, 'phút') + '</section>' +
      '<section class="card"><h3>Phút lẻ đang tích</h3>' +
      M.CATS.map((c) => f('rem_' + c, M.CAT_LABEL[c], state.acc[c] % R.MINUTES_PER_MUFFIN[c], '0-' + (R.MINUTES_PER_MUFFIN[c] - 1) + ' phút')).join('') + '</section>' +
      '<section class="card"><h3>Chuỗi ngày</h3>' +
      f('cycles', 'Chu kì', st.cycles, 'số lần đã đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày') +
      f('dayStreak', 'Ngày hiện tại trong chu kì', st.count, '0-' + R.DAY_STREAK_CYCLE_DAYS) + chk('dayIncludesToday', 'Đã tính cả hôm nay', st.todayDone || st.count === 0) +
      f('dayClaimedUpTo', 'Đã nhận thưởng tới mốc', maxClaim(R.DAY_STREAK_REWARDS, st, state.dayStreak.claims), 'VD 10 = đã nhận mốc 5 và 10') + '</section>';
    if (state.habits.length) {
      h += '<section class="card"><h3>Chuỗi thói quen</h3>' + state.habits.map((hb) => {
        const hs = M.computeHabitStreak(hb, t);
        return '<p style="margin-top:10px"><b>' + esc(hb.name) + '</b></p>' + f('h_' + hb.id + '_streak', 'Chuỗi hiện tại', hs.count) +
          chk('h_' + hb.id + '_today', 'Đã tính cả hôm nay', hs.todayDone || hs.count === 0) +
          f('h_' + hb.id + '_claimed', 'Đã nhận thưởng tới mốc', maxClaim(R.HABIT_STREAK_REWARDS, hs, hb.claims));
      }).join('') + '</section>';
    }
    h += '<section class="card"><h3>Túi đồ</h3>' + R.SHOP.map((it) => f('inv_' + it.id, esc(it.bagName), state.inventory[it.id] || 0)).join('') + '</section>' +
      '<button class="btn pri block" type="submit" style="margin-top:14px;min-height:54px">Lưu số dư</button></form>';
    return h;
  };

  /* ================= Điều hướng ================= */
  const ALIAS = { box: 'bag', habits: 'streak' };
  function go(v) {
    if (v === 'habits') ui.streakTab = 'habit';
    v = ALIAS[v] || v;
    if (!VIEWS[v]) v = 'today';
    if (MAIN_TABS.indexOf(v) >= 0) { stack = []; rootTab = v; }
    else if (v !== view) stack.push(view);
    view = v;
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    view = stack.pop() || rootTab;
    render();
    window.scrollTo(0, 0);
  }

  function readInt(input, opts) {
    const r = M.parsePositiveInt(input.value, opts);
    if (!r.ok) {
      input.classList.add('err');
      toast(r.error, 'error');
      input.focus();
      setTimeout(() => input.classList.remove('err'), 1600);
    }
    return r;
  }

  /* ================= Xử lý hành động ================= */
  document.addEventListener('click', async (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const a = el.dataset.act;
    const t = todayKey();
    switch (a) {
      case 'go': go(el.dataset.view); break;
      case 'back': back(); break;
      case 'log-open': openLog(el.dataset.cat); break;
      case 'deposit-open': openDeposit(); break;
      case 'convert-open': openConvert(); break;
      case 'spend-open': openSpend(); break;
      case 'shop-group': ui.shopGroup = el.dataset.g; render(); break;
      case 'streak-tab': ui.streakTab = el.dataset.tab; render(); break;
      case 'theme': lsSet(THEME_KEY, el.dataset.v); applyTheme(); render(); break;
      case 'open-box': doOpenBox(); break;
      case 'buy': doBuy(el.dataset.item); break;
      case 'use': {
        const it = M.ITEM[el.dataset.item];
        commit(M.useItem(state, it.id, ctx()), 'Đã dùng "' + it.bagName + '". Chúc vui!');
        break;
      }
      case 'claim-day': {
        const res = M.claimDayMilestone(state, parseInt(el.dataset.at, 10), t, ctx());
        if (res.ok) commit(res, 'Nhận thưởng mốc ' + el.dataset.at + ': ' + M.rewardText(res.entry.got));
        else toast(res.error, 'error');
        break;
      }
      case 'claim-habit': {
        const res = M.claimHabitMilestone(state, el.dataset.id, parseInt(el.dataset.at, 10), el.dataset.choice || null, t, ctx());
        if (res.ok) commit(res, 'Nhận thưởng mốc ' + el.dataset.at + ': ' + M.rewardText(res.entry.got));
        else toast(res.error, 'error');
        break;
      }
      case 'habit-toggle': commit(M.toggleHabitDay(state, el.dataset.id, el.dataset.day, t)); break;
      case 'habit-del': {
        const hb = state.habits.find((x) => x.id === el.dataset.id);
        if (!hb) break;
        const yes = await confirmBox({ title: 'Xóa thói quen?', html: '<p>Xóa “<b>' + esc(hb.name) + '</b>” và chuỗi ' + M.computeHabitStreak(hb, t).count + ' ngày của nó. Phần thưởng đã nhận vẫn giữ.</p><p class="muted">App tự sao lưu trước khi xóa.</p>', okLabel: 'Xóa', danger: true });
        if (yes) { autoBackup('Trước khi xóa thói quen “' + hb.name + '”'); commit(M.removeHabit(state, hb.id)); toast('Đã xóa thói quen', 'info'); }
        break;
      }
      case 'goal-day': ui.goalDate = el.dataset.date; render(); break;
      case 'goal-del': commit(M.removeGoal(state, ui.goalDate, el.dataset.id, t)); break;
      case 'goal-copy': {
        const res = M.copyGoals(state, el.dataset.from, ui.goalDate, t, ctx());
        if (commit(res)) toast('Đã chép ' + res.added + ' mục tiêu', 'success');
        break;
      }
      case 'goal-pick': pickFromBank(); break;
      case 'bank-add': commit(M.addTasksToDay(state, [el.dataset.id], ui.goalDate, t, ctx())); break;
      case 'task-today': {
        const res = M.addTasksToDay(state, [el.dataset.id], t, t, ctx());
        if (commit(res)) toast('Đã thêm vào mục tiêu hôm nay', 'success');
        break;
      }
      case 'task-del': {
        const k = state.tasks.find((x) => x.id === el.dataset.id);
        if (!k) break;
        const yes = await confirmBox({ title: 'Xóa nhiệm vụ?', html: '<p>Xóa “<b>' + esc(k.text) + '</b>” khỏi Kho nhiệm vụ. Mục tiêu đã thêm vào các ngày vẫn giữ.</p>', okLabel: 'Xóa', danger: true });
        if (yes) commit(M.removeTask(state, k.id));
        break;
      }
      case 'dismiss-welcome': state.meta.welcomeDismissed = true; save(); render(); break;
      case 'stats-range': ui.statsRange = parseInt(el.dataset.n, 10); render(); break;
      case 'undo': {
        const last = state.log[state.log.length - 1];
        if (last) undoEntry(last.id);
        break;
      }
      case 'log-del': {
        const e = state.log.find((x) => x.id === el.dataset.id);
        if (!e) break;
        const yes = await confirmBox({ title: 'Xóa bản ghi?', html: '<p>' + esc(M.describeEntry(e)) + '</p><p class="muted">Điểm, phút và món liên quan sẽ được tự cộng hoặc trừ lại.</p>', okLabel: 'Xóa bản ghi', danger: true });
        if (yes) { const res = M.deleteEntry(state, e.id); if (commit(res)) toast('Đã xóa bản ghi và hoàn lại điểm', 'info'); }
        break;
      }
      case 'log-more': ui.logLimit += 100; render(); break;
      case 'export': doExport(); break;
      case 'import': $('#importFile').value = ''; $('#importFile').click(); break;
      case 'restore': {
        const b = getBackups()[parseInt(el.dataset.i, 10)];
        if (!b) break;
        const yes = await confirmBox({ title: 'Khôi phục bản sao lưu?', html: '<p>Thay dữ liệu hiện tại bằng bản “' + esc(b.reason) + '” (' + dayLabel(M.dateKey(b.at)) + ' ' + fmtTime(b.at) + ').</p><p class="muted">Dữ liệu hiện tại sẽ được tự sao lưu trước.</p>', okLabel: 'Khôi phục' });
        if (!yes) break;
        try {
          const data = M.migrate(b.data, Date.now());
          autoBackup('Trước khi khôi phục bản sao');
          state = M.pruneGoalDays(data, t); save(); render(); toast('Đã khôi phục', 'success');
        } catch (e) { toast('Bản sao lưu bị lỗi: ' + e.message, 'error'); }
        break;
      }
      case 'reset': {
        const yes = await confirmBox({ title: 'Reset toàn bộ dữ liệu?', html: '<p>Mọi Muffin, Kho, chuỗi, thói quen, túi đồ và nhật ký sẽ bị xóa khỏi máy này.</p><p class="muted">App tự sao lưu trước (khôi phục được trong Cài đặt). Nên Xuất JSON trước cho chắc.</p>', okLabel: 'Reset', danger: true });
        if (!yes) break;
        autoBackup('Trước khi reset');
        const keepExport = state.meta.lastExport;
        state = M.createInitialState(Date.now());
        state.meta.lastExport = keepExport;
        save(); go('today'); toast('Đã reset dữ liệu', 'info');
        break;
      }
      default: break;
    }
  });

  // Gửi form (nút và phím Enter / "Xong" trên bàn phím iPhone)
  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const kind = form.dataset.form;
    const inp = form.querySelector('input[name]');
    if (kind === 'habit-add') {
      const res = M.addHabit(state, inp.value, ctx());
      if (res.ok) { inp.value = ''; commit(res, null); toast('Đã thêm thói quen', 'success'); } else toast(res.error, 'error');
    } else if (kind === 'streak-min') {
      const r = readInt(inp, { max: 1440, maxMsg: 'Tối đa 1440 phút.' });
      if (r.ok) { state.settings.streakMin = r.value; save(); render(); toast('Ngưỡng Chuỗi ngày: ' + r.value + ' phút', 'success'); }
    } else if (kind === 'goal-add') {
      const res = M.addGoals(state, ui.goalDate, [inp.value], todayKey(), ctx());
      if (commit(res)) {
        const ni = $('#goalsCard form[data-form="goal-add"] input');
        if (ni) ni.focus();
      }
    } else if (kind === 'task-add') {
      const ta = form.querySelector('textarea');
      const res = M.addTasks(state, ta.value, ctx());
      if (commit(res)) toast('Đã thêm ' + res.added + ' nhiệm vụ' + (res.dup ? ' (bỏ qua ' + res.dup + ' mục trùng)' : ''), 'success');
    } else if (kind === 'setup') {
      submitSetup(form);
    }
  });

  async function submitSetup(form) {
    const data = {};
    let bad = null;
    form.querySelectorAll('input[name]').forEach((inp) => {
      if (inp.type === 'checkbox') { data[inp.name] = inp.checked; return; }
      if (inp.value.trim() === '') { data[inp.name] = 0; return; }
      const r = M.parsePositiveInt(inp.value, { allowZero: true });
      if (!r.ok && !bad) bad = inp;
      data[inp.name] = r.ok ? r.value : 0;
    });
    if (bad) { readInt(bad, { allowZero: true }); bad.scrollIntoView({ block: 'center' }); return; }
    const input = {
      muffin: data.muffin, kho: data.kho, fun: data.fun, cycles: data.cycles,
      rem: {}, dayStreak: data.dayStreak, dayIncludesToday: data.dayIncludesToday, dayClaimedUpTo: data.dayClaimedUpTo, inventory: {}, habits: {},
    };
    M.CATS.forEach((c) => { input.rem[c] = data['rem_' + c]; });
    R.SHOP.forEach((it) => { input.inventory[it.id] = data['inv_' + it.id]; });
    state.habits.forEach((h) => { input.habits[h.id] = { streak: data['h_' + h.id + '_streak'], includesToday: data['h_' + h.id + '_today'], claimedUpTo: data['h_' + h.id + '_claimed'] }; });
    const res = M.applySetup(state, input, todayKey());
    if (!res.ok) return toast(res.error, 'error');
    const yes = await confirmBox({
      title: 'Lưu số dư ban đầu?',
      html: '<p>Muffin thường <b>' + input.muffin + '</b>, Kho <b>' + input.kho + '</b>, quỹ giải trí <b>' + input.fun + '</b> phút, Chu kì <b>' + input.cycles + '</b>, Chuỗi ngày <b>' + input.dayStreak + '</b>.</p><p class="muted">Số dư hiện tại sẽ bị thay và nhật ký hoàn tác bị xóa. App tự sao lưu trước.</p>',
      okLabel: 'Lưu số dư',
    });
    if (!yes) return;
    autoBackup('Trước khi nhập số dư ban đầu');
    state = res.state; save();
    go('today');
    toast('Đã lưu số dư ban đầu', 'success');
  }

  // Mục tiêu: tick và đổi tên (không vẽ lại cả trang để không mất bàn phím)
  document.addEventListener('change', (ev) => {
    const t = todayKey();
    const chk = ev.target.closest('[data-goal-check]');
    if (chk) {
      const res = M.toggleGoal(state, ui.goalDate, chk.dataset.goalCheck, t, ctx());
      if (!res.ok) { chk.checked = !chk.checked; return toast(res.error, 'error'); }
      state = res.state; save();
      chk.closest('.goal').classList.toggle('done', chk.checked);
      const gb = $('#goalBonus');
      if (gb) gb.outerHTML = goalBonusHTML();
      if (res.bonus > 0) {
        const entry = res.entry;
        toast('Xong ' + R.GOAL_BONUS_COUNT + ' mục tiêu hôm nay! +' + res.bonus + ' Muffin', 'success', { label: 'Hoàn tác', fn: () => undoEntry(entry.id) });
      } else if (res.bonus < 0) toast('Đã trừ lại ' + (-res.bonus) + ' Muffin thưởng mục tiêu', 'info');
      return;
    }
    const txt = ev.target.closest('[data-goal-edit]');
    if (txt) {
      const res = M.editGoal(state, ui.goalDate, txt.dataset.goalEdit, txt.value, t);
      if (!res.ok) return toast(res.error, 'error');
      state = res.state; save();
      if (!M.goalsOf(state, ui.goalDate).some((g) => g.id === txt.dataset.goalEdit)) render();
      return;
    }
    const tk = ev.target.closest('[data-task-edit]');
    if (tk) {
      const res = M.editTask(state, tk.dataset.taskEdit, tk.value);
      if (!res.ok) { toast(res.error, 'error'); render(); return; }
      state = res.state; save();
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('[data-goal-edit],[data-task-edit]')) { ev.preventDefault(); ev.target.blur(); }
  });

  /* ================= Xuất / Nhập JSON ================= */
  async function doExport() {
    const text = M.exportData(state, Date.now());
    const name = 'muffin-sao-luu-' + todayKey() + '.json';
    const mark = () => { state.meta.lastExport = Date.now(); save(); render(); };
    let file = null;
    try { file = new File([text], name, { type: 'application/json' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share) {
      let can = false;
      try { can = navigator.canShare({ files: [file] }); } catch (e) { can = false; }
      if (can) {
        try { await navigator.share({ files: [file], title: 'Sao lưu Muffin' }); mark(); toast('Đã xuất bản sao lưu', 'success'); return; }
        catch (e) { if (e && e.name === 'AbortError') return; /* lỗi khác → tải xuống */ }
      }
    }
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      mark(); toast('Đã tải file ' + name, 'success');
    } catch (e) { toast('Không xuất được file: ' + e.message, 'error'); }
  }

  $('#importFile').addEventListener('change', async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    let text;
    try { text = await f.text(); } catch (e) { return toast('Không đọc được file.', 'error'); }
    const res = M.importData(text, Date.now());
    if (!res.ok) return toast(res.error, 'error');
    const s = res.state;
    const yes = await confirmBox({
      title: 'Nhập dữ liệu từ file?',
      html: '<p>File “' + esc(f.name) + '”: Muffin thường <b>' + s.muffin + '</b>, Kho <b>' + s.kho + '</b>, quỹ giải trí <b>' + s.fun + '</b> phút, ' + s.habits.length + ' thói quen, ' + s.log.length + ' bản ghi.</p><p class="muted">Toàn bộ dữ liệu hiện tại sẽ bị thay. App tự sao lưu trước.</p>',
      okLabel: 'Nhập dữ liệu',
    });
    if (!yes) return;
    autoBackup('Trước khi nhập JSON');
    state = M.pruneGoalDays(s, todayKey()); save(); go('today');
    toast('Đã nhập dữ liệu', 'success');
  });

  /* ================= Khởi động ================= */
  let persisted = false;
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((p) => p || navigator.storage.persist()).then((p) => { persisted = !!p; }).catch(() => {});
    }
  } catch (e) { /* bỏ qua */ }

  // Chế độ app (đã thêm vào Màn hình chính): chặn zoom bằng 2 ngón
  const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (standalone) {
    document.documentElement.classList.add('standalone');
    ['gesturestart', 'gesturechange'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault(), { passive: false }));
    document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  }

  // Sang ngày mới khi app đang mở: vẽ lại (mục tiêu tự bỏ tick, chuỗi cập nhật)
  function checkDay() {
    const t = todayKey();
    if (t !== lastToday) { lastToday = t; state = M.pruneGoalDays(state, t); save(); if (!modalOpen) render(); }
  }
  setInterval(checkDay, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });

  // Đồng bộ khi mở app ở 2 tab cùng lúc (máy tính)
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) { try { state = M.migrate(JSON.parse(e.newValue), Date.now()); render(); } catch (err) { /* bỏ qua */ } }
    if (e.key === THEME_KEY) { applyTheme(); render(); }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  // Mở thẳng một màn qua đường dẫn, VD: index.html#shop
  function viewFromHash() { const v = location.hash.slice(1); return VIEWS[ALIAS[v] || v] ? v : null; }
  const startView = viewFromHash();
  if (startView) {
    if (startView === 'habits') ui.streakTab = 'habit';
    const v = ALIAS[startView] || startView;
    view = v;
    if (MAIN_TABS.indexOf(v) >= 0) rootTab = v;
  }
  window.addEventListener('hashchange', () => { const v = viewFromHash(); if (v) go(v); });

  save();
  render();
  // Cho phép kiểm thử từ DevTools
  window.__muffin = { get state() { return state; }, rules: M };
})();
