# KRANIUM PRESS

> A block-based page builder that exports plain HTML. It runs on [kranium.css](https://github.com/chog-pamp) + kranium.js, lives in one folder, and has no dependencies or build step.

<!-- NOTE: this README is an example draft, rewrite it in your own voice -->

## What it does

KraniumPress runs entirely in your browser. You drag blocks onto a canvas, edit them in the inspector, and export a standalone `.html` file. Host that file on Cloudflare Pages, GitHub Pages, Vercel, or any webhost that serves static files.

While you work, the page lives in localStorage as JSON. Exporting turns it into HTML. There's no account and no backend, so if you delete the builder your page keeps working.

## Quick start

```bash
git clone https://github.com/chog-pamp/kranium-press.git
cd kranium-press
python3 -m http.server 8080
# open http://localhost:8080
```

Any static file server works. The editor is three files plus the framework.

## Features

- 11 blocks: hero, heading, text, image, card grid, button row, alert, stats, quote, divider, spacer
- Live inspector that re-renders the canvas while you type
- Drag to reorder, plus move, duplicate, and delete buttons on every block
- Export to HTML or JSON, and import JSON back in
- Preview mode with a desktop/mobile width toggle
- Autosave, so a reload doesn't lose your page
- The framework's `k.config()` API works on exported pages, so you can change accent color, fonts, and radius from one call

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

The rail, the inspector, and the exporter all read from the same object, so a new block needs no wiring anywhere else.

## Why plain HTML?

A builder that exports what WordPress renders seemed more honest to me than one that exports a database row. The export is a file, and the file is yours to keep even if this project disappears tomorrow.

## License

GNU General Public License version 3. See [LICENSE](LICENSE).
