/* KraniumPress — block library
   Each block: { label, schema: {prop: {type, def, options?, ph?}}, tpl(props) -> html }
   Types: text | textarea | select | url | number */

const BP = {
  hero: {
    label: "Hero",
    schema: {
      kicker: { type: "text", def: "HOMELAB", ph: "small text above the title" },
      title: { type: "text", def: "Your big title here" },
      sub: { type: "textarea", def: "One or two sentences under the title." },
      cta: { type: "text", def: "Get started" },
      ctaHref: { type: "url", def: "#" },
    },
    tpl: p => `<section class="k-hero" style="text-align:center;padding:80px 24px 64px">
  ${p.kicker ? `<div class="k-badge" style="letter-spacing:.25em;font-size:11px;opacity:.7">${esc(p.kicker)}</div>` : ""}
  <h1 class="k-display" style="font-size:clamp(38px,7vw,72px);margin:18px 0 14px">${esc(p.title)}</h1>
  <p style="max-width:620px;margin:0 auto 28px;opacity:.8">${esc(p.sub)}</p>
  ${p.cta ? `<a class="k-btn k-btn-primary" href="${esc(p.ctaHref)}">${esc(p.cta)}</a>` : ""}
</section>`,
  },
  heading: {
    label: "Heading",
    schema: {
      text: { type: "text", def: "Section heading" },
      level: { type: "select", def: "2", options: ["1", "2", "3"] },
    },
    tpl: p => `<h${p.level} class="k-headline" style="margin:34px 0 12px">${esc(p.text)}</h${p.level}>`,
  },
  text: {
    label: "Text",
    schema: {
      html: { type: "textarea", def: "Write your paragraph here. Keep it short and honest.", ph: "paragraph text" },
    },
    tpl: p => `<p style="max-width:720px;opacity:.85;line-height:1.7;margin:10px 0">${esc(p.html)}</p>`,
  },
  image: {
    label: "Image",
    schema: {
      src: { type: "url", def: "", ph: "https://..." },
      alt: { type: "text", def: "image description" },
      caption: { type: "text", def: "" },
    },
    tpl: p => p.src ? `<figure style="margin:26px 0">
  <img src="${esc(p.src)}" alt="${esc(p.alt)}" style="max-width:100%;border-radius:var(--k-radius-lg);border:1px solid var(--k-border)">
  ${p.caption ? `<figcaption style="font-size:12px;opacity:.6;margin-top:8px">${esc(p.caption)}</figcaption>` : ""}
</figure>` : `<div style="border:2px dashed var(--k-border);border-radius:var(--k-radius-lg);padding:56px;text-align:center;opacity:.5;margin:26px 0">Image — paste a URL in the inspector</div>`,
  },
  cards: {
    label: "Card grid",
    schema: {
      items: { type: "textarea", def: "First card|Say something interesting here.\nSecond card|Another short line.\nThird card|Three is a good number.", ph: "title|description (one per line)" },
    },
    tpl: p => {
      const rows = lines(p.items).map(l => {
        const [t, d] = splitBar(l);
        return `  <div class="k-card" style="padding:22px"><div class="k-headline" style="font-size:17px;margin:0 0 8px">${esc(t)}</div><div style="opacity:.75;font-size:14px;line-height:1.6">${esc(d || "")}</div></div>`;
      }).join("\n");
      return `<div class="k-grid-auto-fit" style="margin:20px 0">\n${rows}\n</div>`;
    },
  },
  buttons: {
    label: "Button row",
    schema: {
      buttons: { type: "textarea", def: "Primary|#\nSecondary|#", ph: "label|link (one per line)" },
    },
    tpl: p => {
      const rows = lines(p.buttons).map((l, i) => {
        const [t, h] = splitBar(l);
        const cls = i === 0 ? "k-btn k-btn-primary" : "k-btn";
        return `<a class="${cls}" href="${esc(h || "#")}">${esc(t)}</a>`;
      }).join("\n  ");
      return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin:22px 0">\n  ${rows}\n</div>`;
    },
  },
  alert: {
    label: "Alert",
    schema: {
      kind: { type: "select", def: "info", options: ["info", "success", "warning", "danger"] },
      text: { type: "textarea", def: "Something the visitor should know." },
    },
    tpl: p => `<div class="k-alert k-alert-${esc(p.kind)}" style="margin:20px 0">${esc(p.text)}</div>`,
  },
  stats: {
    label: "Stats row",
    schema: {
      items: { type: "textarea", def: "18|services running\n6|years of code\n99.9%|uptime", ph: "number|label (one per line)" },
    },
    tpl: p => {
      const rows = lines(p.items).map(l => {
        const [n, d] = splitBar(l);
        return `  <div style="text-align:center;padding:18px"><div class="k-display" style="font-size:34px;color:var(--k-accent-bright)">${esc(n)}</div><div style="font-size:12px;letter-spacing:.15em;opacity:.6;margin-top:4px">${esc(d || "")}</div></div>`;
      }).join("\n");
      return `<div class="k-grid-auto-fit" style="margin:24px 0;border:1px solid var(--k-border);border-radius:var(--k-radius-lg);padding:8px">\n${rows}\n</div>`;
    },
  },
  quote: {
    label: "Quote",
    schema: {
      text: { type: "textarea", def: "A quote worth putting on a page." },
      by: { type: "text", def: "Someone" },
    },
    tpl: p => `<blockquote class="k-blockquote" style="margin:26px 0;padding:18px 24px;border-left:3px solid var(--k-accent);border-radius:0 var(--k-radius-lg) var(--k-radius-lg) 0;background:var(--k-bg-card)">
  <div style="font-size:17px;line-height:1.6">${esc(p.text)}</div>
  ${p.by ? `<div style="font-size:12px;opacity:.6;margin-top:10px;letter-spacing:.1em">— ${esc(p.by)}</div>` : ""}
</blockquote>`,
  },
  divider: { label: "Divider", schema: {}, tpl: () => `<hr class="k-divider" style="margin:30px 0">` },
  spacer: {
    label: "Spacer",
    schema: { size: { type: "select", def: "md", options: ["sm", "md", "lg"] } },
    tpl: p => `<div style="height:${({ sm: 20, md: 48, lg: 96 })[p.size] || 48}px"></div>`,
  },
};

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function lines(s) {
  return String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
}
function splitBar(l) {
  const i = l.indexOf("|");
  return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
}
function defaultProps(type) {
  const b = BP[type]; const out = {};
  for (const k in b.schema) out[k] = b.schema[k].def;
  return out;
}

/* ---------- state <-> html ---------- */
function renderBlock(b) {
  const b2 = BP[b.type];
  if (!b2) return "";
  try { return b2.tpl(b.props); }
  catch (e) { return `<div class="k-alert k-alert-danger">Broken block (${esc(b.type)}): ${esc(e.message)}</div>`; }
}

function renderPage(state) {
  return state.blocks.map(renderBlock).join("\n");
}

function exportHTML(state) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(state.title)}</title>
<link rel="stylesheet" href="./kranium.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script defer src="./kranium.js"></script>
</head>
<body style="background:var(--k-bg-surface);color:var(--k-text-primary);margin:0;font-family:var(--k-font-sans)">
<main style="max-width:960px;margin:0 auto;padding:40px 20px 80px">
${renderPage(state)}
</main>
</body>
</html>`;
}

/* export for editor */
if (typeof window !== "undefined") window.KRP_BLOCKS = { BP, defaultProps, renderBlock, renderPage, exportHTML, esc };
