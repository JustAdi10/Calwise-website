/* Calwise — shared behaviour for every page.
   Header state, mobile menu, theme toggle, reveal-on-scroll. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Header: solid once the page scrolls ─────────────────────────────── */
  var header = document.getElementById('siteHeader');
  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ── Mobile menu ─────────────────────────────────────────────────────── */
  var menuToggle = document.getElementById('menuToggle');
  var mobileNav = document.getElementById('mobileNav');

  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileNav.classList.toggle('is-open', open);
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!mobileNav.classList.contains('is-open')) return;
      if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) setMenu(false);
    });
  }

  /* ── Theme (system by default; a click pins light or dark for the whole site) ──
     The choice is kept in localStorage, and also in window.name so it survives
     page-to-page navigation where storage isn't shared (e.g. files opened from disk). */
  var KEY = 'calwise-theme';
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var THEME_COLOR = { light: '#ffe4c2', dark: '#120f0d' };

  function readStored() {
    var t = null;
    try { t = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    if (t !== 'light' && t !== 'dark') {
      var m = /(?:^|;)calwise-theme:(light|dark)(?:;|$)/.exec(window.name || '');
      t = m ? m[1] : null;
    }
    return t;
  }
  function writeStored(t) {
    try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ }
    var rest = (window.name || '').split(';').filter(function (p) { return p && p.indexOf('calwise-theme:') !== 0; });
    rest.push('calwise-theme:' + t);
    window.name = rest.join(';');
  }
  function effectiveTheme() {
    var pinned = root.getAttribute('data-theme');
    if (pinned === 'light' || pinned === 'dark') return pinned;
    return systemDark.matches ? 'dark' : 'light';
  }
  function syncChrome() {
    var t = effectiveTheme();
    var next = t === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('title', 'Switch to ' + next + ' mode');
    });
    // The tab icon follows the theme too (icon-*.png ↔ icon-dark-*.png).
    document.querySelectorAll('link[rel="icon"][type="image/png"]').forEach(function (l) {
      var href = l.getAttribute('href').replace('icon-dark-', 'icon-');
      l.setAttribute('href', t === 'dark' ? href.replace('icon-', 'icon-dark-') : href);
    });
    // The browser's toolbar colour follows the site's theme, not just the system's.
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', root.hasAttribute('data-theme') ? THEME_COLOR[t] : THEME_COLOR[m.getAttribute('media') && m.getAttribute('media').indexOf('dark') !== -1 ? 'dark' : 'light']);
    });
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
    else root.removeAttribute('data-theme');
    syncChrome();
    document.dispatchEvent(new CustomEvent('calwise:theme', { detail: effectiveTheme() }));
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      writeStored(next);
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      // A circular reveal from the button, where the browser supports it.
      if (document.startViewTransition && !reduceMotion.matches) {
        root.style.setProperty('--vt-x', x + 'px');
        root.style.setProperty('--vt-y', y + 'px');
        root.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
        document.startViewTransition(function () { applyTheme(next); });
      } else {
        applyTheme(next);
      }
    });
  });

  // Keep every page and tab in step: other tabs (storage event), pages restored by Back/Forward
  // from the browser's cache (pageshow), and system changes while following the system.
  window.addEventListener('storage', function (e) { if (e.key === KEY) applyTheme(readStored()); });
  window.addEventListener('pageshow', function () { applyTheme(readStored()); });
  if (systemDark.addEventListener) systemDark.addEventListener('change', syncChrome);
  applyTheme(readStored());

  /* ── Reveal on scroll ────────────────────────────────────────────────── */
  var revealEls = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Expose a tiny helper for page scripts */
  window.Calwise = window.Calwise || {};
  window.Calwise.reduceMotion = reduceMotion;
}());
