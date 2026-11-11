# Calwise Website

The marketing and support site for the Calwise iOS app, live at **https://calwise.tech**. It's a static site on Vercel: plain HTML, CSS and JavaScript, with no build step and no dependencies.

The home page follows "a day of eating". Each section is a time of day, and the background moves from a breakfast sunrise to a night sky as you scroll.

## URLs that must keep working

The app and the App Store link to this site, so these paths must never move or change:

| URL | Linked from |
|---|---|
| `/privacy-policy.html` | **The app** (Profile › Privacy Policy) and App Store Connect. Its section `id`s (`#3-optional-ai-features-and-openai` …) are linked from the support page. |
| `/`, `/index.html` | App Store listing |
| `/contact.html` | App Store support link |
| `/support.html` and its `#answer-id` anchors | Help links (the app or emails can deep-link to an answer, e.g. `support.html#delete-account`, or prefill the search with `support.html?q=sync`) |
| `/PRIVACY_POLICY.md`, `/styles.css`, `/icon.png`, `/Home.png`, `/Progress 1.png`, `/Progress 2.png`, `/app-screenshot.png` | Older links and cached social previews. Keep the files even though the pages now use `assets/`. |

`vercel.json` adds short aliases (`/privacy`, `/support`, `/help`, `/faq`, `/contact`) as redirects to the `.html` pages. **Don't turn on `cleanUrls`**: it would redirect `/privacy-policy.html`, the URL the app opens.

Before merging, run the link checker against the Vercel preview:

```sh
node scripts/check-links.mjs https://<preview>.vercel.app
```

To run it locally, serve the folder (`python3 -m http.server 4173`) and run `node scripts/check-links.mjs`.

## Files

| Path | What it is |
|---|---|
| `index.html` | Home |
| `support.html` | Help centre: searchable FAQ, one `<details>` per answer |
| `contact.html` | Contact form. It posts to the Calwise Google Form (`formResponse`, fields `entry.912456393` name, `entry.564968103` email, `entry.900529363` message). The chosen topic is added to the start of the message. |
| `privacy-policy.html` | The policy. The text inside `<article class="policy">` is the legal text; change it only on purpose, together with `PRIVACY_POLICY.md`. |
| `404.html` | Served by Vercel for unknown paths, so it uses absolute (`/…`) links |
| `styles.css` | Shared tokens, type, header, footer, dark mode |
| `assets/css/home.css`, `assets/css/pages.css` | Page styles |
| `assets/js/site.js` | Header, mobile menu, light and dark toggle, reveal on scroll (every page) |
| `assets/js/home.js` | Home demos: the Hinglish logger, katori slider, five ways to log, streak, Monthly Wrapped |
| `assets/js/support.js`, `contact.js`, `policy.js` | Page behaviour |
| `assets/fonts/` | Self-hosted fonts (SIL OFL), so visitors' browsers don't contact Google: Fraunces, Instrument Sans, Tiro Devanagari Hindi, plus `band-*.woff2` for the dish band (Tiro Marathi, Tamil, Telugu, Kannada, Bangla and Gurmukhi; Noto Serif Gujarati and Malayalam). Each `band-*` file holds only the characters of its dish name. **If you change a dish in the band, download that font again** with Google Fonts' `text=` parameter. |
| `assets/img/` | Optimised screenshots (AVIF, WebP and JPEG), icons, App Store badges, `og.png` (social preview) |

The header and footer are repeated in each page. If you change the navigation, change it in all five pages.

## Things to know

- **Screenshots follow the theme.** Each phone has a `<picture class="for-light">` and a `<picture class="for-dark">` (e.g. `home-light-*` and `home2-*`), and only the visible one downloads. When you update a screen, update both.
- **The phones are drawn in CSS** (`.iphone` in `home.css`, iPhone 16 Pro proportions). Set a width on `.iphone`; the band, bezel, corners, Dynamic Island and buttons scale with it.
- **The theme choice is site-wide.** It's stored in `localStorage` (and `window.name` as a fallback) and re-applied on Back/Forward and across tabs. The small script in every page's `<head>` applies it before the first paint.
- **Every page works without JavaScript.** Demos show a finished state, answers are native `<details>`, and the form posts normally.
- **`prefers-reduced-motion` is respected**: no auto-playing demos, typing, marquee or parallax.
- **The home demos run in the browser** on a small table of sample foods. Nothing is sent anywhere. The streak demo uses the same rules as `CalwiseCore`'s `Streak`.
- **Analytics:** Vercel Web Analytics is on `index.html` and `contact.html` only, as section 10 of the privacy policy says. If you add it to another page, update the policy.

## Deploy

Vercel deploys `main` automatically, and every branch and pull request gets a preview URL. There's no build configuration.
