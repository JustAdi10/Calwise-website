/* Calwise — home page interactions.
   Every demo here runs in the browser on a small table of sample foods.
   Nothing is sent anywhere. Without JavaScript, each section shows a finished static state. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtG(n) { return n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10); }
  function fmtQty(q) {
    var whole = Math.floor(q + 1e-9);
    var frac = Math.round((q - whole) * 100) / 100;
    var map = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
    if (frac === 0) return String(whole);
    if (map[frac]) return (whole ? whole : '') + map[frac];
    return String(Math.round(q * 10) / 10);
  }

  /* Animate a number in an element. */
  function tween(el, to, opts) {
    opts = opts || {};
    var fmt = opts.format || fmtInt;
    var from = parseFloat(el.getAttribute('data-value'));
    if (isNaN(from)) from = parseFloat(String(el.textContent).replace(/[^\d.]/g, '')) || 0;
    el.setAttribute('data-value', String(to));
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var dur = opts.duration || 700;
    var start = null;
    if (el._raf) cancelAnimationFrame(el._raf);
    function step(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (t < 1) el._raf = requestAnimationFrame(step);
    }
    el._raf = requestAnimationFrame(step);
  }

  function onVisible(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting, e); });
    }, opts || { threshold: 0.25 });
    io.observe(el);
    return io;
  }

  /* ════════════════════════════════════════════════════════════════════════
     1. Hinglish logger
     ════════════════════════════════════════════════════════════════════════ */
  var FOODS = [
    { label: 'Roti', names: ['roti', 'rotis', 'chapati', 'chapatis', 'chapathi', 'phulka', 'phulkas', 'रोटी'], unit: ['roti', 'roti'], g: 40, kcal: 120, p: 3, c: 18, f: 3.7 },
    { label: 'Dal tadka', names: ['dal tadka', 'tadka dal', 'dal fry', 'daal', 'dal', 'दाल'], unit: ['katori', 'katori'], g: 150, kcal: 165, p: 8.3, c: 21, f: 5.3 },
    { label: 'Chawal', names: ['steamed rice', 'chawal', 'chaawal', 'rice', 'चावल'], unit: ['katori', 'katori'], g: 150, kcal: 195, p: 4, c: 42, f: 0.5 },
    { label: 'Dahi', names: ['dahi', 'curd', 'yogurt', 'yoghurt', 'दही'], unit: ['katori', 'katori'], g: 150, kcal: 90, p: 5.2, c: 7, f: 4.8 },
    { label: 'Poha', names: ['poha', 'पोहा'], unit: ['plate', 'plates'], g: 150, kcal: 270, p: 5, c: 45, f: 8 },
    { label: 'Chai', names: ['masala chai', 'chai', 'tea', 'चाय'], unit: ['cup', 'cups'], g: 150, gu: 'ml', kcal: 95, p: 3, c: 13, f: 3.5 },
    { label: 'Idli', names: ['idli', 'idlis', 'idly'], unit: ['idli', 'idli'], g: 40, kcal: 58, p: 2, c: 12, f: 0.2 },
    { label: 'Sambar', names: ['sambar', 'sambhar'], unit: ['katori', 'katori'], g: 150, kcal: 110, p: 5, c: 15, f: 3.5 },
    { label: 'Masala dosa', names: ['masala dosa', 'dosa', 'dosas'], unit: ['dosa', 'dosa'], g: 180, kcal: 390, p: 8, c: 52, f: 16 },
    { label: 'Aloo paratha', names: ['aloo paratha', 'paratha', 'parathas', 'parantha'], unit: ['paratha', 'paratha'], g: 120, kcal: 290, p: 6, c: 40, f: 12 },
    { label: 'Rajma', names: ['rajma'], unit: ['katori', 'katori'], g: 150, kcal: 210, p: 10, c: 27, f: 6.8 },
    { label: 'Paneer bhurji', names: ['paneer bhurji', 'paneer'], unit: ['katori', 'katori'], g: 150, kcal: 240, p: 14, c: 6, f: 18 },
    { label: 'Boiled egg', names: ['boiled egg', 'boiled eggs', 'eggs', 'egg', 'ande', 'anda'], unit: ['egg', 'eggs'], g: 50, kcal: 78, p: 6.3, c: 0.6, f: 5.3 },
    { label: 'Banana', names: ['bananas', 'banana', 'kela', 'kele'], unit: ['banana', 'bananas'], g: 120, kcal: 105, p: 1.3, c: 27, f: 0.4 },
    { label: 'Samosa', names: ['samosas', 'samosa'], unit: ['samosa', 'samosas'], g: 70, kcal: 210, p: 4, c: 24, f: 11 },
    { label: 'Sabzi', names: ['aloo gobi', 'bhindi', 'sabzi', 'sabji', 'subzi'], unit: ['katori', 'katori'], g: 150, kcal: 150, p: 3.5, c: 14, f: 9 },
    { label: 'Khichdi', names: ['khichdi', 'khichri'], unit: ['katori', 'katori'], g: 150, kcal: 180, p: 6.5, c: 30, f: 4 },
    { label: 'Upma', names: ['upma'], unit: ['plate', 'plates'], g: 150, kcal: 250, p: 6, c: 36, f: 9 },
    { label: 'Salad', names: ['salad'], unit: ['plate', 'plates'], g: 100, kcal: 35, p: 1.5, c: 7, f: 0.3 }
  ];
  var NUMBER_WORDS = {
    a: 1, an: 1, ek: 1, one: 1, do: 2, two: 2, teen: 3, three: 3, char: 4, chaar: 4, four: 4,
    paanch: 5, panch: 5, five: 5, aadha: 0.5, aadhi: 0.5, half: 0.5, dedh: 1.5, dhai: 2.5, dhaai: 2.5,
    thoda: 0.5, thodi: 0.5, thora: 0.5
  };
  var UNIT_WORDS = {
    katori: 'serving', katoris: 'serving', bowl: 'serving', bowls: 'serving', plate: 'serving', plates: 'serving',
    cup: 'serving', cups: 'serving', glass: 'serving', glasses: 'serving', piece: 'serving', pieces: 'serving',
    g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g', ml: 'g'
  };
  var FILLERS = ['sa', 'si', 'ki', 'ka', 'ke', 'of', 'some', 'mein', 'me', 'bhi', 'had', 'ate', 'khaya', 'khayi',
    'for', 'lunch', 'dinner', 'breakfast', 'i', 'my', 'the', 'saath', 'wala', 'wali', 'just', 'aur'];

  // Every alias, longest first, so "dal tadka" beats "dal".
  var ALIASES = [];
  FOODS.forEach(function (food) {
    food.names.forEach(function (n) { ALIASES.push({ name: n, food: food }); });
  });
  ALIASES.sort(function (a, b) { return b.name.length - a.name.length; });

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function findFoods(seg) {
    var taken = [];
    var hits = [];
    ALIASES.forEach(function (a) {
      var ascii = /^[\x00-\x7f]+$/.test(a.name);
      var re = ascii ? new RegExp('(^|[^a-z])(' + escapeRe(a.name) + ')(?![a-z])', 'g') : new RegExp('(^|)(' + escapeRe(a.name) + ')', 'g');
      var m;
      while ((m = re.exec(seg))) {
        var start = m.index + m[1].length;
        var end = start + m[2].length;
        var overlaps = taken.some(function (t) { return start < t[1] && end > t[0]; });
        if (!overlaps) {
          taken.push([start, end]);
          hits.push({ start: start, end: end, food: a.food });
        }
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    });
    return hits.sort(function (a, b) { return a.start - b.start; });
  }

  function readAmount(text) {
    var qty = null;
    var unit = null;
    var num = text.match(/(\d+(?:\.\d+)?)\s*(½)?|½/);
    if (num) {
      if (num[0] === '½') qty = 0.5;
      else qty = parseFloat(num[1]) + (num[2] ? 0.5 : 0);
    }
    text.split(/\s+/).forEach(function (w) {
      if (qty === null && Object.prototype.hasOwnProperty.call(NUMBER_WORDS, w)) qty = NUMBER_WORDS[w];
      if (unit === null && Object.prototype.hasOwnProperty.call(UNIT_WORDS, w)) unit = UNIT_WORDS[w];
    });
    var glued = text.match(/(\d+(?:\.\d+)?)\s*(g|gm|gms|grams?|ml)\b/);
    if (glued) { qty = parseFloat(glued[1]); unit = 'g'; }
    return { qty: qty, unit: unit };
  }

  function leftoverWords(text) {
    return text
      .replace(/[\d.½]+/g, ' ')
      .split(/\s+/)
      .filter(function (w) {
        return w && !Object.prototype.hasOwnProperty.call(NUMBER_WORDS, w) &&
          !Object.prototype.hasOwnProperty.call(UNIT_WORDS, w) && FILLERS.indexOf(w) === -1;
      })
      .join(' ');
  }

  function parseMeal(input) {
    var text = String(input || '').toLowerCase().replace(/[!?;:"“”()]/g, ' ');
    var segments = text.split(/,|\+|&|\band\b|\baur\b|\bwith\b|\bplus\b|\bke saath\b|\bn\b|\bor\b/);
    var items = [];
    segments.forEach(function (raw) {
      var seg = raw.replace(/\s+/g, ' ').trim();
      if (!seg) return;
      var hits = findFoods(seg);
      if (!hits.length) {
        var rest = leftoverWords(seg);
        if (rest) items.push({ unknown: true, label: rest });
        return;
      }
      var prevEnd = 0;
      hits.forEach(function (hit) {
        var amount = readAmount(seg.slice(prevEnd, hit.start));
        prevEnd = hit.end;
        var food = hit.food;
        var servings = amount.qty === null ? 1 : amount.qty;
        if (amount.unit === 'g') servings = amount.qty / food.g;
        servings = clamp(servings, 0.1, 20);
        items.push({
          food: food,
          label: food.label,
          servings: servings,
          grams: servings * food.g,
          kcal: servings * food.kcal,
          p: servings * food.p,
          c: servings * food.c,
          f: servings * food.f
        });
      });
    });
    return items;
  }

  var logger = $('#logger');
  if (logger) {
    var form = $('#loggerForm');
    var field = $('#loggerField');
    var list = $('#loggerItems');
    var ring = $('#loggerRing');
    var kcalEl = $('#loggerKcal');
    var macroEls = { p: $('[data-macro="p"]', logger), c: $('[data-macro="c"]', logger), f: $('[data-macro="f"]', logger) };
    var suggestBtns = $$('.logger-suggest button', logger);
    var DAY = 2000;
    var userTookOver = false;
    var thinkTimer = null;

    function markSuggestion(phrase) {
      suggestBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-phrase') === phrase ? 'true' : 'false');
      });
    }

    function render(items) {
      list.classList.remove('is-thinking');
      list.innerHTML = '';
      var tot = { kcal: 0, p: 0, c: 0, f: 0 };
      items.forEach(function (it, i) {
        var li = document.createElement('li');
        li.className = 'logger-item is-new';
        li.style.setProperty('--i', i);
        var name = document.createElement('span');
        name.className = 'li-name';
        var amt = document.createElement('span');
        amt.className = 'li-amt';
        var kc = document.createElement('span');
        kc.className = 'li-kcal num';
        if (it.unknown) {
          li.classList.add('is-unknown');
          name.textContent = it.label.charAt(0).toUpperCase() + it.label.slice(1);
          amt.textContent = 'Not in this demo. The app would look it up.';
          kc.textContent = '—';
        } else {
          var u = it.servings > 1 ? it.food.unit[1] : it.food.unit[0];
          name.textContent = it.label;
          amt.textContent = fmtQty(it.servings) + ' ' + u + ' · ' + Math.round(it.grams) + ' ' + (it.food.gu || 'g');
          kc.textContent = fmtInt(it.kcal) + ' kcal';
          tot.kcal += it.kcal; tot.p += it.p; tot.c += it.c; tot.f += it.f;
        }
        li.appendChild(name); li.appendChild(amt); li.appendChild(kc);
        list.appendChild(li);
      });
      if (!items.length) {
        var empty = document.createElement('li');
        empty.className = 'logger-item is-unknown is-new';
        empty.innerHTML = '<span class="li-name">Try “2 roti aur dal”</span><span class="li-amt">Name a dish and an amount</span><span class="li-kcal">—</span>';
        list.appendChild(empty);
      }
      ring.style.setProperty('--p', String(clamp(tot.kcal / DAY, 0, 1)));
      tween(kcalEl, Math.round(tot.kcal));
      tween(macroEls.p, tot.p, { format: function (v) { return Math.round(v) + ' g'; } });
      tween(macroEls.c, tot.c, { format: function (v) { return Math.round(v) + ' g'; } });
      tween(macroEls.f, tot.f, { format: function (v) { return Math.round(v) + ' g'; } });
    }

    function work(phrase) {
      markSuggestion(phrase);
      clearTimeout(thinkTimer);
      list.innerHTML = '';
      list.classList.add('is-thinking');
      thinkTimer = setTimeout(function () { render(parseMeal(phrase)); }, reduce ? 0 : 480);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      userTookOver = true;
      stopTyping();
      work(field.value);
    });
    field.addEventListener('focus', function () { userTookOver = true; stopTyping(); });
    suggestBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        userTookOver = true;
        stopTyping();
        field.value = b.getAttribute('data-phrase');
        work(field.value);
      });
    });

    // Seed the totals so tweening starts from the static numbers.
    kcalEl.setAttribute('data-value', '405');
    markSuggestion(field.value);

    // Typing demo: types each example, works it out, moves on — until the visitor takes over.
    var phrases = suggestBtns.map(function (b) { return b.getAttribute('data-phrase'); });
    var phraseIdx = 0;
    var typingTimer = null;
    var visible = false;

    function stopTyping() { clearTimeout(typingTimer); typingTimer = null; }

    function typePhrase(phrase, done) {
      var i = 0;
      field.value = '';
      (function next() {
        if (userTookOver) return;
        field.value = phrase.slice(0, i);
        if (i <= phrase.length) {
          i++;
          typingTimer = setTimeout(next, 38 + Math.random() * 50);
        } else {
          done();
        }
      })();
    }

    function cycle() {
      if (userTookOver || reduce) return;
      if (!visible || document.hidden) { typingTimer = setTimeout(cycle, 800); return; }
      var phrase = phrases[phraseIdx % phrases.length];
      typePhrase(phrase, function () {
        work(phrase);
        phraseIdx++;
        typingTimer = setTimeout(cycle, 4200);
      });
    }

    onVisible(logger, function (isIn) { visible = isIn; }, { threshold: 0.4 });
    if (!reduce) {
      phraseIdx = 1; // the first phrase is already shown statically
      typingTimer = setTimeout(cycle, 3600);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     2. Katori portions
     ════════════════════════════════════════════════════════════════════════ */
  var KATORI = {
    dal:    { kcal: 165, p: 8.3, c: 21, f: 5.3, color: '#f2b824', top: '#f7cd52' },
    rajma:  { kcal: 210, p: 10, c: 27, f: 6.8, color: '#8e2f1f', top: '#a8432e' },
    chawal: { kcal: 195, p: 4, c: 42, f: 0.5, color: '#efe8d6', top: '#fbf7ee' },
    dahi:   { kcal: 90, p: 5.2, c: 7, f: 4.8, color: '#f1efe6', top: '#ffffff' },
    kadhi:  { kcal: 128, p: 4.5, c: 10, f: 7.5, color: '#efc23e', top: '#f6d670' }
  };
  var MACRO_REF = { p: 30, c: 130, f: 25 };

  var katori = $('#katori');
  if (katori) {
    var range = $('#katoriRange');
    var radios = $$('.katori-foods [role="radio"]', katori);
    var visual = $('#katoriVisual');
    var bowls = $$('.bowl', visual);
    var qtyEl = $('#katoriQty');
    var gramsEl = $('#katoriGrams');
    var kEl = $('#katoriKcal');
    var current = 'dal';

    function updateKatori() {
      var q = parseFloat(range.value);
      var food = KATORI[current];
      var min = parseFloat(range.min), max = parseFloat(range.max);
      range.style.setProperty('--pct', ((q - min) / (max - min)) * 100 + '%');
      qtyEl.textContent = fmtQty(q) + ' katori';
      gramsEl.textContent = Math.round(q * 150) + ' g';
      range.setAttribute('aria-valuetext', fmtQty(q).replace('½', ' and a half').replace('¼', ' and a quarter').replace('¾', ' and three quarters').trim() + ' katori, ' + Math.round(q * 150) + ' grams');
      visual.style.setProperty('--food', food.color);
      visual.style.setProperty('--food-top', food.top);
      bowls.forEach(function (b, i) {
        var lvl = clamp(q - i, 0, 1);
        b.querySelector('.katori-fill').style.setProperty('--lvl', String(lvl));
        b.classList.toggle('has-food', lvl > 0);
      });
      tween(kEl, food.kcal * q, { duration: 450 });
      ['p', 'c', 'f'].forEach(function (k) {
        var grams = food[k] * q;
        var label = $('[data-k="' + k + '"]', katori);
        label.textContent = fmtG(grams);
        $('[data-kb="' + k + '"]', katori).style.setProperty('--w', clamp((grams / MACRO_REF[k]) * 100, 2, 100) + '%');
      });
    }

    function selectFood(btn, focus) {
      radios.forEach(function (r) {
        var on = r === btn;
        r.setAttribute('aria-checked', on ? 'true' : 'false');
        r.tabIndex = on ? 0 : -1;
      });
      current = btn.getAttribute('data-food');
      if (focus) btn.focus();
      updateKatori();
    }

    radios.forEach(function (r, i) {
      r.tabIndex = i === 0 ? 0 : -1;
      r.addEventListener('click', function () { selectFood(r); });
      r.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        selectFood(radios[(i + d + radios.length) % radios.length], true);
      });
    });
    range.addEventListener('input', updateKatori);
    kEl.setAttribute('data-value', '165');
    updateKatori();
  }

  /* ════════════════════════════════════════════════════════════════════════
     3. Count-up numbers
     ════════════════════════════════════════════════════════════════════════ */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var done = false;
    if (reduce) return;
    el.setAttribute('data-value', '0');
    el.textContent = '0';
    onVisible(el, function (isIn) {
      if (isIn && !done) { done = true; tween(el, target, { duration: 1600 }); }
    }, { threshold: 0.6 });
  });

  /* ════════════════════════════════════════════════════════════════════════
     4. Five ways to log
     ════════════════════════════════════════════════════════════════════════ */
  var mock = $('#waysMock');
  var wayTabs = $$('#waysTabs .way-tab');
  if (mock && wayTabs.length) {
    var DURATION = 5600;
    var active = 0;
    var auto = !reduce;
    var waysVisible = false;
    var t0 = 0;
    var elapsed = 0;
    var rafId = null;

    function playPanel(mode) {
      var panel = $('[data-panel="' + mode + '"]', mock);
      $$('.mock-panel', mock).forEach(function (p) { p.classList.remove('play'); });
      void panel.offsetWidth; // restart CSS animations
      panel.classList.add('play');
    }

    function activate(i, fromUser) {
      active = (i + wayTabs.length) % wayTabs.length;
      wayTabs.forEach(function (t, j) {
        t.setAttribute('aria-pressed', j === active ? 'true' : 'false');
        t.style.setProperty('--prog', '0%');
      });
      var mode = wayTabs[active].getAttribute('data-mode');
      mock.setAttribute('data-mode', mode);
      playPanel(mode);
      elapsed = 0;
      t0 = performance.now();
      if (fromUser) {
        auto = false;
        wayTabs.forEach(function (t) { t.style.setProperty('--prog', '0%'); });
      }
    }

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (!auto || !waysVisible || document.hidden) { t0 = now - elapsed; return; }
      elapsed = now - t0;
      var pct = clamp(elapsed / DURATION, 0, 1) * 100;
      wayTabs[active].style.setProperty('--prog', pct + '%');
      if (elapsed >= DURATION) activate(active + 1);
    }

    wayTabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i, true); });
      t.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + wayTabs.length) % wayTabs.length;
        wayTabs[n].focus();
        activate(n, true);
      });
    });

    onVisible(mock, function (isIn) {
      var wasVisible = waysVisible;
      waysVisible = isIn;
      if (isIn && !wasVisible) playPanel(mock.getAttribute('data-mode'));
    }, { threshold: 0.35 });
    rafId = requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════════════════════
     5. Streak (same rules as CalwiseCore's Streak: two empty days pause it,
        a third ends it; the count is logged days only)
     ════════════════════════════════════════════════════════════════════════ */
  var daysEl = $('#streakDays');
  if (daysEl) {
    var PAUSE_DAYS = 2;
    var pattern = [false, true, true, true, true, false, true, true, true, false, false, true, true, false];
    var today = new Date();
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var countEl = $('#streakCount');
    var stateEl = $('#streakState');
    var statusEl = $('#streakStatus');
    var buttons = [];

    function computeStreak(logged) {
      var last = logged.length - 1; // index of today
      var idx = [];
      logged.forEach(function (on, i) { if (on) idx.push(i); });
      var run = 0, prev = null;
      idx.forEach(function (d) {
        run = (prev !== null && d - prev <= PAUSE_DAYS + 1) ? run + 1 : 1;
        prev = d;
      });
      if (!idx.length) return { count: 0, state: 'none', paused: {} };
      var gap = last - idx[idx.length - 1];
      var state = gap === 0 ? 'loggedToday' : gap === 1 ? 'due' : gap <= PAUSE_DAYS + 1 ? 'paused' : 'none';
      var daysLeft = state === 'paused' ? PAUSE_DAYS + 2 - gap : null;
      var paused = {};
      for (var k = 1; k < idx.length; k++) {
        if (idx[k] - idx[k - 1] <= PAUSE_DAYS + 1) for (var d = idx[k - 1] + 1; d < idx[k]; d++) paused[d] = true;
      }
      if (state === 'paused') for (var e = idx[idx.length - 1] + 1; e < last; e++) paused[e] = true;
      return { count: state === 'none' ? 0 : run, state: state, daysLeft: daysLeft, paused: paused };
    }

    function stateText(s) {
      switch (s.state) {
        case 'loggedToday': return 'Logged today. See you at breakfast.';
        case 'due': return 'Log something today to keep it going.';
        case 'paused': return s.daysLeft === 2 ? 'Paused. Log today or tomorrow to keep it.' : 'Paused. Log today to keep it. It\'s the last day.';
        default: return 'Three empty days ended it. Log a meal to start a new one.';
      }
    }

    function renderStreak(bump) {
      var s = computeStreak(pattern);
      buttons.forEach(function (btn, i) {
        var on = pattern[i];
        btn.classList.toggle('logged', on);
        btn.classList.toggle('paused', !on && !!s.paused[i]);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var status = on ? 'logged' : s.paused[i] ? 'nothing logged, streak paused' : 'nothing logged';
        btn.setAttribute('aria-label', btn.getAttribute('data-date') + ': ' + status);
      });
      var prevCount = parseInt(countEl.textContent, 10);
      countEl.textContent = String(s.count);
      if (bump && prevCount !== s.count && !reduce) {
        countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
      }
      stateEl.textContent = stateText(s);
      statusEl.classList.toggle('is-paused', s.state === 'paused');
      statusEl.classList.toggle('is-ended', s.state === 'none');
    }

    pattern.forEach(function (on, i) {
      var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (pattern.length - 1 - i));
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sd' + (i === pattern.length - 1 ? ' today' : '');
      var label = (i === pattern.length - 1 ? 'Today, ' : '') + dayNames[date.getDay()] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()];
      btn.setAttribute('data-date', label);
      btn.innerHTML = '<span aria-hidden="true">' + (i === pattern.length - 1 ? 'Today' : dayNames[date.getDay()].charAt(0)) + '</span><b aria-hidden="true">' + date.getDate() + '</b>';
      btn.addEventListener('click', function () { pattern[i] = !pattern[i]; renderStreak(true); });
      li.appendChild(btn);
      daysEl.appendChild(li);
      buttons.push(btn);
    });
    renderStreak(false);
  }

  /* ════════════════════════════════════════════════════════════════════════
     6. A closer look: swap the sticky phone's screen with the active caption
     ════════════════════════════════════════════════════════════════════════ */
  var steps = $$('.look-step');
  var shots = $$('.look-device .look-shot');
  if (steps.length && shots.length && 'IntersectionObserver' in window) {
    var lookIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = parseInt(e.target.getAttribute('data-shot'), 10);
        steps.forEach(function (s) { s.classList.toggle('is-active', s === e.target); });
        shots.forEach(function (p) { p.classList.toggle('is-active', parseInt(p.getAttribute('data-shot'), 10) === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { lookIO.observe(s); });
  }

  /* ════════════════════════════════════════════════════════════════════════
     7. Monthly Wrapped story
     ════════════════════════════════════════════════════════════════════════ */
  var story = $('#story');
  if (story) {
    var cards = $$('.story-card', story);
    var bars = $$('.story-bars i', story);
    var idx = 0;
    var storyVisible = false;
    var hovering = false;

    story.tabIndex = 0;

    function showCard(n) {
      idx = (n + cards.length) % cards.length;
      cards.forEach(function (c, i) {
        c.classList.toggle('is-gone', i < idx);
        c.classList.toggle('is-current', i === idx);
        c.style.setProperty('--pos', String(Math.max(0, i - idx)));
        c.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      bars.forEach(function (b, i) {
        b.classList.remove('run');
        b.classList.toggle('done', i < idx || (reduce && i === idx));
      });
      if (!reduce) {
        void story.offsetWidth;
        bars[idx].classList.add('run');
      }
      syncPause();
    }
    function syncPause() { story.classList.toggle('is-paused', hovering || !storyVisible || document.hidden); }

    bars.forEach(function (b, i) {
      b.addEventListener('animationend', function () { if (i === idx) showCard(idx + 1); });
    });

    $('#wrapNext').addEventListener('click', function () { showCard(idx + 1); });
    $('#wrapPrev').addEventListener('click', function () { showCard(idx - 1); });
    story.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); showCard(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showCard(idx - 1); }
    });

    var downX = null;
    story.addEventListener('pointerdown', function (e) { downX = e.clientX; });
    story.addEventListener('pointerup', function (e) {
      if (downX === null) return;
      var dx = e.clientX - downX;
      downX = null;
      if (dx < -40) showCard(idx + 1);
      else if (dx > 40) showCard(idx - 1);
      else if (Math.abs(dx) < 10) {
        var r = story.getBoundingClientRect();
        showCard(e.clientX - r.left < r.width / 3 ? idx - 1 : idx + 1);
      }
    });
    story.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; syncPause(); } });
    story.addEventListener('pointerleave', function () { hovering = false; syncPause(); });
    story.addEventListener('focusin', function () { hovering = true; syncPause(); });
    story.addEventListener('focusout', function () { hovering = false; syncPause(); });
    document.addEventListener('visibilitychange', syncPause);
    onVisible(story, function (isIn) { storyVisible = isIn; syncPause(); }, { threshold: 0.5 });
    showCard(0);
  }

  /* ════════════════════════════════════════════════════════════════════════
     8. Day rail + header at night
     ════════════════════════════════════════════════════════════════════════ */
  var rail = $('#dayRail');
  var header = $('#siteHeader');
  var sections = $$('[data-section]');
  if (sections.length && 'IntersectionObserver' in window) {
    var railLinks = rail ? $$('a', rail) : [];
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('data-section');
        var night = e.target.classList.contains('is-night');
        railLinks.forEach(function (a) {
          var on = a.getAttribute('data-rail') === id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
        if (rail) rail.classList.toggle('on-night', night);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(function (s) { secIO.observe(s); });

    // The header turns to night while a night section sits under it.
    var nightSections = sections.filter(function (s) { return s.classList.contains('is-night'); });
    if (header && nightSections.length) {
      var nightTicking = false;
      var updateHeaderNight = function () {
        nightTicking = false;
        var mid = header.offsetHeight / 2;
        header.classList.toggle('is-night', nightSections.some(function (s) {
          var r = s.getBoundingClientRect();
          return r.top <= mid && r.bottom >= mid;
        }));
      };
      window.addEventListener('scroll', function () {
        if (!nightTicking) { nightTicking = true; requestAnimationFrame(updateHeaderNight); }
      }, { passive: true });
      updateHeaderNight();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     9. Small scroll & pointer touches
     ════════════════════════════════════════════════════════════════════════ */
  // The sun sets as the horizon scrolls past.
  var horizon = $('.horizon');
  var sun = $('.setting-sun');
  if (horizon && sun && !reduce) {
    var ticking = false;
    var updateSun = function () {
      ticking = false;
      var r = horizon.getBoundingClientRect();
      var vh = window.innerHeight;
      var t = clamp((vh - r.top) / (vh + r.height), 0, 1);
      sun.style.setProperty('--sink', t.toFixed(3));
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateSun); }
    }, { passive: true });
    updateSun();
  }

  // The hero phone leans towards the pointer.
  var heroStage = $('#heroStage');
  var heroPhone = $('.hero-phone');
  if (heroStage && heroPhone && finePointer && !reduce) {
    var hero = $('#hero');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      heroPhone.style.setProperty('--tx', (x * 18).toFixed(1) + 'px');
      heroPhone.style.setProperty('--ty', (y * 14).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', function () {
      heroPhone.style.setProperty('--tx', '0px');
      heroPhone.style.setProperty('--ty', '0px');
    });
  }
}());
