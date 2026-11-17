/* KraniumPress — editor
   State: { title, blocks: [{id, type, props}] } in localStorage key "krn-press-page" */

(function () {
  const LS_KEY = "krn-press-page";
  const { BP, defaultProps, renderBlock, renderPage, exportHTML, esc } = window.KRP_BLOCKS;

  const canvas = document.getElementById("krp-canvas");
  const rail = document.getElementById("krp-rail");
  const insp = document.getElementById("krp-insp");
  const titleIn = document.getElementById("krp-title");

  let state = load();
  let sel = null; // selected block id

  /* ---------- state ---------- */
  function fresh() {
    return {
      title: "My page",
      blocks: [
        { id: uid(), type: "hero", props: defaultProps("hero") },
        { id: uid(), type: "text", props: defaultProps("text") },
        { id: uid(), type: "cards", props: defaultProps("cards") },
      ],
    };
  }
  function uid() { return "b" + Math.random().toString(36).slice(2, 8); }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const s = JSON.parse(raw); if (s && Array.isArray(s.blocks)) return s; }
    } catch (e) {}
    return fresh();
  }
  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    flash("saved ✓");
  }
  function find(id) { return state.blocks.find(b => b.id === id); }
  function selBlock() { return sel ? find(sel) : null; }

  /* ---------- chrome ---------- */
  let flashT;
  function flash(msg) {
    const el = document.getElementById("krp-flash");
    el.textContent = msg; el.style.opacity = "1";
    clearTimeout(flashT);
    flashT = setTimeout(() => { el.style.opacity = "0"; }, 1400);
  }

  /* ---------- render ---------- */
  function renderAll() {
    titleIn.value = state.title;
    renderRail();
    renderCanvas();
    renderInsp();
  }

  function renderRail() {
    rail.innerHTML = "";
    for (const type in BP) {
      const btn = document.createElement("button");
      btn.className = "krp-rail-item";
      btn.textContent = BP[type].label;
      btn.title = "Add " + BP[type].label;
      btn.onclick = () => addBlock(type);
      rail.appendChild(btn);
    }
  }

  function addBlock(type, afterId) {
    const b = { id: uid(), type, props: defaultProps(type) };
    const at = afterId ? state.blocks.findIndex(x => x.id === afterId) + 1 : state.blocks.length;
    state.blocks.splice(at, 0, b);
    sel = b.id;
    renderAll();
  }

  function renderCanvas() {
    canvas.innerHTML = "";
    if (!state.blocks.length) {
      canvas.innerHTML = `<div style="text-align:center;opacity:.4;padding:60px 20px">Empty page — add blocks from the left.</div>`;
      return;
    }
    state.blocks.forEach((b, i) => {
      const wrap = document.createElement("div");
      wrap.className = "krp-block" + (b.id === sel ? " krp-sel" : "");
      wrap.draggable = true;
      wrap.dataset.bid = b.id;

      const bar = document.createElement("div");
      bar.className = "krp-bar";
      bar.innerHTML =
        `<span class="krp-bar-name">${esc(BP[b.type].label)}</span>` +
        `<span class="krp-bar-acts">` +
        `<button data-act="up" title="Move up">↑</button>` +
        `<button data-act="down" title="Move down">↓</button>` +
        `<button data-act="dup" title="Duplicate">⧉</button>` +
        `<button data-act="del" title="Delete">×</button></span>`;
      bar.querySelector('[data-act="up"]').onclick = e => { e.stopPropagation(); move(i, -1); };
      bar.querySelector('[data-act="down"]').onclick = e => { e.stopPropagation(); move(i, 1); };
      bar.querySelector('[data-act="dup"]').onclick = e => {
        e.stopPropagation();
        state.blocks.splice(i + 1, 0, { id: uid(), type: b.type, props: JSON.parse(JSON.stringify(b.props)) });
        renderAll();
      };
      bar.querySelector('[data-act="del"]').onclick = e => {
        e.stopPropagation();
        state.blocks.splice(i, 1);
        if (sel === b.id) sel = null;
        renderAll();
      };

      const body = document.createElement("div");
      body.className = "krp-body";
      body.innerHTML = renderBlock(b);
      body.onclick = () => { sel = b.id; renderAll(); };

      wrap.onclick = () => { sel = b.id; renderCanvas(); renderInsp(); };

      /* drag reorder */
      wrap.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", b.id); wrap.classList.add("krp-drag"); });
      wrap.addEventListener("dragend", () => wrap.classList.remove("krp-drag"));
      wrap.addEventListener("dragover", e => { e.preventDefault(); wrap.classList.add("krp-over"); });
      wrap.addEventListener("dragleave", () => wrap.classList.remove("krp-over"));
      wrap.addEventListener("drop", e => {
        e.preventDefault();
        wrap.classList.remove("krp-over");
        const from = state.blocks.findIndex(x => x.id === e.dataTransfer.getData("text/plain"));
        if (from < 0 || state.blocks[from].id === b.id) return;
        const [moved] = state.blocks.splice(from, 1);
        const to = state.blocks.findIndex(x => x.id === b.id);
        state.blocks.splice(from < to ? to + 1 : to, 0, moved);
        renderAll();
      });

      wrap.appendChild(bar);
      wrap.appendChild(body);
      canvas.appendChild(wrap);
    });
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= state.blocks.length) return;
    const [b] = state.blocks.splice(i, 1);
    state.blocks.splice(j, 0, b);
    renderAll();
  }

  /* ---------- inspector ---------- */
  function renderInsp() {
    const b = selBlock();
    if (!b) { insp.innerHTML = `<div class="krp-insp-empty">Select a block on the canvas to edit it.</div>`; return; }
    const schema = BP[b.type].schema;
    let html = `<div class="krp-insp-head">${esc(BP[b.type].label)}</div>`;
    for (const key in schema) {
      const f = schema[key];
      const val = b.props[key] == null ? "" : b.props[key];
      html += `<label class="krp-field"><span>${esc(key)}</span>`;
      if (f.type === "textarea") {
        html += `<textarea data-key="${esc(key)}" rows="4" placeholder="${esc(f.ph || "")}">${esc(val)}</textarea>`;
      } else if (f.type === "select") {
        html += `<select data-key="${esc(key)}">` + f.options.map(o =>
          `<option value="${esc(o)}"${String(val) === o ? " selected" : ""}>${esc(o)}</option>`).join("") + `</select>`;
      } else {
        html += `<input data-key="${esc(key)}" value="${esc(val)}" placeholder="${esc(f.ph || "")}">`;
      }
      html += `</label>`;
    }
    insp.innerHTML = html;

    insp.querySelectorAll("[data-key]").forEach(inp => {
      inp.addEventListener("input", () => {
        b.props[inp.dataset.key] = inp.value;
        renderCanvas();
        debSave();
      });
    });
  }

  let saveT;
  function debSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      flash("autosaved");
    }, 800);
  }

  /* ---------- top bar actions ---------- */
  titleIn.addEventListener("input", () => { state.title = titleIn.value; debSave(); });

  document.getElementById("krp-save").onclick = save;
  document.getElementById("krp-add").onclick = () => { const t = selBlock(); addBlock(t ? t.type : "text", t ? t.id : null); };

  document.getElementById("krp-export").onclick = () => {
    const html = exportHTML(state);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = (state.title || "page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    flash("html exported");
  };

  document.getElementById("krp-json").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = "page.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  document.getElementById("krp-import").onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (s && Array.isArray(s.blocks)) { state = s; sel = null; save(); renderAll(); flash("imported"); }
        else flash("not a KraniumPress file");
      } catch (err) { flash("bad file"); }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  document.getElementById("krp-preview").onclick = () => {
    document.body.classList.toggle("krp-preview");
    const on = document.body.classList.contains("krp-preview");
    document.getElementById("krp-preview").textContent = on ? "✎ Edit" : "👁 Preview";
  };

  document.getElementById("krp-width").onchange = e => {
    canvas.style.maxWidth = e.target.value === "mobile" ? "420px" : "960px";
    canvas.style.margin = e.target.value === "mobile" ? "0 auto" : "";
  };

  /* reset */
  document.getElementById("krp-reset").onclick = () => {
    if (!confirm("Start over? Current page is replaced with a fresh one.")) return;
    state = fresh(); sel = null; save(); renderAll();
  };

  /* init */
  renderAll();
  if (window.k && window.k.init) window.k.init(canvas);
})();
