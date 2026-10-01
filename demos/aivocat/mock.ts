// Fausse API de la démo Aivocat : reproduit dans le navigateur les routes du
// backend FastAPI (app/api/routes/*.py) appelées par l'interface (app/ui/app.js),
// avec leurs formes de réponse et leurs enchaînements : analyse suivie pièce par
// pièce puis vectorisation et fiche, questions avec phases de progression,
// sources [Sn] vérifiées, abstention, conversations, bibliothèque, clés USB.
// Aucun modèle ne tourne ici : les réponses sont préparées (data.ts) et choisies
// par mots-clés, avec une latence calquée sur le débit d'un 9B local.
import { HttpError, file, ilYa, installMockApi, jourIlYa, type MockRequest, type Route } from "../shared/runtime";
import {
  ABSTENTION,
  BIBLIO_DIR,
  CASES_DIR,
  DOSSIERS_BIBLIO,
  EMPREINTE_EMBEDDINGS,
  JEUX,
  MARTEL_EN_ATTENTE,
  PACKS,
  VOLUMES,
  empreinte,
  jeuPourEmplacement,
  type JeuCle,
  type PackDef,
  type PieceMeta,
  type Reponse,
  type SourceDef,
  type Volume,
} from "./data";

const BASE = "/demos/aivocat";
const MODELE = "ollama:qwen3.5:9b";
const VERSION = "0.17.1";

// --- Base de la démo --------------------------------------------------------------

/** Pièce présente dans le dossier (ou sur la clé), analysée ou non. */
interface Fichier extends PieceMeta {
  version: number;
}

interface Document {
  doc_uid: string;
  rel_path: string;
  filename: string;
  ext: string;
  size_bytes: number;
  page_count: number | null;
  status: string;
  message: string | null;
  ocr_pages: number;
  chunk_count: number;
  indexed_at: string | null;
  version: number;
}

interface Fiche {
  text: string;
  sources: unknown[];
  generated_at: string;
  model: string;
  documents: number;
  chunks: number;
  passages_considered: number;
  truncated: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
  mode?: string;
  answer?: Record<string, unknown>;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  updated_ts: number;
  messages: Message[];
}

interface Dossier {
  case_id: string;
  label: string;
  jeu: JeuCle;
  created_at: string;
  updated_at: string;
  last_indexed_at: string | null;
  storage: Record<string, unknown>;
  source: Fichier[];
  documents: Document[];
  brief: Fiche | null;
  conversations: Conversation[];
}

interface Etape {
  file: string;
  ms: number;
  traiter: boolean;
}

interface Tache {
  job_id: string;
  case_id: string;
  kind: "case" | "library";
  label: string | null;
  started_at: string;
  t0: number;
  etapes: Etape[];
  retirees: string[];
  nonLues: { file: string; reason: string }[];
  vecMs: number;
  ficheMs: number;
  force: boolean;
  appliquee: boolean;
  finished_at: string | null;
  report: Record<string, unknown> | null;
}

interface Db {
  cases: Dossier[];
  /** Dossiers sur clé fermés : leur mémoire reste sur la clé, prête à être rouverte. */
  closed: Dossier[];
  jobs: Tache[];
  volumes: Volume[];
  packs: PackDef[];
  warmed: boolean;
  logs: string[];
}

type Req = MockRequest<Db>;

// --- Utilitaires ----------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Horodatage au format de `utcnow()` côté serveur. */
const iso = (ms = Date.now()) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "+00:00");
const hex = (n = 12) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const extOf = (name: string) => (name.includes(".") ? "." + name.split(".").pop()!.toLowerCase() : "");
const SUPPORTEES = new Set([".pdf", ".docx", ".txt", ".md", ".xlsx", ".pptx", ".eml", ".msg", ".png", ".jpg", ".jpeg", ".tiff"]);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

function introuvable(message: string): never {
  throw new HttpError(404, message);
}

// Journal technique, au format de app/core/logging.py : jamais de contenu de
// pièce, de question ni de réponse, seulement des indicateurs.
function journal(db: Db, logger: string, event: string, champs: Record<string, unknown> = {}, niveau = "INFO", quand = Date.now()) {
  const d = new Date(quand);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())},${p(d.getMilliseconds(), 3)}`;
  const kv = Object.entries(champs)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "boolean" ? (v ? "True" : "False") : v}`)
    .join(" ");
  db.logs.push(`${date} | ${niveau.padEnd(7)} | ${logger.padEnd(22)} | ${event}${kv ? " | " + kv : ""}`);
  if (db.logs.length > 400) db.logs.splice(0, db.logs.length - 400);
}

function acces(db: Db, method: string, path: string, status: number) {
  journal(db, "uvicorn.access", `127.0.0.1:${50000 + Math.floor(Math.random() * 9000)} - "${method} /api${path} HTTP/1.1" ${status}`);
}

// --- Emplacements -------------------------------------------------------------------

function volumePour(db: Db, chemin: string): Volume {
  const lettre = (/^([A-Za-z]):/.exec(chemin)?.[1] ?? "C").toUpperCase();
  const connu = db.volumes.find((v) => v.root.toUpperCase().startsWith(lettre + ":"));
  if (connu) return connu;
  // Disque interne du PC : ni amovible ni en lecture seule.
  return {
    root: `${lettre}:\\`,
    label: lettre === "C" ? "Windows" : "Données",
    serial: empreinte(lettre).slice(0, 4).toUpperCase() + "-" + empreinte(lettre + "x").slice(0, 4).toUpperCase(),
    removable: false,
    read_only: false,
    free_bytes: 412_000_000_000,
    total_bytes: 999_000_000_000,
    filesystem: "NTFS",
    simulated: false,
  };
}

const stockageLocal = (id: string) => ({ kind: "local", read_only_source: false, documents_root: `${CASES_DIR}\\${id}\\source` });

function stockageCle(db: Db, id: string, piecesRoot: string, memoire: string) {
  return {
    kind: "usb",
    read_only_source: true,
    documents_root: piecesRoot,
    documents_volume: volumePour(db, piecesRoot),
    memory_root: `${memoire.replace(/[\\/]+$/, "")}\\avocat-local-ai\\${id}`,
    memory_volume: volumePour(db, memoire),
    documents_present: true,
  };
}

const estCle = (c: Dossier) => c.storage.kind === "usb";

// --- Sources et réponses ------------------------------------------------------------

const SCORES = [0.962, 0.931, 0.887, 0.842, 0.776, 0.713, 0.655, 0.604, 0.571, 0.533, 0.502];

function sourcePublique(s: SourceDef, index: number) {
  return {
    index,
    label: `S${index}`,
    chunk_uid: s.chunk_uid,
    citation: s.citation,
    filename: s.filename,
    rel_path: s.rel_path,
    page_start: s.page_start,
    page_end: s.page_start,
    heading_path: s.heading_path,
    char_start: s.char_start,
    char_end: s.char_end,
    score: SCORES[index - 1] ?? 0.5,
    kind: s.kind,
    pack: s.pack,
    text: s.text,
  };
}

/** Durées d'une réponse : génération au débit d'un 9B sur carte graphique (~46 tok/s). */
function minutage(texte: string, analyse: boolean, abstention: boolean) {
  const tokens = Math.max(14, Math.round(texte.length / 3.4));
  const retrieval = (analyse ? 1500 : 1000) + Math.floor(Math.random() * 400);
  if (abstention) return { tokens: 0, retrieval, prompt: 0, release_vram: 0, generation: 0, validation: 0, total: retrieval + 60 };
  const generation = Math.round(clamp((tokens / 46) * 1000, 1600, 6800));
  const t = { tokens, retrieval, prompt: 30, release_vram: 240, generation, validation: 110, total: 0 };
  t.total = t.retrieval + t.prompt + t.release_vram + t.generation + t.validation;
  return t;
}

