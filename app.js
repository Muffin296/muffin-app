/* Muffin Study Game: giao diện, lưu trữ, PWA. Luật chơi nằm trong rules.js */
(function () {
  'use strict';
  const M = window.MuffinRules;
  const R = M.RULES;
  const APP_VERSION = '1.1.0';
  const KEY = 'muffin.state';
  const BK_KEY = 'muffin.backups';
  const MAIN_TABS = ['today', 'box', 'shop', 'streak', 'habits', 'bag'];

  /* ================= Biểu tượng (SVG nét) ================= */
  const I = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ICON = {
    today: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
    box: I('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>'),
    shop: I('<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
    streak: I('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.5 1.5 2 2.5 2C11.5 7.5 11 5 12 3z"/>'),
    habits: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
    bag: I('<path d="M6 10a6 6 0 0 1 12 0v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10z"/><path d="M9 5V3.5h6V5M9 14h6"/>'),
    stats: I('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
    log: I('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6M12 17h.01"/>'),
    settings: I('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    back: I('<path d="M15 18l-6-6 6-6"/>'),
    undo: I('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  };
  const TAB_LABEL = { today: 'Ghi nhận', box: 'Mở hộp', shop: 'Cửa hàng', streak: 'Chuỗi', habits: 'Thói quen', bag: 'Túi đồ' };
  const CAT_COLOR = { home: '#2563EB', class: '#9333EA', work: '#EA580C', gym: '#E11D48' };

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

  /* ================= Trạng thái ================= */
  let state = loadState();
  let view = 'today';
  let prevMain = 'today';
  const todayKey = () => M.dateKey(Date.now());
  let lastToday = todayKey();
  const ui = { statsRange: 7, logLimit: 60, flash: null, bump: false, habitTableOpen: false, goalDate: lastToday };
  state = M.pruneGoalDays(state, lastToday);
  const wideMQ = window.matchMedia('(min-width: 900px)');
  const isWide = () => wideMQ.matches;

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
  function weekday(key) { return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(key + 'T00:00:00Z').getUTCDay()]; }
  function fmtTime(ms) { const d = new Date(ms + R.TZ_OFFSET_HOURS * 3600000); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
  function hm(min) { const h = Math.floor(min / 60), m = min % 60; return h ? h + ' giờ' + (m ? ' ' + m + ' phút' : '') : m + ' phút'; }
  function dayLabel(key) {
    const t = todayKey();
    if (key === t) return 'Hôm nay';
    if (key === M.addDays(t, -1)) return 'Hôm qua';
    return weekday(key) + ', ' + fmtDate(key);
  }
  function rewardIcon(r) { return r.fun ? '⏱️' : r.item ? M.ITEM[r.item].icon : '🎁'; }
  function pct(a, b) { return Math.max(0, Math.min(100, b ? (a / b) * 100 : 0)); }

  /* ================= Toast ================= */
  function toast(msg, type, action, ms) {
    const box = $('#toasts');
    if (!box) return;
    while (box.children.length >= 3) box.firstChild.remove();
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
    let timer = setTimeout(close, ms || (action ? 5000 : 3200));
    function close() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      el.classList.add('out');
      setTimeout(() => el.remove(), 200);
    }
  }

  /* ================= Modal xác nhận ================= */
  let modalOpen = null;
  function confirmBox(opts) {
    return new Promise((resolve) => {
      const root = $('#modalRoot');
      const wrap = document.createElement('div');
      wrap.className = 'backdrop';
      wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
        '<h3 id="mTitle">' + esc(opts.title) + '</h3><div class="body">' + (opts.html || '') + '</div>' +
        '<div class="btn-row">' +
        (opts.cancel === false ? '' : '<button type="button" class="btn soft" data-m="no">' + esc(opts.cancelLabel || 'Hủy') + '</button>') +
        '<button type="button" class="btn ' + (opts.danger ? 'danger' : 'primary') + '" data-m="yes">' + esc(opts.okLabel || 'Đồng ý') + '</button>' +
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
      setTimeout(() => yes.focus(), 30);
      if (opts.onMount) opts.onMount(wrap, done);
    });
  }

  /* ================= Vẽ ================= */
  function render() {
    const t = todayKey();
    // ngày đang xem mục tiêu phải nằm trong [hôm nay, hôm nay + 6]
    const gd = M.daysBetween(t, ui.goalDate);
    if (gd < 0 || gd >= R.GOAL_PLAN_DAYS) ui.goalDate = t;
    renderTop();
    renderBanner();
    renderSidebar();
    renderTabs();
    renderView();
    ui.bump = false;
  }

  function statsHTML(full) {
    const st = M.computeDayStreak(state, todayKey());
    const b = ui.bump ? ' bump' : '';
    return '<div class="stat s-muffin' + b + '"><span class="lbl">' + (full ? 'Muffin Thường' : 'Thường') + '</span><b>' + fmt(state.muffin) + '</b></div>' +
      '<div class="stat s-kho"><span class="lbl">' + (full ? 'Muffin Trong Kho' : 'Trong Kho') + '</span><b>' + fmt(state.kho) + '</b></div>' +
      '<div class="stat s-cycle"><span class="lbl">Chu Kì</span><b>' + fmt(st.cycles) + '</b></div>' +
      '<div class="stat s-streak"><span class="lbl">Chuỗi Ngày</span><b>🔥' + st.count + '</b></div>';
  }

  function renderTop() {
    $('#statbar').innerHTML = statsHTML();
    const btn = (v, label) => '<button class="icon-btn' + (view === v ? ' on' : '') + '" data-act="go" data-view="' + v + '" aria-label="' + label + '" title="' + label + '">' + ICON[v] + '</button>';
    $('#topActions').innerHTML = btn('stats', 'Thống kê') + btn('log', 'Nhật ký') + btn('help', 'Luật chơi') + btn('settings', 'Cài đặt');
  }

  function renderBanner() {
    const el = $('#banner');
    if (M.needsBackupReminder(state, Date.now()) && view !== 'settings') {
      const last = state.meta.lastExport;
      const days = Math.floor((Date.now() - (last || state.createdAt)) / 86400000);
      el.innerHTML = '<div class="banner"><span>💾 ' + (last ? 'Đã ' + days + ' ngày chưa sao lưu.' : 'Bạn chưa sao lưu lần nào.') + ' Nên xuất JSON để không mất dữ liệu.</span>' +
        '<button class="btn sm soft" data-act="export">Sao lưu ngay</button></div>';
    } else el.innerHTML = '';
  }

  function renderSidebar() {
    const sb = $('#sidebar');
    if (!isWide()) { sb.innerHTML = ''; return; }
    sb.innerHTML = '<div class="side-stats">' + statsHTML(true) + '</div>' + depositCard() + goalsCard();
  }

  function renderTabs() {
    const box = M.boxInfo(state).available;
    const ready = readyCounts();
    $('#tabs').innerHTML = MAIN_TABS.map((v) => {
      let badge = '';
      if (v === 'box' && box > 0) badge = box;
      if (v === 'streak' && ready.day > 0) badge = ready.day;
      if (v === 'habits' && ready.habit > 0) badge = ready.habit;
      return '<button class="tab' + (view === v ? ' on' : '') + '" data-act="go" data-view="' + v + '" aria-label="' + TAB_LABEL[v] + (badge ? ' (' + badge + ' mục chờ)' : '') + '"' + (view === v ? ' aria-current="page"' : '') + '>' +
        ICON[v] + '<span aria-hidden="true">' + TAB_LABEL[v] + '</span>' + (badge ? '<span class="badge" aria-hidden="true">' + badge + '</span>' : '') + '</button>';
    }).join('');
  }

  function readyCounts() {
    const t = todayKey();
    const day = M.milestoneStatus(R.DAY_STREAK_REWARDS, M.computeDayStreak(state, t), state.dayStreak.claims).filter((m) => m.status === 'ready').length;
    let habit = 0;
    state.habits.forEach((h) => { habit += M.milestoneStatus(R.HABIT_STREAK_REWARDS, M.computeHabitStreak(h, t), h.claims).filter((m) => m.status === 'ready').length; });
    return { day: day, habit: habit };
  }

  function renderView() {
    const v = $('#view');
    const fn = VIEWS[view] || VIEWS.today;
    v.innerHTML = fn();
    if (VIEW_AFTER[view]) VIEW_AFTER[view]();
  }

  function pageHead(title) {
    return '<div class="page-head"><button class="icon-btn" data-act="back" aria-label="Quay lại">' + ICON.back + '</button><h2>' + esc(title) + '</h2></div>';
  }

  /* ---------- Thẻ dùng chung ---------- */
  function depositCard() {
    const fi = M.funConvertInfo(state, todayKey());
    return '<section class="card"><div class="card-head"><h3>Gửi Muffin Bảo Lưu</h3><span class="pill' + (fi.khoOk ? ' kho-ok' : ' kho-need') + '">Hôm nay ' + fi.deposited + '/' + fi.needKho + (fi.khoOk ? ' ✓' : '') + '</span></div>' +
      '<form class="row" data-form="deposit"><input name="n" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Số Muffin" aria-label="Số Muffin gửi vào Kho">' +
      '<button class="btn kho" type="submit">Gửi Kho</button></form>' +
      (fi.khoOk ? '' : '<p class="live">Cần gửi thêm <b>' + (fi.needKho - fi.deposited) + '</b> Muffin hôm nay để mở khóa đổi phút giải trí.</p>') +
      '<p class="note">Điểm trong Kho dùng mua đồ ở Shop, KHÔNG đổi ra phút giải trí được. Kho hiện có <b>' + fmt(state.kho) + '</b> Muffin.</p></section>';
  }

  // Nhãn ngày ngắn cho dải chọn ngày của mục tiêu
  function planLabel(d, t) {
    const diff = M.daysBetween(t, d);
    return diff === 0 ? 'Nay' : diff === 1 ? 'Mai' : weekday(d);
  }
  function goalTitle(d, t) {
    const diff = M.daysBetween(t, d);
    return diff === 0 ? 'Mục tiêu hôm nay' : diff === 1 ? 'Mục tiêu ngày mai' : 'Mục tiêu ' + weekday(d) + ', ' + fmtShort(d);
  }

  function goalsCard() {
    const t = todayKey();
    const d = ui.goalDate;
    const items = M.goalsOf(state, d);
    const isToday = d === t;
    const done = items.filter((g) => g.done).length;
    const strip = M.planDates(t).map((x) => {
      const n = M.goalsOf(state, x).length;
      return '<button type="button" class="dchip' + (x === d ? ' on' : '') + '" data-act="goal-day" data-date="' + x + '" aria-pressed="' + (x === d) + '" aria-label="' + esc(goalTitle(x, t)) + ', ' + n + ' mục">' +
        '<span>' + planLabel(x, t) + '</span><b>' + fmtShort(x).slice(0, 2) + '</b><i>' + (n ? n : '') + '</i></button>';
    }).join('');
    // ngày gần nhất trước đó có mục tiêu (để chép)
    let prev = null;
    for (let i = 1; i <= 14 && !prev; i++) { const p = M.addDays(d, -i); if (M.goalsOf(state, p).length) prev = p; }
    let html = '<section class="card" id="goalsCard"><div class="card-head"><h3>' + esc(goalTitle(d, t)) + '</h3>' +
      (isToday ? '<span class="pill" id="goalCount">' + done + '/' + items.length + '</span>' : '<span class="pill">' + items.length + '/' + R.GOALS_MAX_PER_DAY + '</span>') + '</div>' +
      '<div class="dstrip" role="group" aria-label="Chọn ngày">' + strip + '</div>';
    if (items.length) {
      html += '<ul class="goal-list">' + items.map((g, i) =>
        '<li class="goal' + (g.done ? ' done' : '') + '">' +
        (isToday
          ? '<label class="chk"><input type="checkbox" data-goal-check="' + esc(g.id) + '"' + (g.done ? ' checked' : '') + ' aria-label="Hoàn thành: ' + esc(g.text) + '"><i></i></label>'
          : '<span class="goal-num" aria-hidden="true">' + (i + 1) + '</span>') +
        '<input class="goal-text" data-goal-edit="' + esc(g.id) + '" value="' + esc(g.text) + '" maxlength="80" enterkeyhint="done" aria-label="Sửa mục tiêu ' + (i + 1) + '">' +
        '<button class="icon-btn sm" data-act="goal-del" data-id="' + esc(g.id) + '" aria-label="Xóa mục tiêu ' + esc(g.text) + '">' + ICON.trash + '</button>' +
        '</li>').join('') + '</ul>';
    } else {
      html += '<p class="empty-goals">Chưa có mục tiêu cho ngày này.</p>';
    }
    if (items.length < R.GOALS_MAX_PER_DAY) {
      html += '<form class="row goal-add" data-form="goal-add"><input name="text" maxlength="80" autocomplete="off" placeholder="Thêm mục tiêu…" aria-label="Thêm mục tiêu mới" enterkeyhint="done">' +
        '<button class="btn primary" type="submit" aria-label="Thêm mục tiêu">+</button></form>';
    }
    html += '<div class="btn-row goal-tools">' +
      '<button class="btn soft" data-act="goal-pick"' + (state.tasks.length ? '' : ' disabled') + '>📋 Lấy từ Kho nhiệm vụ</button>' +
      (prev && !items.length ? '<button class="btn soft" data-act="goal-copy" data-from="' + prev + '">Chép từ ' + esc(planLabel(prev, t) === 'Nay' ? 'hôm nay' : dayLabel(prev).toLowerCase()) + '</button>' : '') +
      '</div>' +
      '<p class="hint">' + (isToday ? 'Chạm vào tên để sửa. ' : 'Lên kế hoạch trước; tới ngày đó mới tick được. ') +
      '<button class="linkish" data-act="go" data-view="tasks">Kho nhiệm vụ (' + state.tasks.length + ')</button></p></section>';
    return html;
  }

  // Bảng chọn nhiều nhiệm vụ từ Kho để thêm vào ngày đang chọn
  async function pickFromBank() {
    const t = todayKey();
    const d = ui.goalDate;
    const have = M.goalsOf(state, d).map((g) => g.text.toLowerCase());
    const room = R.GOALS_MAX_PER_DAY - have.length;
    if (room <= 0) return toast('Ngày này đã đủ ' + R.GOALS_MAX_PER_DAY + ' mục tiêu.', 'error');
    let wrapEl = null;
    const yes = await confirmBox({
      title: '📋 Thêm vào ' + goalTitle(d, t).replace('Mục tiêu ', ''),
      html: '<p class="muted">Chọn nhiệm vụ (còn chỗ cho ' + room + ' mục).</p><ul class="pick-list">' + state.tasks.map((k) => {
        const exists = have.indexOf(k.text.toLowerCase()) >= 0;
        return '<li><label class="pick' + (exists ? ' off' : '') + '"><input type="checkbox" value="' + esc(k.id) + '"' + (exists ? ' disabled' : '') + '><span>' + esc(k.text) + (exists ? ' <small>(đã có)</small>' : '') + '</span></label></li>';
      }).join('') + '</ul>',
      okLabel: 'Thêm',
      onMount: (wrap) => {
        wrapEl = wrap;
        const btn = wrap.querySelector('[data-m=yes]');
        const upd = () => {
          const n = wrap.querySelectorAll('.pick-list input:checked').length;
          btn.textContent = n ? 'Thêm ' + n + ' mục' : 'Thêm';
          btn.disabled = n === 0 || n > room;
        };
        wrap.addEventListener('change', upd); upd();
      },
    });
    if (!yes || !wrapEl) return;
    const ids = [...wrapEl.querySelectorAll('.pick-list input:checked')].map((i) => i.value);
    const res = M.addTasksToDay(state, ids, d, t, ctx());
    if (commit(res)) toast('Đã thêm ' + res.added + ' mục tiêu' + (res.full ? ' (' + res.full + ' mục không vừa vì đủ 10)' : ''), 'success');
  }

  /* ================= CÁC MÀN ================= */
  const VIEWS = {};
  const VIEW_AFTER = {};

  /* ---------- Ghi nhận ---------- */
  VIEWS.today = function () {
    const t = todayKey();
    const day = state.days[t] || { home: 0, class: 0, work: 0, gym: 0, earned: 0 };
    const total = M.dayTotal(day);
    const st = M.computeDayStreak(state, t);
    let html = '';
    if (!state.meta.setupDone && !state.meta.welcomeDismissed) {
      html += '<section class="card welcome"><h3>👋 Chào mừng tới Muffin!</h3><p>Nếu bạn đang có Muffin, Kho, chuỗi hay đồ từ bản cũ, hãy khai báo trước khi bắt đầu.</p>' +
        '<div class="btn-row"><button class="btn primary" data-act="go" data-view="setup">Nhập số dư ban đầu</button><button class="btn soft" data-act="dismiss-welcome">Bắt đầu từ 0</button></div></section>';
    }
    const need = Math.max(0, st.min - total);
    html += '<section class="card today-sum"><div class="sum-grid">' +
      '<div class="sum-box"><div class="big">' + fmt(total) + '</div><div class="lbl">phút hôm nay</div></div>' +
      '<div class="sum-box muffin"><div class="big">+' + fmt(day.earned || 0) + ' 🧁</div><div class="lbl">Muffin hôm nay</div></div></div>' +
      '<div class="streak-line">' + (st.todayDone
        ? '🔥 <b>Chuỗi Ngày ' + st.count + '/' + R.DAY_STREAK_CYCLE_DAYS + '</b>: hôm nay đã được tính ✓'
        : '🔥 Còn <b>' + need + ' phút</b> nữa để hôm nay được tính vào Chuỗi Ngày' + (st.count ? ' (đang ' + st.count + ' ngày)' : '')) +
      '<div class="bar"><span style="width:' + pct(total, st.min) + '%"></span></div></div>' +
      (function () {
        const fi = M.funConvertInfo(state, t);
        return '<div class="kho-line' + (fi.khoOk ? ' ok' : '') + '">🏦 Gửi Kho hôm nay: <b>' + fi.deposited + '/' + fi.needKho + '</b>' +
          (fi.khoOk ? ' ✓ · Đổi phút còn <b>' + fi.leftMin + '</b>/' + fi.maxMin + ' phút' : ' · Gửi đủ mới đổi được phút giải trí') + '</div>';
      })() + '</section>';

    html += '<h2 class="sec-title">Ghi nhận phút</h2>';
    M.CATS.forEach((c) => {
      const rate = R.MINUTES_PER_MUFFIN[c];
      const rem = state.acc[c] % rate;
      const flash = ui.flash && ui.flash.cat === c ? '<div class="flash">' + esc(ui.flash.text) + '</div>' : '';
      html += '<section class="card cat cat-' + c + '">' + flash +
        '<div class="cat-head"><span class="dot"></span><b>' + M.CAT_SHORT[c] + '</b><span class="rate">' + rate + ' phút = 1 🧁</span></div>' +
        '<form class="row" data-form="log" data-cat="' + c + '">' +
        '<input name="m" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Số phút ' + M.CAT_LABEL[c].toLowerCase() + '" aria-label="Số phút ' + M.CAT_LABEL[c] + '">' +
        '<button class="btn primary" type="submit" aria-label="Ghi phút ' + M.CAT_LABEL[c] + '">+</button></form>' +
        '<div class="quick">' + [15, 30, 60].map((m) => '<button type="button" data-act="quick" data-cat="' + c + '" data-min="' + m + '" aria-label="Ghi nhanh ' + m + ' phút ' + M.CAT_LABEL[c] + '">+' + m + '</button>').join('') + '</div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + rate + '" aria-valuenow="' + rem + '" aria-label="Tiến độ tới Muffin tiếp theo"><span style="width:' + pct(rem, rate) + '%"></span></div>' +
        '<div class="bar-text"><span>Đã tích <b>' + rem + '/' + rate + '</b> phút → Muffin tiếp</span><span>Hôm nay <b>' + fmt(day[c] || 0) + '</b> ph</span></div>' +
        '</section>';
    });
    if (!isWide()) html += '<h2 class="sec-title">Hôm nay</h2>' + goalsCard();
    ui.flash = null;
    return html;
  };

  /* ---------- Mở hộp ---------- */
  function giftHTML(cls) {
    return '<div class="gift ' + (cls || '') + '" aria-hidden="true"><div class="g-body"></div><div class="g-rib-v"></div>' +
      '<div class="g-lid-wrap"><div class="g-lid"></div><div class="g-rib-l"></div><div class="g-bow"></div></div></div>';
  }
  VIEWS.box = function () {
    const bi = M.boxInfo(state);
    const opens = state.log.filter((e) => e.type === 'box').slice(-5).reverse();
    const odds = R.BOX.REWARDS.map((r) => r.muffin).join(', ');
    return '<section class="card box-card">' + giftHTML(bi.available ? 'ready' : '') +
      '<h2>Hộp Huyền Thoại</h2>' +
      '<div class="box-avail"><b>' + bi.available + '</b> lượt mở sẵn sàng</div>' +
      '<div class="bar lg" role="progressbar" aria-valuemin="0" aria-valuemax="' + bi.per + '" aria-valuenow="' + bi.progress + '" aria-label="Tiến độ hộp tiếp theo"><span style="width:' + pct(bi.progress, bi.per) + '%"></span></div>' +
      '<div class="bar-text"><span><b>' + bi.progress + '/' + bi.per + '</b> phút học ở nhà</span><span>Đã mở: <b>' + state.boxOpened + '</b> hộp</span></div>' +
      '<button class="btn big" data-act="open-box"' + (bi.available ? '' : ' disabled') + '>' + (bi.available ? 'Mở hộp' : 'Còn ' + (bi.per - bi.progress) + ' phút nữa') + '</button>' +
      '<p class="hint">Mỗi ' + bi.per + ' phút học ở nhà (cộng dồn) = 1 lượt. Mỗi hộp cho ngẫu nhiên ' + odds + ' Muffin thường, cơ hội ngang nhau.</p></section>' +
      '<h2 class="sec-title">Lần mở gần đây</h2>' +
      (opens.length ? '<section class="card list">' + opens.map((e) =>
        '<div class="li"><span class="li-ic">🎁</span><div class="li-main"><b>+' + e.reward + ' Muffin</b><span class="li-sub">' + dayLabel(e.date) + ' · ' + fmtTime(e.t) + '</span></div></div>').join('') + '</section>'
        : '<section class="card empty">Chưa mở hộp nào.</section>');
  };

  async function doOpenBox() {
    const res = M.openBox(state, ctx());
    if (!res.ok) return toast(res.error, 'error');
    // Lưu ngay rồi mới chạy hiệu ứng (đóng app giữa chừng cũng không mất thưởng)
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
      html: '<div class="box-stage">' + giftHTML('shake') + confetti + '<div class="reward-pop" aria-live="polite">+' + reward + ' 🧁</div><p class="muted" id="boxMsg">Đang mở…</p></div>',
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

  /* ---------- Cửa hàng ---------- */
  VIEWS.shop = function () {
    let html = '';
    if (!isWide()) html += depositCard();
    const fi = M.funConvertInfo(state, todayKey());
    const locked = !fi.khoOk || fi.leftMin <= 0;
    html += '<section class="card"><div class="card-head"><h3>Đổi Phút Giải Trí</h3><span class="pill">1 🧁 = ' + R.FUN_MINUTES_PER_MUFFIN + ' phút</span></div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + fi.maxMin + '" aria-valuenow="' + fi.converted + '" aria-label="Phút giải trí đã đổi hôm nay"><span style="width:' + pct(fi.converted, fi.maxMin) + '%"></span></div>' +
      '<div class="bar-text"><span>Hôm nay đã đổi <b>' + fi.converted + '/' + fi.maxMin + '</b> phút</span><span>Còn <b>' + fi.leftMin + '</b> phút</span></div>' +
      (!fi.khoOk
        ? '<p class="lock-note">🔒 Gửi đủ <b>' + fi.needKho + '</b> Muffin vào Kho hôm nay để mở khóa (đã gửi ' + fi.deposited + '/' + fi.needKho + ').</p>'
        : fi.leftMin <= 0 ? '<p class="lock-note">🔒 Hôm nay đã đổi đủ ' + fi.maxMin + ' phút (2 tiếng). Mai đổi tiếp nhé.</p>' : '') +
      '<form class="row" data-form="convert" style="margin-top:10px"><input name="n" id="convertInput" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Số Muffin thường" aria-label="Số Muffin thường muốn đổi"' + (locked ? ' disabled' : '') + '>' +
      '<button class="btn primary" type="submit"' + (locked ? ' disabled' : '') + '>Đổi</button></form>' +
      '<div class="live" id="convertPreview"></div>' +
      '<p class="hint">Chỉ dùng Muffin thường. Mỗi ngày đổi tối đa ' + fi.maxMin + ' phút (2 tiếng). Phút được cộng vào Quỹ Thời Gian Giải Trí (tab Túi đồ). Muffin trong Kho không đổi được.</p></section>';
    html += '<section class="card"><p>Số dư để mua: <b>' + fmt(state.kho) + '</b> Kho + <b>' + fmt(state.muffin) + '</b> thường = <b>' + fmt(state.kho + state.muffin) + '</b> 🧁</p>' +
      '<p class="hint">Khi mua, app trừ Muffin trong Kho trước, thiếu thì trừ thêm Muffin thường.</p></section>';
    M.SHOP_GROUPS.forEach((g) => {
      const items = R.SHOP.filter((it) => it.group === g.id);
      html += '<h2 class="sec-title">' + g.name + '</h2><section class="card list">' + items.map((it) => {
        const p = M.purchasePreview(state, it.id);
        const sub = p.can
          ? '<span class="li-sub">Trừ ' + (p.fromKho ? 'Kho ' + p.fromKho : '') + (p.fromKho && p.fromMuffin ? ' · ' : '') + (p.fromMuffin ? 'Thường ' + p.fromMuffin : '') + '</span>'
          : '<span class="li-sub warn">Thiếu ' + fmt(p.short) + ' 🧁</span>';
        return '<div class="li"><span class="li-ic">' + it.icon + '</span><div class="li-main"><b>' + esc(it.name) + '</b>' + sub + '</div>' +
          '<button class="btn primary sm" data-act="buy" data-item="' + it.id + '"' + (p.can ? '' : ' disabled') + ' aria-label="Đổi ' + esc(it.name) + ' giá ' + it.price + ' Muffin">Đổi ' + fmt(it.price) + '</button></div>';
      }).join('') + '</section>';
    });
    return html;
  };
  VIEW_AFTER.shop = function () { updateConvertPreview(); };
  function updateConvertPreview() {
    const inp = $('#convertInput'), out = $('#convertPreview');
    if (!inp || !out) return;
    const fi = M.funConvertInfo(state, todayKey());
    if (!fi.khoOk || fi.leftMin <= 0) { out.innerHTML = ''; return; }
    const r = M.parsePositiveInt(inp.value);
    if (!inp.value) out.innerHTML = 'Bạn có <b>' + fmt(state.muffin) + '</b> Muffin thường. Hôm nay đổi được tối đa <b>' + fi.maxMuffin + '</b> Muffin (' + fi.maxMuffin * R.FUN_MINUTES_PER_MUFFIN + ' phút).';
    else if (!r.ok) out.innerHTML = '<span class="li-sub warn">' + esc(r.error) + '</span>';
    else if (r.value > state.muffin) out.innerHTML = '<span class="li-sub warn">Chỉ có ' + fmt(state.muffin) + ' Muffin thường.</span>';
    else if (r.value * R.FUN_MINUTES_PER_MUFFIN > fi.leftMin) out.innerHTML = '<span class="li-sub warn">Vượt giới hạn hôm nay: chỉ còn đổi được ' + fi.leftMin + ' phút (' + Math.floor(fi.leftMin / R.FUN_MINUTES_PER_MUFFIN) + ' Muffin).</span>';
    else out.innerHTML = '= <b>' + fmt(r.value * R.FUN_MINUTES_PER_MUFFIN) + ' phút</b> giải trí';
  }

  async function doBuy(id) {
    const it = M.ITEM[id];
    const p = M.purchasePreview(state, id);
    if (!p.can) return toast('Thiếu ' + p.short + ' Muffin để đổi "' + it.name + '".', 'error');
    const parts = [];
    if (p.fromKho) parts.push('<b>' + p.fromKho + '</b> Muffin trong Kho');
    if (p.fromMuffin) parts.push('<b>' + p.fromMuffin + '</b> Muffin thường');
    const yes = await confirmBox({
      title: it.icon + ' Đổi "' + it.name + '"?',
      html: '<p>Giá <b>' + it.price + '</b> 🧁. Sẽ trừ ' + parts.join(' + ') + '.</p><p class="muted">Sau khi đổi: Kho còn ' + (state.kho - p.fromKho) + ', thường còn ' + (state.muffin - p.fromMuffin) + '. Món vào Túi Đồ.</p>',
      okLabel: 'Đổi ' + it.price,
    });
    if (yes) commit(M.buyItem(state, id, ctx()), 'Đã đổi "' + it.name + '". Xem trong Túi đồ');
  }

  /* ---------- Chuỗi Ngày ---------- */
  VIEWS.streak = function () {
    const t = todayKey();
    const st = M.computeDayStreak(state, t);
    const ms = M.milestoneStatus(R.DAY_STREAK_REWARDS, st, state.dayStreak.claims);
    const next = ms.find((m) => m.status === 'locked');
    const N = R.DAY_STREAK_CYCLE_DAYS;
    let html = '<section class="card hero day"><div class="hero-head"><div class="hero-label">🔥 Chuỗi Ngày</div><span class="pill cycle">Chu Kì ' + st.cycles + '</span></div>' +
      '<div class="hero-num">' + st.count + ' <small>/ ' + N + ' ngày</small></div>' +
      '<p>' + (st.todayDone ? 'Hôm nay đã được tính ✓ (' + st.todayMinutes + ' phút)' : 'Hôm nay: ' + st.todayMinutes + '/' + st.min + ' phút. Ghi đủ ' + st.min + ' phút để giữ chuỗi.') + '</p>' +
      '<div class="bar"><span style="width:' + pct(st.todayMinutes, st.min) + '%"></span></div>' +
      (st.runStart ? '<p class="hint">Chu kì này bắt đầu từ ' + fmtDate(st.runStart) + '.' + (st.total > st.count ? ' Tổng chuỗi liên tiếp: ' + st.total + ' ngày.' : '') + '</p>' : '') +
      (next ? '<p class="hint">Mốc tiếp theo: <b>' + next.at + ' ngày</b> → ' + esc(M.rewardText(next.reward)) + ' (còn ' + (next.at - st.count) + ' ngày)</p>' : '') +
      '</section>';
    html += '<p class="hint" style="margin:10px 4px 0">Chuỗi Ngày tính khi tổng phút ghi nhận trong ngày ≥ ' + st.min + ' phút. Đi hết ' + N + ' ngày thì Chu Kì +1, ngày ' + (N + 1) + ' quay về ngày 1 và các mốc thưởng nhận lại được. Khác với Chuỗi Thói Quen 🌱 (tab Thói quen).</p>';
    html += '<h2 class="sec-title">Mốc thưởng Chuỗi Ngày</h2><section class="card list">' + ms.map((m) => {
      const sub = m.status === 'claimed' ? '<span class="li-sub">Đã nhận ✓</span>' : m.status === 'ready' ? '<span class="li-sub good">Đã đạt, nhận ngay!</span>' : '<span class="li-sub">Còn ' + (m.at - st.count) + ' ngày</span>';
      return '<div class="li ms ' + m.status + '"><span class="ms-at">' + m.at + '</span><div class="li-main"><b>' + rewardIcon(m.reward) + ' ' + esc(M.rewardText(m.reward)) + '</b>' + sub + '</div>' +
        '<button class="btn sm ' + (m.status === 'ready' ? 'day' : '') + '" data-act="claim-day" data-at="' + m.at + '"' + (m.status === 'ready' ? '' : ' disabled') + '>' + (m.status === 'claimed' ? 'Đã nhận' : 'Nhận') + '</button></div>';
    }).join('') + '</section>';
    return html;
  };

  /* ---------- Thói quen ---------- */
  VIEWS.habits = function () {
    const t = todayKey();
    const y = M.addDays(t, -1);
    let html = '<section class="card"><div class="card-head"><h3>🌱 Thêm thói quen</h3></div>' +
      '<form class="row" data-form="habit-add"><input name="name" maxlength="60" autocomplete="off" placeholder="VD: Đọc sách 20 trang" aria-label="Tên thói quen mới" enterkeyhint="done">' +
      '<button class="btn habit" type="submit">Thêm</button></form>' +
      '<p class="hint">Mỗi thói quen có Chuỗi Thói Quen riêng: tick mỗi ngày để +1, bỏ lỡ 1 ngày thì về 0.</p></section>';
    if (!state.habits.length) html += '<section class="card empty">Chưa có thói quen nào.</section>';
    state.habits.forEach((h) => {
      const st = M.computeHabitStreak(h, t);
      const ms = M.milestoneStatus(R.HABIT_STREAK_REWARDS, st, h.claims);
      const ready = ms.filter((m) => m.status === 'ready');
      const next = ms.find((m) => m.status === 'locked');
      const done = {}; h.done.forEach((d) => { done[d] = true; });
      // Ngày khai từ bản cũ (số dư ban đầu) cũng hiện là đã xong
      if (h.anchor && h.anchor.count > 0) {
        for (let i = 0; i < Math.min(h.anchor.count, 7); i++) done[M.addDays(h.anchor.endDate, -i)] = true;
      }
      let week = '';
      for (let i = 6; i >= 0; i--) {
        const d = M.addDays(t, -i);
        const editable = d === t || d === y;
        const isDone = done[d] || false;
        week += '<button class="wd' + (isDone ? ' done' : '') + (d === t ? ' today' : '') + (editable ? ' editable' : '') + '"' +
          (editable ? ' data-act="habit-toggle" data-id="' + esc(h.id) + '" data-day="' + d + '"' : ' disabled') +
          ' aria-label="' + (d === t ? 'Hôm nay' : weekday(d) + ' ' + fmtShort(d)) + ': ' + (isDone ? 'đã xong' : 'chưa xong') + '"' + (editable ? ' aria-pressed="' + isDone + '"' : '') + '>' +
          '<span>' + (d === t ? 'Nay' : weekday(d)) + '</span><i></i></button>';
      }
      const doneToday = !!done[t];
      html += '<section class="card habit-card"><div class="habit-head"><b>' + esc(h.name) + '</b><span class="pill habit">🌱 ' + st.count + ' ngày</span>' +
        '<button class="icon-btn sm danger" data-act="habit-del" data-id="' + esc(h.id) + '" aria-label="Xóa thói quen ' + esc(h.name) + '">' + ICON.trash + '</button></div>' +
        '<div class="week">' + week + '</div>' +
        '<button class="btn block ' + (doneToday ? 'habit-done' : 'habit') + '" data-act="habit-toggle" data-id="' + esc(h.id) + '" data-day="' + t + '" aria-pressed="' + doneToday + '">' +
        (doneToday ? '✓ Đã hoàn thành hôm nay (chạm để bỏ)' : 'Hoàn thành hôm nay') + '</button>' +
        ready.map((m) => '<div class="claim-box"><span>🎉 Mốc ' + m.at + ': ' + esc(M.rewardText(m.reward)) + '</span>' +
          (m.reward.choice
            ? m.reward.choice.map((c) => '<button class="btn sm habit" data-act="claim-habit" data-id="' + esc(h.id) + '" data-at="' + m.at + '" data-choice="' + c + '">' + M.ITEM[c].icon + ' ' + esc(M.ITEM[c].name) + '</button>').join('')
            : '<button class="btn sm habit" data-act="claim-habit" data-id="' + esc(h.id) + '" data-at="' + m.at + '">Nhận</button>') + '</div>').join('') +
        (next ? '<p class="hint">Mốc tiếp: <b>' + next.at + ' ngày</b> → ' + esc(M.rewardText(next.reward)) + ' (còn ' + (next.at - st.count) + ')</p>' : '<p class="hint">Đã qua mọi mốc! 🏆</p>') +
        '</section>';
    });
    html += '<details class="card" id="habitTable"' + (ui.habitTableOpen ? ' open' : '') + '><summary>Bảng thưởng Chuỗi Thói Quen</summary>' +
      '<table class="rt"><thead><tr><th>Mốc</th><th>Phần thưởng</th></tr></thead><tbody>' +
      R.HABIT_STREAK_REWARDS.map((m) => '<tr><td>' + m.at + ' ngày</td><td>' + rewardIcon(m.reward) + ' ' + esc(M.rewardText(m.reward)) + '</td></tr>').join('') +
      '</tbody></table></details>';
    return html;
  };
  VIEW_AFTER.habits = function () {
    const d = $('#habitTable');
    if (d) d.addEventListener('toggle', () => { ui.habitTableOpen = d.open; });
  };

  /* ---------- Túi đồ ---------- */
  VIEWS.bag = function () {
    let html = '<section class="card fun-card"><div class="fun-label">⏱️ Quỹ Thời Gian Giải Trí</div>' +
      '<div class="fun-num">' + fmt(state.fun) + ' <small>phút</small></div>' +
      (state.fun >= 60 ? '<div class="muted">≈ ' + hm(state.fun) + '</div>' : '') +
      '<form class="row" data-form="spend"><input name="m" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Số phút" aria-label="Số phút giải trí muốn tiêu">' +
      '<button class="btn primary" type="submit">Tiêu Phút</button></form></section>';
    const total = R.SHOP.reduce((t, it) => t + (state.inventory[it.id] || 0), 0);
    html += '<h2 class="sec-title">Túi Đồ · ' + total + ' món</h2><div class="bag-grid">' + R.SHOP.map((it) => {
      const n = state.inventory[it.id] || 0;
      return '<div class="card bag-card' + (n ? ' has' : '') + '"><div class="bag-ic" aria-hidden="true">' + it.icon + '</div><b class="name">' + esc(it.bagName) + '</b>' +
        '<div class="bag-n">Đang có: <b>' + n + '</b></div>' +
        '<button class="btn sm ' + (n ? 'primary' : '') + '" data-act="use" data-item="' + it.id + '"' + (n ? '' : ' disabled') + ' aria-label="Dùng ' + esc(it.bagName) + '">Dùng</button></div>';
    }).join('') + '</div>';
    return html;
  };

  /* ---------- Kho nhiệm vụ ---------- */
  VIEWS.tasks = function () {
    const t = todayKey();
    const todayTexts = M.goalsOf(state, t).map((g) => g.text.toLowerCase());
    let html = pageHead('Kho nhiệm vụ') +
      '<section class="card"><h3>Thêm vào kho</h3>' +
      '<form data-form="task-add"><textarea name="text" rows="4" placeholder="Mỗi dòng 1 nhiệm vụ, ví dụ:&#10;Ôn chương 3&#10;Tập gym chân&#10;Đọc 20 trang sách" aria-label="Nhiệm vụ mới, mỗi dòng 1 nhiệm vụ"></textarea>' +
      '<button class="btn primary block" type="submit" style="margin-top:10px">Thêm vào kho</button></form>' +
      '<p class="hint">Nhiệm vụ nằm sẵn trong kho để bạn lấy ra làm mục tiêu cho hôm nay hoặc mấy ngày tới (nút 📋 ở thẻ Mục tiêu). Lấy ra rồi vẫn còn trong kho để dùng lại.</p></section>';
    html += '<h2 class="sec-title">Trong kho · ' + state.tasks.length + ' nhiệm vụ</h2>';
    if (!state.tasks.length) return html + '<section class="card empty">Kho đang trống. Điền vài nhiệm vụ ở trên nhé.</section>';
    html += '<section class="card list">' + state.tasks.map((k) => {
      const inToday = todayTexts.indexOf(k.text.toLowerCase()) >= 0;
      return '<div class="li task-li"><input class="goal-text" data-task-edit="' + esc(k.id) + '" value="' + esc(k.text) + '" maxlength="80" enterkeyhint="done" aria-label="Sửa nhiệm vụ">' +
        (inToday ? '<span class="pill kho-ok">Đã có hôm nay</span>' : '<button class="btn sm soft" data-act="task-today" data-id="' + esc(k.id) + '" aria-label="Thêm ' + esc(k.text) + ' vào mục tiêu hôm nay">+ Hôm nay</button>') +
        '<button class="icon-btn sm danger" data-act="task-del" data-id="' + esc(k.id) + '" aria-label="Xóa nhiệm vụ ' + esc(k.text) + '">' + ICON.trash + '</button></div>';
    }).join('') + '</section>';
    return html;
  };

  /* ---------- Thống kê ---------- */
  VIEWS.stats = function () {
    const n = ui.statsRange;
    const data = M.statsRange(state, todayKey(), n);
    const sum = { home: 0, class: 0, work: 0, gym: 0, earned: 0, spent: 0, total: 0 };
    data.forEach((d) => Object.keys(sum).forEach((k) => { sum[k] += d[k] || 0; }));
    const all = M.statsAllTime(state);
    const active = data.filter((d) => d.total > 0).length;
    return pageHead('Thống kê') +
      '<div class="seg" role="tablist"><button role="tab" aria-selected="' + (n === 7) + '" class="' + (n === 7 ? 'on' : '') + '" data-act="stats-range" data-n="7">7 ngày</button>' +
      '<button role="tab" aria-selected="' + (n === 30) + '" class="' + (n === 30 ? 'on' : '') + '" data-act="stats-range" data-n="30">30 ngày</button></div>' +
      '<section class="card"><div class="card-head"><h3>Phút theo ngày</h3><span class="pill">' + fmt(sum.total) + ' phút</span></div>' + chartSVG(data) +
      '<div class="legend">' + M.CATS.map((c) => '<span><i style="background:' + CAT_COLOR[c] + '"></i>' + M.CAT_SHORT[c] + ' · <b>' + fmt(sum[c]) + '</b></span>').join('') + '</div></section>' +
      '<section class="card"><div class="tiles">' +
      '<div class="tile green"><span class="lbl">Muffin đã kiếm</span><b>+' + fmt(sum.earned) + '</b></div>' +
      '<div class="tile red"><span class="lbl">Muffin đã tiêu</span><b>-' + fmt(sum.spent) + '</b></div>' +
      '<div class="tile"><span class="lbl">Ngày có ghi nhận</span><b>' + active + '/' + n + '</b></div>' +
      '<div class="tile"><span class="lbl">TB mỗi ngày</span><b>' + fmt(Math.round(sum.total / n)) + ' ph</b></div>' +
      '</div><p class="hint">Từ trước tới nay: kiếm <b>' + fmt(all.earned) + '</b> 🧁, tiêu <b>' + fmt(all.spent) + '</b> 🧁 (tiêu = mua đồ + đổi phút; gửi Kho không tính là tiêu).</p></section>';
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
      g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="' + (v ? '#E2E8E4' : '#9AA6A0') + '" stroke-width="1"' + (v ? ' stroke-dasharray="3 3"' : '') + '/>' +
        '<text x="' + (L - 5) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    }
    const slot = pw / data.length;
    const bw = Math.max(4, Math.min(28, slot * 0.66));
    const minLine = M.computeDayStreak(state, todayKey()).min;
    data.forEach((d, i) => {
      const x = L + slot * i + (slot - bw) / 2;
      let acc = 0, bars = '';
      M.CATS.forEach((c, ci) => {
        const v = d[c];
        if (!v) return;
        const y0 = y(acc), y1 = y(acc + v);
        acc += v;
        const isTop = acc === d.total;
        bars += '<rect x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0.5, y0 - y1).toFixed(1) + '" fill="' + CAT_COLOR[c] + '"' + (isTop ? ' rx="2"' : '') + '/>';
      });
      const title = fmtDate(d.date) + ': ' + d.total + ' phút (' + M.CATS.map((c) => M.CAT_SHORT[c] + ' ' + d[c]).join(', ') + ')';
      g += '<g><title>' + esc(title) + '</title><rect x="' + (L + slot * i).toFixed(1) + '" y="' + T + '" width="' + slot.toFixed(1) + '" height="' + ph + '" fill="transparent"/>' + bars + '</g>';
      const showLabel = data.length <= 7 || i % 5 === (data.length - 1) % 5;
      if (showLabel) g += '<text x="' + (L + slot * i + slot / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + (data.length <= 7 ? weekday(d.date) : fmtShort(d.date)) + '</text>';
    });
    if (minLine <= top) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(minLine).toFixed(1) + '" y2="' + y(minLine).toFixed(1) + '" stroke="#B45309" stroke-width="1.5" stroke-dasharray="6 4"/>' +
      '<text x="' + (L + 4) + '" y="' + (y(minLine) - 4).toFixed(1) + '" text-anchor="start" style="fill:#92400E;font-weight:700;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round">Ngưỡng chuỗi ' + minLine + ' ph</text>';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ cột phút ghi nhận theo ngày, chia theo 4 loại">' + g + '</svg>';
  }

  /* ---------- Nhật ký ---------- */
  VIEWS.log = function () {
    const last = state.log[state.log.length - 1];
    let html = pageHead('Nhật ký') + '<section class="card"><button class="btn block ' + (last ? 'primary' : '') + '" data-act="undo"' + (last ? '' : ' disabled') + '>' + ICON.undo.replace('<svg', '<svg width="20" height="20"') + ' Hoàn tác hành động gần nhất</button>' +
      (last ? '<p class="hint">Gần nhất: ' + esc(M.describeEntry(last)) + '</p>' : '') +
      '<p class="hint">Xóa một bản ghi bất kỳ sẽ tự cộng hoặc trừ lại điểm. Nếu điểm đã bị tiêu, app sẽ báo và không xóa.</p></section>';
    if (!state.log.length) return html + '<section class="card empty">Chưa có hoạt động nào.</section>';
    const items = state.log.slice(-ui.logLimit).reverse();
    let cur = null;
    items.forEach((e) => {
      if (e.date !== cur) {
        if (cur) html += '</section>';
        cur = e.date;
        html += '<h2 class="sec-title">' + dayLabel(e.date) + '</h2><section class="card list">';
      }
      html += '<div class="li log-li"><time>' + fmtTime(e.t) + '</time><div class="li-main">' + esc(M.describeEntry(e)) + '</div>' +
        '<button class="icon-btn sm danger" data-act="log-del" data-id="' + esc(e.id) + '" aria-label="Xóa bản ghi">' + ICON.trash + '</button></div>';
    });
    html += '</section>';
    if (state.log.length > ui.logLimit) html += '<button class="btn block soft" data-act="log-more">Xem thêm (' + (state.log.length - ui.logLimit) + ')</button>';
    return html;
  };

  /* ---------- Luật chơi ---------- */
  VIEWS.help = function () {
    const tbl = (rows) => '<table class="rt"><tbody>' + rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</tbody></table>';
    const min = M.computeDayStreak(state, todayKey()).min;
    return pageHead('Luật chơi') + '<div class="rules">' +
      '<section class="card"><h3>1. Kiếm Muffin</h3>' + tbl(M.CATS.map((c) => [M.CAT_LABEL[c], R.MINUTES_PER_MUFFIN[c] + ' phút = 1 🧁'])) +
      '<p class="hint">Phút lẻ chưa đủ 1 Muffin được giữ lại, cộng dồn lần sau (mỗi loại riêng). Mỗi lần ghi tối đa ' + R.MAX_MINUTES_PER_ENTRY + ' phút.</p></section>' +
      '<section class="card"><h3>2. Muffin Thường và Kho</h3><ul>' +
      '<li><b>Muffin Thường</b>: đổi ra phút giải trí (1 🧁 = ' + R.FUN_MINUTES_PER_MUFFIN + ' phút) hoặc mua đồ.</li>' +
      '<li><b>Gửi Kho</b> (một chiều): Muffin trong Kho chỉ dùng mua đồ ở Shop, KHÔNG đổi ra phút giải trí.</li>' +
      '<li><b>Mua đồ</b>: trừ Kho trước, thiếu thì trừ thêm Muffin thường. App hiện trước số bị trừ.</li>' +
      '<li>Phút giải trí vào <b>Quỹ Thời Gian Giải Trí</b>; tiêu bằng nút “Tiêu Phút” ở Túi đồ.</li>' +
      '<li><b>Mỗi ngày phải gửi ít nhất ' + R.DAILY_KHO_MIN + ' Muffin vào Kho</b>. Chưa gửi đủ thì chưa đổi được phút giải trí (vẫn mua đồ bình thường).</li>' +
      '<li><b>Mỗi ngày đổi tối đa ' + R.FUN_CONVERT_MAX_MINUTES_PER_DAY + ' phút giải trí</b> (2 tiếng, tức ' + Math.floor(R.FUN_CONVERT_MAX_MINUTES_PER_DAY / R.FUN_MINUTES_PER_MUFFIN) + ' Muffin). Phút thưởng từ chuỗi không tính vào giới hạn này.</li></ul></section>' +
      '<section class="card"><h3>3. Hộp Huyền Thoại</h3><ul><li>Mỗi ' + R.BOX.HOME_MINUTES_PER_BOX + ' phút <b>học ở nhà</b> (cộng dồn) = 1 lượt mở.</li>' +
      '<li>Mỗi lượt: ngẫu nhiên ' + R.BOX.REWARDS.map((r) => r.muffin).join(', ') + ' Muffin thường, cơ hội ngang nhau.</li></ul></section>' +
      '<section class="card"><h3>4. Cửa Hàng</h3>' + tbl(R.SHOP.map((it) => [it.icon + ' ' + esc(it.name), it.price + ' 🧁'])) + '</section>' +
      '<section class="card"><h3>5. 🔥 Chuỗi Ngày</h3><ul>' +
      '<li>Một ngày được tính khi tổng phút ghi nhận (mọi loại) ≥ <b>' + min + ' phút</b> (đổi được trong Cài đặt).</li>' +
      '<li>Ngày tính theo giờ Việt Nam (Asia/Ho_Chi_Minh), qua 0:00 là sang ngày mới.</li>' +
      '<li>Bỏ lỡ 1 ngày thì chuỗi về 0. Hôm nay chưa đủ thì chuỗi vẫn giữ tới hết ngày.</li>' +
      '<li><b>Chu Kì</b>: mỗi lần chuỗi đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày thì Chu Kì +1, ngày thứ ' + (R.DAY_STREAK_CYCLE_DAYS + 1) + ' quay về ngày 1 của chu kì mới và mọi mốc thưởng nhận lại được từ đầu. Chu Kì là tổng số lần đã đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày, đứt chuỗi cũng không mất.</li></ul>' +
      tbl(R.DAY_STREAK_REWARDS.map((m) => [m.at + ' ngày', esc(M.rewardText(m.reward))])) + '</section>' +
      '<section class="card"><h3>6. 🌱 Chuỗi Thói Quen</h3><ul><li>Mỗi thói quen có chuỗi riêng: tick hoàn thành trong ngày thì +1, bỏ lỡ 1 ngày thì về 0.</li>' +
      '<li>Được tick bù cho hôm qua nếu quên.</li></ul>' +
      tbl(R.HABIT_STREAK_REWARDS.map((m) => [m.at + ' ngày', esc(M.rewardText(m.reward))])) + '</section>' +
      '<section class="card"><h3>7. Nhận thưởng</h3><ul>' +
      '<li>Mỗi mốc nhận được 1 lần trong một lượt chuỗi (với Chuỗi Ngày là 1 lần mỗi chu kì). Chuỗi đứt rồi đạt lại thì được nhận lại.</li>' +
      '<li>Thưởng phút → Quỹ Thời Gian Giải Trí. Thưởng là món → Túi Đồ. Muffin từ hộp → Muffin thường.</li></ul></section>' +
      '<section class="card"><h3>8. Mục tiêu, nhật ký, sao lưu</h3><ul>' +
      '<li><b>Mục tiêu</b>: mỗi ngày tối đa ' + R.GOALS_MAX_PER_DAY + ' mục. Chọn ngày ở dải ngày trên thẻ để sửa mục tiêu của hôm nay và ' + (R.GOAL_PLAN_DAYS - 1) + ' ngày tới. Chỉ tick được mục tiêu của hôm nay.</li>' +
      '<li><b>Kho nhiệm vụ</b>: điền sẵn nhiều nhiệm vụ (mỗi dòng 1 cái), rồi bấm 📋 để lấy ra làm mục tiêu cho ngày đang chọn.</li>' +
      '<li>Mọi hành động đều vào Nhật ký; có Hoàn tác và xóa từng bản ghi (tự cộng/trừ lại điểm).</li>' +
      '<li>Dữ liệu chỉ nằm trên máy này. Nên Xuất JSON ít nhất mỗi tuần (app sẽ nhắc sau ' + R.BACKUP_REMIND_DAYS + ' ngày).</li></ul></section>' +
      '</div>';
  };

  /* ---------- Cài đặt ---------- */
  VIEWS.settings = function () {
    const last = state.meta.lastExport;
    const backups = getBackups();
    return pageHead('Cài đặt') +
      '<section class="card"><h3>Sao lưu dữ liệu</h3><p class="hint">Lần xuất gần nhất: <b>' + (last ? dayLabel(M.dateKey(last)) + ' ' + fmtTime(last) : 'chưa có') + '</b></p>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn primary" data-act="export">Xuất JSON</button><button class="btn soft" data-act="import">Nhập JSON</button></div>' +
      '<p class="note">Trên iPhone, app ở Màn hình chính có bộ nhớ riêng, tách khỏi tab Safari. Hãy nhập số dư / nhập JSON bên trong app đã cài. Xuất JSON sẽ mở bảng Chia sẻ để lưu vào app Tệp hoặc gửi Zalo.</p></section>' +
      '<section class="card"><h3>Số dư ban đầu</h3><p class="hint">Khai báo Muffin, Kho, chuỗi và đồ đang có từ bản cũ.</p>' +
      '<button class="btn block soft" style="margin-top:10px" data-act="go" data-view="setup">Nhập số dư ban đầu</button></section>' +
      '<section class="card"><h3>Ngưỡng Chuỗi Ngày</h3>' +
      '<form class="row" data-form="streak-min" style="margin-top:10px"><input name="v" inputmode="numeric" pattern="[0-9]*" value="' + M.computeDayStreak(state, todayKey()).min + '" aria-label="Số phút tối thiểu mỗi ngày (STREAK_MIN_MINUTES)">' +
      '<button class="btn primary" type="submit">Lưu</button></form><p class="hint">Số phút ghi nhận tối thiểu mỗi ngày để được tính Chuỗi Ngày (mặc định ' + R.STREAK_MIN_MINUTES + '). Đổi ngưỡng sẽ tính lại chuỗi theo dữ liệu đã có.</p></section>' +
      '<section class="card"><h3>Bản sao lưu tự động</h3><p class="hint">App tự lưu bản sao trước khi reset, nhập dữ liệu, xóa thói quen… (giữ 5 bản gần nhất).</p>' +
      (backups.length ? '<div class="list" style="margin:6px -16px -8px">' + backups.map((b, i) =>
        '<div class="li"><div class="li-main"><b>' + esc(b.reason) + '</b><span class="li-sub">' + dayLabel(M.dateKey(b.at)) + ' ' + fmtTime(b.at) + '</span></div>' +
        '<button class="btn sm soft" data-act="restore" data-i="' + i + '">Khôi phục</button></div>').join('') + '</div>' : '<p class="hint"><b>Chưa có bản nào.</b></p>') + '</section>' +
      '<section class="card danger-zone"><h3>Vùng nguy hiểm</h3><p class="hint">Xóa toàn bộ dữ liệu trên máy này. App sẽ tự sao lưu trước khi xóa.</p>' +
      '<button class="btn block ghost-danger" style="margin-top:10px" data-act="reset">Reset dữ liệu</button></section>' +
      '<p class="hint" style="text-align:center">Muffin Study Game v' + APP_VERSION + ' · Dữ liệu lưu trên máy' + (persisted ? ' (đã xin lưu bền vững)' : '') + '</p>';
  };

  /* ---------- Số dư ban đầu ---------- */
  VIEWS.setup = function () {
    const t = todayKey();
    const bi = M.boxInfo(state);
    const st = M.computeDayStreak(state, t);
    const maxClaim = (list, streak, claims) => {
      let m = 0;
      M.milestoneStatus(list, streak, claims).forEach((x) => { if (x.status === 'claimed') m = Math.max(m, x.at); });
      return m;
    };
    const f = (name, label, val, small) => '<div class="field"><label for="f_' + name + '">' + label + (small ? '<small>' + small + '</small>' : '') + '</label>' +
      '<input id="f_' + name + '" name="' + name + '" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="' + val + '"></div>';
    const chk = (name, label, checked) => '<div class="field"><label for="f_' + name + '">' + label + '</label><input type="checkbox" id="f_' + name + '" name="' + name + '"' + (checked ? ' checked' : '') + '></div>';
    let html = pageHead('Nhập số dư ban đầu') +
      '<p class="hint" style="margin:4px 4px 0">Điền số đang có ở bản cũ. Ô để trống = 0. Lưu sẽ thay toàn bộ số dư hiện tại và xóa nhật ký hoàn tác (app tự sao lưu trước).</p>' +
      '<form data-form="setup">' +
      '<section class="card" style="margin-top:12px"><h3>Muffin</h3>' +
      f('muffin', 'Muffin Thường', state.muffin) + f('kho', 'Muffin Trong Kho', state.kho) + f('fun', 'Quỹ phút giải trí', state.fun, 'phút') + '</section>' +
      '<section class="card" style="margin-top:12px"><h3>Hộp Huyền Thoại</h3>' +
      f('boxProgress', 'Tiến độ hộp hiện tại', bi.progress, 'phút ở nhà, 0-' + (R.BOX.HOME_MINUTES_PER_BOX - 1)) +
      f('boxPending', 'Lượt mở hộp đang chờ', bi.available) + '</section>' +
      '<section class="card" style="margin-top:12px"><h3>Phút lẻ đang tích</h3>' +
      M.CATS.map((c) => f('rem_' + c, M.CAT_LABEL[c], state.acc[c] % R.MINUTES_PER_MUFFIN[c], '0-' + (R.MINUTES_PER_MUFFIN[c] - 1) + ' phút')).join('') + '</section>' +
      '<section class="card" style="margin-top:12px"><h3>🔥 Chuỗi Ngày</h3>' +
      f('cycles', 'Chu Kì', st.cycles, 'số lần đã đi hết ' + R.DAY_STREAK_CYCLE_DAYS + ' ngày') +
      f('dayStreak', 'Ngày hiện tại trong chu kì', st.count, '0-' + R.DAY_STREAK_CYCLE_DAYS) + chk('dayIncludesToday', 'Đã tính cả hôm nay', st.todayDone || st.count === 0) +
      f('dayClaimedUpTo', 'Đã nhận thưởng tới mốc', maxClaim(R.DAY_STREAK_REWARDS, st, state.dayStreak.claims), 'VD 10 = đã nhận mốc 5 và 10') + '</section>';
    if (state.habits.length) {
      html += '<section class="card" style="margin-top:12px"><h3>🌱 Chuỗi Thói Quen</h3>' + state.habits.map((h) => {
        const hs = M.computeHabitStreak(h, t);
        return '<p style="margin-top:10px"><b>' + esc(h.name) + '</b></p>' + f('h_' + h.id + '_streak', 'Chuỗi hiện tại', hs.count) +
          chk('h_' + h.id + '_today', 'Đã tính cả hôm nay', hs.todayDone || hs.count === 0) +
          f('h_' + h.id + '_claimed', 'Đã nhận thưởng tới mốc', maxClaim(R.HABIT_STREAK_REWARDS, hs, h.claims));
      }).join('') + '</section>';
    } else {
      html += '<p class="hint" style="margin:10px 4px 0">Có thói quen với chuỗi sẵn từ bản cũ? Hãy thêm thói quen ở tab Thói quen trước, rồi quay lại đây để khai chuỗi.</p>';
    }
    html += '<section class="card" style="margin-top:12px"><h3>🎒 Túi Đồ</h3>' + R.SHOP.map((it) => f('inv_' + it.id, it.icon + ' ' + esc(it.bagName), state.inventory[it.id] || 0)).join('') + '</section>' +
      '<button class="btn primary block big" type="submit" style="margin-top:14px">Lưu số dư</button></form>';
    return html;
  };

  /* ================= Xử lý hành động ================= */
  function go(v) {
    if (MAIN_TABS.indexOf(v) >= 0) prevMain = v;
    view = v;
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

  function doLog(cat, minutes) {
    const res = M.logMinutes(state, cat, minutes, ctx());
    if (!res.ok) return toast(res.error, 'error');
    const e = res.entry;
    ui.flash = { cat: cat, text: '+' + e.gained + ' 🧁' };
    ui.bump = e.gained > 0;
    commit(res, 'Đã ghi ' + minutes + ' phút ' + M.CAT_LABEL[cat] + ' → +' + e.gained + ' Muffin' + (e.boxGained ? ' · 🎁 +' + e.boxGained + ' lượt hộp!' : ''));
  }

  document.addEventListener('click', async (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const a = el.dataset.act;
    const t = todayKey();
    switch (a) {
      case 'go': go(el.dataset.view); break;
      case 'back': go(prevMain); break;
      case 'quick': doLog(el.dataset.cat, parseInt(el.dataset.min, 10)); break;
      case 'open-box': doOpenBox(); break;
      case 'buy': doBuy(el.dataset.item); break;
      case 'use': {
        const it = M.ITEM[el.dataset.item];
        commit(M.useItem(state, it.id, ctx()), 'Đã dùng "' + it.bagName + '". Chúc vui!');
        break;
      }
      case 'claim-day': {
        const res = M.claimDayMilestone(state, parseInt(el.dataset.at, 10), t, ctx());
        if (res.ok) commit(res, '🔥 Nhận thưởng mốc ' + el.dataset.at + ': ' + M.rewardText(res.entry.got));
        else toast(res.error, 'error');
        break;
      }
      case 'claim-habit': {
        const res = M.claimHabitMilestone(state, el.dataset.id, parseInt(el.dataset.at, 10), el.dataset.choice || null, t, ctx());
        if (res.ok) commit(res, '🌱 Nhận thưởng mốc ' + el.dataset.at + ': ' + M.rewardText(res.entry.got));
        else toast(res.error, 'error');
        break;
      }
      case 'habit-toggle': commit(M.toggleHabitDay(state, el.dataset.id, el.dataset.day, t)); break;
      case 'habit-del': {
        const h = state.habits.find((x) => x.id === el.dataset.id);
        if (!h) break;
        const yes = await confirmBox({ title: 'Xóa thói quen?', html: '<p>Xóa “<b>' + esc(h.name) + '</b>” và chuỗi 🌱 ' + M.computeHabitStreak(h, t).count + ' ngày của nó. Phần thưởng đã nhận vẫn giữ.</p><p class="muted">App sẽ tự sao lưu trước khi xóa (khôi phục được trong Cài đặt).</p>', okLabel: 'Xóa', danger: true });
        if (yes) { autoBackup('Trước khi xóa thói quen “' + h.name + '”'); commit(M.removeHabit(state, h.id)); toast('Đã xóa thói quen.', 'info'); }
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
        if (yes) { const res = M.deleteEntry(state, e.id); if (commit(res)) toast('Đã xóa bản ghi và hoàn lại điểm.', 'info'); }
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
          state = M.pruneGoalDays(data, t); save(); render(); toast('Đã khôi phục.', 'success');
        } catch (e) { toast('Bản sao lưu bị lỗi: ' + e.message, 'error'); }
        break;
      }
      case 'reset': {
        const yes = await confirmBox({ title: 'Reset toàn bộ dữ liệu?', html: '<p>Mọi Muffin, Kho, chuỗi, thói quen, túi đồ và nhật ký sẽ bị xóa khỏi máy này.</p><p class="muted">App sẽ tự sao lưu trước (khôi phục được trong Cài đặt). Nên Xuất JSON trước cho chắc.</p>', okLabel: 'Reset', danger: true });
        if (!yes) break;
        autoBackup('Trước khi reset');
        const keepExport = state.meta.lastExport;
        state = M.createInitialState(Date.now());
        state.meta.lastExport = keepExport;
        save(); go('today'); toast('Đã reset dữ liệu.', 'info');
        break;
      }
      default: break;
    }
  });

  // Gửi form (nút + và phím Enter / "Xong" trên bàn phím iPhone)
  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const kind = form.dataset.form;
    const inp = form.querySelector('input[name]');
    if (kind === 'log') {
      const r = readInt(inp, { max: R.MAX_MINUTES_PER_ENTRY, maxMsg: 'Mỗi lần ghi tối đa ' + R.MAX_MINUTES_PER_ENTRY + ' phút.' });
      if (r.ok) { inp.blur(); doLog(form.dataset.cat, r.value); }
    } else if (kind === 'deposit') {
      const r = readInt(inp, { max: state.muffin, maxMsg: 'Bạn chỉ có ' + state.muffin + ' Muffin thường.' });
      if (r.ok) { inp.blur(); ui.bump = true; commit(M.deposit(state, r.value, ctx()), 'Đã gửi ' + r.value + ' Muffin vào Kho'); }
    } else if (kind === 'convert') {
      const r = readInt(inp, { max: state.muffin, maxMsg: 'Bạn chỉ có ' + state.muffin + ' Muffin thường (Kho không đổi được).' });
      if (r.ok) { inp.blur(); ui.bump = true; commit(M.convertFun(state, r.value, ctx()), 'Đã đổi ' + r.value + ' Muffin → ' + (r.value * R.FUN_MINUTES_PER_MUFFIN) + ' phút giải trí'); }
    } else if (kind === 'spend') {
      const r = readInt(inp, { max: state.fun, maxMsg: 'Quỹ giải trí chỉ còn ' + state.fun + ' phút.' });
      if (r.ok) { inp.blur(); commit(M.spendFun(state, r.value, ctx()), 'Đã tiêu ' + r.value + ' phút giải trí. Chơi vui!'); }
    } else if (kind === 'habit-add') {
      const res = M.addHabit(state, inp.value, ctx());
      if (res.ok) { inp.value = ''; commit(res, null); toast('Đã thêm thói quen 🌱', 'success'); } else toast(res.error, 'error');
    } else if (kind === 'streak-min') {
      const r = readInt(inp, { max: 1440, maxMsg: 'Tối đa 1440 phút.' });
      if (r.ok) { state.settings.streakMin = r.value; save(); render(); toast('Ngưỡng Chuỗi Ngày: ' + r.value + ' phút', 'success'); }
    } else if (kind === 'goal-add') {
      const res = M.addGoals(state, ui.goalDate, [inp.value], todayKey(), ctx());
      if (commit(res)) {
        const ni = $('#goalsCard form[data-form="goal-add"] input');
        if (ni) ni.focus();
      }
    } else if (kind === 'task-add') {
      const ta = form.querySelector('textarea');
      const res = M.addTasks(state, ta.value, ctx());
      if (commit(res)) toast('Đã thêm ' + res.added + ' nhiệm vụ vào kho' + (res.dup ? ' (bỏ qua ' + res.dup + ' mục trùng)' : ''), 'success');
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
      muffin: data.muffin, kho: data.kho, fun: data.fun, cycles: data.cycles, boxProgress: data.boxProgress, boxPending: data.boxPending,
      rem: {}, dayStreak: data.dayStreak, dayIncludesToday: data.dayIncludesToday, dayClaimedUpTo: data.dayClaimedUpTo, inventory: {}, habits: {},
    };
    M.CATS.forEach((c) => { input.rem[c] = data['rem_' + c]; });
    R.SHOP.forEach((it) => { input.inventory[it.id] = data['inv_' + it.id]; });
    state.habits.forEach((h) => { input.habits[h.id] = { streak: data['h_' + h.id + '_streak'], includesToday: data['h_' + h.id + '_today'], claimedUpTo: data['h_' + h.id + '_claimed'] }; });
    const res = M.applySetup(state, input, todayKey());
    if (!res.ok) return toast(res.error, 'error');
    const yes = await confirmBox({
      title: 'Lưu số dư ban đầu?',
      html: '<p>Muffin thường <b>' + input.muffin + '</b>, Kho <b>' + input.kho + '</b>, quỹ giải trí <b>' + input.fun + '</b> phút, Chu Kì <b>' + input.cycles + '</b>, Chuỗi Ngày <b>' + input.dayStreak + '</b>.</p><p class="muted">Số dư hiện tại sẽ bị thay và nhật ký hoàn tác bị xóa. App tự sao lưu trước.</p>',
      okLabel: 'Lưu số dư',
    });
    if (!yes) return;
    autoBackup('Trước khi nhập số dư ban đầu');
    state = res.state; save();
    go('today');
    toast('Đã lưu số dư ban đầu ✓', 'success');
  }

  // Mục tiêu: tick và đổi tên (không vẽ lại cả trang để không mất bàn phím)
  document.addEventListener('change', (ev) => {
    const t = todayKey();
    const chk = ev.target.closest('[data-goal-check]');
    if (chk) {
      const res = M.toggleGoal(state, ui.goalDate, chk.dataset.goalCheck, t);
      if (!res.ok) { chk.checked = !chk.checked; return toast(res.error, 'error'); }
      state = res.state; save();
      chk.closest('.goal').classList.toggle('done', chk.checked);
      refreshGoalCount();
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
  function refreshGoalCount() {
    const items = M.goalsOf(state, ui.goalDate);
    const el = $('#goalCount');
    if (el) el.textContent = items.filter((g) => g.done).length + '/' + items.length;
  }
  document.addEventListener('input', (ev) => { if (ev.target.id === 'convertInput') updateConvertPreview(); });

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
        try { await navigator.share({ files: [file], title: 'Sao lưu Muffin' }); mark(); toast('Đã xuất bản sao lưu ✓', 'success'); return; }
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
    toast('Đã nhập dữ liệu ✓', 'success');
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
  wideMQ.addEventListener ? wideMQ.addEventListener('change', render) : wideMQ.addListener(render);

  // Đồng bộ khi mở app ở 2 tab cùng lúc (máy tính)
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) { try { state = M.migrate(JSON.parse(e.newValue), Date.now()); render(); } catch (err) { /* bỏ qua */ } }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  // Mở thẳng một màn qua đường dẫn, VD: index.html#shop
  const startView = location.hash.slice(1);
  if (VIEWS[startView]) view = startView;
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS[v] && v !== view) go(v); });

  save();
  render();
  // Cho phép kiểm thử từ DevTools
  window.__muffin = { get state() { return state; }, rules: M };
})();
