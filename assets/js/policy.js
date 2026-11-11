/* Calwise — privacy policy: table of contents, reading progress, section links, back to top.
   The policy text itself is never changed; these are additions around it. */
(function () {
  'use strict';

  var article = document.querySelector('article.policy');
  if (!article) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var headings = Array.prototype.slice.call(article.querySelectorAll('h2[id]'));

  /* ── Table of contents ───────────────────────────────────────────────── */
  var toc = document.getElementById('policyToc');
  var tocLinks = [];
  if (toc) {
    var list = toc.querySelector('ol');
    headings.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
      tocLinks.push(a);
    });
  }

  /* ── "#" links on headings ───────────────────────────────────────────── */
  Array.prototype.slice.call(article.querySelectorAll('h2[id], h3[id]')).forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'heading-link';
    a.href = '#' + h.id;
    a.textContent = '#';
    a.setAttribute('aria-label', 'Link to “' + h.textContent + '”');
    h.appendChild(a);
  });

  /* ── Scroll-spy ──────────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window && tocLinks.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-active', on);
          if (on) {
            a.setAttribute('aria-current', 'true');
            if (a.scrollIntoView && toc.scrollHeight > toc.clientHeight) a.scrollIntoView({ block: 'nearest' });
          } else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(function (h) { io.observe(h); });
  }

  /* ── Reading progress + back to top ──────────────────────────────────── */
  var bar = document.getElementById('readProgress');
  var toTop = document.getElementById('toTop');
  var ticking = false;
  function update() {
    ticking = false;
    var r = article.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.6;
    var p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    if (bar) bar.style.setProperty('--read', p.toFixed(4));
    if (toTop) toTop.classList.toggle('is-shown', window.scrollY > 1200);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var skip = document.querySelector('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });
  }
}());