const DEMO_AJOUT =
  "Démo : ce dossier a été ajouté pendant votre visite ; la démo ne lit pas le contenu de ses pièces (rien ne quitte votre navigateur). Les trois dossiers d'exemple répondent à des questions préparées, avec leurs sources.";

// « liste » : question d'ensemble sur un dossier sans aperçu préparé (ajouté en visite).
type Choix = { r: Reponse; genre: "preparee" | "apercu" } | { r: null; genre: "aucune" | "vide" | "liste" };

// Questions d'ensemble, d'après les motifs de app/rag/engine.py (_OVERVIEW_PATTERNS).
const APERCU_RE = [
  /\bcontenu\b/, /\bcontient\b/, /\bresum/, /\bsynthes/, /\bde quoi (parle|s'agit|traite|il s'agit|retourne)/,
  /\bquelles? (sont |est )?(les )?pieces?\b/, /\bliste (des|les) pieces\b/, /\bpresente/, /\bapercu\b/, /\bvue d'ensemble\b/,
  /\bqu'y a[- ]t[- ]il\b/, /\bobjet du (dossier|litige)\b/, /\b(expliqu|racont|decri|detaill)\w*\b.*(dossier|affaire|litige|situation|contexte)/, /\bsur quoi porte/,
  /\ben quoi consiste/, /\bquel est le probleme\b/, /\bde quoi il est question\b/,
];

function choisir(c: Dossier, question: string): Choix {
  const jeu = JEUX[c.jeu];
  const q = fold(question);
  const mots = q.split(/[^a-z0-9]+/).filter(Boolean);
  let meilleur: Reponse | null = null;
  let score = 0;
  for (const r of jeu.reponses) {
    let s = fold(r.q) === q.trim() ? 100 : 0;
    for (const m of r.mots) {
      const [mot, poids] = m.split(":");
      const ok = mot.includes(" ") ? q.includes(mot) : mots.some((w) => w.startsWith(mot));
      if (ok) s += Number(poids ?? 1);
    }
    if (s > score) {
      score = s;
      meilleur = r;
    }
  }
  if (meilleur && score >= 3) return { r: meilleur, genre: "preparee" };
  if (APERCU_RE.some((re) => re.test(q))) return jeu.apercu.texte ? { r: jeu.apercu, genre: "apercu" } : { r: null, genre: "liste" };
  return { r: null, genre: jeu.reponses.length ? "aucune" : "vide" };
}

/** Réponse publique, telle que `Answer.to_public(explain=True)` + conversation_id. */
function construireReponse(c: Dossier, question: string, mode: string) {
  const strict = mode !== "chat";
  const choix = choisir(c, question);
  const analysee = c.documents.length > 0;
  let texte: string;
  let sources: ReturnType<typeof sourcePublique>[] = [];
  let flags: string[] = [];
  let abstention: string | null = null;

  if (!analysee) {
    texte = ABSTENTION;
    abstention = "gate:no_passages";
  } else if (choix.r) {
    texte = choix.r.texte;
    sources = choix.r.sources.map((s, i) => sourcePublique(s, i + 1));
    flags = [...(choix.r.flags ?? [])];
    abstention = choix.r.abstention ?? null;
    // En mode « références », pas de style analyse : réponse stricte.
    if (strict) flags = flags.filter((f) => !["analysis", "swot", "attack", "rebuttal", "chat_fallback"].includes(f));
  } else if (choix.genre === "liste") {
    // Dossier ajouté pendant la visite : rien de préparé, on dit ce qu'il contient.
    const noms = c.documents.map((d) => d.rel_path);
    texte = `Le dossier « ${c.label} » contient ${noms.length} pièce(s) analysée(s) :\n\n${noms.map((n) => "- " + n).join("\n")}\n\n${DEMO_AJOUT}`;
    flags = ["uncited"];
  } else {
    const exemples = JEUX[c.jeu].suggestions.slice(0, 2).map((s) => `« ${s} »`).join(" ou ");
    texte = choix.genre === "vide"
      ? `${ABSTENTION}\n\n${DEMO_AJOUT}`
      : `${ABSTENTION}\n\nDémo : pas de modèle dans votre navigateur ; les réponses de ce dossier sont préparées pour une sélection de questions, par exemple ${exemples}.`;
    abstention = "gate:rerank";
  }

  const t = minutage(texte, flags.includes("analysis"), !!abstention);
  const reranked = true;
  const best = abstention ? 0.0021 + Math.random() * 0.004 : 0.9 + Math.random() * 0.08;
  const answer = {
    case_id: c.case_id,
    answer: texte,
    abstained: !!abstention,
    abstention_reason: abstention,
    sources,
    flags,
    notes: [] as string[],
    mode: strict ? (choix.genre === "apercu" ? "overview" : "search") : "chat",
    model: MODELE,
    timings_ms: abstention ? { retrieval: t.retrieval, total: t.total } : { retrieval: t.retrieval, prompt: t.prompt, release_vram: t.release_vram, generation: t.generation, total: t.total },
    invalid_citations: [] as number[],
    passages_considered: abstention ? 0 : Math.max(8, sources.length + 3),
    retrieval: {
      passages_mode: choix.genre === "apercu" && strict ? "overview" : "search",
      style: strict ? "strict" : flags.includes("analysis") ? "analysis" : "chat",
      counts: { dense: 40, lexical: 40, fused: 57, reranked: 20, kept: abstention ? 0 : 8 },
      reranked,
      best_rerank_score: Math.round(best * 10000) / 10000,
      best_dense_score: Math.round((abstention ? 0.38 : 0.71 + Math.random() * 0.1) * 10000) / 10000,
      timings_ms: { dense: Math.round(t.retrieval * 0.22), lexical: 9, rerank: Math.round(t.retrieval * 0.7) },
    },
    generation: abstention ? {} : { completion_tokens: t.tokens, prompt_tokens: 3400 + sources.length * 260, tokens_per_second: 46.2, truncated: false },
  };
  return { answer, t };
}

// --- Fiche du dossier ------------------------------------------------------------------

function nouvelleFiche(c: Dossier, quand = Date.now()): Fiche | null {
  if (!c.documents.length) return null;
  const jeu = JEUX[c.jeu];
  const chunks = c.documents.reduce((n, d) => n + d.chunk_count, 0);
  const text = jeu.fiche.texte
    ? jeu.fiche.texte
    : `Pièces analysées (${c.documents.length}) :\n${c.documents.map((d) => "- " + d.rel_path).join("\n")}\n\nDémo : ce dossier a été ajouté pendant votre visite ; le contenu des pièces n'est pas lu par la démo, la fiche se limite donc à leur liste.`;
  return {
    text,
    sources: jeu.fiche.sources.map((s, i) => sourcePublique(s, i + 1)),
    generated_at: iso(quand),
    model: MODELE,
    documents: c.documents.length,
    chunks,
    passages_considered: Math.min(24, chunks),
    truncated: false,
  };
}

/** Même forme que `brief_as_text` (et que ficheAsText côté interface). */
function ficheTexte(c: Dossier, f: Fiche, markdown: boolean): string {
  const titre = `Fiche du dossier — ${c.label}`;
  const date = new Date(f.generated_at).toLocaleString("fr-FR");
  const lignes = markdown ? [`# ${titre}`] : [titre, "=".repeat(titre.length)];
  lignes.push(`Établie le ${date} à partir de ${f.documents} pièce(s), par l'assistant local.`, "", f.text.trim());
  const sources = f.sources as { label: string; citation: string }[];
  if (sources.length) {
    lignes.push("", markdown ? "## Pièces citées" : "Pièces citées", ...(markdown ? [] : ["-".repeat("Pièces citées".length)]));
    for (const s of sources) lignes.push(`[${s.label}] ${s.citation}`);
  }
  lignes.push("", "Rédigée automatiquement à partir des pièces analysées : à vérifier avant tout usage.");
  return lignes.join("\n") + "\n";
}

// --- Documents et analyse --------------------------------------------------------------

