/* Calwise — help centre: live search, deep links to answers, copy-link, topic scroll-spy.
   Without JavaScript every answer is a native <details> and still works. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var faqs = Array.prototype.slice.call(document.querySelectorAll('.faq'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.faq-group'));
  var input = document.getElementById('helpQuery');
  var status = document.getElementById('helpStatus');
  var noResults = document.getElementById('noResults');

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[“”"'’‘.,!?()]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Index each answer once.
  faqs.forEach(function (faq) {
    var q = faq.querySelector('.q');
    faq._q = q.textContent;
    faq._text = norm(faq.textContent);
  });

  /* ── Opening animation ───────────────────────────────────────────────── */
  faqs.forEach(function (faq) {
    var body = faq.querySelector('.faq-body');
    faq.addEventListener('toggle', function () {
      if (faq.open && !reduce && body.animate) {
        body.animate(
          [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
      if (faq.open && faq._userToggled) {
        history.replaceState(null, '', '#' + faq.id + (location.search || ''));
      }
      faq._userToggled = false;
    });
    faq.querySelector('summary').addEventListener('click', function () { faq._userToggled = true; });
  });

  /* ── Copy link to an answer ──────────────────────────────────────────── */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  faqs.forEach(function (faq) {
    var foot = document.createElement('p');
    foot.className = 'faq-foot';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-link';
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg><span>Copy link</span>';
    btn.setAttribute('aria-label', 'Copy link to “' + faq._q + '”');
    btn.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + faq.id;
      copyText(url).then(function () {
        btn.classList.add('is-done');
        btn.querySelector('span').textContent = 'Copied';
        setTimeout(function () {
          btn.classList.remove('is-done');
          btn.querySelector('span').textContent = 'Copy link';
        }, 1800);
      }, function () { location.hash = faq.id; });
    });
    foot.appendChild(btn);
    faq.querySelector('.faq-body').appendChild(foot);
  });

  /* ── Deep links: /support.html#delete-account opens that answer ──────── */
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el || !el.classList.contains('faq')) return;
    if (input && input.value) { input.value = ''; search(''); }
    el.open = true;
    el.classList.remove('is-target');
    void el.offsetWidth;
    el.classList.add('is-target');
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }
  window.addEventListener('hashchange', openFromHash);

  /* ── Search ──────────────────────────────────────────────────────────── */
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function highlight(text, words) {
    var html = escapeHtml(text);
    if (!words.length) return html;
    var re = new RegExp('(' + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    return html.replace(re, '<mark>$1</mark>');
  }

  var openedBySearch = [];
  function search(raw) {
    var query = norm(raw);
    var words = query ? query.split(' ').filter(function (w) { return w.length > 1 || /\d/.test(w); }) : [];
    var shown = 0;

    openedBySearch.forEach(function (f) { f.open = false; });
    openedBySearch = [];

    faqs.forEach(function (faq) {
      var hit = !words.length || words.every(function (w) { return faq._text.indexOf(w) !== -1; });
      faq.hidden = !hit;
      faq.querySelector('.q').innerHTML = highlight(faq._q, words);
      if (hit) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector('.faq:not([hidden])');
    });

    if (words.length && shown > 0 && shown <= 3) {
      faqs.forEach(function (f) {
        if (!f.hidden && !f.open) { f.open = true; openedBySearch.push(f); }
      });
    }

    noResults.hidden = !(words.length && shown === 0);
    status.textContent = words.length
      ? (shown === 0 ? 'No answers match “' + raw.trim() + '”.' : shown + (shown === 1 ? ' answer matches' : ' answers match') + ' “' + raw.trim() + '”.')
      : '';
  }

  if (input) {
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        search(input.value);
        var params = new URLSearchParams(location.search);
        if (input.value.trim()) params.set('q', input.value.trim()); else params.delete('q');
        var qs = params.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      }, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; search(''); history.replaceState(null, '', location.pathname); }
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = faqs.filter(function (f) { return !f.hidden; })[0];
        if (first) { first.open = true; first.querySelector('summary').focus(); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });

    // ?q=… prefills the search (handy for links from the app or emails).
    var initial = new URLSearchParams(location.search).get('q');
    if (initial) { input.value = initial; search(initial); }
  }

  openFromHash();

  /* ── Topic scroll-spy ────────────────────────────────────────────────── */
  var aside = document.getElementById('helpAside');
  if (aside && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(aside.querySelectorAll('a'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    groups.forEach(function (g) { io.observe(g); });
  }
}());
