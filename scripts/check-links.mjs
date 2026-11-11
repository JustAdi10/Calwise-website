#!/usr/bin/env node
// Checks that every URL the old site served still works, and that every internal link,
// asset and #anchor on every page resolves. No dependencies (Node 18+).
//
//   node scripts/check-links.mjs                      # against http://127.0.0.1:4173 (python3 -m http.server 4173)
//   node scripts/check-links.mjs https://<preview>.vercel.app
//
// Exits with code 1 if anything is broken.

const base = (process.argv[2] || 'http://127.0.0.1:4173').replace(/\/$/, '');
const isVercel = !/127\.0\.0\.1|localhost/.test(base);

// URLs that existed before the redesign, or are linked from the app / App Store. They must keep working.
const LEGACY = [
  '/',
  '/index.html',
  '/privacy-policy.html', // opened by the app: Profile › Privacy Policy
  '/contact.html',
  '/styles.css',
  '/PRIVACY_POLICY.md',
  '/icon.png',
  '/Home.png',
  '/Progress%201.png',
  '/Progress%202.png',
  '/app-screenshot.png',
];
// Section anchors on the privacy policy that other places may link to.
const POLICY_ANCHORS = [
  'calwise-privacy-policy', '1-information-we-collect', '2-how-we-use-information', '3-optional-ai-features-and-openai',
  '4-who-else-receives-information', '5-apple-health-safeguards', '6-storage-security-and-international-transfers',
  '7-how-long-we-keep-information-and-deleting-your-account', '8-your-choices-and-rights', '9-children',
  '10-this-website', '11-changes-to-this-policy', '12-contact',
];
// Short aliases from vercel.json (only checked on Vercel; they're redirects).
const ALIASES = { '/privacy': '/privacy-policy.html', '/support': '/support.html', '/help': '/support.html', '/faq': '/support.html', '/contact': '/contact.html' };
const PAGES = ['/index.html', '/support.html', '/contact.html', '/privacy-policy.html', '/404.html'];

let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { failures++; console.log('  FAIL ' + m); };
const cache = new Map();

async function get(path, opts = {}) {
  const key = path + (opts.redirect || '');
  if (!cache.has(key)) {
    cache.set(key, fetch(base + path, { redirect: opts.redirect || 'follow' }).then(async (r) => ({
      status: r.status, url: r.url, location: r.headers.get('location'),
      body: (r.headers.get('content-type') || '').includes('html') ? await r.text() : (await r.arrayBuffer(), ''),
    })).catch((e) => ({ status: 0, error: e.message })));
  }
  return cache.get(key);
}

console.log(`Checking ${base}\n\nLegacy URLs`);
for (const p of LEGACY) {
  const r = await get(p);
  r.status === 200 ? ok(p) : bad(`${p} → ${r.status || r.error}`);
}

console.log('\nPrivacy policy anchors');
const policy = (await get('/privacy-policy.html')).body || '';
for (const id of POLICY_ANCHORS) policy.includes(`id="${id}"`) ? ok('#' + id) : bad('missing #' + id);

if (isVercel) {
  console.log('\nAliases (vercel.json)');
  for (const [from, to] of Object.entries(ALIASES)) {
    const r = await get(from, { redirect: 'manual' });
    const loc = r.location ? new URL(r.location, base).pathname : '';
    [301, 308].includes(r.status) && loc === to ? ok(`${from} → ${to}`) : bad(`${from} → ${r.status} ${loc}`);
  }
  const nf = await get('/this-page-does-not-exist');
  nf.status === 404 && /katori/.test(nf.body) ? ok('custom 404 page') : bad(`404 page → ${nf.status}`);
}

console.log('\nLinks, assets and anchors on every page');
for (const page of PAGES) {
  const { status, body } = await get(page);
  if (status !== 200) { bad(`${page} → ${status}`); continue; }
  const refs = new Set();
  for (const m of body.matchAll(/\s(?:href|src)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of body.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((s) => refs.add(s.trim().split(/\s+/)[0]));
  let n = 0;
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(ref) || ref.startsWith('/_vercel/')) continue;
    const url = new URL(ref, base + page);
    const target = url.pathname;
    const r = await get(target);
    if (r.status !== 200) { bad(`${page}: ${ref} → ${r.status || r.error}`); continue; }
    if (url.hash && url.hash.length > 1) {
      const id = decodeURIComponent(url.hash.slice(1));
      const html = target === new URL(page, base).pathname ? body : r.body;
      if (!html.includes(`id="${id}"`)) { bad(`${page}: ${ref} → no element #${id}`); continue; }
    }
    n++;
  }
  ok(`${page} (${n} internal references)`);
}

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll good.');
process.exit(failures ? 1 : 0);