function documentDe(f: Fichier, quand: string): Document {
  return {
    doc_uid: empreinte(`doc:${f.rel_path}:${f.version}`),
    rel_path: f.rel_path,
    filename: f.rel_path.split("/").pop()!,
    ext: extOf(f.rel_path),
    size_bytes: f.size_bytes,
    page_count: f.page_count,
    status: f.status,
    message: f.message,
    ocr_pages: f.ocr_pages,
    chunk_count: f.chunk_count,
    indexed_at: quand,
    version: f.version,
  };
}

function enAttente(c: Dossier) {
  const docs = new Map(c.documents.map((d) => [d.rel_path, d]));
  const lisibles = c.source.filter((f) => !f.unsupported);
  const presents = new Set(c.source.map((f) => f.rel_path));
  return {
    new: lisibles.filter((f) => !docs.has(f.rel_path)).map((f) => f.rel_path),
    modified: lisibles.filter((f) => docs.has(f.rel_path) && docs.get(f.rel_path)!.version !== f.version).map((f) => f.rel_path),
    removed: c.documents.filter((d) => !presents.has(d.rel_path)).map((d) => d.rel_path),
    unsupported: c.source.filter((f) => f.unsupported).map((f) => ({ file: f.rel_path, reason: f.unsupported! })),
  };
}

const dureeTache = (j: Tache) => j.etapes.reduce((n, e) => n + e.ms, 0) + j.vecMs + j.ficheMs;

/** État d'une tâche à l'instant présent, déduit de son heure de départ : survit aux rechargements. */
function vueTache(j: Tache, maintenant = Date.now()): Record<string, unknown> & { state: string } {
  const pub = {
    job_id: j.job_id,
    case_id: j.case_id,
    kind: j.kind,
    label: j.label,
    state: "running",
    started_at: j.started_at,
    finished_at: null,
  };
  const total = j.etapes.length;
  let t = maintenant - j.t0;
  for (let i = 0; i < total; i++) {
    if (t < j.etapes[i].ms) return { ...pub, progress: { done: i, total, current: j.etapes[i].file, phase: "extraction" } };
    t -= j.etapes[i].ms;
  }
  if (t < j.vecMs) return { ...pub, progress: { done: total, total, current: null, phase: "vectorisation" } };
  t -= j.vecMs;
  if (t < j.ficheMs) return { ...pub, progress: { done: total, total, current: null, phase: "brief" } };
  return {
    ...pub,
    state: "done",
    finished_at: j.finished_at ?? iso(j.t0 + dureeTache(j)),
    progress: { done: total, total, current: null, phase: "done" },
    ...(j.report ? { report: j.report } : {}),
  };
}

function lancerAnalyse(db: Db, c: Dossier, force: boolean): Tache {
  const p = enAttente(c);
  const aTraiter = new Set([...p.new, ...p.modified]);
  const etapes: Etape[] = c.source
    .filter((f) => !f.unsupported)
    .map((f) => {
      const traiter = force || aTraiter.has(f.rel_path);
      return { file: f.rel_path, ms: traiter ? f.ms : 25, traiter };
    });
  const chunks = etapes.filter((e) => e.traiter).reduce((n, e) => n + (c.source.find((f) => f.rel_path === e.file)?.chunk_count ?? 0), 0);
  const change = etapes.some((e) => e.traiter) || p.removed.length > 0;
  const j: Tache = {
    job_id: hex(12),
    case_id: c.case_id,
    kind: "case",
    label: null,
    started_at: iso(),
    t0: Date.now(),
    etapes,
    retirees: p.removed,
    nonLues: p.unsupported,
    vecMs: change ? Math.round(clamp(500 + chunks * 45, 700, 4200)) : 150,
    ficheMs: change && c.source.some((f) => !f.unsupported) ? 3800 : 0,
    force,
    appliquee: false,
    finished_at: null,
    report: null,
  };
  db.jobs.push(j);
  if (db.jobs.length > 15) db.jobs.splice(0, db.jobs.length - 15);
  return j;
}

/** Fin d'analyse : l'index, la fiche et le rapport, comme pipeline.run + build_brief. */
function appliquerAnalyse(db: Db, j: Tache) {
  j.appliquee = true;
  const fin = j.t0 + dureeTache(j);
  j.finished_at = iso(fin);
  const c = db.cases.find((x) => x.case_id === j.case_id);
  if (!c) return;
  const quand = iso(fin);
  const fichiers = j.etapes.map((e) => ({ e, f: c.source.find((f) => f.rel_path === e.file) })).filter((x) => x.f);
  const traites = fichiers.filter((x) => x.e.traiter);
  for (const { f } of traites) {
    const d = documentDe(f!, quand);
    const i = c.documents.findIndex((x) => x.rel_path === d.rel_path);
    if (i >= 0) c.documents[i] = d;
    else c.documents.push(d);
  }
  c.documents = c.documents.filter((d) => !j.retirees.includes(d.rel_path));
  c.documents.sort((a, b) => a.rel_path.localeCompare(b.rel_path));
  c.last_indexed_at = quand;
  c.updated_at = quand;

  const somme = (k: "page_count" | "ocr_pages" | "chunk_count") => traites.reduce((n, x) => n + (x.f![k] ?? 0), 0);
  const ok = traites.filter((x) => x.f!.status === "ok").length;
  const warning = traites.filter((x) => x.f!.status === "warning").length;
  const skipped = fichiers.length - traites.length + j.nonLues.length;
  const files = [
    ...j.nonLues.map((u) => ({ file: u.file, level: "skipped", stage: "scan", message: u.reason, duration_ms: 0, pages: 0, ocr_pages: 0, chunks: 0 })),
    ...fichiers.map(({ e, f }) => e.traiter
      ? { file: f!.rel_path, level: f!.status, stage: "done", message: f!.message, duration_ms: e.ms, pages: f!.page_count ?? 0, ocr_pages: f!.ocr_pages, chunks: f!.chunk_count }
      : { file: f!.rel_path, level: "skipped", stage: "scan", message: "inchangé depuis la dernière indexation", duration_ms: 0, pages: 0, ocr_pages: 0, chunks: 0 }),
  ];
  const duree = j.etapes.reduce((n, e) => n + e.ms, 0) + j.vecMs;
  j.report = {
    case_id: c.case_id,
    status: warning ? "warning" : "ok",
    started_at: j.started_at,
    finished_at: iso(j.t0 + duree),
    duration_ms: duree,
    counters: { seen: files.length, ok, warning, error: 0, skipped, removed: j.retirees.length, pages: somme("page_count"), ocr_pages: somme("ocr_pages"), chunks: somme("chunk_count") },
    files,
    removed: j.retirees,
    embedding: { embedded: somme("chunk_count"), duration_ms: j.vecMs, error: null },
  };
  journal(db, "app.ingestion.pipeline", "ingestion.finished", { case: c.case_id, status: warning ? "warning" : "ok", seen: files.length, ok, warning, error: 0, skipped, duration_ms: duree }, "INFO", j.t0 + duree);
  // La fiche suit l'analyse quand quelque chose a changé (comme dans ingest.py).
  if (j.ficheMs) {
    c.brief = nouvelleFiche(c, fin);
    if (c.brief) journal(db, "app.rag.engine", "brief.written", { case: c.case_id, sources: c.brief.sources.length, passages: c.brief.passages_considered }, "INFO", fin - 50);
  }
}

function lancerRecueil(db: Db, nom: string, slug: string, fichiers: number): Tache {
  const etapes: Etape[] = Array.from({ length: fichiers }, (_, i) => {
    const mois = String((i % 12) + 1).padStart(2, "0");
    const jour = String(((i * 7) % 27) + 1).padStart(2, "0");
    return { file: `${i % 3 ? "CPH_Nantes" : "CA_Rennes"}_2025-${mois}-${jour}.pdf`, ms: 650 + ((i * 137) % 500), traiter: true };
  });
  const j: Tache = {
    job_id: hex(12),
    case_id: `bibliotheque:${slug}`,
    kind: "library",
    label: nom,
    started_at: iso(),
    t0: Date.now(),
    etapes,
    retirees: [],
    nonLues: [],
    vecMs: 2600,
    ficheMs: 0,
    force: false,
    appliquee: false,
    finished_at: null,
    report: null,
  };
  db.jobs.push(j);
  return j;
}

