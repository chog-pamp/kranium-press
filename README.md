# KRANIUM PRESS

> A block-based page builder that outputs **plain HTML**. Built on [kranium.css](https://github.com/chog-pamp) + kranium.js. Zero dependencies, zero build step, one folder.

<!-- NOTE: this README is an example draft — rewrite it in your own voice -->

## What it is

KraniumPress is a website builder that runs entirely in your browser. You drag blocks onto a canvas, edit their content in an inspector panel, and export the result as a real, standalone `.html` file you can host anywhere — Cloudflare Pages, GitHub Pages, a USB stick.

There is no backend, no account, no lock-in. Your page is saved as JSON in `localStorage` while you work, and exported as HTML when you're done.

## Quick start

```bash
git clone https://github.com/chog-pamp/kranium-press.git
cd kranium-press
python3 -m http.server 8080
# open http://localhost:8080
```

That's it. Any static file server works — the editor is three files plus the framework.

## Features

- **11 blocks** — hero, heading, text, image, card grid, button row, alert, stats, quote, divider, spacer
- **Live inspector** — edit any block's props, canvas updates as you type
- **Drag to reorder** — HTML5 drag & drop, plus move/duplicate/delete buttons
- **Export HTML** — a real standalone page, framework-linked, XSS-escaped
- **Export / import JSON** — pages are portable data, not database rows
- **Preview mode** — hide the editor chrome, check desktop/mobile widths
- **Autosave** — localStorage, survives reloads
- **Themeable** — the framework's `k.config()` API works on exported pages (accent color, fonts, radius)

## Files

```
index.html    the editor shell
blocks.js     block library: schemas + HTML templates
editor.js     state, canvas, inspector, export/import
kranium.css   the framework (vendored)
kranium.js    framework behaviors (vendored)
```

## Adding your own block

Open `blocks.js` and add one entry:

```js
pricing: {
  label: "Pricing table",
  schema: {
    plans: { type: "textarea", def: "Free|0$/mo|basics\nPro|9$/mo|everything" },
  },
  tpl: p => `<div class="k-grid-auto-fit">${/* render p.plans */""}</div>`,
},
```

The editor picks it up automatically — rail, inspector, export.

## Why plain HTML?

Because a page builder that *outputs what WordPress renders* is more honest than one that outputs a database row. Export gives you a file; the file is yours. Delete the builder and your page still works.

## License

GPL-3.0 — see [LICENSE](LICENSE).
