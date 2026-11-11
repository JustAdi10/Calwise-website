/* Calwise — contact form.
   Posts straight to the Calwise Google Form (formResponse) so the message actually arrives.
   Without JavaScript the same form posts normally and Google shows its confirmation page. */
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var card = document.getElementById('formCard');
  var nameEl = document.getElementById('name');
  var emailEl = document.getElementById('email');
  var msgEl = document.getElementById('message');
  var countEl = document.getElementById('messageCount');
  var sendBtn = document.getElementById('sendBtn');
  var formError = document.getElementById('formError');
  var successTitle = document.getElementById('successTitle');
  var successEmail = document.getElementById('successEmail');
  var DRAFT_KEY = 'calwise-contact-draft';
  var EMAIL = 'calwiseapp@gmail.com';

  var errors = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    message: document.getElementById('messageError')
  };

  /* ── Topic (?topic=bug preselects a chip) ────────────────────────────── */
  var TOPIC_PARAM = { question: 'Question', bug: 'Bug report', account: 'Account & data', privacy: 'Privacy', feedback: 'Feedback', partnership: 'Partnership' };
  var wanted = TOPIC_PARAM[(new URLSearchParams(location.search).get('topic') || '').toLowerCase()];
  var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="topic"]'));
  if (wanted) radios.forEach(function (r) { r.checked = r.value === wanted; });
  function topic() {
    var r = radios.filter(function (x) { return x.checked; })[0];
    return r ? r.value : 'Question';
  }

  /* ── Counter & draft ─────────────────────────────────────────────────── */
  function updateCount() {
    countEl.textContent = msgEl.value.length + ' / ' + msgEl.maxLength;
  }
  function saveDraft() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ n: nameEl.value, e: emailEl.value, m: msgEl.value, t: topic() }));
    } catch (e) { /* storage unavailable */ }
  }
  try {
    var d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (d) {
      if (d.n && !nameEl.value) nameEl.value = d.n;
      if (d.e && !emailEl.value) emailEl.value = d.e;
      if (d.m && !msgEl.value) msgEl.value = d.m;
      if (d.t && !wanted) radios.forEach(function (r) { r.checked = r.value === d.t; });
    }
  } catch (e) { /* ignore */ }
  updateCount();
  form.addEventListener('input', function (e) {
    if (e.target === msgEl) updateCount();
    if (e.target.getAttribute('aria-invalid') === 'true') validate(e.target);
    saveDraft();
  });

  /* ── Validation ──────────────────────────────────────────────────────── */
  function validate(el) {
    var msg = '';
    var v = el.value.trim();
    if (el === nameEl && !v) msg = 'Please add your name.';
    if (el === emailEl) {
      if (!v) msg = 'We need an email to reply to.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email doesn\'t look quite right.';
    }
    if (el === msgEl && v.length < 5) msg = v ? 'A little more detail, please.' : 'Please write a message.';
    var key = el === nameEl ? 'name' : el === emailEl ? 'email' : 'message';
    errors[key].textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-errormessage', errors[key].id); else el.removeAttribute('aria-errormessage');
    return !msg;
  }
  [nameEl, emailEl, msgEl].forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value) validate(el); });
  });

  /* ── Submit ──────────────────────────────────────────────────────────── */
  function setBusy(busy) {
    sendBtn.disabled = busy;
    sendBtn.classList.toggle('is-busy', busy);
    sendBtn.querySelector('.btn-label').textContent = busy ? 'Sending…' : 'Send message';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.hidden = true;
    var ok = [nameEl, emailEl, msgEl].map(validate);
    var firstBad = [nameEl, emailEl, msgEl][ok.indexOf(false)];
    if (firstBad) { firstBad.focus(); return; }

    var body = '[' + topic() + '] ' + msgEl.value.trim();
    var params = new URLSearchParams();
    params.set(nameEl.name, nameEl.value.trim());
    params.set(emailEl.name, emailEl.value.trim());
    params.set(msgEl.name, body);

    setBusy(true);
    // Google Forms doesn't send CORS headers, so the response is opaque: a resolved request means it was delivered.
    fetch(form.action, { method: 'POST', mode: 'no-cors', body: params })
      .then(function () {
        successEmail.textContent = emailEl.value.trim();
        card.classList.add('is-sent');
        try { sessionStorage.removeItem(DRAFT_KEY); } catch (err) { /* ignore */ }
        setTimeout(function () { successTitle.focus(); }, 50);
      })
      .catch(function () {
        var mail = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('[' + topic() + '] Message from ' + nameEl.value.trim()) +
          '&body=' + encodeURIComponent(msgEl.value.trim() + '\n\n— ' + nameEl.value.trim() + ' (' + emailEl.value.trim() + ')');
        formError.innerHTML = '';
        formError.appendChild(document.createTextNode('We couldn\'t send that. Check your connection and try again, or '));
        var a = document.createElement('a');
        a.href = mail;
        a.className = 'text-link';
        a.textContent = 'send it by email instead';
        formError.appendChild(a);
        formError.appendChild(document.createTextNode('. Your message is still here.'));
        formError.hidden = false;
      })
      .then(function () { setBusy(false); });
  });

  document.getElementById('sendAnother').addEventListener('click', function () {
    msgEl.value = '';
    updateCount();
    card.classList.remove('is-sent');
    [nameEl, emailEl, msgEl].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    msgEl.focus();
  });

  /* ── Copy email ──────────────────────────────────────────────────────── */
  var copyBtn = document.getElementById('copyEmail');
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
        copyBtn.classList.add('is-done');
        copyBtn.querySelector('span').textContent = 'Copied';
        setTimeout(function () {
          copyBtn.classList.remove('is-done');
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 1800);
      });
    });
  }
}());