function appliquerRecueil(db: Db, j: Tache) {
  j.appliquee = true;
  const fin = j.t0 + dureeTache(j);
  j.finished_at = iso(fin);
  const dossier = DOSSIERS_BIBLIO.find((d) => d.name === j.label)!;
  const pack: PackDef = {
    slug: dossier.slug,
    name: dossier.name,
    kind: "library",
    description: `Documents du cabinet : ${dossier.files} fichier(s) lus.`,
    version: jourIlYa(0),
    source: "Bibliothèque du cabinet",
    built_at: iso(fin),
    texts: j.etapes.map((e, i) => ({ id: `lib-${i}`, title: e.file, short_title: e.file, articles: 6 + (i % 5) })),
    articles: dossier.files,
    passages: dossier.files * 9,
    size_bytes: dossier.files * 486_000,
    active: true,
  };
  const i = db.packs.findIndex((p) => p.slug === pack.slug);
  if (i >= 0) db.packs[i] = pack;
  else db.packs.push(pack);
  j.report = {
    case_id: j.case_id,
    status: "ok",
    started_at: j.started_at,
    finished_at: iso(fin),
    duration_ms: dureeTache(j),
    counters: { seen: dossier.files, ok: dossier.files, warning: 0, error: 0, skipped: 0, removed: 0, pages: dossier.files * 4, ocr_pages: 0, chunks: dossier.files * 9 },
    files: [],
    removed: [],
    embedding: { embedded: dossier.files * 9, duration_ms: j.vecMs, error: null },
  };
  journal(db, "app.packs.library", "library.built", { slug: pack.slug, files: dossier.files, passages: pack.passages }, "INFO", fin);
}

/** Avance le temps simulé : termine les tâches arrivées à échéance. */
function avancer(db: Db) {
  const maintenant = Date.now();
  for (const j of db.jobs) {
    if (j.appliquee || maintenant < j.t0 + dureeTache(j)) continue;
    if (j.kind === "library") appliquerRecueil(db, j);
    else appliquerAnalyse(db, j);
  }
}

const tacheEnCours = (db: Db, cle: string) => db.jobs.find((j) => j.case_id === cle && !j.appliquee && Date.now() < j.t0 + dureeTache(j)) ?? null;

// --- Avancement des questions (ProgressBoard, en mémoire comme côté serveur) ----------

const tableau = new Map<string, { t0: number; phases: [string, number][] }>();

function suivre(rid: string | undefined, phases: [string, number][]) {
  if (rid && /^[A-Za-z0-9_-]{1,64}$/.test(rid)) tableau.set(rid, { t0: Date.now(), phases });
}

function phasesReponse(t: ReturnType<typeof minutage>): [string, number][] {
  if (!t.generation) return [["queued", 0], ["retrieval", 120], ["done", t.total]];
  let at = 120;
  const out: [string, number][] = [["queued", 0], ["retrieval", at]];
  at += t.retrieval;
  out.push(["prompt", at]);
  at += t.prompt;
  out.push(["release_vram", at]);
  at += t.release_vram;
  out.push(["generation", at]);
  at += t.generation;
  out.push(["validation", at]);
  out.push(["done", at + t.validation]);
  return out;
}

// --- Seed --------------------------------------------------------------------------

function fichiersDe(jeu: JeuCle): Fichier[] {
  return JEUX[jeu].pieces.map((p) => ({ ...p, version: 1 }));
}

function nouveauDossier(id: string, label: string, jeu: JeuCle, storage: Record<string, unknown>, creeIlYa: number, analyseIlYa: number | null): Dossier {
  const c: Dossier = {
    case_id: id,
    label,
    jeu,
    created_at: ilYa(creeIlYa, 9),
    updated_at: ilYa(analyseIlYa ?? creeIlYa, 11),
    last_indexed_at: null,
    storage,
    source: fichiersDe(jeu),
    documents: [],
    brief: null,
    conversations: [],
  };
  if (analyseIlYa !== null) {
    const quand = ilYa(analyseIlYa, 11);
    c.documents = c.source.map((f) => documentDe(f, quand));
    c.last_indexed_at = quand;
    c.brief = nouvelleFiche(c, Date.parse(quand) + 40_000);
  }
  return c;
}

/** Conversation déjà menée, pour que le premier dossier ouvert montre un vrai échange. */
function conversationPassee(c: Dossier, questions: [string, string][], joursIlYa: number): Conversation {
  const debut = Date.parse(ilYa(joursIlYa, 15));
  let at = debut;
  const messages: Message[] = [];
  for (const [question, mode] of questions) {
    messages.push({ role: "user", content: question, created_at: iso(at), mode });
    const { answer, t } = construireReponse(c, question, mode);
    at += t.total + 1000;
    messages.push({ role: "assistant", content: answer.answer, created_at: iso(at), mode: answer.mode, answer: answer as unknown as Record<string, unknown> });
    at += 95_000;
  }
  return { id: hex(12), title: titreDe(questions[0][0]), created_at: iso(debut), updated_at: iso(at), updated_ts: at / 1000, messages };
}

const titreDe = (texte: string) => {
  const plat = texte.split(/\s+/).join(" ").trim();
  return plat.length <= 70 ? plat : plat.slice(0, 69).trimEnd() + "…";
};

function seed(): Db {
  const db: Db = { cases: [], closed: [], jobs: [], volumes: VOLUMES.map((v) => ({ ...v })), packs: PACKS.map((p) => ({ ...p })), warmed: false, logs: [] };

  const bail = nouveauDossier("LEMOINE_C_SCI_LES_GLYCINES", "Lemoine c/ SCI Les Glycines", "bail", stockageLocal("LEMOINE_C_SCI_LES_GLYCINES"), 21, 3);
  bail.conversations.push(
    conversationPassee(bail, [
      ["Quelles retenues le bailleur a-t-il faites sur le dépôt de garantie ?", "chat"],
      ["À quelle date les clés ont-elles été restituées ?", "chat"],
    ], 2),
  );

  const martel = nouveauDossier("MARTEL_C_NOVAPRINT", "Martel c/ SAS Novaprint", "licenciement", stockageLocal("MARTEL_C_NOVAPRINT"), 12, 6);
  martel.conversations.push(conversationPassee(martel, [["Quels griefs sont reprochés à M. Martel ?", "auto"]], 5));
  // Deux fichiers déposés depuis la dernière analyse : le bandeau « À analyser » les signale.
  martel.source.push(...MARTEL_EN_ATTENTE.map((p) => ({ ...p, version: 1 })));

  const atelier = nouveauDossier("ATELIER_RIVE_GAUCHE_TVA", "SARL Atelier Rive Gauche — contrôle TVA", "tva", {}, 8, 1);
  atelier.storage = stockageCle(db, atelier.case_id, "E:\\", "F:\\");

  db.cases.push(atelier, bail, martel);

  const debut = Date.now() - 95_000;
  journal(db, "app.api.main", "app.started", { host: "127.0.0.1", port: 8000, llm: "qwen3.5:9b", embeddings: "bge-m3", reranking: true, ocr: "rapidocr" }, "INFO", debut);
  journal(db, "app.storage.mounts", "usb.mounted", { case: atelier.case_id, documents_volume: "5A3C-91F2", memory_volume: "C07E-1D44" }, "INFO", debut + 1200);
  journal(db, "uvicorn.error", "Application startup complete.", {}, "INFO", debut + 1900);
  return db;
}

// --- Routes ------------------------------------------------------------------------------

