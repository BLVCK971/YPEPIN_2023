// Fausse API des démos : remplace window.fetch pour les appels /api/*, avant
// le chargement de l'application cliente (import injecté en tête de son
// main.tsx par demos/build.mjs). Données fictives, gardées en sessionStorage
// pour survivre aux rechargements, remises à zéro par le bandeau de démo.
// Aucune requête ne part vers un serveur : le site reste 100 % statique.

export type Json = unknown;

export interface MockRequest<Db> {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  /** Corps JSON parsé, FormData tel quel, ou undefined. */
  body: any;
  /** Jeton Bearer reçu, null sans en-tête Authorization. */
  token: string | null;
  db: Db;
}

/** Valeur renvoyée : JSON (200), undefined (204), ou Response construite à la main (fichier). */
export type Handler<Db> = (req: MockRequest<Db>) => Json | Response | Promise<Json | Response>;

export type Route<Db> = [method: string, pattern: string, handler: Handler<Db>];

export class HttpError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

export interface DemoLogin<Db = any> {
  /** Libellé du bouton dans le bandeau. */
  label: string;
  /** Jeton posé dans localStorage (clé `tokenKey`) avant la navigation. */
  token?: string;
  /** Session tenue côté serveur (cookie httpOnly dans le vrai projet) : ouverte dans la db. */
  session?: (db: Db) => void;
  /** Route de l'application (sans le préfixe /demos/<nom>), hash compris le cas échéant. */
  to: string;
}

export interface DemoOptions<Db> {
  /** Préfixe des URL de la démo, ex. "/demos/arc-gr". */
  base: string;
  /** Nom affiché dans le bandeau. */
  name: string;
  /** Clé localStorage du jeton dans l'application cliente (absente si session par cookie). */
  tokenKey?: string;
  seed: () => Db;
  routes: Route<Db>[];
  logins: DemoLogin<Db>[];
  /** Ligne d'aide affichée dans le bandeau déplié (identifiants de démo...). */
  hint?: string;
  /** Préfixer par `base` les liens <a href="/..."> calculés à l'exécution (oui par défaut). */
  keepLinks?: boolean;
}

const LATENCE_MS = 180;

function compile(pattern: string): { re: RegExp; keys: string[] } {
  const keys: string[] = [];
  const re = pattern.replace(/\/:(\w+)/g, (_, k) => {
    keys.push(k);
    return "/([^/]+)";
  });
  return { re: new RegExp(`^${re}/?$`), keys };
}

export function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function file(content: BlobPart, type: string, filename: string): Response {
  return new Response(new Blob([content], { type }), {
    status: 200,
    headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${filename}"` },
  });
}

let compteur = 0;
/** Identifiant unique façon UUID, suffisant pour une démo. */
export function uid(): string {
  compteur += 1;
  return `demo-${Date.now().toString(36)}-${compteur.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function installMockApi<Db>(opts: DemoOptions<Db>): void {
  const storageKey = `demo:${opts.base}:db`;
  const routes = opts.routes.map(([method, pattern, handler]) => ({ method, handler, ...compile(pattern) }));

  let db: Db;
  try {
    const saved = sessionStorage.getItem(storageKey);
    db = saved ? (JSON.parse(saved) as Db) : opts.seed();
  } catch {
    db = opts.seed();
  }
  const save = () => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(db));
    } catch {
      // stockage indisponible (navigation privée) : la démo reste en mémoire
    }
  };

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return realFetch(input, init);

    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const path = url.pathname.slice(4);
    const headers = new Headers(init.headers);
    const auth = headers.get("Authorization");
    let body: any;
    if (init.body instanceof FormData) body = init.body;
    else if (typeof init.body === "string" && init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    await new Promise((r) => setTimeout(r, LATENCE_MS));

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(path);
      if (!m) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      try {
        const out = await r.handler({
          method,
          path,
          params,
          query: url.searchParams,
          body,
          token: auth?.startsWith("Bearer ") ? auth.slice(7) : null,
          db,
        });
        if (method !== "GET") save();
        if (out instanceof Response) return out;
        if (out === undefined) return new Response(null, { status: 204 });
        return json(out);
      } catch (e) {
        if (e instanceof HttpError) return json({ detail: e.message }, e.status);
        console.error("[démo] erreur dans la fausse API", method, path, e);
        return json({ detail: "Erreur interne de la démo" }, 500);
      }
    }
    console.warn("[démo] route non simulée :", method, path);
    return json({ detail: "Fonction non disponible dans la démo" }, 404);
  };

  const reset = () => {
    try {
      sessionStorage.removeItem(storageKey);
      if (opts.tokenKey) localStorage.removeItem(opts.tokenKey);
    } catch {
      // rien à nettoyer
    }
    location.assign(`${opts.base}/`);
  };
  const loginAs = (l: DemoLogin<Db>) => {
    if (l.session) {
      l.session(db);
      save();
    }
    try {
      if (l.token && opts.tokenKey) localStorage.setItem(opts.tokenKey, l.token);
    } catch {
      // sans localStorage, l'application reste déconnectée
    }
    const cible = `${opts.base}${l.to}`;
    location.assign(cible);
    // Même document (changement de hash seul) : recharger pour que l'app relise la session.
    if (cible.split("#")[0] === location.pathname) location.reload();
  };

  if (opts.keepLinks !== false) keepLinksInDemo(opts.base);

  const mount = () => mountBanner(opts, loginAs, reset);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
}

// Les liens écrits en dur (href="/...") sont réécrits au build, mais pas ceux
// calculés en JavaScript (navHref, contactHref...) : sans ce filet, un clic
// ferait sortir de la démo vers la racine d'ypepin.com. Les URL d'API restent
// telles quelles (servies par la fausse API, pas par une page).
function keepLinksInDemo(base: string) {
  const corriger = (a: Element) => {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return;
    if (href === base || href.startsWith(`${base}/`) || href.startsWith(`${base}#`) || href.startsWith(`${base}?`)) return;
    a.setAttribute("href", base + href);
  };
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes") corriger(m.target as Element);
      for (const n of m.addedNodes) {
        if (!(n instanceof Element)) continue;
        if (n.matches("a[href]")) corriger(n);
        n.querySelectorAll("a[href]").forEach(corriger);
      }
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
}

