/*
 * Muffin Study Game: LUẬT CHƠI + HÀM THUẦN
 * ------------------------------------------------------------------
 * File này KHÔNG đụng tới DOM hay localStorage, để chạy được cả trong
 * trình duyệt lẫn Node (tests/run-tests.js).
 *
 * Mọi hàm hành động có dạng:  action(state, tham số..., ctx) -> Kết quả
 *   Kết quả thành công: { ok: true,  state: <state mới>, entry: <bản ghi nhật ký> }
 *   Kết quả thất bại:   { ok: false, error: '<thông báo tiếng Việt>' }
 * State cũ không bao giờ bị sửa (luôn trả về bản sao mới).
 * ctx = { now: <mili-giây>, id: <chuỗi id duy nhất>, rand: <số 0..1> }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MuffinRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================================================================
   * RULES: SỐ LIỆU BẮT BUỘC GIỮ NGUYÊN (không đổi, không làm tròn)
   * ================================================================ */
  const RULES = {
    // Quy đổi phút → Muffin thường: cần bao nhiêu phút cho 1 Muffin
    MINUTES_PER_MUFFIN: {
      home: 15,  // Học ở nhà:   15 phút = 1 Muffin
      class: 25, // Học trên lớp: 25 phút = 1 Muffin
      work: 20,  // Làm việc:    20 phút = 1 Muffin
      gym: 30,   // Tập gym:     30 phút = 1 Muffin
    },

    // Đổi phút giải trí: 1 Muffin thường = 5 phút giải trí.
    // Muffin trong Kho KHÔNG được đổi ra phút giải trí.
    FUN_MINUTES_PER_MUFFIN: 5,

    // Các mục giải trí khi tiêu phút từ Quỹ giải trí (chọn 1 mục mỗi lần tiêu).
    // limit: số phút tối đa mỗi ngày cho mục đó; dùng hết thì khoá tới hết ngày, qua 0:00 đếm lại.
    FUN_APPS: [
      { id: 'tiktok', name: 'TikTok', limit: 45 },
      { id: 'youtube', name: 'YouTube', limit: 60 },
      { id: 'facebook', name: 'Facebook', limit: 15 },
      { id: 'instagram', name: 'Instagram', limit: 15 },
      { id: 'threads', name: 'Threads', limit: 15 },
      { id: 'game', name: 'Game', limit: 60 },
      { id: 'web', name: 'Website', limit: 60 },
    ],

    // Hộp Huyền Thoại: trong 1 ngày học ở nhà đủ 200 phút thì mở được 1 lần (mỗi ngày tối đa 1 lần).
    // Tính riêng từng ngày: qua ngày mới đếm lại từ 0, không mở trong ngày thì mất lượt.
    // Mỗi lượt thưởng ngẫu nhiên 2, 4 hoặc 7 Muffin thường, xác suất đều nhau (weight bằng nhau).
    BOX: {
      HOME_MINUTES_PER_DAY: 200,
      REWARDS: [
        { muffin: 2, weight: 1 },
        { muffin: 4, weight: 1 },
        { muffin: 7, weight: 1 },
      ],
    },

    // Cửa Hàng: tên món - giá Muffin. group: small = Giải trí, shopping = Mua sắm, big = Trải nghiệm
    // bagName: tên thẻ hiện trong Túi Đồ.
    SHOP: [
      { id: 'cafe',   name: 'Đi cafe học',     bagName: 'Đi Cafe Học',     price: 55,   group: 'big',      icon: '☕' },
      { id: 'net',    name: 'Net 2 tiếng',     bagName: 'Net 2 Tiếng',     price: 70,   group: 'small',    icon: '🎮' },
      { id: 'food',   name: 'Đồ ăn/uống <60k', bagName: 'Đồ Ăn/Uống <60k', price: 70,   group: 'shopping', icon: '🧋' },
      { id: 'movie',  name: '1 vé xem phim',   bagName: 'Vé Xem Phim',     price: 90,   group: 'small',    icon: '🎬' },
      { id: 'buy100', name: 'Mua đồ <100k',    bagName: 'Thẻ Mua <100k',   price: 111,  group: 'shopping', icon: '🛍️' },
      { id: 'buy150', name: 'Mua đồ <150k',    bagName: 'Thẻ Mua <150k',   price: 150,  group: 'shopping', icon: '🛍️' },
      { id: 'skate',  name: 'Trượt băng',      bagName: 'Vé Trượt Băng',   price: 175,  group: 'big',      icon: '⛸️' },
      { id: 'buy250', name: 'Mua đồ <250k',    bagName: 'Thẻ Mua <250k',   price: 222,  group: 'shopping', icon: '🛍️' },
      { id: 'buy350', name: 'Mua đồ <350k',    bagName: 'Thẻ Mua <350k',   price: 333,  group: 'shopping', icon: '🛍️' },
      { id: 'buy500', name: 'Mua đồ <500k',    bagName: 'Thẻ Mua <500k',   price: 444,  group: 'shopping', icon: '🎁' },
      { id: 'buy700', name: 'Mua đồ <700k',    bagName: 'Thẻ Mua <700k',   price: 555,  group: 'shopping', icon: '🎁' },
      { id: 'buy1m',  name: 'Mua đồ <1tr',     bagName: 'Thẻ Mua <1tr',    price: 777,  group: 'shopping', icon: '💎' },
      { id: 'buy1m5', name: 'Mua đồ <1tr5',    bagName: 'Thẻ Mua <1tr5',   price: 888,  group: 'shopping', icon: '💎' },
      { id: 'buy2m5', name: 'Mua đồ <2tr5',    bagName: 'Thẻ Mua <2tr5',   price: 999,  group: 'shopping', icon: '💎' },
      { id: 'travel', name: 'Du lịch',         bagName: 'Du Lịch',         price: 1001, group: 'big',      icon: '✈️' },
      { id: 'wish',   name: 'Điều ước',        bagName: 'Điều Ước',        price: 2006, group: 'big',      icon: '🌟' },
    ],

    // Thưởng Chuỗi Ngày. Phần thưởng: { fun: số phút giải trí } hoặc { item: id món trong SHOP }
    DAY_STREAK_REWARDS: [
      { at: 5,  reward: { fun: 45 } },
      { at: 10, reward: { fun: 60 } },
      { at: 15, reward: { item: 'movie' } },   // 1 vé xem phim
      { at: 20, reward: { fun: 45 } },
      { at: 25, reward: { fun: 60 } },
      { at: 30, reward: { item: 'buy150' } },  // Mua đồ <150k
      { at: 35, reward: { fun: 45 } },
      { at: 40, reward: { fun: 60 } },
      { at: 45, reward: { item: 'movie' } },
      { at: 50, reward: { fun: 45 } },
      { at: 55, reward: { fun: 60 } },
      { at: 60, reward: { item: 'buy250' } },  // Mua đồ <250k
      { at: 65, reward: { fun: 60 } },
      { at: 70, reward: { item: 'movie' } },
      { at: 75, reward: { item: 'travel' } },  // Du lịch
    ],

    // Thưởng Chuỗi Thói Quen (mỗi thói quen có chuỗi riêng).
    // { choice: [...] } = được chọn 1 trong các món.
    HABIT_STREAK_REWARDS: [
      { at: 5,   reward: { fun: 30 } },
      { at: 7,   reward: { item: 'cafe' } },             // Đi cafe học
      { at: 14,  reward: { fun: 25 } },
      { at: 20,  reward: { fun: 25 } },
      { at: 25,  reward: { fun: 25 } },
      { at: 30,  reward: { item: 'buy100' } },           // Mua đồ <100k
      { at: 35,  reward: { fun: 25 } },
      { at: 40,  reward: { fun: 25 } },
      { at: 45,  reward: { choice: ['food', 'net'] } },  // Đồ ăn/uống <60k HOẶC Net 2 tiếng
      { at: 50,  reward: { fun: 25 } },
      { at: 55,  reward: { fun: 25 } },
      { at: 60,  reward: { item: 'buy150' } },           // Mua đồ <150k
      { at: 65,  reward: { fun: 25 } },
      { at: 70,  reward: { fun: 25 } },
      { at: 75,  reward: { choice: ['food', 'net'] } },
      { at: 80,  reward: { fun: 25 } },
      { at: 85,  reward: { fun: 25 } },
      { at: 90,  reward: { item: 'buy350' } },           // Mua đồ <350k
      { at: 95,  reward: { fun: 25 } },
      { at: 100, reward: { item: 'buy1m' } },            // Mua đồ <1tr
    ],

    /* ---------- Các mặc định cho luật chưa rõ ở bản cũ (mục 3) ---------- */
    // Một ngày được tính vào Chuỗi Ngày khi tổng phút ghi nhận (mọi loại) >= ngưỡng này.
    // Có thể đổi trong Cài đặt (lưu ở state.settings.streakMin). Đổi ngưỡng chỉ áp dụng từ hôm đổi trở đi:
    // ngày cũ giữ ngưỡng cũ, lưu ở state.settings.streakMinHist = [{ until: ngày cuối, min }] tăng dần.
    STREAK_MIN_MINUTES: 60,
    // Ngày tính theo giờ Asia/Ho_Chi_Minh (UTC+7, không có giờ mùa hè).
    TZ_OFFSET_HOURS: 7,
    // Mỗi lần ghi tối đa 600 phút.
    MAX_MINUTES_PER_ENTRY: 600,
    // Nhắc sao lưu nếu quá 7 ngày chưa xuất JSON.
    BACKUP_REMIND_DAYS: 7,
    // Chu Kì: mỗi lần Chuỗi Ngày đi hết 75 ngày thì Chu Kì +1,
    // ngày thứ 76 quay về ngày 1 và các mốc thưởng 5 → 75 nhận lại được.
    DAY_STREAK_CYCLE_DAYS: 75,
    // Mỗi ngày chỉ được đổi tối đa 120 phút giải trí (2 tiếng) từ Muffin thường.
    // (Phút thưởng từ chuỗi không tính vào giới hạn này.)
    FUN_CONVERT_MAX_MINUTES_PER_DAY: 120,
    // Mỗi ngày phải gửi đủ 5 Muffin vào Kho thì mới được đổi phút giải trí hôm đó.
    DAILY_KHO_MIN: 5,
    // Mục tiêu: thêm bao nhiêu mục mỗi ngày cũng được, lên kế hoạch được cho hôm nay và 6 ngày tới.
    GOAL_PLAN_DAYS: 7,
    // Thưởng mục tiêu: hoàn thành đủ 10 mục tiêu trong 1 ngày → +2 Muffin thường (mỗi ngày 1 lần).
    GOAL_BONUS_COUNT: 10,
    GOAL_BONUS_MUFFIN: 2,
    // Kho nhiệm vụ: tối đa 300 nhiệm vụ.
    TASK_BANK_MAX: 300,
    // Giữ tối đa bấy nhiêu bản ghi nhật ký (cũ hơn thì không hoàn tác được nữa).
    LOG_MAX: 3000,
  };

  const CATS = ['home', 'class', 'work', 'gym'];
  const CAT_LABEL = { home: 'Học ở nhà', class: 'Học trên lớp', work: 'Làm việc', gym: 'Tập gym' };
  const CAT_SHORT = { home: 'Ở nhà', class: 'Trên lớp', work: 'Làm việc', gym: 'Tập gym' };
  const SHOP_GROUPS = [
    { id: 'small', name: 'Giải trí nhỏ' },
    { id: 'shopping', name: 'Mua sắm' },
    { id: 'big', name: 'Trải nghiệm lớn' },
  ];
  const ITEM = {};
  RULES.SHOP.forEach((it) => { ITEM[it.id] = it; });
  const FUN_APP = {};
  RULES.FUN_APPS.forEach((a) => { FUN_APP[a.id] = a; });

  const SCHEMA_VERSION = 2;
  const DAY_MS = 86400000;

  /* ================================================================
   * Tiện ích
   * ================================================================ */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function ok(state, entry) { return { ok: true, state: state, entry: entry || null }; }
  function fail(error) { return { ok: false, error: error }; }
  function isNonNegInt(n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0; }

  // Ngày (YYYY-MM-DD) theo giờ Việt Nam từ mốc thời gian (ms)
  function dateKey(ms) {
    return new Date(ms + RULES.TZ_OFFSET_HOURS * 3600000).toISOString().slice(0, 10);
  }
  // Cộng/trừ ngày trên chuỗi YYYY-MM-DD
  function addDays(key, n) {
    return new Date(Date.parse(key + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
  }
  function daysBetween(a, b) { // b - a (số ngày)
    return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS);
  }

  /**
   * Kiểm tra ô nhập: chỉ nhận số nguyên dương.
   * opts: { max, maxMsg, allowZero }
   * Trả về { ok, value } hoặc { ok:false, error }
   */
  function parsePositiveInt(raw, opts) {
    opts = opts || {};
    const s = String(raw == null ? '' : raw).trim();
    if (s === '') return fail('Bạn chưa nhập số.');
    if (!/^\d+$/.test(s)) return fail('Chỉ nhập số nguyên dương (không dấu, không thập phân).');
    const v = parseInt(s, 10);
    if (!opts.allowZero && v <= 0) return fail('Số phải lớn hơn 0.');
    if (opts.max != null && v > opts.max) return fail(opts.maxMsg || ('Tối đa ' + opts.max + '.'));
    return { ok: true, value: v };
  }

  // deposited: Muffin đã gửi Kho trong ngày; conv: phút giải trí đã đổi trong ngày
  function emptyDay() { return { home: 0, class: 0, work: 0, gym: 0, earned: 0, spent: 0, deposited: 0, conv: 0, goalBonus: 0 }; }
  function ensureDay(s, key) {
    if (!s.days[key]) s.days[key] = emptyDay();
    return s.days[key];
  }
  function dayTotal(day) { return day ? CATS.reduce((t, c) => t + (day[c] || 0), 0) : 0; }
  function clampDown(obj, k, n) { obj[k] = Math.max(0, (obj[k] || 0) - n); }

  function emptyInventory() {
    const inv = {};
    RULES.SHOP.forEach((it) => { inv[it.id] = 0; });
    return inv;
  }

  /* ================================================================
   * State ban đầu
   * ================================================================ */
  function createInitialState(now) {
    now = now || Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      muffin: 0,       // Muffin thường
      kho: 0,          // Muffin trong Kho (chỉ dùng mua đồ)
      fun: 0,          // Quỹ Thời Gian Giải Trí (phút)
      // Phút cộng dồn của từng loại, dùng để quy đổi. Phút lẻ = acc % tỷ lệ (giữ lại, không mất).
      acc: { home: 0, class: 0, work: 0, gym: 0 },
      boxAcc: 0,       // (cũ, không còn dùng) phút ở nhà cộng dồn của luật hộp trước v1.4
      boxOpened: 0,    // Tổng số lần đã mở hộp (để thống kê). Ngày đã mở hộp: days[ngày].box = 1
      inventory: emptyInventory(),
      days: {},        // { 'YYYY-MM-DD': { home, class, work, gym, earned, spent, deposited, conv } }
      // anchor: { count, endDate } từ số dư ban đầu; cycleBase: số Chu Kì khai từ bản cũ
      dayStreak: { anchor: null, claims: [], cycleBase: 0 },
      habits: [],      // [{ id, name, createdAt, done: ['YYYY-MM-DD'], anchor, claims: [] }]
      goalDays: {},    // Mục tiêu theo ngày: { 'YYYY-MM-DD': [{ id, text, done }] }
      tasks: [],       // Kho nhiệm vụ: [{ id, text }]
      log: [],
      settings: { streakMin: RULES.STREAK_MIN_MINUTES, streakMinHist: [] },
      meta: { lastExport: null, setupDone: false, welcomeDismissed: false, lastFunApp: null },
    };
  }

  /* ================================================================
   * Migrate: nâng cấp dữ liệu cũ lên schema mới, điền giá trị thiếu
   * ================================================================ */
  function fillDefaults(target, defaults) {
    Object.keys(defaults).forEach((k) => {
      const d = defaults[k];
      if (target[k] === undefined || target[k] === null && d !== null) {
        target[k] = clone(d);
      } else if (d && typeof d === 'object' && !Array.isArray(d) && typeof target[k] === 'object' && !Array.isArray(target[k]) && target[k] !== null) {
        // chỉ điền sâu với object "cấu trúc" (không điền vào days vì days là map tự do)
        if (k !== 'days') fillDefaults(target[k], d);
      }
    });
    return target;
  }

  function migrate(raw, now) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Dữ liệu không hợp lệ.');
    const s = clone(raw);
    const v = s.schemaVersion || 0;
    if (v > SCHEMA_VERSION) throw new Error('Dữ liệu được tạo từ phiên bản app mới hơn.');
    // v1 -> v2: 10 ô mục tiêu cố định → mục tiêu theo ngày; thêm Kho nhiệm vụ; Chu Kì theo chuỗi 75 ngày.
    if (v < 2) {
      const g = s.goals;
      s.goalDays = s.goalDays || {};
      if (g && Array.isArray(g.items)) {
        const t = dateKey(now || Date.now());
        const items = g.items.filter((x) => x && x.text).map((x, i) => ({ id: 'm' + i + '_' + (now || 0), text: String(x.text), done: g.date === t ? !!x.done : false }));
        if (items.length) s.goalDays[t] = items;
      }
      delete s.goals;
      if (s.dayStreak && s.dayStreak.cycleBase == null) s.dayStreak.cycleBase = 0;
    }
    // Ngưỡng chuỗi trước bản 1.9.0 áp ngược cho mọi ngày cũ. Lần đầu mở bản mới: ngày trước hôm nay
    // dùng ngưỡng mặc định nếu ngưỡng hiện tại cao hơn (để đổi ngưỡng không làm gãy chuỗi đã có).
    if (!s.settings || typeof s.settings !== 'object' || Array.isArray(s.settings)) s.settings = {};
    if (!Array.isArray(s.settings.streakMinHist)) {
      s.settings.streakMinHist = [];
      const cur = s.settings.streakMin;
      if (Number.isInteger(cur) && cur > RULES.STREAK_MIN_MINUTES) {
        s.settings.streakMinHist.push({ until: addDays(dateKey(now || Date.now()), -1), min: RULES.STREAK_MIN_MINUTES });
      }
    }
    fillDefaults(s, createInitialState(now || s.createdAt || Date.now()));
    s.schemaVersion = SCHEMA_VERSION;
    // Bảo đảm kiểu dữ liệu tối thiểu
    ['muffin', 'kho', 'fun', 'boxAcc', 'boxOpened'].forEach((k) => {
      if (!isNonNegInt(s[k])) throw new Error('Trường "' + k + '" không hợp lệ.');
    });
    CATS.forEach((c) => { if (!isNonNegInt(s.acc[c])) throw new Error('Trường acc.' + c + ' không hợp lệ.'); });
    Object.keys(s.inventory).forEach((k) => { if (!isNonNegInt(s.inventory[k])) throw new Error('Túi đồ không hợp lệ.'); });
    if (!Array.isArray(s.log) || !Array.isArray(s.habits)) throw new Error('Nhật ký / thói quen không hợp lệ.');
    s.habits.forEach((h) => { fillDefaults(h, { done: [], anchor: null, claims: [] }); });
    if (!s.goalDays || typeof s.goalDays !== 'object' || Array.isArray(s.goalDays)) throw new Error('Mục tiêu không hợp lệ.');
    Object.keys(s.goalDays).forEach((d) => { if (!Array.isArray(s.goalDays[d])) throw new Error('Mục tiêu ngày ' + d + ' không hợp lệ.'); });
    if (!Array.isArray(s.tasks)) throw new Error('Kho nhiệm vụ không hợp lệ.');
    if (!isNonNegInt(s.dayStreak.cycleBase)) throw new Error('Chu Kì không hợp lệ.');
    return s;
  }

  /* ================================================================
   * Nhật ký
   * ================================================================ */
  function pushLog(s, entry) {
    s.log.push(entry);
    if (s.log.length > RULES.LOG_MAX) s.log.splice(0, s.log.length - RULES.LOG_MAX);
  }
  function baseEntry(type, ctx) {
    return { id: ctx.id || (String(ctx.now) + Math.random().toString(36).slice(2, 7)), t: ctx.now, date: dateKey(ctx.now), type: type };
  }

  /* ================================================================
   * HÀNH ĐỘNG
   * ================================================================ */

  // Ghi phút. Phút lẻ chưa đủ 1 Muffin được giữ trong acc để cộng dồn lần sau.
  function logMinutes(state, cat, minutes, ctx) {
    if (CATS.indexOf(cat) < 0) return fail('Loại không hợp lệ.');
    if (!Number.isInteger(minutes) || minutes <= 0) return fail('Số phút phải là số nguyên dương.');
    if (minutes > RULES.MAX_MINUTES_PER_ENTRY) return fail('Mỗi lần ghi tối đa ' + RULES.MAX_MINUTES_PER_ENTRY + ' phút.');
    const s = clone(state);
    const rate = RULES.MINUTES_PER_MUFFIN[cat];
    const before = s.acc[cat];
    const gained = Math.floor((before + minutes) / rate) - Math.floor(before / rate);
    s.acc[cat] = before + minutes;
    s.muffin += gained;
    const entry = baseEntry('log', ctx);
    const day = ensureDay(s, entry.date);
    let boxGained = 0;
    if (cat === 'home') {
      const per = RULES.BOX.HOME_MINUTES_PER_DAY;
      if (!day.box && day.home < per && day.home + minutes >= per) boxGained = 1;
    }
    day[cat] += minutes;
    day.earned += gained;
    entry.cat = cat; entry.minutes = minutes; entry.gained = gained; entry.boxGained = boxGained;
    pushLog(s, entry);
    return ok(s, entry);
  }

  // Gửi Muffin thường vào Kho (một chiều)
  function deposit(state, amount, ctx) {
    if (!Number.isInteger(amount) || amount <= 0) return fail('Số Muffin phải là số nguyên dương.');
    if (amount > state.muffin) return fail('Bạn chỉ có ' + state.muffin + ' Muffin thường.');
    const s = clone(state);
    s.muffin -= amount; s.kho += amount;
    const entry = baseEntry('deposit', ctx); entry.amount = amount;
    const day = ensureDay(s, entry.date);
    day.deposited = (day.deposited || 0) + amount;
    pushLog(s, entry);
    return ok(s, entry);
  }

  // Tình trạng đổi phút giải trí trong ngày: đã gửi Kho bao nhiêu, đã đổi bao nhiêu phút, còn đổi được bao nhiêu
  function funConvertInfo(state, today) {
    const day = state.days[today] || {};
    const deposited = day.deposited || 0;
    const converted = day.conv || 0;
    const maxMin = RULES.FUN_CONVERT_MAX_MINUTES_PER_DAY;
    const leftMin = Math.max(0, maxMin - converted);
    const per = RULES.FUN_MINUTES_PER_MUFFIN;
    return {
      deposited: deposited, needKho: RULES.DAILY_KHO_MIN, khoOk: deposited >= RULES.DAILY_KHO_MIN,
      converted: converted, maxMin: maxMin, leftMin: leftMin,
      maxMuffin: Math.min(state.muffin, Math.floor(leftMin / per)), // số Muffin còn đổi được hôm nay
    };
  }

  // Đổi Muffin thường → phút giải trí (Kho không dùng được ở đây)
  function convertFun(state, amount, ctx) {
    if (!Number.isInteger(amount) || amount <= 0) return fail('Số Muffin phải là số nguyên dương.');
    const info = funConvertInfo(state, dateKey(ctx.now));
    if (!info.khoOk) return fail('Hôm nay cần gửi đủ ' + info.needKho + ' Muffin vào Kho trước khi đổi phút (đã gửi ' + info.deposited + '/' + info.needKho + ').');
    if (amount > state.muffin) return fail('Bạn chỉ có ' + state.muffin + ' Muffin thường (Muffin trong Kho không đổi ra phút được).');
    const minutes = amount * RULES.FUN_MINUTES_PER_MUFFIN;
    if (minutes > info.leftMin) {
      return fail(info.leftMin <= 0
        ? 'Hôm nay đã đổi đủ ' + info.maxMin + ' phút giải trí. Mai đổi tiếp nhé.'
        : 'Mỗi ngày chỉ đổi tối đa ' + info.maxMin + ' phút. Hôm nay còn đổi được ' + info.leftMin + ' phút (' + Math.floor(info.leftMin / RULES.FUN_MINUTES_PER_MUFFIN) + ' Muffin).');
    }
    const s = clone(state);
    s.muffin -= amount; s.fun += minutes;
    const entry = baseEntry('convert', ctx); entry.amount = amount; entry.minutes = minutes;
    const day = ensureDay(s, entry.date);
    day.spent += amount;
    day.conv = (day.conv || 0) + minutes;
    pushLog(s, entry);
    return ok(s, entry);
  }

  // Xem trước khi mua: trừ Kho trước, thiếu thì trừ thêm Muffin thường
  function purchasePreview(state, itemId) {
    const it = ITEM[itemId];
    if (!it) return { can: false, fromKho: 0, fromMuffin: 0, short: 0 };
    const fromKho = Math.min(state.kho, it.price);
    const fromMuffin = it.price - fromKho;
    const short = Math.max(0, fromMuffin - state.muffin);
    return { can: short === 0, fromKho: fromKho, fromMuffin: fromMuffin, short: short, price: it.price };
  }

  function buyItem(state, itemId, ctx) {
    const it = ITEM[itemId];
    if (!it) return fail('Không có món này.');
    const p = purchasePreview(state, itemId);
    if (!p.can) return fail('Thiếu ' + p.short + ' Muffin để đổi "' + it.name + '".');
    const s = clone(state);
    s.kho -= p.fromKho; s.muffin -= p.fromMuffin;
    s.inventory[itemId] = (s.inventory[itemId] || 0) + 1;
    const entry = baseEntry('buy', ctx);
    entry.item = itemId; entry.fromKho = p.fromKho; entry.fromMuffin = p.fromMuffin;
    ensureDay(s, entry.date).spent += it.price;
    pushLog(s, entry);
    return ok(s, entry);
  }

  function useItem(state, itemId, ctx) {
    if (!ITEM[itemId]) return fail('Không có món này.');
    if (!(state.inventory[itemId] > 0)) return fail('Bạn không còn "' + ITEM[itemId].bagName + '".');
    const s = clone(state);
    s.inventory[itemId] -= 1;
    const entry = baseEntry('use', ctx); entry.item = itemId;
    pushLog(s, entry);
    return ok(s, entry);
  }

  // app: id trong RULES.FUN_APPS (bắt buộc). Phút đã tiêu theo mục lưu ở days[ngày].funUse = { app: phút }.
  function spendFun(state, minutes, ctx, app) {
    if (!Number.isInteger(minutes) || minutes <= 0) return fail('Số phút phải là số nguyên dương.');
    if (minutes > state.fun) return fail('Quỹ giải trí chỉ còn ' + state.fun + ' phút.');
    if (!FUN_APP[app]) return fail('Hãy chọn mục giải trí.');
    const lim = funAppLimit(state, dateKey(ctx.now), app);
    if (lim.locked) return fail(lim.name + ' hôm nay đã dùng hết ' + lim.limit + ' phút.');
    if (minutes > lim.left) return fail(lim.name + ' hôm nay chỉ còn ' + lim.left + ' phút.');
    const s = clone(state);
    s.fun -= minutes;
    const entry = baseEntry('spendFun', ctx); entry.minutes = minutes; entry.app = app;
    const day = ensureDay(s, entry.date);
    day.funUse = day.funUse || {};
    day.funUse[app] = (day.funUse[app] || 0) + minutes;
    s.meta.lastFunApp = app;
    pushLog(s, entry);
    return ok(s, entry);
  }

  // Giới hạn trong ngày của 1 mục: { id, name, limit, used, left, locked }
  function funAppLimit(state, date, app) {
    const a = FUN_APP[app];
    const used = ((((state.days[date] || {}).funUse) || {})[app]) || 0;
    const left = Math.max(0, a.limit - used);
    return { id: a.id, name: a.name, limit: a.limit, used: used, left: left, locked: left === 0 };
  }
  // Giới hạn trong ngày của mọi mục, theo thứ tự RULES.FUN_APPS
  function funLimits(state, date) { return RULES.FUN_APPS.map((a) => funAppLimit(state, date, a.id)); }
  // Phút giải trí đã tiêu trong ngày theo mục, xếp giảm dần: { total, list: [{ id, name, minutes, limit, left, locked }] }
  function funUseInfo(state, date) {
    const use = ((state.days[date] || {}).funUse) || {};
    const list = RULES.FUN_APPS.filter((a) => use[a.id] > 0).map((a) => {
      const l = funAppLimit(state, date, a.id);
      return { id: a.id, name: a.name, minutes: use[a.id], limit: l.limit, left: l.left, locked: l.locked };
    });
    list.sort((a, b) => b.minutes - a.minutes);
    return { total: list.reduce((n, x) => n + x.minutes, 0), list: list };
  }

  /* ---------- Hộp Huyền Thoại ---------- */
  // Hộp tính theo từng ngày: đủ HOME_MINUTES_PER_DAY phút ở nhà trong ngày `today` và chưa mở hôm đó.
  function boxInfo(state, today) {
    const per = RULES.BOX.HOME_MINUTES_PER_DAY;
    const day = state.days[today || dateKey(Date.now())] || {};
    const home = day.home || 0;
    const opened = !!day.box;
    const ready = home >= per && !opened;
    return { per: per, home: home, progress: Math.min(home, per), opened: opened, ready: ready, available: ready ? 1 : 0, left: Math.max(0, per - home) };
  }

  // Chọn phần thưởng theo weight với số ngẫu nhiên r ∈ [0,1)
  function pickBoxReward(r) {
    const list = RULES.BOX.REWARDS;
    const total = list.reduce((t, x) => t + x.weight, 0);
    let x = r * total;
    for (let i = 0; i < list.length; i++) {
      if (x < list[i].weight) return list[i].muffin;
      x -= list[i].weight;
    }
    return list[list.length - 1].muffin;
  }

  function openBox(state, ctx) {
    const today = dateKey(ctx.now);
    const bi = boxInfo(state, today);
    if (bi.opened) return fail('Hôm nay đã mở hộp rồi. Mai quay lại nhé.');
    if (!bi.ready) return fail('Học ở nhà đủ ' + bi.per + ' phút hôm nay mới mở được hộp (còn ' + bi.left + ' phút).');
    const s = clone(state);
    const reward = pickBoxReward(ctx.rand != null ? ctx.rand : Math.random());
    s.boxOpened += 1; s.muffin += reward;
    const entry = baseEntry('box', ctx); entry.reward = reward;
    const day = ensureDay(s, entry.date);
    day.earned += reward; day.box = 1;
    pushLog(s, entry);
    return ok(s, entry);
  }

  /* ---------- Chuỗi ---------- */
  // Đếm chuỗi liên tiếp kết thúc ở hôm nay (nếu hôm nay đã đạt) hoặc hôm qua.
  // Hôm nay chưa đạt thì chuỗi vẫn còn (chưa đứt) cho tới hết ngày.
  function countRun(qualified, today) {
    const todayDone = qualified(today);
    let d = todayDone ? today : addDays(today, -1);
    let count = 0;
    while (count < 100000 && qualified(d)) { count++; d = addDays(d, -1); }
    return { count: count, todayDone: todayDone, runStart: count > 0 ? addDays(d, 1) : null };
  }
  function anchorCovers(anchor, d) {
    if (!anchor || !(anchor.count > 0)) return false;
    const diff = daysBetween(d, anchor.endDate); // endDate - d
    return diff >= 0 && diff < anchor.count;
  }

  function streakMin(state) {
    const v = state.settings && state.settings.streakMin;
    return Number.isInteger(v) && v > 0 ? v : RULES.STREAK_MIN_MINUTES;
  }
  // Ngưỡng áp dụng cho ngày d: ngày nằm trong một mốc cũ thì dùng ngưỡng cũ, còn lại dùng ngưỡng hiện tại
  function streakMinFor(state, d) {
    const hist = state.settings && state.settings.streakMinHist;
    if (Array.isArray(hist)) {
      for (let i = 0; i < hist.length; i++) {
        const h = hist[i];
        if (h && d <= h.until && Number.isInteger(h.min) && h.min > 0) return h.min;
      }
    }
    return streakMin(state);
  }
  // Đổi ngưỡng Chuỗi ngày: áp dụng từ hôm nay, ngày trước đó giữ ngưỡng cũ
  function setStreakMin(state, min, today) {
    if (!Number.isInteger(min) || min <= 0 || min > 1440) return fail('Ngưỡng phải từ 1 đến 1440 phút.');
    const s = clone(state);
    if (!s.settings || typeof s.settings !== 'object') s.settings = {};
    const cur = streakMin(s);
    if (min === cur) return ok(s);
    const hist = Array.isArray(s.settings.streakMinHist) ? s.settings.streakMinHist : [];
    const until = addDays(today, -1);
    const last = hist[hist.length - 1];
    if (!last || last.until < until) hist.push({ until: until, min: cur });
    s.settings.streakMinHist = hist;
    s.settings.streakMin = min;
    return ok(s);
  }

  // Số Chu Kì đã hoàn thành trong lịch sử: mỗi đoạn chuỗi liên tiếp dài L ngày cho floor(L / 75) Chu Kì
  function completedCycles(state) {
    const N = RULES.DAY_STREAK_CYCLE_DAYS;
    const set = {};
    Object.keys(state.days).forEach((d) => { if (dayTotal(state.days[d]) >= streakMinFor(state, d)) set[d] = true; });
    const a = state.dayStreak && state.dayStreak.anchor;
    if (a && a.count > 0) for (let i = 0; i < a.count; i++) set[addDays(a.endDate, -i)] = true;
    const list = Object.keys(set).sort();
    let total = 0, len = 0, prev = null;
    list.forEach((d) => {
      len = prev && addDays(prev, 1) === d ? len + 1 : 1;
      if (len % N === 0) total++;
      prev = d;
    });
    return total;
  }

  /**
   * Chuỗi Ngày: ngày được tính khi tổng phút ghi nhận >= ngưỡng.
   * Chuỗi chạy theo Chu Kì 75 ngày: ngày 76 quay về ngày 1 của chu kì mới.
   * Trả về:
   *   count     ngày thứ mấy trong chu kì hiện tại (0..75), dùng cho mốc thưởng
   *   runStart  ngày bắt đầu chu kì hiện tại (mốc đã nhận gắn với ngày này)
   *   total     tổng số ngày liên tiếp (không chia chu kì)
   *   cycles    Chu Kì = số lần đã đi hết 75 ngày từ trước tới nay (cả bản cũ)
   */
  function computeDayStreak(state, today) {
    const N = RULES.DAY_STREAK_CYCLE_DAYS;
    const anchor = state.dayStreak && state.dayStreak.anchor;
    const r = countRun((d) => dayTotal(state.days[d]) >= streakMinFor(state, d) || anchorCovers(anchor, d), today);
    const idx = r.count > 0 ? Math.floor((r.count - 1) / N) : 0;
    return {
      count: r.count - idx * N,
      runStart: r.runStart ? addDays(r.runStart, idx * N) : null,
      total: r.count,
      fullRunStart: r.runStart,
      todayDone: r.todayDone,
      todayMinutes: dayTotal(state.days[today]),
      min: streakMinFor(state, today),
      cycles: ((state.dayStreak && state.dayStreak.cycleBase) || 0) + completedCycles(state),
    };
  }

  // Chuỗi Thói Quen của 1 thói quen
  function computeHabitStreak(habit, today) {
    const set = {};
    (habit.done || []).forEach((d) => { set[d] = true; });
    return countRun((d) => !!set[d] || anchorCovers(habit.anchor, d), today);
  }

  function claimKey(runStart, at) { return runStart + '|' + at; }

  // Trạng thái từng mốc: 'claimed' | 'ready' | 'locked'
  function milestoneStatus(list, streak, claims) {
    return list.map((m) => {
      const claimed = !!streak.runStart && claims.indexOf(claimKey(streak.runStart, m.at)) >= 0;
      return { at: m.at, reward: m.reward, status: claimed ? 'claimed' : (streak.count >= m.at ? 'ready' : 'locked') };
    });
  }

  // Trao phần thưởng: phút → Quỹ giải trí, món → Túi Đồ
  function grantReward(s, reward, choice) {
    if (reward.fun) { s.fun += reward.fun; return { fun: reward.fun }; }
    let item = reward.item;
    if (reward.choice) {
      if (reward.choice.indexOf(choice) < 0) return null;
      item = choice;
    }
    s.inventory[item] = (s.inventory[item] || 0) + 1;
    return { item: item };
  }

  function claimDayMilestone(state, at, today, ctx) {
    const m = RULES.DAY_STREAK_REWARDS.find((x) => x.at === at);
    if (!m) return fail('Không có mốc này.');
    const st = computeDayStreak(state, today);
    if (st.count < at) return fail('Chưa đạt mốc ' + at + ' ngày (đang ' + st.count + ').');
    const key = claimKey(st.runStart, at);
    if (state.dayStreak.claims.indexOf(key) >= 0) return fail('Mốc này đã nhận trong lượt chuỗi hiện tại.');
    const s = clone(state);
    const got = grantReward(s, m.reward);
    s.dayStreak.claims.push(key);
    const entry = baseEntry('claimDay', ctx);
    entry.at = at; entry.key = key; entry.got = got;
    pushLog(s, entry);
    return ok(s, entry);
  }

  function claimHabitMilestone(state, habitId, at, choice, today, ctx) {
    const hi = state.habits.findIndex((h) => h.id === habitId);
    if (hi < 0) return fail('Không tìm thấy thói quen.');
    const m = RULES.HABIT_STREAK_REWARDS.find((x) => x.at === at);
    if (!m) return fail('Không có mốc này.');
    const st = computeHabitStreak(state.habits[hi], today);
    if (st.count < at) return fail('Chưa đạt mốc ' + at + ' ngày (đang ' + st.count + ').');
    const key = claimKey(st.runStart, at);
    if (state.habits[hi].claims.indexOf(key) >= 0) return fail('Mốc này đã nhận trong lượt chuỗi hiện tại.');
    if (m.reward.choice && m.reward.choice.indexOf(choice) < 0) return fail('Hãy chọn 1 phần thưởng.');
    const s = clone(state);
    const got = grantReward(s, m.reward, choice);
    s.habits[hi].claims.push(key);
    const entry = baseEntry('claimHabit', ctx);
    entry.habitId = habitId; entry.habitName = s.habits[hi].name; entry.at = at; entry.key = key; entry.got = got;
    pushLog(s, entry);
    return ok(s, entry);
  }

  /* ---------- Thói quen ---------- */
  function addHabit(state, name, ctx) {
    const n = String(name || '').trim();
    if (!n) return fail('Hãy nhập tên thói quen.');
    if (n.length > 60) return fail('Tên thói quen tối đa 60 ký tự.');
    const s = clone(state);
    s.habits.push({ id: ctx.id || ('h' + ctx.now), name: n, createdAt: ctx.now, done: [], anchor: null, claims: [] });
    return ok(s);
  }
  function renameHabit(state, habitId, name) {
    const n = String(name || '').trim();
    if (!n) return fail('Tên không được để trống.');
    const s = clone(state);
    const h = s.habits.find((x) => x.id === habitId);
    if (!h) return fail('Không tìm thấy thói quen.');
    h.name = n.slice(0, 60);
    return ok(s);
  }
  function removeHabit(state, habitId) {
    const s = clone(state);
    const before = s.habits.length;
    s.habits = s.habits.filter((h) => h.id !== habitId);
    if (s.habits.length === before) return fail('Không tìm thấy thói quen.');
    return ok(s);
  }
  // Tick / bỏ tick một ngày (chỉ cho hôm nay và hôm qua)
  function toggleHabitDay(state, habitId, day, today) {
    if (day !== today && day !== addDays(today, -1)) return fail('Chỉ tick được hôm nay hoặc hôm qua.');
    const s = clone(state);
    const h = s.habits.find((x) => x.id === habitId);
    if (!h) return fail('Không tìm thấy thói quen.');
    const i = h.done.indexOf(day);
    if (i >= 0) h.done.splice(i, 1); else h.done.push(day);
    // giữ gọn: chỉ lưu 400 ngày gần nhất
    h.done.sort();
    if (h.done.length > 400) h.done = h.done.slice(-400);
    return ok(s);
  }

  /* ---------- Mục tiêu theo ngày ---------- */
  // Mỗi ngày có danh sách mục tiêu riêng (không giới hạn số mục). Sang ngày mới là danh sách mới, tick cũ không mang theo.
  // Hoàn thành đủ 10 mục tiêu trong ngày → tự cộng 2 Muffin thường; bỏ tick xuống dưới 10 thì trừ lại.
  // Sửa được mục tiêu của hôm nay và 6 ngày tới; chỉ tick được mục tiêu của hôm nay.
  function goalsOf(state, date) { return (state.goalDays && state.goalDays[date]) || []; }
  function planDates(today) {
    const out = [];
    for (let i = 0; i < RULES.GOAL_PLAN_DAYS; i++) out.push(addDays(today, i));
    return out;
  }
  function checkPlanDate(date, today) {
    const diff = daysBetween(today, date);
    if (diff < 0) return 'Không sửa được mục tiêu của ngày đã qua.';
    if (diff >= RULES.GOAL_PLAN_DAYS) return 'Chỉ lên kế hoạch được tới ' + (RULES.GOAL_PLAN_DAYS - 1) + ' ngày tới.';
    return null;
  }
  function cleanText(text, max) { return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max || 80); }
  function sameText(a, b) { return a.toLowerCase() === b.toLowerCase(); }

  // Thêm nhiều mục tiêu vào 1 ngày (bỏ qua mục trùng tên đã có trong ngày đó)
  function addGoals(state, date, texts, today, ctx) {
    const err = checkPlanDate(date, today);
    if (err) return fail(err);
    const s = clone(state);
    const list = s.goalDays[date] ? s.goalDays[date] : (s.goalDays[date] = []);
    let added = 0, dup = 0;
    (Array.isArray(texts) ? texts : [texts]).forEach((raw, i) => {
      const t = cleanText(raw);
      if (!t) return;
      if (list.some((g) => sameText(g.text, t))) { dup++; return; }
      list.push({ id: (ctx.id || ('g' + ctx.now)) + '_' + i, text: t, done: false });
      added++;
    });
    if (!list.length) delete s.goalDays[date];
    if (!added) return fail(dup ? 'Mục tiêu này đã có trong ngày.' : 'Hãy nhập tên mục tiêu.');
    const r = ok(s);
    r.added = added; r.dup = dup;
    return r;
  }
  function editGoal(state, date, goalId, text, today) {
    const err = checkPlanDate(date, today);
    if (err) return fail(err);
    const s = clone(state);
    const list = s.goalDays[date] || [];
    const g = list.find((x) => x.id === goalId);
    if (!g) return fail('Không tìm thấy mục tiêu.');
    const t = cleanText(text);
    if (!t) return removeGoal(state, date, goalId, today);
    g.text = t;
    return ok(s);
  }
  function removeGoal(state, date, goalId, today) {
    const err = checkPlanDate(date, today);
    if (err) return fail(err);
    const s = clone(state);
    const list = s.goalDays[date] || [];
    const i = list.findIndex((x) => x.id === goalId);
    if (i < 0) return fail('Không tìm thấy mục tiêu.');
    list.splice(i, 1);
    if (!list.length) delete s.goalDays[date];
    const b = settleGoalBonus(s, date, null);
    if (b.error) return fail(b.error);
    return ok(s);
  }
  function toggleGoal(state, date, goalId, today, ctx) {
    if (date !== today) return fail('Chỉ tick được mục tiêu của hôm nay.');
    const s = clone(state);
    const g = (s.goalDays[date] || []).find((x) => x.id === goalId);
    if (!g) return fail('Không tìm thấy mục tiêu.');
    g.done = !g.done;
    const b = settleGoalBonus(s, date, ctx);
    if (b.error) return fail(b.error);
    const r = ok(s, b.entry);
    r.bonus = b.entry ? b.entry.amount : b.removed ? -b.removed : 0;
    return r;
  }
  // Thông tin thưởng mục tiêu của 1 ngày
  function goalBonusInfo(state, date) {
    const done = goalsOf(state, date).filter((g) => g.done).length;
    const got = (state.days[date] && state.days[date].goalBonus) || 0;
    return { done: done, need: RULES.GOAL_BONUS_COUNT, reward: RULES.GOAL_BONUS_MUFFIN, got: got };
  }
  // Đủ 10 mục hoàn thành → cộng thưởng (1 lần/ngày). Xuống dưới 10 → trừ lại và bỏ bản ghi thưởng.
  function settleGoalBonus(s, date, ctx) {
    const info = goalBonusInfo(s, date);
    if (info.done >= info.need && !info.got && ctx) {
      const amount = RULES.GOAL_BONUS_MUFFIN;
      const day = ensureDay(s, date);
      s.muffin += amount; day.earned += amount; day.goalBonus = amount;
      const entry = baseEntry('goalBonus', ctx); entry.date = date; entry.amount = amount;
      pushLog(s, entry);
      return { entry: entry };
    }
    if (info.done < info.need && info.got) {
      if (s.muffin < info.got) return { error: 'Thưởng ' + info.got + ' Muffin của mục tiêu hôm nay đã được tiêu, không bỏ tick được.' };
      const day = ensureDay(s, date);
      s.muffin -= info.got; clampDown(day, 'earned', info.got); day.goalBonus = 0;
      for (let i = s.log.length - 1; i >= 0; i--) {
        if (s.log[i].type === 'goalBonus' && s.log[i].date === date) { s.log.splice(i, 1); break; }
      }
      return { removed: info.got };
    }
    return {};
  }
  // Chép tên các mục tiêu từ một ngày sang ngày khác (không chép dấu tick)
  function copyGoals(state, fromDate, toDate, today, ctx) {
    const texts = goalsOf(state, fromDate).map((g) => g.text);
    if (!texts.length) return fail('Ngày đó không có mục tiêu để chép.');
    return addGoals(state, toDate, texts, today, ctx);
  }
  // Dọn mục tiêu cũ hơn 60 ngày cho gọn bộ nhớ
  function pruneGoalDays(state, today) {
    const old = Object.keys(state.goalDays || {}).filter((d) => daysBetween(d, today) > 60);
    if (!old.length) return state;
    const s = clone(state);
    old.forEach((d) => { delete s.goalDays[d]; });
    return s;
  }

  /* ---------- Kho nhiệm vụ ---------- */
  // Thêm nhiều nhiệm vụ một lúc (mỗi dòng 1 nhiệm vụ), bỏ dòng trống và dòng trùng
  function addTasks(state, texts, ctx) {
    const s = clone(state);
    let added = 0, dup = 0;
    const lines = Array.isArray(texts) ? texts : String(texts || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const t = cleanText(lines[i]);
      if (!t) continue;
      if (s.tasks.some((x) => sameText(x.text, t))) { dup++; continue; }
      if (s.tasks.length >= RULES.TASK_BANK_MAX) return fail('Kho nhiệm vụ tối đa ' + RULES.TASK_BANK_MAX + ' mục.');
      s.tasks.push({ id: (ctx.id || ('t' + ctx.now)) + '_' + i, text: t });
      added++;
    }
    if (!added) return fail(dup ? 'Các nhiệm vụ này đã có trong kho.' : 'Hãy nhập ít nhất 1 nhiệm vụ.');
    const r = ok(s);
    r.added = added; r.dup = dup;
    return r;
  }
  function editTask(state, taskId, text) {
    const t = cleanText(text);
    if (!t) return fail('Tên nhiệm vụ không được để trống.');
    const s = clone(state);
    const x = s.tasks.find((k) => k.id === taskId);
    if (!x) return fail('Không tìm thấy nhiệm vụ.');
    if (s.tasks.some((k) => k.id !== taskId && sameText(k.text, t))) return fail('Kho đã có nhiệm vụ này.');
    x.text = t;
    return ok(s);
  }
  function removeTask(state, taskId) {
    const s = clone(state);
    const n = s.tasks.length;
    s.tasks = s.tasks.filter((k) => k.id !== taskId);
    if (s.tasks.length === n) return fail('Không tìm thấy nhiệm vụ.');
    return ok(s);
  }
  // Đưa nhiệm vụ từ Kho vào mục tiêu của một ngày (nhiệm vụ vẫn ở lại trong Kho để dùng lại)
  function addTasksToDay(state, taskIds, date, today, ctx) {
    const texts = taskIds.map((id) => (state.tasks.find((k) => k.id === id) || {}).text).filter(Boolean);
    if (!texts.length) return fail('Hãy chọn ít nhất 1 nhiệm vụ.');
    return addGoals(state, date, texts, today, ctx);
  }

  /* ================================================================
   * HOÀN TÁC / XÓA BẢN GHI: tự cộng hoặc trừ lại điểm
   * ================================================================ */
  function revertOn(s, e) {
    switch (e.type) {
      case 'log': {
        const rate = RULES.MINUTES_PER_MUFFIN[e.cat];
        const acc = s.acc[e.cat];
        const newAcc = Math.max(0, acc - e.minutes);
        const loss = Math.floor(acc / rate) - Math.floor(newAcc / rate);
        if (s.muffin < loss) return 'Cần trừ lại ' + loss + ' Muffin thường nhưng chỉ còn ' + s.muffin + ' (đã tiêu hoặc gửi Kho).';
        const day = ensureDay(s, e.date);
        if (e.cat === 'home' && day.box && (day.home || 0) - e.minutes < RULES.BOX.HOME_MINUTES_PER_DAY) return 'Số phút này đã dùng để mở Hộp Huyền Thoại. Hãy hoàn tác lần mở hộp trước.';
        s.acc[e.cat] = newAcc;
        s.muffin -= loss;
        clampDown(day, e.cat, e.minutes);
        clampDown(day, 'earned', loss);
        return null;
      }
      case 'deposit':
        if (s.kho < e.amount) return 'Kho chỉ còn ' + s.kho + ' Muffin, không đủ để rút lại ' + e.amount + '.';
        s.kho -= e.amount; s.muffin += e.amount;
        clampDown(ensureDay(s, e.date), 'deposited', e.amount);
        return null;
      case 'convert': {
        if (s.fun < e.minutes) return 'Quỹ giải trí chỉ còn ' + s.fun + ' phút, không đủ trừ lại ' + e.minutes + ' phút.';
        s.fun -= e.minutes; s.muffin += e.amount;
        const day = ensureDay(s, e.date);
        clampDown(day, 'spent', e.amount);
        clampDown(day, 'conv', e.minutes);
        return null;
      }
      case 'buy':
        if (!(s.inventory[e.item] > 0)) return 'Món "' + ITEM[e.item].bagName + '" đã được dùng, không hoàn tác được.';
        s.inventory[e.item] -= 1; s.kho += e.fromKho; s.muffin += e.fromMuffin;
        clampDown(ensureDay(s, e.date), 'spent', e.fromKho + e.fromMuffin);
        return null;
      case 'use':
        s.inventory[e.item] = (s.inventory[e.item] || 0) + 1;
        return null;
      case 'spendFun': {
        s.fun += e.minutes;
        const use = e.app && (ensureDay(s, e.date).funUse || null);
        if (use && use[e.app]) { use[e.app] = Math.max(0, use[e.app] - e.minutes); if (!use[e.app]) delete use[e.app]; }
        return null;
      }
      case 'box':
        if (s.muffin < e.reward) return 'Cần trừ lại ' + e.reward + ' Muffin thường nhưng chỉ còn ' + s.muffin + '.';
        s.muffin -= e.reward; s.boxOpened = Math.max(0, s.boxOpened - 1);
        clampDown(ensureDay(s, e.date), 'earned', e.reward);
        ensureDay(s, e.date).box = 0;
        return null;
      case 'goalBonus': {
        if (s.muffin < e.amount) return 'Cần trừ lại ' + e.amount + ' Muffin thường nhưng chỉ còn ' + s.muffin + '.';
        const day = ensureDay(s, e.date);
        s.muffin -= e.amount; clampDown(day, 'earned', e.amount); day.goalBonus = 0;
        return null;
      }
      case 'claimDay':
      case 'claimHabit': {
        if (e.got.fun) {
          if (s.fun < e.got.fun) return 'Quỹ giải trí chỉ còn ' + s.fun + ' phút, không đủ trừ lại ' + e.got.fun + ' phút.';
          s.fun -= e.got.fun;
        } else {
          if (!(s.inventory[e.got.item] > 0)) return 'Món thưởng đã được dùng, không hoàn tác được.';
          s.inventory[e.got.item] -= 1;
        }
        const list = e.type === 'claimDay' ? s.dayStreak.claims : ((s.habits.find((h) => h.id === e.habitId) || {}).claims || []);
        const i = list.indexOf(e.key);
        if (i >= 0) list.splice(i, 1);
        return null;
      }
      default:
        return 'Không hoàn tác được loại bản ghi này.';
    }
  }

  // Xóa (hoàn tác) một bản ghi bất kỳ theo id
  function deleteEntry(state, entryId) {
    const idx = state.log.findIndex((e) => e.id === entryId);
    if (idx < 0) return fail('Không tìm thấy bản ghi.');
    const s = clone(state);
    const e = s.log[idx];
    const err = revertOn(s, e);
    if (err) return fail(err);
    s.log.splice(idx, 1);
    return ok(s, e);
  }
  // Hoàn tác hành động gần nhất
  function undoLast(state) {
    if (!state.log.length) return fail('Chưa có hành động nào để hoàn tác.');
    return deleteEntry(state, state.log[state.log.length - 1].id);
  }

  /* ================================================================
   * Mô tả bản ghi (hiển thị trong Nhật ký)
   * ================================================================ */
  function rewardText(r) {
    if (!r) return '';
    if (r.fun) return r.fun + ' phút giải trí';
    if (r.item) return ITEM[r.item].name;
    if (r.choice) return r.choice.map((id) => ITEM[id].name).join(' HOẶC ');
    return '';
  }
  function describeEntry(e) {
    switch (e.type) {
      case 'log': return 'Ghi ' + e.minutes + ' phút ' + CAT_LABEL[e.cat] + ' → +' + e.gained + ' 🧁' + (e.boxGained ? ' · mở được hộp' : '');
      case 'deposit': return 'Gửi ' + e.amount + ' Muffin vào Kho';
      case 'convert': return 'Đổi ' + e.amount + ' Muffin → ' + e.minutes + ' phút giải trí';
      case 'buy': return 'Đổi "' + ITEM[e.item].name + '" (Kho -' + e.fromKho + ', Thường -' + e.fromMuffin + ')';
      case 'use': return 'Dùng "' + ITEM[e.item].bagName + '"';
      case 'spendFun': return 'Tiêu ' + e.minutes + ' phút giải trí' + (FUN_APP[e.app] ? ' · ' + FUN_APP[e.app].name : '');
      case 'box': return 'Mở Hộp Huyền Thoại → +' + e.reward + ' 🧁';
      case 'goalBonus': return 'Hoàn thành ' + RULES.GOAL_BONUS_COUNT + ' mục tiêu trong ngày → +' + e.amount + ' 🧁';
      case 'claimDay': return 'Nhận thưởng Chuỗi Ngày mốc ' + e.at + ': ' + rewardText(e.got);
      case 'claimHabit': return 'Nhận thưởng Chuỗi Thói Quen "' + e.habitName + '" mốc ' + e.at + ': ' + rewardText(e.got);
      default: return e.type;
    }
  }

  /* ================================================================
   * Số dư ban đầu (chuyển từ bản cũ)
   * input: { muffin, kho, fun, cycles (Chu Kì = số lần đi hết 75 ngày), rem:{home,class,work,gym},
   *          dayStreak, dayIncludesToday, dayClaimedUpTo, inventory:{id:n},
   *          habits: { [id]: { streak, includesToday, claimedUpTo } } }
   * Ghi đè số dư, xóa nhật ký hoàn tác (vì số dư đã thay mới).
   * ================================================================ */
  function applySetup(state, input, today) {
    const n = (v) => (v === undefined || v === null || v === '' ? 0 : v);
    const fields = ['muffin', 'kho', 'fun', 'cycles', 'dayStreak', 'dayClaimedUpTo'];
    for (const f of fields) if (!isNonNegInt(n(input[f]))) return fail('Ô "' + f + '" phải là số nguyên ≥ 0.');
    const N = RULES.DAY_STREAK_CYCLE_DAYS;
    if (n(input.dayStreak) > N) return fail('Ngày trong chu kì chỉ từ 0 đến ' + N + '.');
    const s = clone(state);
    s.muffin = n(input.muffin); s.kho = n(input.kho); s.fun = n(input.fun);
    const rem = input.rem || {};
    for (const c of CATS) {
      const r = n(rem[c]);
      if (!isNonNegInt(r) || r >= RULES.MINUTES_PER_MUFFIN[c]) return fail('Phút lẻ "' + CAT_LABEL[c] + '" phải từ 0 đến ' + (RULES.MINUTES_PER_MUFFIN[c] - 1) + '.');
      s.acc[c] = r;
    }
    const inv = input.inventory || {};
    for (const it of RULES.SHOP) {
      const v = n(inv[it.id]);
      if (!isNonNegInt(v)) return fail('Số lượng "' + it.bagName + '" không hợp lệ.');
      s.inventory[it.id] = v;
    }
    // Chuỗi ngày
    const ds = n(input.dayStreak);
    // Chu Kì khai báo; nếu đang đúng ngày 75 thì chu kì đó sẽ tự được đếm nên trừ ra để không đếm 2 lần
    s.dayStreak = {
      anchor: ds > 0 ? { count: ds, endDate: input.dayIncludesToday ? today : addDays(today, -1) } : null,
      claims: [],
      cycleBase: 0,
    };
    s.dayStreak.cycleBase = Math.max(0, n(input.cycles) - completedCycles(s));
    if (ds > 0) {
      const st = computeDayStreak(s, today);
      RULES.DAY_STREAK_REWARDS.forEach((m) => {
        if (m.at <= n(input.dayClaimedUpTo) && m.at <= st.count) s.dayStreak.claims.push(claimKey(st.runStart, m.at));
      });
    }
    // Chuỗi thói quen
    const hin = input.habits || {};
    for (const h of s.habits) {
      const x = hin[h.id];
      if (!x) continue;
      const hs = n(x.streak);
      if (!isNonNegInt(hs) || !isNonNegInt(n(x.claimedUpTo))) return fail('Chuỗi thói quen "' + h.name + '" không hợp lệ.');
      h.anchor = hs > 0 ? { count: hs, endDate: x.includesToday ? today : addDays(today, -1) } : null;
      h.claims = [];
      if (hs > 0) {
        const st = computeHabitStreak(h, today);
        RULES.HABIT_STREAK_REWARDS.forEach((m) => {
          if (m.at <= n(x.claimedUpTo) && m.at <= st.count) h.claims.push(claimKey(st.runStart, m.at));
        });
      }
    }
    s.log = [];
    s.meta.setupDone = true;
    s.meta.welcomeDismissed = true;
    return ok(s);
  }

  /* ================================================================
   * Xuất / Nhập JSON
   * ================================================================ */
  function exportData(state, now) {
    return JSON.stringify({ app: 'muffin-study-game', schemaVersion: SCHEMA_VERSION, exportedAt: new Date(now).toISOString(), state: state }, null, 2);
  }
  function importData(text, now) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { return fail('File không phải JSON hợp lệ.'); }
    if (!obj || obj.app !== 'muffin-study-game' || !obj.state) return fail('File này không phải bản sao lưu của Muffin.');
    try { return ok(migrate(obj.state, now)); } catch (e) { return fail('Dữ liệu lỗi: ' + e.message); }
  }

  /* ================================================================
   * Thống kê
   * ================================================================ */
  function statsRange(state, today, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const day = state.days[d] || emptyDay();
      out.push({ date: d, home: day.home, class: day.class, work: day.work, gym: day.gym, earned: day.earned, spent: day.spent, total: dayTotal(day) });
    }
    return out;
  }
  // Thống kê giải trí n ngày gần nhất (tính cả hôm nay):
  // { days:[{ date, use:{app:phút}, total }], per:{app:phút}, list:[{id,name,minutes}] giảm dần, fun, study, avg }
  function funStatsRange(state, today, n) {
    const days = [], per = {};
    let fun = 0, study = 0;
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const day = state.days[d] || emptyDay();
      const use = {};
      let total = 0;
      Object.keys(day.funUse || {}).forEach((a) => {
        const v = day.funUse[a] || 0;
        if (!FUN_APP[a] || v <= 0) return;
        use[a] = v; total += v; per[a] = (per[a] || 0) + v;
      });
      fun += total; study += dayTotal(day);
      days.push({ date: d, use: use, total: total });
    }
    const list = RULES.FUN_APPS.filter((a) => per[a.id] > 0).map((a) => ({ id: a.id, name: a.name, minutes: per[a.id] }));
    list.sort((a, b) => b.minutes - a.minutes);
    return { days: days, per: per, list: list, fun: fun, study: study, avg: Math.round(fun / n) };
  }
  function statsAllTime(state) {
    let earned = 0, spent = 0;
    Object.keys(state.days).forEach((k) => { earned += state.days[k].earned || 0; spent += state.days[k].spent || 0; });
    return { earned: earned, spent: spent };
  }

  function needsBackupReminder(state, now) {
    const last = state.meta.lastExport || state.createdAt;
    return now - last > RULES.BACKUP_REMIND_DAYS * DAY_MS;
  }

  return {
    RULES, CATS, CAT_LABEL, CAT_SHORT, SHOP_GROUPS, ITEM, SCHEMA_VERSION,
    dateKey, addDays, daysBetween, parsePositiveInt, dayTotal,
    createInitialState, migrate,
    logMinutes, deposit, convertFun, purchasePreview, buyItem, useItem, spendFun, funUseInfo,
    boxInfo, pickBoxReward, openBox,
    computeDayStreak, computeHabitStreak, milestoneStatus, claimDayMilestone, claimHabitMilestone,
    addHabit, renameHabit, removeHabit, toggleHabitDay, funConvertInfo,
    goalsOf, planDates, addGoals, editGoal, removeGoal, toggleGoal, goalBonusInfo, copyGoals, pruneGoalDays,
    addTasks, editTask, removeTask, addTasksToDay,
    deleteEntry, undoLast, describeEntry, rewardText,
    applySetup, exportData, importData, statsRange, funStatsRange, setStreakMin, streakMinFor, funLimits, funAppLimit, statsAllTime, needsBackupReminder,
  };
});