/** Référence à la base courante, pour les liens réécrits hors des requêtes. */
let dbCourante: Db | null = null;
/** Fichiers déposés pendant la visite (non conservés au rechargement : trop lourds). */
const deposes = new Map<string, File>();

function dossier(db: Db, id: string): Dossier {
  return db.cases.find((c) => c.case_id === id) ?? introuvable(`Dossier introuvable : ${id}`);
}

function dossierPublic(c: Dossier) {
  const chunks = c.documents.reduce((n, d) => n + d.chunk_count, 0);
  return {
    case_id: c.case_id,
    label: c.label,
    created_at: c.created_at,
    updated_at: c.updated_at,
    documents: c.documents.length,
    chunks,
    last_indexed_at: c.last_indexed_at,
    embedding_fingerprint: chunks ? EMPREINTE_EMBEDDINGS : "",
    collection: `case_${c.case_id.toLowerCase()}`,
    storage: c.storage,
  };
}

const docPublic = ({ version: _v, ...d }: Document) => d;

function packPublic(p: PackDef) {
  return { ...p, embedding_fingerprint: EMPREINTE_EMBEDDINGS, compatible: true, error: null, active: p.active };
}

function resumeConversation(conv: Conversation) {
  return { id: conv.id, title: conv.title || "Conversation", created_at: conv.created_at, updated_at: conv.updated_at, messages: conv.messages.length };
}

function verifierId(id: unknown): string {
  const v = String(id ?? "").trim();
  if (!ID_RE.test(v)) throw new HttpError(422, `Identifiant de dossier invalide : « ${v} ». Lettres, chiffres, tiret et souligné, 64 caractères au plus.`);
  return v;
}

function verifierChemin(chemin: unknown): string {
  const v = String(chemin ?? "").trim();
  if (!/^([A-Za-z]:([\\/]|$)|\\\\)/.test(v)) throw new HttpError(400, `Emplacement introuvable : « ${v} ». Indiquez un dossier ou une clé, par exemple E:\\ ou D:\\Dossiers\\Durand.`);
  return /^[A-Za-z]:$/.test(v) ? v + "\\" : v;
}