// Bandeau flottant, en DOM brut (hors de l'arbre React de l'application) et
// avec ses propres styles en ligne pour ne dépendre d'aucun CSS du client.
function mountBanner<Db>(opts: DemoOptions<Db>, loginAs: (l: DemoLogin<Db>) => void, reset: () => void) {
  const host = document.createElement("div");
  host.setAttribute("data-demo-banner", "");
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap { position: fixed; left: 12px; bottom: 12px; z-index: 2147483647; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: #f5f5f5; }
      .pill, .panel { background: rgba(10, 10, 14, 0.92); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
      .pill { display: flex; align-items: center; gap: 8px; padding: 7px 12px; cursor: pointer; border-radius: 999px; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
      .panel { width: min(320px, calc(100vw - 24px)); padding: 14px; }
      .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      h2 { margin: 0; font-size: 14px; font-weight: 600; }
      p { margin: 6px 0 10px; color: #a3a3a3; font-size: 12px; }
      .hint { margin-top: 0; color: #d4d4d4; }
      button, a { font: inherit; color: inherit; }
      .btn { display: block; width: 100%; box-sizing: border-box; text-align: left; margin-top: 6px; padding: 8px 10px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); cursor: pointer; text-decoration: none; }
      .btn:hover { background: rgba(255,255,255,0.14); }
      .btn.primary { border-color: rgba(34,211,238,0.45); background: rgba(34,211,238,0.12); }
      .x { background: none; border: 0; cursor: pointer; color: #a3a3a3; font-size: 18px; line-height: 1; padding: 0 2px; }
      .foot { display: flex; gap: 6px; margin-top: 10px; }
      .foot .btn { text-align: center; margin-top: 0; }
      [hidden] { display: none !important; }
    </style>
    <div class="wrap">
      <div class="pill" role="button" tabindex="0" aria-label="Ouvrir le panneau de démo"><span class="dot"></span>Démo · données fictives</div>
      <div class="panel" hidden>
        <div class="row"><h2>Démo ${escapeHtml(opts.name)}</h2><button class="x" aria-label="Réduire">×</button></div>
        <p>Vraie application, fausse API dans votre navigateur : données fictives, rien n'est envoyé ni enregistré sur un serveur.</p>
        ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ""}
        <div class="logins"></div>
        <div class="foot">
          <button class="btn reset">Réinitialiser</button>
          <a class="btn" href="https://ypepin.com/#Projets">ypepin.com ↗</a>
        </div>
      </div>
    </div>`;

  const pill = shadow.querySelector<HTMLElement>(".pill")!;
  const panel = shadow.querySelector<HTMLElement>(".panel")!;
  const logins = shadow.querySelector<HTMLElement>(".logins")!;
  for (const l of opts.logins) {
    const b = document.createElement("button");
    b.className = "btn primary";
    b.textContent = l.label;
    b.addEventListener("click", () => loginAs(l));
    logins.appendChild(b);
  }

  const openKey = `demo:${opts.base}:panel`;
  const setOpen = (open: boolean) => {
    pill.hidden = open;
    panel.hidden = !open;
    try {
      sessionStorage.setItem(openKey, open ? "1" : "0");
    } catch {
      // préférence d'affichage non retenue
    }
  };
  let initial = true;
  try {
    initial = sessionStorage.getItem(openKey) !== "0";
  } catch {
    // ouvert par défaut
  }
  setOpen(initial);
  pill.addEventListener("click", () => setOpen(true));
  pill.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && setOpen(true));
  shadow.querySelector(".x")!.addEventListener("click", () => setOpen(false));
  shadow.querySelector(".reset")!.addEventListener("click", reset);

  document.body.appendChild(host);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// --- Petits utilitaires de dates pour les jeux de données ---------------------

const JOUR = 86_400_000;

/** Date ISO (avec heure) décalée de `jours` par rapport à maintenant. */
export function ilYa(jours: number, heure = 10): string {
  const d = new Date(Date.now() - jours * JOUR);
  d.setHours(heure, 0, 0, 0);
  return d.toISOString();
}

/** Date seule (YYYY-MM-DD) décalée de `jours` (négatif = dans le futur). */
export function jourIlYa(jours: number): string {
  const d = new Date(Date.now() - jours * JOUR);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
