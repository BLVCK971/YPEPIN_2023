/* Aivocat — interface locale, sans dépendance.
   Tout ce qui vient du serveur — réponses du modèle, texte des pièces, noms
   de fichiers — est inséré comme TEXTE, jamais comme HTML : une pièce qui
   contiendrait du balisage ne doit pas pouvoir s'exécuter dans le navigateur. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    caseId: null, cases: [], storage: null, thread: [], conversationId: null, conversations: [],
    usb: { volumes: [], orphans: [], localAllowed: true, available: true, defaultMemory: "" },
    knownRunning: new Set(),
    ingestTimer: null, logsTimer: null, askTimer: null, usbTimer: null, jobsTimer: null, pendingTimer: null,
    pending: null,
    brief: null,
    page: "dossiers", library: null, libraryTimer: null,
  };

  // ---------------------------------------------------------------- utilitaires

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else if (value !== null && value !== undefined) node.setAttribute(key, value);
    }
    for (const child of children) {
      if (child === null || child === undefined) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function toast(message, kind) {
    const node = el("div", { class: "toast" + (kind ? " " + kind : ""), text: message });
    $("toasts").append(node);
    setTimeout(() => node.remove(), kind === "error" ? 9000 : 4500);
  }

  async function api(method, path, body) {
    const options = { method, headers: {} };
    if (body instanceof FormData) options.body = body;
    else if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    if (response.status === 204) return null;
    let payload = null;
    try { payload = await response.json(); } catch (_) { /* pas de corps */ }
    if (!response.ok) {
      const message = payload && (payload.message || payload.detail);
      const detail = payload && payload.detail && payload.message ? " — " + payload.detail : "";
      const error = new Error((typeof message === "string" ? message : `Erreur ${response.status}`) + detail);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  const fmtMs = (ms) => ms == null ? "–" : ms >= 1000 ? (ms / 1000).toFixed(1) + " s" : ms + " ms";
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("fr-FR") : "jamais";
  const fmtDateShort = (iso) => iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "jamais";
  const fmtBytes = (n) => n == null ? "" : n >= 1e9 ? (n / 1e9).toFixed(1).replace(".", ",") + " Go" : Math.round(n / 1e6) + " Mo";
  const isUsb = (storage) => !!(storage && storage.kind === "usb");
  const labelOf = (caseId) => { const c = state.cases.find((x) => x.case_id === caseId); return c ? c.label : caseId; };

  // Identifiant technique déduit du nom : « Durand c/ Martin » → DURAND_C_MARTIN.
  function slugId(label) {
    const ascii = String(label || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let id = ascii.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
    if (!/^[A-Z0-9]/.test(id)) id = "DOSSIER_" + id;
    return id.replace(/_+$/, "") || "DOSSIER_" + Date.now().toString(36).toUpperCase();
  }

  function bindAutoId(labelId, idId) {
    const idInput = $(idId);
    idInput.addEventListener("input", () => { idInput.dataset.touched = idInput.value ? "1" : ""; });
    $(labelId).addEventListener("input", () => { if (!idInput.dataset.touched) idInput.value = slugId($(labelId).value); });
  }

  // ---------------------------------------------------------------- thème

  const THEME_KEY = "aivocat.theme";
  const darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedTheme() {
    try { const t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : null; } catch (_) { return null; }
  }

  function currentTheme() {
    return document.documentElement.dataset.theme || (darkQuery && darkQuery.matches ? "dark" : "light");
  }

  function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    $("btn-theme").textContent = theme === "dark" ? "☀" : "☾";
    $("btn-theme").title = theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre";
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* navigation privée */ } }
  }

  function initTheme() {
    applyTheme(storedTheme() || currentTheme(), false);
    if (darkQuery) darkQuery.addEventListener("change", () => { if (!storedTheme()) applyTheme(darkQuery.matches ? "dark" : "light", false); });
  }

  // ---------------------------------------------------------------- modèles

  async function loadModels() {
    try {
      const m = await api("GET", "/api/models");
      if (m.app && m.app.display_name) {
        document.title = m.app.display_name;
        $("brand-name").textContent = m.app.display_name;
      }
      const ok = m.llm.available && m.embeddings.available;
      $("models-text").textContent = ok ? "Chargement…" : "Un modèle manque";
      $("models-dot").className = "dot " + (ok ? "dot-wait" : "dot-ko");
      renderModelsPopover(m);
      if (ok) warmUp();
    } catch (error) {
      $("models-text").textContent = "modèles : " + error.message;
      $("models-dot").className = "dot dot-ko";
    }
  }

  // Chaque modèle : son rôle, son nom, où il est sur le PC, s'il est chargé.
  function renderModelsPopover(m) {
    const rows = [
      ["Rédaction des réponses", m.llm],
      ["Recherche dans les pièces", m.embeddings],
      ["Classement des passages", m.reranker],
      ["Lecture des scans (OCR)", m.ocr],
    ];
    const table = el("table", {});
    for (const [role, x] of rows) {
      table.append(el("tr", {},
        el("td", { class: "role", text: role }),
        el("td", {},
          el("div", { class: "name", text: x.model || x.engine || "—" }),
          x.location ? el("div", { class: "where", text: x.location }) : null),
        el("td", { class: "state" }, modelState(x)),
      ));
    }
    const journal = el("button", { class: "btn link mini", type: "button", text: "Journal technique",
      onclick: () => { const f = $("footer"); f.hidden = !f.hidden; if (!f.hidden) pollLogs(); } });
    $("models-pop").replaceChildren(table, journal);
  }

  function modelState(x) {
    if (x.enabled === false) return el("span", { class: "pill pill-pending", text: "désactivé" });
    if (x.available === false) return el("span", { class: "pill pill-error", text: "absent", title: x.reason || "" });
    const bits = [];
    if (x.loaded) {
      let where = "chargé";
      if (x.device) where += " · " + (x.device === "cuda" ? "carte graphique" : x.device === "cpu" ? "processeur" : "carte + processeur");
      if (x.vram_bytes) where += " · " + fmtBytes(x.vram_bytes);
      bits.push(where);
    } else bits.push("sur disque");
    if (x.size_bytes) bits.push(fmtBytes(x.size_bytes));
    return el("span", { class: "pill " + (x.loaded ? "pill-ok" : "pill-pending"), text: bits.join(" · ") });
  }

  async function refreshModelsQuietly() {
    try { renderModelsPopover(await api("GET", "/api/models")); } catch (_) { /* accessoire */ }
  }

  async function warmUp() {
    try {
      const result = await api("POST", "/api/models/warmup");
      if (result.ok) {
        $("models-dot").className = "dot dot-ok";
        $("models-text").textContent = "Prêt";
      } else {
        $("models-dot").className = "dot dot-ko";
        $("models-text").textContent = "Un modèle manque";
        toast("Un modèle n'est pas disponible : " + Object.keys(result.errors).join(", "), "warn");
      }
    } catch (error) {
      $("models-dot").className = "dot dot-ko";
      $("models-text").textContent = "Modèles indisponibles";
      toast("Préchauffage : " + error.message, "warn");
    }
    refreshModelsQuietly();
  }

  // ---------------------------------------------------------------- vues

  function showView(name) {
    if (name !== "case") { clearTimeout(state.pendingTimer); state.pending = null; }
    $("empty-state").hidden = name !== "empty";
    $("view-add").hidden = name !== "add";
    $("case-view").hidden = name !== "case";
    $("dashboard").hidden = name !== "case";
  }

  // ---------------------------------------------------------------- clés et emplacements

  async function loadUsb(showErrors) {
    try {
      const u = await api("GET", "/api/usb");
      state.usb.available = true;
      state.usb.volumes = u.volumes;
      state.usb.orphans = u.orphans;
      state.usb.localAllowed = u.local_cases_allowed;
      state.usb.defaultMemory = u.default_memory_root || "";
      $("add-local-choice").hidden = !u.local_cases_allowed;
      renderKeyChips();
      return u;
    } catch (error) {
      // Fonction désactivée dans la configuration : pas de clés listées.
      state.usb.available = false;
      state.usb.volumes = [];
      renderKeyChips();
      if (showErrors) toast("Clés : " + error.message, "warn");
      return null;
    }
  }

  function renderKeyChips() {
    const chips = $("key-chips");
    chips.replaceChildren();
    if (state.usb.volumes.length) chips.append(el("span", { class: "muted small", text: "Clés détectées :" }));
    for (const v of state.usb.volumes) {
      const chip = el("button", { class: "key-chip", type: "button",
        title: `${v.root} · n° de série ${v.serial}` + (v.simulated ? " · simulée" : "") },
        `${v.label} (${v.root})`, v.read_only ? el("span", { class: "ro", text: " · lecture seule" }) : null);
      chip.addEventListener("click", () => { $("add-documents").value = v.root; $("add-documents").focus(); });
      chips.append(chip);
    }
    const orphans = $("orphan-list");
    orphans.replaceChildren();
    for (const o of state.usb.orphans) {
      const where = o.documents_volume_label || o.documents_path || o.documents_volume_serial;
      orphans.append(el("li", { class: "orphan", text:
        `${o.label || o.case_id} : données de l'assistant présentes dans ${o.memory_root}, pièces introuvables (${where}). Rebranchez la clé, puis « Actualiser ».` }));
    }
    fillDatalist($("volume-roots"), state.usb.volumes);
    fillDatalist($("writable-roots"), state.usb.volumes.filter((v) => !v.read_only));
    $("add-memory-hint").textContent = state.usb.defaultMemory
      ? `(par défaut : ${state.usb.defaultMemory})`
      : "(par défaut : avec les pièces, si l'emplacement est inscriptible)";
  }

  function fillDatalist(datalist, volumes) {
    datalist.replaceChildren(...volumes.map((v) => el("option", { value: v.root, text: v.label })));
  }

  function pollUsb() {
    clearTimeout(state.usbTimer);
    if (!state.usb.available) return;
    state.usbTimer = setTimeout(async () => {
      const before = state.cases.filter((c) => isUsb(c.storage)).map((c) => c.case_id).join("|");
      const u = await loadUsb(false);
      if (u) {
        const after = u.cases.map((c) => c.case_id).join("|");
        // Une clé branchée ou retirée : la liste des dossiers change.
        if (after !== before) {
          await loadCases().catch(() => {});
          if (state.caseId && !state.cases.some((c) => c.case_id === state.caseId)) {
            toast("Le dossier ouvert n'est plus disponible : une clé a été retirée.", "warn");
            state.caseId = null;
            showView("empty");
          }
        }
      }
      pollUsb();
    }, 8000);
  }

  // ---------------------------------------------------------------- page d'ajout

  function openAddPage() {
    state.caseId = null;
    renderCases();
    showView("add");
    loadUsb(false);
    $("add-label").focus();
  }

  function syncAddSource() {
    const source = document.querySelector('input[name="source"]:checked').value;
    $("add-existing").hidden = source !== "existing";
    $("add-memory-field").hidden = source !== "existing";
    $("btn-add-submit").textContent = source === "existing" ? "Ouvrir et analyser" : "Créer le dossier";
  }

  // Fenêtre native « Sélectionner un dossier » : ouverte par le serveur, qui
  // tourne sur ce même ordinateur.
  async function pickFolder(inputId, buttonId, title) {
    const button = $(buttonId);
    button.disabled = true;
    try {
      const r = await api("POST", "/api/system/pick-folder", { title, initial: $(inputId).value.trim() || null });
      if (r.path) $(inputId).value = r.path;
    } catch (error) {
      toast(error.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function submitAdd(event) {
    event.preventDefault();
    const label = $("add-label").value.trim();
    const caseId = $("add-case-id").value.trim() || slugId(label);
    const source = document.querySelector('input[name="source"]:checked').value;
    const status = $("add-status");
    $("btn-add-submit").disabled = true;
    try {
      if (source === "local") {
        status.textContent = "Création…";
        await api("POST", "/api/cases", { case_id: caseId, label });
        toast(`Dossier « ${label} » créé. Déposez vos pièces, puis « Analyser les pièces ».`);
      } else {
        const documentsRoot = $("add-documents").value.trim();
        if (!documentsRoot) { toast("Indiquez où sont les pièces.", "warn"); return; }
        status.textContent = "Ouverture…";
        const memoryRoot = $("add-memory").value.trim();
        await api("POST", "/api/usb/mount", { documents_root: documentsRoot, memory_root: memoryRoot || null, case_id: caseId, label });
        toast(`Dossier « ${label} » ouvert.`);
      }
      status.textContent = "";
      $("form-add").reset();
      delete $("add-case-id").dataset.touched;
      syncAddSource();
      await loadCases();
      await selectCase(caseId);
      if (source !== "local") await startIngest(false);
    } catch (error) {
      status.textContent = "";
      toast(error.message, "error");
    } finally {
      $("btn-add-submit").disabled = false;
    }
  }

  // ---------------------------------------------------------------- dossiers

  async function loadCases() {
    const body = await api("GET", "/api/cases");
    state.cases = body.cases;
    renderCases();
  }

  function renderCases() {
    const list = $("case-list");
    list.replaceChildren();
    if (!state.cases.length) {
      list.append(el("li", { class: "muted small", text: "Aucun dossier pour l'instant." }));
      return;
    }
    for (const c of state.cases) {
      const button = el("button", {
        class: "case-item" + (c.case_id === state.caseId ? " active" : ""),
        type: "button", onclick: () => selectCase(c.case_id),
      },
        el("span", { class: "label", text: c.label }),
        c.case_id !== c.label ? el("span", { class: "id", text: c.case_id }) : null,
        el("span", { class: "counts" },
          isUsb(c.storage) ? el("span", { class: "kind", text: "clé" }) : null,
          c.documents ? `${c.documents} pièce(s)` : "aucune pièce"),
      );
      list.append(el("li", {}, button));
    }
  }

  async function selectCase(caseId) {
    if (state.page !== "dossiers") showPage("dossiers");
    state.caseId = caseId;
    renderCases();
    showView("case");
    await loadConversations(true);
    await refreshCase();
  }

  async function refreshCase() {
    if (!state.caseId) return;
    const [info, docs, status] = await Promise.all([
      api("GET", `/api/cases/${state.caseId}`),
      api("GET", `/api/cases/${state.caseId}/documents`),
      api("GET", `/api/cases/${state.caseId}/ingest/status`),
    ]);
    state.storage = info.storage;
    $("case-title").textContent = info.label;
    $("case-title").title = `Identifiant : ${info.case_id} · ${info.documents} pièce(s) · ${info.chunks} passage(s)`;
    applyStorage(info.storage);
    renderDocuments(docs.documents);
    renderIngestStatus(status);
    renderSteps(info, docs.documents, status);
    loadBrief(info);
    if (status.state === "running") scheduleIngestPoll();
    else checkPending();
    const listed = state.cases.find((c) => c.case_id === info.case_id);
    if (listed) { listed.documents = info.documents; listed.chunks = info.chunks; renderCases(); }
  }

  // ---------------------------------------------------------------- pages et bibliothèque

  function showPage(page) {
    state.page = page;
    document.body.classList.toggle("page-bibliotheque", page === "bibliotheque");
    for (const b of document.querySelectorAll("#pagenav .nav-item")) b.classList.toggle("active", b.dataset.page === page);
    $("view-library").hidden = page !== "bibliotheque";
    if (page === "bibliotheque") {
      $("empty-state").hidden = true; $("view-add").hidden = true; $("case-view").hidden = true; $("dashboard").hidden = true;
      loadLibrary();
    } else {
      clearTimeout(state.libraryTimer);
      showView(state.caseId ? "case" : "empty");
    }
  }

  async function loadLibrary() {
    try {
      state.library = await api("GET", "/api/library");
      renderLibrary();
    } catch (error) { toast(error.message, "error"); }
  }

  function renderLibrary() {
    const lib = state.library; if (!lib) return;
    $("library-dir").textContent = lib.dir;
    const list = $("library-list");
    list.replaceChildren();
    const packs = new Map(lib.packs.map((p) => [p.slug, p]));
    const rows = [];
    for (const p of lib.packs) rows.push({ pack: p, folder: null });
    for (const f of lib.folders) {
      const row = rows.find((r) => r.pack && r.pack.slug === f.slug);
      if (row) row.folder = f; else rows.push({ pack: null, folder: f });
    }
    if (!rows.length) {
      list.append(el("p", { class: "muted", text: "Aucun recueil pour l'instant : déposez un dossier de documents dans la bibliothèque, il apparaîtra ici." }));
      return;
    }
    let running = false;
    for (const { pack, folder } of rows) {
      const name = pack ? pack.name : folder.name;
      const kind = pack ? (pack.kind === "library" ? "Documents du cabinet" : "Textes officiels") : "Documents du cabinet";
      const meta = [];
      if (pack) {
        meta.push(pack.kind === "library" ? `${pack.articles} fichier(s) lus` : `${pack.articles} article(s)`);
        meta.push(`textes au ${fmtVersion(pack.version)}`);
        if (pack.size_bytes) meta.push(fmtBytes(pack.size_bytes));
        if (!pack.compatible) meta.push("à reconstruire pour le modèle actuel");
      }
      if (folder) meta.push(`${folder.files} fichier(s) déposés` + (pack ? "" : " · pas encore analysé"));
      const job = folder && folder.job;
      const busy = !!(job && job.state === "running");
      running = running || busy;

      const controls = el("div", { class: "library-controls" });
      if (pack) {
        const input = el("input", { type: "checkbox", id: `lib-${pack.slug}` });
        input.checked = !!pack.active; input.disabled = !pack.compatible;
        input.addEventListener("change", () => setPackActive(pack.slug, input.checked, input));
        controls.append(el("label", { class: "switch", title: "Consulté pour tous les dossiers quand il est chargé" }, input,
          el("span", { class: "switch-text", text: input.checked ? "Chargé" : "Déchargé" })));
      }
      if (folder) {
        const button = el("button", { class: "btn mini" + (pack ? "" : " btn-primary"), type: "button",
          text: busy ? "Analyse en cours…" : (pack ? "Réanalyser" : "Analyser"),
          title: "Lit, découpe et prépare les documents de ce recueil (peut prendre plusieurs minutes)" });
        button.disabled = busy;
        button.addEventListener("click", () => buildFolder(folder.name, button));
        controls.append(button);
      }
      if (job && job.state !== "running" && job.report) {
        const r = job.report; const c = r.counters || {};
        controls.append(el("span", { class: "muted small", text: r.status === "error" ? "Analyse interrompue" : `${c.ok || 0} lu(s), ${c.error || 0} en erreur` }));
      }
      list.append(el("div", { class: "library-row" + (pack && pack.active ? " on" : "") },
        el("div", { class: "library-main" },
          el("div", { class: "library-name" }, el("strong", { text: name }), el("span", { class: "pill pill-pending kind", text: kind })),
          el("div", { class: "muted small", text: meta.join(" · "), title: pack ? (pack.texts || []).map((t) => t.short_title).join(" · ") : (folder ? folder.path : "") })),
        controls));
    }
    clearTimeout(state.libraryTimer);
    if (running) state.libraryTimer = setTimeout(loadLibrary, 3000);
  }

  const fmtVersion = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v.split("-").reverse().join("/") : (v || "");

  async function setPackActive(slug, active, input) {
    try {
      await api("PUT", `/api/library/packs/${encodeURIComponent(slug)}`, { active });
      toast(active ? "Recueil chargé : il est consulté pour tous les dossiers." : "Recueil déchargé.");
      await loadLibrary();
    } catch (error) { input.checked = !active; toast(error.message, "error"); }
  }

  async function buildFolder(name, button) {
    button.disabled = true;
    try {
      await api("POST", `/api/library/folders/${encodeURIComponent(name)}/build`);
      toast(`Analyse du recueil « ${name} » lancée.`);
      pollJobs();
      await loadLibrary();
    } catch (error) { button.disabled = false; toast(error.message, "error"); }
  }

  // La fiche du dossier : rédigée à la fin de chaque analyse, montrée ici, et
  // donnée en contexte à chaque question de la conversation.
  async function loadBrief(info) {
    const caseId = state.caseId;
    const text = $("brief-text"); const meta = $("brief-meta");
    try {
      const brief = await api("GET", `/api/cases/${caseId}/brief`);
      if (state.caseId !== caseId) return;
      state.brief = brief;
      text.replaceChildren(...paragraphsWithMarkers(brief.text, "brief"));
      const stale = info && brief.documents !== info.documents;
      meta.textContent = `Établie le ${fmtDate(brief.generated_at)} à partir de ${brief.documents} pièce(s)` +
        (stale ? " — des pièces ont changé depuis : mettez la fiche à jour." : ".");
      $("btn-brief").textContent = "Mettre à jour la fiche";
      $("btn-brief-open").disabled = false;
      $("btn-brief-copy").disabled = false;
    } catch (_) {
      state.brief = null;
      text.replaceChildren(el("span", { class: "muted", text: "Pas encore de fiche : elle est rédigée à la fin de l'analyse." }));
      meta.textContent = "";
      $("btn-brief").textContent = "Rédiger la fiche";
      $("btn-brief-open").disabled = true;
      $("btn-brief-copy").disabled = true;
      closeFiche();
    }
  }

  // La fiche en pleine page : le texte se lit d'un bloc, se sélectionne, se
  // copie, s'enregistre et s'imprime (seule : le reste de la page disparaît
  // à l'impression). Le petit cadre du tableau de bord ne le permettait pas.
  function openFiche() {
    const brief = state.brief;
    if (!brief || !state.caseId) { toast("Pas encore de fiche pour ce dossier."); return; }
    const caseId = state.caseId;
    $("fiche-title").textContent = `Fiche du dossier — ${$("case-title").textContent}`;
    $("fiche-meta").textContent = `Établie le ${fmtDate(brief.generated_at)} à partir de ${brief.documents} pièce(s), par l'assistant local.`;
    $("fiche-text").replaceChildren(...paragraphsWithMarkers(brief.text, "fiche"));
    const sources = $("fiche-sources");
    sources.replaceChildren();
    if (brief.sources && brief.sources.length) {
      const list = el("ol");
      for (const s of brief.sources) {
        list.append(el("li", { id: `fiche-src-${s.index}` },
          el("span", { class: "label", text: s.label || `S${s.index}` }),
          el("span", { text: s.citation || s.filename || "" })));
      }
      sources.append(el("h3", { text: "Pièces citées" }), list);
    }
    const link = $("fiche-download");
    link.href = `/api/cases/${encodeURIComponent(caseId)}/brief/export?format=txt`;
    link.setAttribute("download", `fiche-${caseId}.txt`);
    $("fiche-overlay").hidden = false;
    document.body.classList.add("fiche-open");
    $("fiche-close").focus();
  }

  function closeFiche() {
    const overlay = $("fiche-overlay");
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove("fiche-open");
  }

  // Le texte de la fiche, tel que le serveur l'exporte (même forme que
  // `brief_as_text`) : composé ici, sans aller-retour, pour que la copie reste
  // dans le geste de clic — certains navigateurs refusent le presse-papiers
  // après une attente réseau.
  function ficheAsText(brief, label) {
    const title = `Fiche du dossier — ${label}`;
    const lines = [title, "=".repeat(title.length)];
    const origin = brief.documents ? ` à partir de ${brief.documents} pièce(s)` : "";
    lines.push(`Établie le ${fmtDate(brief.generated_at)}${origin}, par l'assistant local.`, "");
    lines.push(String(brief.text || "").replace(/\*\*|__/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim());
    const sources = brief.sources || [];
    if (sources.length) {
      lines.push("", "Pièces citées", "-".repeat("Pièces citées".length));
      for (const s of sources) lines.push(`[${s.label || "S" + s.index}] ${s.citation || s.filename || ""}`);
    }
    lines.push("", "Rédigée automatiquement à partir des pièces analysées : à vérifier avant tout usage.");
    return lines.join("\n") + "\n";
  }

  async function copyFiche() {
    if (!state.caseId || !state.brief) { toast("Pas encore de fiche pour ce dossier."); return; }
    try {
      await writeClipboard(ficheAsText(state.brief, $("case-title").textContent));
      toast("Fiche copiée : collez-la où vous voulez.");
    } catch (error) {
      toast(error.message || "Copie impossible.", "error");
    }
  }

  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return; } catch (_) { /* repli ci-dessous */ }
    }
    // Navigateur sans presse-papiers moderne (ou page servie en http sur une
    // autre machine) : la copie passe par une zone de texte hors écran.
    const area = el("textarea", { class: "clip" });
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Le navigateur a refusé la copie : ouvrez la fiche en pleine page et sélectionnez le texte.");
  }

  async function rebuildBrief() {
    if (!state.caseId) return;
    const caseId = state.caseId;
    const button = $("btn-brief"); const status = $("brief-status");
    button.disabled = true;
    const requestId = newRequestId();
    const started = Date.now();
    let phase = "queued";
    const timer = setInterval(async () => {
      const s = Math.round((Date.now() - started) / 1000);
      try {
        const p = await api("GET", `/api/cases/${caseId}/ask/progress/${requestId}`);
        phase = p.phase;
      } catch (_) { /* pas encore enregistrée */ }
      status.textContent = `✳ ${s} s · ${PHASE_LABELS[phase] || phase}`;
    }, 900);
    try {
      await api("POST", `/api/cases/${caseId}/brief`, { request_id: requestId });
      toast("Fiche du dossier mise à jour.");
      if (state.caseId === caseId) await loadBrief(await api("GET", `/api/cases/${caseId}`));
    } catch (error) {
      toast(error.message, "error");
    } finally {
      clearInterval(timer);
      status.textContent = "";
      button.disabled = false;
    }
  }

  // Ce qui attend d'être analysé : pièces ajoutées, modifiées ou retirées du
  // dossier depuis la dernière analyse, et fichiers que l'application ne lit
  // pas. Vérifié à l'ouverture du dossier puis toutes les 30 s.
  async function checkPending() {
    clearTimeout(state.pendingTimer);
    const caseId = state.caseId;
    if (!caseId) return;
    try {
      const p = await api("GET", `/api/cases/${caseId}/pending`);
      if (state.caseId !== caseId) return;
      state.pending = p;
      renderPending(p);
    } catch (error) {
      // Dossier disparu (fermé, supprimé, autre configuration) : on cesse de
      // l'interroger toutes les 30 s ; le reste est accessoire, on réessaiera.
      if (error && error.status === 404) return;
    }
    state.pendingTimer = setTimeout(checkPending, 30000);
  }

  function renderPending(p) {
    const node = $("pending-status");
    const button = $("btn-index");
    const parts = [];
    if (p.new.length) parts.push(`${p.new.length} nouvelle(s) : ${p.new.slice(0, 4).join(", ")}${p.new.length > 4 ? "…" : ""}`);
    if (p.modified.length) parts.push(`${p.modified.length} modifiée(s) : ${p.modified.slice(0, 4).join(", ")}${p.modified.length > 4 ? "…" : ""}`);
    if (p.removed.length) parts.push(`${p.removed.length} retirée(s) du dossier`);
    const unsupported = (p.unsupported || []).filter((u) => !/inchang/i.test(u.reason || ""));
    node.replaceChildren();
    node.hidden = !parts.length && !unsupported.length;
    button.classList.toggle("attention", parts.length > 0);
    if (parts.length) node.append(el("div", { text: `À analyser — ${parts.join(" · ")}. Cliquez sur « Analyser les pièces ».` }));
    if (unsupported.length) node.append(el("div", { class: "small", text: `Non lu(s) : ` + unsupported.map((u) => `${u.file} — ${u.reason}`).join(" · ") }));
    if (parts.length) {
      const s = $("step-pieces"); s.className = "step active";
      $("step-pieces-state").textContent = `${p.new.length + p.modified.length} à analyser`;
    }
  }

  // Les trois étapes du tableau de bord : où en est ce dossier ?
  function renderSteps(info, docs, status) {
    const set = (id, cls, text) => { const s = $(id); s.className = "step " + cls; $(id + "-state").textContent = text; };
    const running = status && status.state === "running";
    const pieces = docs.length;
    set("step-pieces", pieces ? "done" : "active", pieces ? "" : (isUsb(state.storage) ? "copiez des pièces sur la clé" : "déposez des pièces"));
    if (running) set("step-index", "running", "en cours…");
    else if (info.last_indexed_at) set("step-index", "done", fmtDateShort(info.last_indexed_at));
    else set("step-index", pieces ? "active" : "todo", "à lancer");
    set("step-ask", info.chunks ? "done" : "todo", info.chunks ? "" : "après l'analyse");
  }

  // Où sont les pièces de ce dossier, en clair — et un bouton pour y aller.
  // Un dossier « copié dans l'application » ne voit pas les fichiers ajoutés
  // ailleurs : c'est la source de confusion la plus fréquente.
  function applyStorage(storage) {
    const usb = isUsb(storage);
    $("dropzone").hidden = usb;
    $("btn-close-case").hidden = !usb;
    $("btn-delete-case").textContent = usb ? "Supprimer les données de l'assistant" : "Supprimer le dossier";
    $("btn-delete-case").title = usb
      ? "Efface l'analyse et les données de l'assistant pour ce dossier. Les pièces ne sont pas touchées."
      : "Supprime le dossier ET ses pièces";
    const banner = $("usb-banner");
    banner.hidden = false;
    banner.className = "status-line usb-banner compact" + (usb ? "" : " info");
    const openButton = el("button", { class: "btn mini", type: "button", text: "Ouvrir le dossier",
      title: "Ouvre le dossier des pièces dans l'explorateur Windows. Ajoutez-y des pièces, puis « Analyser les pièces »." });
    openButton.addEventListener("click", openFolder);
    if (usb) {
      banner.title = `Pièces : ${storage.documents_root}\nDonnées de l'assistant : ${storage.memory_root}`;
      banner.replaceChildren(...[
        el("span", {}, "Pièces sur ", el("strong", { text: `« ${storage.documents_volume.label} »` }),
          ", jamais modifiées · mémoire sur ", el("strong", { text: `« ${storage.memory_volume.label} »` })),
        storage.documents_present ? null : el("span", { class: "flag", text: "clé des pièces absente" }),
        openButton,
      ].filter(Boolean));
    } else {
      const root = storage && storage.documents_root ? storage.documents_root : "";
      banner.title = root ? `Pièces : ${root}` : "";
      const relocateButton = el("button", { class: "btn mini", type: "button", text: "Lire sur place plutôt…",
        title: "Les fichiers ajoutés ailleurs ne sont pas vus par une copie. Ce bouton fait lire les pièces directement dans leur dossier d'origine et supprime la copie." });
      relocateButton.addEventListener("click", relocateCase);
      banner.replaceChildren(
        el("span", {}, "Pièces ", el("strong", { text: "copiées dans l'application" })),
        openButton, relocateButton,
      );
    }
  }

  // Un dossier copié devient un dossier lu sur place : on choisit le dossier
  // d'origine, la copie est supprimée, les conversations restent.
  async function relocateCase() {
    if (!state.caseId) return;
    let picked;
    try {
      picked = await api("POST", "/api/system/pick-folder", { title: "Où sont les pièces d'origine de ce dossier ?" });
    } catch (error) { toast(error.message, "error"); return; }
    if (!picked || !picked.path) return;
    if (!window.confirm(`Lire les pièces depuis « ${picked.path} » et supprimer la copie dans l'application ?\n\nLes conversations sont conservées ; l'analyse sera relancée.`)) return;
    const caseId = state.caseId;
    try {
      await api("POST", `/api/usb/relocate/${encodeURIComponent(caseId)}`, { documents_root: picked.path });
      toast("Le dossier lit maintenant ses pièces sur place. Analyse relancée.");
      await loadUsb(false);
      await loadCases();
      await selectCase(caseId);
      await startIngest(false);
    } catch (error) { toast(error.message, "error"); }
  }

  async function openFolder() {
    if (!state.caseId) return;
    try {
      await api("POST", `/api/cases/${state.caseId}/open-folder`);
      toast("Dossier des pièces ouvert dans l'explorateur.");
    } catch (error) { toast(error.message, "error"); }
  }

  function renderDocuments(docs) {
    const body = $("docs-body");
    body.replaceChildren();
    $("docs-table").hidden = !docs.length;
    $("docs-empty").hidden = !!docs.length;
    $("docs-summary").textContent = docs.length ? `Voir les pièces (${docs.length})` : "Pièces";
    for (const d of docs) {
      const pill = el("span", { class: "pill pill-" + d.status, text: d.status });
      body.append(el("tr", {},
        el("td", {}, el("a", { href: fileUrl(d.rel_path), target: "_blank", rel: "noopener", text: d.rel_path, title: d.rel_path })),
        el("td", {}, pill),
        el("td", { class: "num", text: d.page_count ?? "–", title: `${d.chunk_count} passage(s)` + (d.ocr_pages ? ` · ${d.ocr_pages} page(s) par reconnaissance de texte` : "") }),
        el("td", { class: "muted small", text: d.message || "" }),
      ));
    }
  }

  function confirmWithId(action) {
    const typed = window.prompt(`${action}\n\nPour confirmer, tapez l'identifiant du dossier : ${state.caseId}`);
    return typed !== null && typed.trim() === state.caseId;
  }

  async function clearIndex() {
    if (!confirmWithId("Effacer l'analyse de ce dossier ? Les pièces sont conservées ; une nouvelle analyse la reconstruit.")) return;
    try {
      await api("POST", `/api/cases/${state.caseId}/index?confirm=${encodeURIComponent(state.caseId)}`);
      toast("Analyse effacée. Les pièces sont conservées.");
      await refreshCase();
    } catch (error) { toast(error.message, "error"); }
  }

  async function deleteCase() {
    const usb = isUsb(state.storage);
    const question = usb
      ? "Supprimer les données de l'assistant pour ce dossier (analyse et fichiers de travail) ? Les pièces ne sont pas touchées."
      : "SUPPRIMER DÉFINITIVEMENT ce dossier, PIÈCES COMPRISES ?";
    if (!confirmWithId(question)) return;
    try {
      await api("DELETE", `/api/cases/${state.caseId}?confirm=${encodeURIComponent(state.caseId)}`);
      toast(usb ? "Données de l'assistant supprimées. Les pièces sont intactes." : "Dossier supprimé.");
      state.caseId = null;
      showView("empty");
      await loadUsb(false);
      await loadCases();
    } catch (error) { toast(error.message, "error"); }
  }

  async function closeCase() {
    if (!state.caseId) return;
    try {
      await api("POST", `/api/usb/${encodeURIComponent(state.caseId)}/close`);
      toast("Dossier fermé : vous pouvez retirer les clés.");
      state.caseId = null;
      showView("empty");
      await loadCases();
    } catch (error) { toast(error.message, "error"); }
  }

  // ---------------------------------------------------------------- pièces et analyse

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || !state.caseId) return;
    if (isUsb(state.storage)) { toast("Les pièces de ce dossier sont sur une clé en lecture seule : copiez-les sur la clé depuis l'explorateur.", "warn"); return; }
    const form = new FormData();
    // Les sous-répertoires sont aplatis : le serveur ne garde que le nom.
    for (const file of files) form.append("files", file, file.name);
    const status = $("ingest-status");
    status.hidden = false; status.className = "status-line";
    status.textContent = `Dépôt de ${files.length} fichier(s)…`;
    try {
      const result = await api("POST", `/api/cases/${state.caseId}/files`, form);
      let message = `${result.count} fichier(s) déposé(s).`;
      if (result.skipped && result.skipped.length) message += ` ${result.skipped.length} déjà présent(s), ignoré(s).`;
      if (result.rejected.length) {
        message += ` ${result.rejected.length} refusé(s) : ` +
          result.rejected.map((r) => `${r.file} (${r.reason})`).join(", ");
        toast(message, "warn");
      } else toast(message);
      status.textContent = message + " Cliquez sur « Analyser les pièces » pour les traiter.";
      await refreshCase();
    } catch (error) {
      status.className = "status-line error";
      status.textContent = "Dépôt impossible : " + error.message;
    }
  }

  async function startIngest(force) {
    if (!state.caseId) return;
    try {
      const result = await api("POST", `/api/cases/${state.caseId}/ingest${force ? "?force=true" : ""}`);
      if (result.status === "already_running") toast("Une analyse est déjà en cours pour ce dossier.", "warn");
      renderIngestStatus(result);
      scheduleIngestPoll();
      pollJobs();
    } catch (error) { toast(error.message, "error"); }
  }

  function scheduleIngestPoll() {
    clearTimeout(state.ingestTimer);
    state.ingestTimer = setTimeout(pollIngest, 1500);
  }

  async function pollIngest() {
    if (!state.caseId) return;
    try {
      const status = await api("GET", `/api/cases/${state.caseId}/ingest/status`);
      renderIngestStatus(status);
      if (status.state === "running") scheduleIngestPoll();
      else await refreshCase();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function renderIngestStatus(status) {
    const node = $("ingest-status");
    setButtonsBusy(status.state === "running");
    if (!status || status.state === "idle") { node.hidden = true; return; }
    node.hidden = false;
    node.replaceChildren();
    if (status.state === "running") {
      node.className = "status-line";
      const p = status.progress || {};
      let text = "Analyse en cours…";
      if (p.total) text = `Analyse en cours : ${Math.min(p.done, p.total)}/${p.total} pièce(s)` + (p.phase === "vectorisation" ? " · préparation des réponses" : p.phase === "brief" ? " · rédaction de la fiche du dossier" : p.current ? ` · ${p.current}` : "");
      node.append(el("div", { text }), el("div", { class: "bar" }));
      return;
    }
    if (status.state === "failed") {
      node.className = "status-line error";
      node.textContent = "Analyse interrompue : " + (status.error || "erreur inconnue");
      return;
    }
    const r = status.report; const c = r.counters;
    node.className = "status-line" + (r.status === "ok" ? "" : " " + r.status);
    const parts = [c.ok ? `${c.ok} pièce(s) analysée(s)` : "Analyse à jour"];
    if (c.skipped) parts.push(`${c.skipped} inchangée(s)`);
    if (c.warning) parts.push(`${c.warning} avec avertissement`);
    if (c.error) parts.push(`${c.error} en erreur`);
    if (c.ocr_pages) parts.push(`${c.ocr_pages} page(s) lue(s) par reconnaissance de texte`);
    if (c.removed) parts.push(`${c.removed} retirée(s)`);
    node.append(el("div", { text: parts.join(" · ") }));
    node.title = `${fmtMs(r.duration_ms)} · ${c.pages} page(s) · ${c.chunks} passage(s)` + (r.embedding && r.embedding.embedded != null ? ` · vectorisation ${r.embedding.embedded} en ${fmtMs(r.embedding.duration_ms)}` : "");
    // Les fichiers non lus sont signalés dans le bandeau « à analyser » de
    // l'étape 1, vérifié toutes les 30 s : pas de doublon ici.
    if (r.embedding && r.embedding.error) {
      node.className = "status-line warn";
      node.append(el("div", { class: "small", text: "Préparation des réponses impossible : " + r.embedding.error + " — relancez « Analyser les pièces », seules les pièces non préparées seront reprises." }));
    }
  }

  function setButtonsBusy(busy) {
    for (const id of ["btn-index", "btn-reindex", "btn-clear-index", "btn-delete-case", "btn-close-case"]) $(id).disabled = busy;
  }

  function fileUrl(relPath, page) {
    const encoded = relPath.split("/").map(encodeURIComponent).join("/");
    return `/api/cases/${encodeURIComponent(state.caseId)}/files/${encoded}` + (page ? `#page=${page}` : "");
  }

  // ---------------------------------------------------------------- analyses en cours, partout

  async function pollJobs() {
    clearTimeout(state.jobsTimer);
    let running = [];
    try {
      const body = await api("GET", "/api/jobs");
      running = body.jobs.filter((j) => j.state === "running");
      for (const j of body.jobs) {
        if (j.state !== "running" && state.knownRunning.has(j.job_id)) {
          state.knownRunning.delete(j.job_id);
          const who = j.label || labelOf(j.case_id);
          toast(j.state === "done" ? `Analyse terminée : « ${who} ».` : `Analyse interrompue : « ${who} ».`, j.state === "done" ? "" : "warn");
          if (j.kind === "library") { if (state.page === "bibliotheque") loadLibrary(); }
          else { loadCases().catch(() => {}); if (j.case_id === state.caseId) refreshCase().catch(() => {}); }
        }
      }
      for (const j of running) state.knownRunning.add(j.job_id);
      renderJobsBar(running);
    } catch (_) { /* le serveur répondra au prochain relevé */ }
    state.jobsTimer = setTimeout(pollJobs, running.length ? 1500 : 8000);
  }

  function renderJobsBar(running) {
    const bar = $("jobs-bar");
    bar.hidden = !running.length;
    if (!running.length) return;
    const j = running[0]; const p = j.progress || {};
    let text = j.kind === "library" ? `Analyse du recueil « ${j.label || j.case_id} »` : `Analyse de « ${labelOf(j.case_id)} »`;
    if (p.total) {
      text += ` : ${Math.min(p.done, p.total)}/${p.total} pièce(s)`;
      if (p.phase === "vectorisation") text += " · préparation des réponses";
      else if (p.phase === "brief") text += " · rédaction de la fiche du dossier";
      else if (p.current) text += ` · ${p.current}`;
    } else text += "…";
    if (running.length > 1) text += ` · ${running.length - 1} autre(s) en attente`;
    $("jobs-text").textContent = text;
    const fill = $("jobs-fill");
    if (p.total) {
      fill.classList.remove("indeterminate");
      fill.style.width = `${Math.round(100 * Math.min(p.done, p.total) / p.total)}%`;
    } else {
      fill.classList.add("indeterminate");
      fill.style.width = "";
    }
    bar.onclick = () => { if (j.kind === "library") showPage("bibliotheque"); else if (state.caseId !== j.case_id) selectCase(j.case_id); };
  }

  // ---------------------------------------------------------------- conversations

  async function loadConversations(resume) {
    try {
      const body = await api("GET", `/api/cases/${state.caseId}/conversations`);
      state.conversations = body.conversations;
    } catch (_) {
      state.conversations = [];
    }
    renderConversationSelect();
    if (resume) {
      if (state.conversations.length) await openConversation(state.conversations[0].id);
      else resetThread();
    }
  }

  function renderConversationSelect() {
    const select = $("conversation-select");
    select.replaceChildren();
    select.append(el("option", { value: "", text: state.conversations.length ? "Nouvelle conversation…" : "Aucune conversation enregistrée" }));
    for (const c of state.conversations) {
      const when = c.updated_at ? new Date(c.updated_at).toLocaleDateString("fr-FR") : "";
      select.append(el("option", { value: c.id, text: `${c.title || "Conversation"}${when ? " · " + when : ""}` }));
    }
    select.value = state.conversationId || "";
    $("btn-delete-thread").hidden = !state.conversationId;
  }

  async function openConversation(id) {
    try {
      const conv = await api("GET", `/api/cases/${state.caseId}/conversations/${id}`);
      state.conversationId = conv.id;
      state.thread = conv.messages.map((m) => m.role === "user"
        ? { role: "user", text: m.content, mode: m.mode || "chat" }
        : { role: "assistant", answer: m.answer || { answer: m.content, sources: [], flags: [], mode: m.mode || "chat" }, strict: m.mode !== "chat" });
    } catch (error) {
      toast(error.message, "error");
      state.conversationId = null;
      state.thread = [];
    }
    renderConversationSelect();
    renderThread();
  }

  function resetThread() {
    state.conversationId = null;
    state.thread = [];
    renderConversationSelect();
    renderThread();
  }

  async function deleteThread() {
    if (!state.conversationId) return;
    if (!window.confirm("Supprimer cette conversation des données de l'assistant ?")) return;
    try {
      await api("DELETE", `/api/cases/${state.caseId}/conversations/${state.conversationId}`);
      toast("Conversation supprimée.");
      state.conversationId = null;
      state.thread = [];
      await loadConversations(false);
      renderThread();
    } catch (error) { toast(error.message, "error"); }
  }

  // ---------------------------------------------------------------- questions

  // Court, et seulement ce qui change la lecture de la réponse. Le reste
  // (détails techniques) va dans l'info-bulle de la bulle.
  const FLAG_LABELS = {
    uncited: ["warn", "Sans citation : à vérifier"],
    invalid_citations_removed: ["warn", "Références inventées retirées"],
    truncated: ["warn", "Réponse tronquée"],
    passages_dropped: ["info", "Passages écartés, contexte plein"],
    no_reranker: ["info", "Classement indisponible"],
    overview: ["info", "Vue d'ensemble"],
    analysis: ["info", "Analyse : appréciation à vérifier"],
    swot: ["info", "SWOT : appréciation à vérifier"],
    attack: ["info", "Ligne d'attaque : appréciation à vérifier"],
    rebuttal: ["info", "Contre-argumentation : appréciation à vérifier"],
    plain: ["info", "Langage simple"],
    calc_corrected: ["warn", "Calcul du modèle corrigé"],
    calc_unshown: ["info", "Calcul non écrit en chiffres : à vérifier"],
    deep_read_unknown: ["info", "Pièce demandée introuvable"],
    chat_fallback: ["info", "Réponse d'ensemble"],
    low_relevance: ["warn", "Correspondance faible : à vérifier"],
  };
  const SILENT_FLAGS = new Set(["lexical_only", "thinking", "deep_read", "analysis_topup"]);
  // Une réponse de stratégie est aussi une analyse : une seule étiquette suffit.
  const STRATEGY_FLAGS = new Set(["swot", "attack", "rebuttal"]);
  // Titres de rubrique des réponses de stratégie (« Forces », « Verdict : »…).
  const HEADING = /^(forces|faiblesses|opportunit[eé]s|menaces|en bref|verdict|point de vigilance|angles? d'attaque|attaques?)\b.{0,30}$/i;
  const ABSTENTION_LABELS = {
    "gate:no_passages": "aucun passage trouvé dans ce dossier",
    "gate:rerank": "aucun passage suffisamment pertinent",
    "gate:dense": "aucun passage suffisamment pertinent",
    "model": "le modèle juge les pièces insuffisantes pour répondre",
  };
  const MARKER = /\[\s*(S\s*\d+(?:\s*[,;]\s*S?\s*\d+)*)\s*\]/gi;
  const BULLET = /^\s*(?:[*•\-–]|\d+[.)])\s+/;

  // Ce que dit le trait de statut, phase par phase (telle que le serveur la signale).
  const PHASE_LABELS = {
    queued: "En attente…",
    retrieval: "Recherche dans les pièces…",
    prompt: "Préparation de la demande au modèle…",
    release_vram: "Libération de la mémoire graphique…",
    generation: "Rédaction de la réponse…",
    reading: "Lecture complète d'une pièce…",
    validation: "Vérification des citations…",
    brief: "Rédaction de la fiche du dossier…",
    done: "Terminé.",
    error: "Erreur.",
  };

  function newRequestId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  async function ask(event) {
    event.preventDefault();
    await askQuestion($("question").value.trim(), "chat");
  }

  // « Résumer le dossier » : pas de recherche, le début de chaque pièce.
  async function overview() {
    const typed = $("question").value.trim();
    await askQuestion(typed || "De quoi parle ce dossier ?", "chat", true);
  }

  async function askQuestion(question, mode, forceOverview) {
    if (!question || !state.caseId) return;
    setAskBusy(true);
    // Les échanges précédents sont lus côté serveur dans la conversation
    // enregistrée ; le client n'envoie que l'identifiant de conversation.
    const requestId = newRequestId();
    const conversationId = state.conversationId;
    const caseId = state.caseId;
    state.thread.push({ role: "user", text: question, mode });
    const pending = { role: "pending", requestId, started: Date.now(), phase: "queued" };
    state.thread.push(pending);
    renderThread();
    $("question").value = "";
    startProgress(pending, caseId);
    try {
      const body = { question, explain: true, conversation_id: conversationId, mode: forceOverview ? "chat" : mode, request_id: requestId };
      const answer = await api("POST", `/api/cases/${caseId}/ask`, body);
      // Si l'avocat a changé de dossier puis est revenu pendant la réponse, le
      // fil affiché n'est plus celui de la question : on rouvre la conversation
      // enregistrée, qui contient maintenant la réponse.
      const stillDisplayed = state.thread.includes(pending);
      replacePending(pending, { role: "assistant", answer, strict: mode !== "chat" });
      if (state.caseId === caseId) {
        state.conversationId = answer.conversation_id || conversationId;
        if (stillDisplayed) await loadConversations(false);
        else await openConversation(state.conversationId);
      }
    } catch (error) {
      replacePending(pending, null);
      $("question").value = question;
      toast(error.message, "error");
    } finally {
      stopProgress();
      setAskBusy(false);
    }
  }

  function replacePending(pending, message) {
    const index = state.thread.indexOf(pending);
    if (index >= 0) {
      if (message) state.thread.splice(index, 1, message);
      else state.thread.splice(index, 1);
    }
    renderThread();
  }

  // Le trait de statut : temps écoulé rafraîchi chaque seconde, phase lue sur le
  // serveur. Le libellé change seulement si la phase change : pas de clignotement.
  function startProgress(pending, caseId) {
    stopProgress();
    const tick = async () => {
      const elapsed = $("pending-elapsed");
      if (elapsed) {
        const s = Math.round((Date.now() - pending.started) / 1000);
        elapsed.textContent = `${s} s` + (s > 25 && pending.phase !== "generation" ? " · premier appel : chargement du modèle" : "");
      }
      try {
        const p = await api("GET", `/api/cases/${caseId}/ask/progress/${pending.requestId}`);
        if (p.phase !== pending.phase) {
          pending.phase = p.phase;
          const label = $("pending-phase");
          if (label) label.textContent = PHASE_LABELS[p.phase] || p.phase;
        }
      } catch (_) { /* pas encore enregistrée, ou expirée : on garde le dernier libellé */ }
    };
    // Premier relevé après un court délai : la question doit d'abord arriver au serveur.
    state.askTimer = setInterval(tick, 900);
  }

  function stopProgress() {
    clearInterval(state.askTimer);
    state.askTimer = null;
  }

  function setAskBusy(busy) {
    for (const id of ["btn-ask", "btn-references", "btn-overview"]) $(id).disabled = busy;
  }

  function renderThread() {
    const thread = $("thread");
    thread.replaceChildren();
    thread.hidden = !state.thread.length;
    state.thread.forEach((message, index) => {
      if (message.role === "user") {
        thread.append(el("div", { class: "bubble user" },
          el("div", { class: "bubble-text", text: message.text }),
          message.mode !== "chat" ? el("div", { class: "bubble-tag", text: "recherche de références" }) : null));
      } else if (message.role === "pending") {
        thread.append(el("div", { class: "thinking", role: "status", "aria-live": "polite" },
          el("span", { class: "spark", "aria-hidden": "true", text: "✳" }),
          el("span", { class: "elapsed", id: "pending-elapsed", text: `${Math.round((Date.now() - message.started) / 1000)} s` }),
          el("span", { class: "sep", text: "·" }),
          el("span", { class: "phase", id: "pending-phase", text: PHASE_LABELS[message.phase] || message.phase }),
        ));
      } else {
        thread.append(answerBubble(message.answer, index, message.strict));
      }
    });
    thread.scrollTop = thread.scrollHeight;
  }

  function answerBubble(a, index, strict) {
    const prefix = `b${index}`;
    const bubble = el("div", { class: "bubble assistant" + (a.abstained ? " abstained" : "") });

    const flags = el("div", { class: "answer-flags" });
    if (a.abstained) {
      flags.append(el("span", { class: "flag", text: "Abstention — " + (ABSTENTION_LABELS[a.abstention_reason] || a.abstention_reason || "") }));
    }
    for (const flag of a.flags || []) {
      if (SILENT_FLAGS.has(flag)) continue;
      if (flag === "analysis" && (a.flags || []).some((f) => STRATEGY_FLAGS.has(f))) continue;
      const [kind, label] = FLAG_LABELS[flag] || ["info", flag];
      flags.append(el("span", { class: "flag " + kind, text: label }));
    }
    // Ce que l'assistant a fait de particulier : « Pièce lue en entier : … ».
    for (const note of a.notes || []) flags.append(el("span", { class: "flag info", text: note }));
    bubble.append(flags);

    bubble.append(el("div", { class: "answer-text" }, ...paragraphsWithMarkers(a.answer, prefix)));

    const t = a.timings_ms || {}; const g = a.generation || {};
    bubble.title = [t.total ? fmtMs(t.total) : "", g.tokens_per_second ? `${g.tokens_per_second} tok/s` : "",
      a.passages_considered != null ? `${a.passages_considered} passage(s) considéré(s)` : "", a.model ? `modèle ${a.model}` : ""]
      .filter(Boolean).join(" · ");

    if (a.sources && a.sources.length) {
      const details = el("details", { class: "sources-box" });
      if (strict) details.open = true;
      details.append(el("summary", { text: `Sources (${a.sources.length})` }));
      const list = el("ol", { class: "sources" });
      for (const s of a.sources) list.append(sourceRow(s, prefix, a, strict));
      details.append(list);
      bubble.append(details);
    }
    return bubble;
  }

  function sourceRow(s, prefix, a, strict) {
    const excerpt = el("div", { class: "excerpt", text: s.text || "(texte non renvoyé)" });
    // Un article de loi cité se lit tout de suite, en entier : c'est la règle
    // que le modèle applique, et c'est là qu'on vérifie qu'il a lu le bon alinéa.
    const shown = strict || s.kind === "reference";
    excerpt.hidden = !shown;
    const toggle = el("button", { class: "btn link more", type: "button", text: shown ? "Masquer l'extrait" : "Voir l'extrait",
      onclick: () => { excerpt.hidden = !excerpt.hidden; toggle.textContent = excerpt.hidden ? "Voir l'extrait" : "Masquer l'extrait"; } });
    const isPdf = /\.pdf$/i.test(s.filename);
    // Un article de loi ou de code n'est pas une pièce : rien à ouvrir, on le dit.
    const open = s.kind === "reference"
      ? el("span", { class: "pill pill-pending open", text: "texte de référence" })
      : el("a", { class: "btn open", href: fileUrl(s.rel_path, isPdf ? s.page_start : null), target: "_blank", rel: "noopener",
          text: isPdf && s.page_start ? `Ouvrir, page ${s.page_start}` : "Ouvrir" });
    return el("li", { class: "source", id: `${prefix}-src-${s.index}` },
      el("span", { class: "label", text: s.label }),
      el("span", { class: "citation", text: s.citation }),
      open,
      el("span", { class: "score", text: strict ? scoreLabel(s.score, a) : "" }),
      excerpt, toggle,
    );
  }

  // Score du reranker : une probabilité, lisible en pourcentage. Sans reranking
  // (dense, lexical, début des pièces), l'échelle n'est pas une probabilité : brut.
  function scoreLabel(score, a) {
    if (score == null) return "";
    const reranked = !!(a.retrieval && a.retrieval.reranked);
    return reranked ? `pertinence ${(score * 100).toFixed(1).replace(".", ",")} %` : `score ${score.toFixed(3)}`;
  }

  function paragraphsWithMarkers(text, prefix) {
    // Le texte est découpé en paragraphes ; chaque marqueur [Sn] devient un
    // lien vers sa source. Tout le reste est inséré comme texte brut. Le
    // Markdown que le modèle glisse parfois (gras, puces) est réduit à sa
    // forme lisible, sans jamais interpréter de balisage.
    const clean = String(text || "").replace(/\*\*|__/g, "").replace(/^#{1,4}\s+/gm, "");
    const list = (lines) => {
      const ul = el("ul", { class: "answer-list" });
      for (const line of lines) {
        const item = el("li");
        appendWithMarkers(item, line.replace(BULLET, ""), prefix);
        ul.append(item);
      }
      return ul;
    };
    const heading = (line) => {
      const h = el("p", { class: "answer-heading" });
      appendWithMarkers(h, line, prefix);
      return h;
    };
    return clean.split(/\n{2,}/).filter((para) => para.trim()).flatMap((para) => {
      const lines = para.split("\n").filter((line) => line.trim());
      if (lines.length && lines.every((line) => BULLET.test(line))) return [list(lines)];
      // Un titre suivi de ses points, sans ligne vide entre eux (SWOT…).
      if (lines.length > 1 && !BULLET.test(lines[0]) && lines.slice(1).every((line) => BULLET.test(line))) {
        return [heading(lines[0]), list(lines.slice(1))];
      }
      // Un titre seul sur sa ligne (« Forces », « Verdict : … »).
      if (lines.length === 1 && HEADING.test(lines[0].trim()) && !/\[S\d/.test(lines[0])) {
        return [heading(lines[0])];
      }
      const p = el("p");
      lines.forEach((line, i) => { if (i) p.append(el("br")); appendWithMarkers(p, line, prefix); });
      return [p];
    });
  }

  function appendWithMarkers(node, text, prefix) {
    let last = 0;
    for (const match of text.matchAll(MARKER)) {
      node.append(document.createTextNode(text.slice(last, match.index)));
      const indices = match[1].match(/\d+/g) || [];
      indices.forEach((n, i) => {
        if (i) node.append(", ");
        node.append(el("a", { class: "cite", href: `#${prefix}-src-${n}`, text: "S" + n }));
      });
      last = match.index + match[0].length;
    }
    node.append(document.createTextNode(text.slice(last)));
  }

  // ---------------------------------------------------------------- journal

  async function pollLogs() {
    if (!$("logs-details").open) return;
    try {
      const body = await api("GET", "/api/logs?lines=80");
      const pre = $("logs");
      const atBottom = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 8;
      pre.textContent = body.lines.join("\n");
      if (atBottom) pre.scrollTop = pre.scrollHeight;
    } catch (_) { /* silencieux : le journal est accessoire */ }
    state.logsTimer = setTimeout(pollLogs, 3000);
  }

  // ---------------------------------------------------------------- câblage

  function wire() {
    $("btn-theme").addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark", true));
    $("models-badge").addEventListener("click", () => $("models-wrap").classList.toggle("open"));
    document.addEventListener("click", (e) => { if (!$("models-wrap").contains(e.target)) $("models-wrap").classList.remove("open"); });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      $("models-wrap").classList.remove("open");
      closeFiche();
    });
    $("btn-add-case").addEventListener("click", openAddPage);
    $("form-add").addEventListener("submit", submitAdd);
    $("btn-add-cancel").addEventListener("click", () => showView(state.caseId ? "case" : "empty"));
    for (const radio of document.querySelectorAll('input[name="source"]')) radio.addEventListener("change", syncAddSource);
    $("btn-pick-documents").addEventListener("click", () => pickFolder("add-documents", "btn-pick-documents", "Où sont les pièces de ce dossier ?"));
    $("btn-pick-memory").addEventListener("click", () => pickFolder("add-memory", "btn-pick-memory", "Où ranger les données de l'assistant ?"));
    bindAutoId("add-label", "add-case-id");

    $("btn-index").addEventListener("click", () => startIngest(false));
    $("btn-reindex").addEventListener("click", () => startIngest(true));
    $("btn-clear-index").addEventListener("click", clearIndex);
    $("btn-delete-case").addEventListener("click", deleteCase);
    $("btn-close-case").addEventListener("click", closeCase);
    $("btn-brief").addEventListener("click", rebuildBrief);
    for (const b of document.querySelectorAll("#pagenav .nav-item")) b.addEventListener("click", () => showPage(b.dataset.page));
    $("btn-brief-open").addEventListener("click", openFiche);
    $("btn-brief-copy").addEventListener("click", copyFiche);
    $("fiche-copy").addEventListener("click", copyFiche);
    $("fiche-close").addEventListener("click", closeFiche);
    $("fiche-print").addEventListener("click", () => window.print());
    $("fiche-overlay").addEventListener("click", (e) => { if (e.target === $("fiche-overlay")) closeFiche(); });
    $("input-files").addEventListener("change", (e) => { uploadFiles(e.target.files); e.target.value = ""; });
    $("input-folder").addEventListener("change", (e) => { uploadFiles(e.target.files); e.target.value = ""; });
    $("jobs-bar").addEventListener("keydown", (e) => { if (e.key === "Enter") $("jobs-bar").click(); });

    $("form-ask").addEventListener("submit", ask);
    $("btn-references").addEventListener("click", () => askQuestion($("question").value.trim(), "auto"));
    $("btn-overview").addEventListener("click", overview);
    $("btn-new-thread").addEventListener("click", resetThread);
    $("btn-delete-thread").addEventListener("click", deleteThread);
    $("conversation-select").addEventListener("change", (e) => { if (e.target.value) openConversation(e.target.value); else resetThread(); });
    $("question").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("form-ask").requestSubmit(); });
    $("logs-details").addEventListener("toggle", () => { clearTimeout(state.logsTimer); if ($("logs-details").open) pollLogs(); });

    const zone = $("dropzone");
    for (const type of ["dragenter", "dragover"]) zone.addEventListener(type, (e) => { e.preventDefault(); zone.classList.add("over"); });
    for (const type of ["dragleave", "drop"]) zone.addEventListener(type, (e) => { e.preventDefault(); zone.classList.remove("over"); });
    zone.addEventListener("drop", (e) => uploadFiles(e.dataTransfer.files));
  }

  // Licence : un bandeau visible seulement quand il y a lieu de prévenir
  // (échéance proche, expirée, mauvaise machine). Rien tant que tout va bien.
  async function loadLicense() {
    let s;
    try {
      s = await api("GET", "/api/license");
    } catch { return; }
    const banner = $("license-banner");
    const messages = {
      expiring: ["warn", `Licence valable encore ${s.days_left} jour(s). Contactez votre prestataire pour la renouveler.`],
      expired: ["error", "Licence expirée : les textes de référence ne sont plus consultés. Les dossiers restent intacts. Contactez votre prestataire."],
      wrong_machine: ["error", "Cette licence a été émise pour une autre machine : les textes de référence ne sont pas consultés."],
      missing: ["warn", "Aucune licence installée : les textes de référence ne sont pas consultés. Les dossiers restent intacts."],
      invalid: ["error", "Licence illisible : les textes de référence ne sont pas consultés."],
      tampered: ["error", "Licence non valide : les textes de référence ne sont pas consultés."],
    };
    const shown = messages[s.state];
    banner.hidden = !shown;
    if (shown) {
      banner.className = "status-line license-banner " + shown[0];
      banner.textContent = shown[1];
    }
  }

  initTheme();
  wire();
  syncAddSource();
  loadModels();
  loadLicense();
  setInterval(loadLicense, 6 * 3600 * 1000);   // recontrôle quelques fois par jour
  loadUsb(false)
    .then(() => loadCases())
    .then(() => { pollUsb(); pollJobs(); })
    .catch((e) => toast(e.message, "error"));
})();