const ROUTES: Route<Db>[] = [
  // --- Modèles, licence, journal, tâches
  ["GET", "/models", ({ db }) => ({
    version: VERSION,
    app: { name: "avocat-local-ai", display_name: "Aivocat", version: VERSION },
    llm: { provider: "ollama", model: "qwen3.5:9b", available: true, num_ctx: 16384, thinking: false, location: "C:\\Users\\Cabinet\\.ollama\\models", size_bytes: 6_600_000_000, loaded: db.warmed, ...(db.warmed ? { vram_bytes: 8_120_000_000, device: "cuda" } : {}) },
    embeddings: { provider: "ollama", model: "bge-m3", dim: 1024, available: true, location: "C:\\Users\\Cabinet\\.ollama\\models", size_bytes: 1_157_000_000, loaded: false },
    reranker: { enabled: true, model: "BAAI/bge-reranker-v2-m3", available: true, reason: null, location: "C:\\Aivocat\\models\\bge-reranker-v2-m3", size_bytes: 2_271_000_000, loaded: db.warmed, device: "cuda" },
    ocr: { enabled: true, engine: "rapidocr", location: "C:\\Aivocat\\models\\rapidocr", available: true, size_bytes: 15_800_000 },
    offline: true,
  })],
  ["POST", "/models/warmup", async ({ db }) => {
    // Premier préchauffage : bge-m3, reranker puis LLM, comme une vraie question.
    const premier = !db.warmed;
    const timings = premier ? { embedder: 640, reranker: 910, llm: 1350 } : { embedder: 35, reranker: 22, llm: 160 };
    const total = timings.embedder + timings.reranker + timings.llm;
    await sleep(total);
    db.warmed = true;
    journal(db, "app.api.routes.system", "models.warmup", { ok: true, embedder_ms: timings.embedder, reranker_ms: timings.reranker, llm_ms: timings.llm, total_ms: total });
    acces(db, "POST", "/models/warmup", 200);
    return { ok: true, timings_ms: { ...timings, total }, errors: {} };
  }],
  ["GET", "/license", () => ({
    state: "ok",
    cabinet: "Cabinet de démonstration",
    expires: jourIlYa(-243),
    days_left: 243,
    detail: "Licence de démonstration, valable sur ce poste.",
    valid: true,
  })],
  ["GET", "/logs", ({ db, query }) => {
    const n = clamp(Number(query.get("lines") ?? 100) || 100, 1, 500);
    return { file: "app.log", lines: db.logs.slice(-n) };
  }],
  ["GET", "/jobs", ({ db }) => {
    const jobs = db.jobs.map((j) => vueTache(j));
    return { jobs, running: jobs.filter((j) => j.state === "running").length };
  }],
  ["POST", "/system/pick-folder", async ({ db, body }) => {
    // La vraie route ouvre la fenêtre Windows « Sélectionner un dossier » :
    // ici, un choix plausible selon la question posée.
    await sleep(700);
    const titre = fold(String(body?.title ?? ""));
    const chemin = titre.includes("donnees") ? "F:\\" : titre.includes("origine") ? "D:\\Dossiers\\Clients\\Pièces d'origine" : "D:\\Dossiers\\Clients\\Nouveau dossier";
    journal(db, "app.api.routes.system", "system.folder_picked", { chosen: true });
    return { path: chemin };
  }],

  // --- Clés USB
  ["GET", "/usb", ({ db }) => ({
    volumes: db.volumes,
    cases: db.cases.filter(estCle).map(dossierPublic),
    orphans: [],
    local_cases_allowed: true,
    default_memory_root: "F:\\",
    allow_any_directory: true,
  })],
  ["POST", "/usb/mount", ({ db, body }) => {
    const racine = verifierChemin(body?.documents_root);
    const memoire = body?.memory_root ? verifierChemin(body.memory_root) : "F:\\";
    const id = verifierId(body?.case_id);
    if (volumePour(db, memoire).read_only) {
      throw new HttpError(400, `L'emplacement « ${memoire} » est en lecture seule : choisissez une clé ou un dossier inscriptible pour les données de l'assistant.`);
    }
    if (db.cases.some((c) => c.case_id === id)) throw new HttpError(409, `Le dossier ${id} existe déjà.`);
    // Mémoire déjà présente pour ce dossier (clé refermée plus tôt) : on la rouvre telle quelle.
    const ferme = db.closed.findIndex((c) => c.case_id === id);
    let c: Dossier;
    if (ferme >= 0) {
      c = db.closed.splice(ferme, 1)[0];
      if (body?.label) c.label = String(body.label).trim();
    } else {
      const jeu = jeuPourEmplacement(racine);
      c = {
        case_id: id,
        label: String(body?.label ?? "").trim() || id,
        jeu,
        created_at: iso(),
        updated_at: iso(),
        last_indexed_at: null,
        storage: {},
        source: fichiersDe(jeu),
        documents: [],
        brief: null,
        conversations: [],
      };
    }
    c.storage = stockageCle(db, id, racine, memoire);
    db.cases.push(c);
    const doc = c.storage.documents_volume as Volume;
    const mem = c.storage.memory_volume as Volume;
    journal(db, "app.storage.mounts", "usb.mounted", { case: id, documents_volume: doc.serial, memory_volume: mem.serial });
    acces(db, "POST", "/usb/mount", 201);
    return dossierPublic(c);
  }],
  ["POST", "/usb/:id/close", ({ db, params }) => {
    const c = db.cases.find((x) => x.case_id === params.id && estCle(x)) ?? introuvable(`Dossier sur clé introuvable : ${params.id}`);
    if (tacheEnCours(db, c.case_id)) throw new HttpError(400, "Une indexation est en cours sur ce dossier. Attendez la fin de l'indexation avant de retirer la clé.");
    db.cases = db.cases.filter((x) => x !== c);
    db.jobs = db.jobs.filter((j) => j.case_id !== c.case_id);
    db.closed.push(c);
    journal(db, "app.storage.mounts", "usb.unmounted", { case: c.case_id });
    acces(db, "POST", `/usb/${c.case_id}/close`, 204);
    return undefined;
  }],
  ["POST", "/usb/relocate/:id", ({ db, params, body }) => {
    const c = dossier(db, params.id);
    if (tacheEnCours(db, c.case_id)) throw new HttpError(400, "Une analyse est en cours sur ce dossier : attendez sa fin.");
    const racine = verifierChemin(body?.documents_root);
    const memoire = body?.memory_root ? verifierChemin(body.memory_root) : "F:\\";
    // Les pièces sont désormais lues sur place : la copie et l'index repartent de zéro,
    // les conversations restent.
    c.storage = stockageCle(db, c.case_id, racine, memoire);
    c.documents = [];
    c.last_indexed_at = null;
    c.updated_at = iso();
    db.jobs = db.jobs.filter((j) => j.case_id !== c.case_id);
    journal(db, "app.storage.case_manager", "case.relocated", { case: c.case_id });
    acces(db, "POST", `/usb/relocate/${c.case_id}`, 200);
    return dossierPublic(c);
  }],

  // --- Dossiers
  ["GET", "/cases", ({ db }) => {
    const cases = [...db.cases].sort((a, b) => a.case_id.localeCompare(b.case_id)).map(dossierPublic);
    return { cases, count: cases.length };
  }],
  ["POST", "/cases", ({ db, body }) => {
    const id = verifierId(body?.case_id);
    if (db.cases.some((c) => c.case_id === id) || db.closed.some((c) => c.case_id === id)) throw new HttpError(409, `Le dossier ${id} existe déjà.`);
    const c: Dossier = {
      case_id: id,
      label: String(body?.label ?? "").trim().slice(0, 200) || id,
      jeu: "generique",
      created_at: iso(),
      updated_at: iso(),
      last_indexed_at: null,
      storage: stockageLocal(id),
      source: [],
      documents: [],
      brief: null,
      conversations: [],
    };
    db.cases.push(c);
    journal(db, "app.storage.case_manager", "case.created", { case: id });
    acces(db, "POST", "/cases", 201);
    return dossierPublic(c);
  }],
  ["GET", "/cases/:id", ({ db, params }) => {
    const c = dossier(db, params.id);
    setTimeout(() => afficherSuggestions(c), 0);
    return dossierPublic(c);
  }],
  ["DELETE", "/cases/:id", ({ db, params, query }) => {
    const c = dossier(db, params.id);
    if (query.get("confirm") !== c.case_id) throw new HttpError(400, "La confirmation ne correspond pas à l'identifiant du dossier.");
    db.cases = db.cases.filter((x) => x !== c);
    db.jobs = db.jobs.filter((j) => j.case_id !== c.case_id);
    for (const k of [...deposes.keys()]) if (k.startsWith(`${c.case_id}/`)) deposes.delete(k);
    journal(db, estCle(c) ? "app.storage.mounts" : "app.storage.case_manager", estCle(c) ? "usb.memory_deleted" : "case.deleted", { case: c.case_id });
    acces(db, "DELETE", `/cases/${c.case_id}`, 204);
    return undefined;
  }],
  ["GET", "/cases/:id/documents", ({ db, params }) => {
    const c = dossier(db, params.id);
    return { case_id: c.case_id, documents: c.documents.map(docPublic), count: c.documents.length };
  }],
  ["POST", "/cases/:id/index", ({ db, params, query }) => {
    const c = dossier(db, params.id);
    if (query.get("confirm") !== c.case_id) throw new HttpError(400, "La confirmation ne correspond pas à l'identifiant du dossier.");
    // Index effacé, pièces conservées ; la fiche décrivait l'index : elle part avec.
    c.documents = [];
    c.last_indexed_at = null;
    c.brief = null;
    c.updated_at = iso();
    db.jobs = db.jobs.filter((j) => j.case_id !== c.case_id);
    journal(db, "app.storage.case_manager", "case.index_cleared", { case: c.case_id });
    acces(db, "POST", `/cases/${c.case_id}/index`, 204);
    return undefined;
  }],
  ["POST", "/cases/:id/files", ({ db, params, body }) => {
    const c = dossier(db, params.id);
    if (estCle(c)) throw new HttpError(400, "Les pièces de ce dossier sont sur une clé en lecture seule : copiez-les sur la clé depuis l'explorateur.");
    if (!(body instanceof FormData)) throw new HttpError(422, "Aucun fichier reçu.");
    const stored: Record<string, unknown>[] = [];
    const rejected: { file: string; reason: string }[] = [];
    const skipped: { file: string; reason: string }[] = [];
    for (const v of body.getAll("files")) {
      if (!(v instanceof File)) continue;
      // Même assainissement que sanitise_filename : dernier segment, caractères sûrs.
      let nom = v.name.replace(/\\/g, "/").split("/").pop()!.trim().replace(/[<>:"|?*\u0000-\u001f]/g, "_").replace(/^[. ]+|[. ]+$/g, "");
      if (!nom) {
        rejected.push({ file: v.name || "?", reason: "Nom de fichier refusé" });
        continue;
      }
      if (v.size === 0) {
        rejected.push({ file: nom, reason: "fichier vide" });
        continue;
      }
      if (v.size > 200 * 1024 * 1024) {
        rejected.push({ file: nom, reason: "dépasse la limite de 200 Mo" });
        continue;
      }
      let note: string | undefined;
      const existant = c.source.find((f) => f.rel_path === nom);
      if (existant) {
        if (existant.size_bytes === v.size) {
          skipped.push({ file: nom, reason: "déjà présente, contenu identique" });
          continue;
        }
        const point = nom.lastIndexOf(".");
        const [base, ext] = point > 0 ? [nom.slice(0, point), nom.slice(point)] : [nom, ""];
        let n = 2;
        while (c.source.some((f) => f.rel_path === `${base} (${n})${ext}`)) n++;
        nom = `${base} (${n})${ext}`;
        note = "version différente d'une pièce du même nom, conservée à côté";
      }
      c.source.push({ ...metaDepot(nom, v.size), version: 1 });
      deposes.set(`${c.case_id}/${nom}`, v);
      stored.push({ file: nom, size_bytes: v.size, ...(note ? { note } : {}) });
      journal(db, "app.api.routes.ingest", "ingestion.file_received", { case: c.case_id, size_bytes: v.size });
    }
    c.updated_at = iso();
    acces(db, "POST", `/cases/${c.case_id}/files`, 201);
    return { case_id: c.case_id, stored, rejected, skipped, count: stored.length };
  }],
  ["GET", "/cases/:id/files/:rel", async ({ db, params }) => {
    // Une pièce fournie en PDF d'exemple est servie telle quelle (le vrai fetch
    // passe hors /api) ; sinon, le fichier déposé pendant la visite.
    const c = dossier(db, params.id);
    const f = c.source.find((x) => x.rel_path === params.rel) ?? introuvable(`Pièce introuvable dans ${c.case_id} : ${params.rel}`);
    if (f.pdf) {
      const r = await fetch(`${BASE}/pieces/${f.pdf}`);
      return new Response(await r.blob(), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${f.rel_path}"` } });
    }
    const depose = deposes.get(`${c.case_id}/${f.rel_path}`);
    if (depose) return new Response(depose, { status: 200, headers: { "Content-Type": depose.type || "application/octet-stream" } });
    introuvable(`Démo : la pièce « ${f.rel_path} » est fictive et n'est pas fournie.`);
  }],
  ["POST", "/cases/:id/open-folder", ({ db, params }) => {
    dossier(db, params.id);
    // Rien à ouvrir dans un navigateur : l'interface est interceptée avant (voir plus bas).
    return undefined;
  }],
  ["POST", "/cases/:id/ingest", ({ db, params, query }) => {
    const c = dossier(db, params.id);
    const enCours = tacheEnCours(db, c.case_id);
    if (enCours) return { status: "already_running", ...vueTache(enCours) };
    const j = lancerAnalyse(db, c, query.get("force") === "true");
    acces(db, "POST", `/cases/${c.case_id}/ingest`, 202);
    return { status: "started", ...vueTache(j) };
  }],
  ["GET", "/cases/:id/ingest/status", ({ db, params }) => {
    const c = dossier(db, params.id);
    const j = [...db.jobs].reverse().find((x) => x.case_id === c.case_id);
    return j ? vueTache(j) : { case_id: c.case_id, state: "idle" };
  }],
  ["GET", "/cases/:id/pending", ({ db, params }) => {
    const c = dossier(db, params.id);
    if (tacheEnCours(db, c.case_id)) return { case_id: c.case_id, running: true, count: 0, new: [], modified: [], removed: [], unsupported: [] };
    const p = enAttente(c);
    return { case_id: c.case_id, running: false, count: p.new.length + p.modified.length + p.removed.length, ...p };
  }],
  ["GET", "/cases/:id/report", ({ db, params }) => {
    const c = dossier(db, params.id);
    const j = [...db.jobs].reverse().find((x) => x.case_id === c.case_id && x.report);
    return { case_id: c.case_id, run: j?.report ?? null, events: [] };
  }],

  // --- Questions et fiche
  ["POST", "/cases/:id/ask", async ({ db, params, body }) => {
    const c = dossier(db, params.id);
    const question = String(body?.question ?? "").trim();
    if (question.length < 2 || question.length > 2000) throw new HttpError(422, "La question doit compter de 2 à 2 000 caractères.");
    const mode = ["auto", "chat", "search", "overview"].includes(body?.mode) ? String(body.mode) : "auto";
    let conv = body?.conversation_id ? c.conversations.find((x) => x.id === body.conversation_id) : undefined;
    if (body?.conversation_id && !conv) introuvable(`Conversation introuvable : ${body.conversation_id}`);

    const { answer, t } = construireReponse(c, question, mode);
    suivre(body?.request_id, phasesReponse(t));
    await sleep(t.total);

    // La question et sa réponse rejoignent la conversation du dossier.
    if (!conv) {
      conv = { id: hex(12), title: "", created_at: iso(), updated_at: iso(), updated_ts: Date.now() / 1000, messages: [] };
      c.conversations.push(conv);
    }
    const debut = iso(Date.now() - t.total);
    conv.messages.push({ role: "user", content: question, created_at: debut, mode });
    conv.messages.push({ role: "assistant", content: answer.answer, created_at: iso(), mode: answer.mode, answer: answer as unknown as Record<string, unknown> });
    if (!conv.title) conv.title = titreDe(question);
    conv.updated_at = iso();
    conv.updated_ts = Date.now() / 1000;
    journal(db, "app.rag.engine", "answer.done", {
      case: c.case_id,
      abstained: answer.abstained,
      reason: answer.abstention_reason,
      sources: answer.sources.length,
      flags: answer.flags.join(","),
      passages: answer.passages_considered,
      tokens: t.tokens || null,
      ...Object.fromEntries(Object.entries(answer.timings_ms).map(([k, v]) => [`${k}_ms`, v])),
    });
    acces(db, "POST", `/cases/${c.case_id}/ask`, 200);
    return { ...answer, conversation_id: conv.id };
  }],
  ["GET", "/cases/:id/ask/progress/:rid", ({ params }) => {
    const e = tableau.get(params.rid) ?? introuvable(`Aucune question en cours sous l'identifiant '${params.rid}'.`);
    const elapsed = Date.now() - e.t0;
    const passees = e.phases.filter(([, at]) => at <= elapsed);
    return {
      request_id: params.rid,
      phase: passees[passees.length - 1]?.[0] ?? "queued",
      elapsed_ms: elapsed,
      phases: passees.slice(1).map(([name, at]) => ({ name, at_ms: at })),
    };
  }],
  ["GET", "/cases/:id/brief", ({ db, params }) => {
    const c = dossier(db, params.id);
    if (!c.brief) introuvable("Pas encore de fiche pour ce dossier : lancez une analyse.");
    return { case_id: c.case_id, ...c.brief };
  }],
  ["POST", "/cases/:id/brief", async ({ db, params, body }) => {
    const c = dossier(db, params.id);
    if (!c.documents.length) throw new HttpError(400, "Aucune pièce analysée : pas de fiche possible.");
    const texte = JEUX[c.jeu].fiche.texte || "fiche";
    const t = minutage(texte, false, false);
    t.retrieval += 800;
    t.total += 800;
    suivre(body?.request_id, phasesReponse(t));
    await sleep(t.total);
    c.brief = nouvelleFiche(c);
    journal(db, "app.rag.engine", "brief.written", { case: c.case_id, sources: c.brief!.sources.length, passages: c.brief!.passages_considered });
    acces(db, "POST", `/cases/${c.case_id}/brief`, 200);
    return { case_id: c.case_id, ...c.brief };
  }],
  ["GET", "/cases/:id/brief/export", ({ db, params, query }) => {
    const c = dossier(db, params.id);
    if (!c.brief) introuvable("Pas encore de fiche pour ce dossier : lancez une analyse.");
    const md = query.get("format") === "md";
    return file(ficheTexte(c, c.brief, md), md ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8", `fiche-${c.case_id}.${md ? "md" : "txt"}`);
  }],

  // --- Conversations
  ["GET", "/cases/:id/conversations", ({ db, params }) => {
    const c = dossier(db, params.id);
    const conversations = [...c.conversations].sort((a, b) => b.updated_ts - a.updated_ts).map(resumeConversation);
    return { case_id: c.case_id, conversations, count: conversations.length };
  }],
  ["POST", "/cases/:id/conversations", ({ db, params }) => {
    const c = dossier(db, params.id);
    const conv: Conversation = { id: hex(12), title: "", created_at: iso(), updated_at: iso(), updated_ts: Date.now() / 1000, messages: [] };
    c.conversations.push(conv);
    return resumeConversation(conv);
  }],
  ["GET", "/cases/:id/conversations/:cid", ({ db, params }) => {
    const c = dossier(db, params.id);
    const conv = c.conversations.find((x) => x.id === params.cid) ?? introuvable(`Conversation introuvable : ${params.cid}`);
    return structuredClone(conv);
  }],
  ["DELETE", "/cases/:id/conversations/:cid", ({ db, params }) => {
    const c = dossier(db, params.id);
    if (!c.conversations.some((x) => x.id === params.cid)) introuvable(`Conversation introuvable : ${params.cid}`);
    c.conversations = c.conversations.filter((x) => x.id !== params.cid);
    return undefined;
  }],

  // --- Bibliothèque
  ["GET", "/library", ({ db }) => ({
    dir: BIBLIO_DIR,
    packs: db.packs.map(packPublic),
    folders: DOSSIERS_BIBLIO.map((d) => {
      const pack = db.packs.find((p) => p.slug === d.slug);
      const j = [...db.jobs].reverse().find((x) => x.case_id === `bibliotheque:${d.slug}`);
      return { name: d.name, slug: d.slug, files: d.files, path: `${BIBLIO_DIR}\\${d.name}`, single: false, pack: pack ? d.slug : null, built_at: pack?.built_at ?? null, job: j ? vueTache(j) : null };
    }),
  })],
  ["PUT", "/library/packs/:slug", ({ db, params, body }) => {
    const p = db.packs.find((x) => x.slug === params.slug);
    if (!p) throw new HttpError(404, `Recueil inconnu : ${params.slug}`);
    p.active = !!body?.active;
    journal(db, "app.packs.registry", "packs.active_changed", { slug: p.slug, active: p.active });
    acces(db, "PUT", `/library/packs/${p.slug}`, 200);
    return packPublic(p);
  }],
  ["POST", "/library/folders/:name/build", ({ db, params }) => {
    const d = DOSSIERS_BIBLIO.find((x) => x.name === params.name);
    if (!d) throw new HttpError(404, `Recueil introuvable : ${params.name}`);
    const enCours = tacheEnCours(db, `bibliotheque:${d.slug}`);
    if (enCours) return { status: "already_running", ...vueTache(enCours) };
    const j = lancerRecueil(db, d.name, d.slug, d.files);
    acces(db, "POST", `/library/folders/${encodeURIComponent(d.name)}/build`, 202);
    return { status: "started", ...vueTache(j) };
  }],
  ["GET", "/packs", ({ db }) => ({ packs: db.packs.map(packPublic), embedding_fingerprint: EMPREINTE_EMBEDDINGS, dir: "C:\\Aivocat\\packs" })],
];

/** Ce que l'analyse tirerait d'un fichier déposé : pages, passages, OCR, selon son type. */
function metaDepot(nom: string, taille: number): PieceMeta {
  const ext = extOf(nom);
  const base = { rel_path: nom, size_bytes: taille, ocr_pages: 0, status: "ok" as const, message: null };
  if (!SUPPORTEES.has(ext)) return { ...base, page_count: null, chunk_count: 0, ms: 0, unsupported: `extension non prise en charge (${ext || "aucune"})` };
  if (ext === ".pdf") {
    const pages = clamp(Math.round(taille / 90_000), 1, 80);
    return { ...base, page_count: pages, chunk_count: pages * 3, ms: 600 + pages * 380 };
  }
  if ([".png", ".jpg", ".jpeg", ".tiff"].includes(ext)) return { ...base, page_count: 1, ocr_pages: 1, chunk_count: 1, ms: 2200 };
  if (ext === ".pptx") {
    const pages = clamp(Math.round(taille / 150_000), 1, 60);
    return { ...base, page_count: pages, chunk_count: pages * 2, ms: 600 + pages * 200 };
  }
  return { ...base, page_count: null, chunk_count: clamp(Math.round(taille / 6_000), 1, 40), ms: 700 };
}

// Chaque route commence par faire avancer le temps simulé (fin des analyses en cours).
const routes: Route<Db>[] = ROUTES.map(([m, p, h]) => [m, p, (req: Req) => {
  dbCourante = req.db;
  avancer(req.db);
  return h(req);
}]);

installMockApi<Db>({
  base: BASE,
  name: "Aivocat",
  seed,
  routes,
  logins: [],
  hint: "Trois dossiers fictifs, pièces comprises. Ouvrez « Lemoine c/ SCI Les Glycines », cliquez une question proposée sous la zone de saisie, puis « Ouvrir, page N » sur une source : le PDF s'ouvre à la page citée. Pas de modèle dans votre navigateur : les réponses sont préparées.",
});

// =============================================================================
//  Intégration à l'interface
// =============================================================================
// L'interface ouvre les pièces et la fiche par de simples liens vers /api/... :
// des navigations, que la fausse API (qui remplace fetch) ne voit pas. Les liens
// des pièces fournies en PDF sont donc réécrits vers le fichier statique, page
// comprise ; les autres sont interceptés au clic.

const LIEN_PIECE = /^\/api\/cases\/([^/]+)\/files\/([^#]+)(#page=\d+)?$/;

function pieceDuLien(href: string): { c: Dossier; f: Fichier; page: string } | null {
  const m = LIEN_PIECE.exec(href);
  if (!m || !dbCourante) return null;
  const c = dbCourante.cases.find((x) => x.case_id === decodeURIComponent(m[1]));
  const rel = m[2].split("/").map(decodeURIComponent).join("/");
  const f = c?.source.find((x) => x.rel_path === rel);
  return c && f ? { c, f, page: m[3] ?? "" } : null;
}

function reecrire(a: Element) {
  const href = a.getAttribute("href");
  if (!href || !href.startsWith("/api/cases/")) return;
  const p = pieceDuLien(href);
  if (p?.f.pdf) a.setAttribute("href", `${BASE}/pieces/${p.f.pdf}${p.page}`);
}

new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "attributes") reecrire(m.target as Element);
    for (const n of m.addedNodes) {
      if (!(n instanceof Element)) continue;
      if (n.matches("a[href]")) reecrire(n);
      n.querySelectorAll("a[href]").forEach(reecrire);
    }
  }
}).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });

// L'interface renomme l'onglet d'après display_name : la mention « Démo » reste.
const titre = document.querySelector("title");
if (titre) {
  new MutationObserver(() => {
    if (!document.title.startsWith("Démo · ")) document.title = `Démo · ${document.title}`;
  }).observe(titre, { childList: true, characterData: true, subtree: true });
}

/** Toast dans le style de l'interface (même conteneur, même classe). */
function toast(message: string, genre = "") {
  const zone = document.getElementById("toasts");
  if (!zone) return;
  const n = document.createElement("div");
  n.className = "toast" + (genre ? " " + genre : "");
  n.textContent = message;
  zone.append(n);
  setTimeout(() => n.remove(), 6500);
}

window.addEventListener("click", (e) => {
  const cible = e.target as Element | null;
  // « Ouvrir le dossier » : la vraie application ouvre l'explorateur Windows du poste.
  const bouton = cible?.closest?.("#usb-banner button");
  if (bouton && bouton.textContent === "Ouvrir le dossier") {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast("Démo : sur le poste du cabinet, ce bouton ouvre le dossier des pièces dans l'explorateur Windows, pour y glisser de nouvelles pièces.");
    return;
  }
  const a = cible?.closest?.("a[href]");
  const href = a?.getAttribute("href") ?? "";
  if (!href.startsWith("/api/")) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (href.includes("/brief/export")) {
    // Enregistrer la fiche : vrai fichier texte, produit par la fausse API.
    void fetch(href)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? `Erreur ${r.status}`);
        const nom = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "fiche.txt";
        const url = URL.createObjectURL(await r.blob());
        const lien = Object.assign(document.createElement("a"), { href: url, download: nom });
        document.body.append(lien);
        lien.click();
        lien.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      })
      .catch((err: Error) => toast(err.message, "error"));
    return;
  }
  const p = pieceDuLien(href);
  const depose = p && deposes.get(`${p.c.case_id}/${p.f.rel_path}`);
  if (depose) {
    window.open(URL.createObjectURL(depose), "_blank", "noopener");
    return;
  }
  const nom = p?.f.rel_path ?? decodeURIComponent(href.split("/").pop() ?? "");
  toast(`Démo : pas d'aperçu pour « ${nom} » (pièce fictive, ou fichier déposé avant un rechargement de la page). Les pièces PDF d'exemple s'ouvrent, elles, à la page citée.`);
}, true);

// Questions proposées sous la zone de saisie : la démo n'ayant pas de modèle,
// elles indiquent ce qui a une réponse préparée. Seul ajout à l'interface.
function afficherSuggestions(c: Dossier) {
  const form = document.getElementById("form-ask");
  if (!form) return;
  let zone = document.getElementById("demo-suggestions");
  if (!zone) {
    zone = document.createElement("div");
    zone.id = "demo-suggestions";
    zone.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px";
    form.append(zone);
  }
  const titre = document.createElement("span");
  titre.className = "muted small";
  titre.textContent = "Essayez :";
  const boutons = JEUX[c.jeu].suggestions.map((q) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-ghost mini";
    b.textContent = q;
    b.addEventListener("click", () => {
      const champ = document.getElementById("question") as HTMLTextAreaElement | null;
      const envoyer = document.getElementById("btn-ask") as HTMLButtonElement | null;
      if (!champ || !envoyer || envoyer.disabled) return;
      champ.value = q;
      (form as HTMLFormElement).requestSubmit();
    });
    return b;
  });
  zone.replaceChildren(titre, ...boutons);
}
