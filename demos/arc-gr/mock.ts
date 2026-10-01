// Fausse API de la démo ARC GR : reproduit dans le navigateur les routes du
// backend FastAPI (backend/app/routers/*.py) appelées par le front, avec leur
// logique métier — journal automatique des changements de statut, date
// d'encaissement, corbeille et cascade, relance mail en deux niveaux, import
// avec aperçu et annulation, portail cloisonné au client du jeton, invitation.
// Aucun e-mail n'est envoyé, aucune IA n'est appelée : réponses simulées.
import { HttpError, installMockApi, type MockRequest, type Route } from "../shared/runtime";
import {
  ADMIN_EMAIL,
  CLOSED,
  DEFAULT_TEMPLATES,
  DEMO_PASSWORD,
  PENDING_INVITE_TOKEN,
  PORTAL_CLIENT_ID,
  PORTAL_CLIENT_NAME,
  PORTAL_EMAIL,
  STATUS_LABELS,
  euro,
  frDate,
  seed,
  type ColumnMapping,
  type Db,
  type DbBatch,
  type DbClient,
  type DbDossier,
  type DbEvent,
  type DbUser,
  type DossierStatus,
  type EventType,
} from "./data";
import { parseFile, referenceFromNotes } from "./fichier";

const BASE = "/demos/arc-gr";
type Req = MockRequest<Db>;

// --- Utilitaires -----------------------------------------------------------------

const nowIso = () => new Date().toISOString();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let compteur = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(++compteur).toString(36)}`;

/** Date du jour en heure locale (YYYY-MM-DD), comme local_today() côté serveur. */
function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
/** Date locale d'un horodatage ISO. */
function localDate(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

const isActive = (d: DbDossier) => !CLOSED.includes(d.status);
const STATUSES = Object.keys(STATUS_LABELS) as DossierStatus[];
const EVENT_TYPES: EventType[] = ["appel", "email", "courrier", "sms", "note", "statut", "autre"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function addEvent(db: Db, dossierId: string, type: EventType, description: string): DbEvent {
  const ev = { id: newId("e"), dossier_id: dossierId, event_type: type, description, created_at: nowIso() };
  db.events.push(ev);
  return ev;
}

// --- Authentification -------------------------------------------------------------
// Jetons opaques (le front ne les décode pas) : `demo-admin` pour l'équipe ARC,
// `demo-client-<id du client>` pour un compte du portail (un accès par client).

function tokenFor(u: DbUser): string {
  return u.role === "admin" ? "demo-admin" : `demo-client-${u.client_id}`;
}

function currentUser(req: Req): DbUser {
  const t = req.token;
  const user =
    t === "demo-admin"
      ? req.db.users.find((u) => u.role === "admin")
      : t?.startsWith("demo-client-")
        ? req.db.users.find((u) => u.role === "client" && u.client_id === t.slice("demo-client-".length))
        : undefined;
  if (!user) throw new HttpError(401, "Non authentifié");
  return user;
}

function requireAdmin(req: Req): DbUser {
  const user = currentUser(req);
  if (user.role !== "admin") throw new HttpError(403, "Cet espace est réservé à l'équipe ARC.");
  return user;
}

function requireClient(req: Req): DbUser & { client_id: string } {
  const user = currentUser(req);
  if (user.role !== "client" || !user.client_id) throw new HttpError(403, "Cet espace est réservé aux clients ARC.");
  const client = req.db.clients.find((c) => c.id === user.client_id);
  if (!client || client.deleted_at) throw new HttpError(403, "Cet accès n'est plus actif. Contactez ARC.");
  return user as DbUser & { client_id: string };
}

/** Enveloppe une route CRM : refuse tout jeton qui n'est pas celui de l'équipe ARC. */
const admin =
  (handler: (req: Req) => unknown) =>
  (req: Req) => {
    requireAdmin(req);
    return handler(req);
  };

function userOut(db: Db, u: DbUser) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    client_id: u.client_id,
    client_company: db.clients.find((c) => c.id === u.client_id)?.company_name ?? null,
  };
}

function inviteUser(db: Db, token: string): DbUser {
  const u = db.users.find((x) => x.invite_token === token);
  const client = db.clients.find((c) => c.id === u?.client_id);
  if (!u || !u.invite_expires_at || Date.parse(u.invite_expires_at) < Date.now() || !client || client.deleted_at) {
    throw new HttpError(404, "Ce lien d'invitation n'est plus valable. Demandez-en un nouveau à ARC.");
  }
  return u;
}

const authRoutes: Route<Db>[] = [
  ["POST", "/auth/login", ({ db, body }) => {
    const user = db.users.find((u) => u.email === String(body?.email ?? "").trim().toLowerCase());
    if (!user || user.password === null || user.password !== body?.password) {
      throw new HttpError(401, "Email ou mot de passe incorrect.");
    }
    if (user.role === "client" && db.clients.find((c) => c.id === user.client_id)?.deleted_at !== null) {
      throw new HttpError(403, "Cet accès n'est plus actif. Contactez ARC.");
    }
    user.last_login_at = nowIso();
    return { access_token: tokenFor(user), token_type: "bearer" };
  }],
  ["GET", "/auth/me", (req) => userOut(req.db, currentUser(req))],
  ["PATCH", "/auth/me/password", (req) => {
    const user = currentUser(req);
    if (user.password !== req.body?.current_password) throw new HttpError(401, "Mot de passe actuel incorrect.");
    if (String(req.body?.new_password ?? "").length < 8) throw new HttpError(422, "Le nouveau mot de passe doit faire au moins 8 caractères.");
    user.password = req.body.new_password;
    return { status: "ok" };
  }],
  ["GET", "/auth/invitation/:token", ({ db, params }) => {
    const u = inviteUser(db, params.token);
    return { email: u.email, full_name: u.full_name, company_name: db.clients.find((c) => c.id === u.client_id)!.company_name };
  }],
  ["POST", "/auth/invitation/:token", ({ db, params, body }) => {
    const u = inviteUser(db, params.token);
    if (String(body?.password ?? "").length < 8) throw new HttpError(422, "Le mot de passe doit faire au moins 8 caractères.");
    u.password = body.password;
    u.invite_token = null;
    u.invite_expires_at = null;
    u.last_login_at = nowIso();
    return { access_token: tokenFor(u), token_type: "bearer" };
  }],
];

// --- Clients ----------------------------------------------------------------------

function clientOut(c: DbClient) {
  return { ...c };
}

function withStats(db: Db, c: DbClient) {
  const live = db.dossiers.filter((d) => d.client_id === c.id && !d.deleted_at);
  const active = live.filter(isActive);
  return {
    ...clientOut(c),
    dossiers_count: live.length,
    active_dossiers_count: active.length,
    amount_outstanding: active.reduce((s, d) => s + d.amount, 0),
    amount_recovered: live.filter((d) => d.status === "regle").reduce((s, d) => s + d.amount, 0),
    has_portal_access: db.users.some((u) => u.role === "client" && u.client_id === c.id),
  };
}

function getClient(db: Db, id: string, includeDeleted = false): DbClient {
  const c = db.clients.find((x) => x.id === id);
  if (!c || (c.deleted_at && !includeDeleted)) throw new HttpError(404, "Client introuvable");
  return c;
}

function checkClientInput(db: Db, body: Record<string, unknown>, selfId?: string) {
  if ("company_name" in body) {
    const name = String(body.company_name ?? "").trim();
    if (!name) throw new HttpError(selfId ? 400 : 422, "Le nom de l'entreprise ne peut pas être vidé.");
    if (db.clients.some((c) => c.id !== selfId && c.company_name.toLowerCase() === name.toLowerCase())) {
      throw new HttpError(409, "Un client avec ce nom existe déjà.");
    }
  }
  if (body.contact_email && !EMAIL_RE.test(String(body.contact_email))) throw new HttpError(422, "Adresse email du contact invalide.");
  const rate = body.commission_rate;
  if (rate !== undefined && rate !== null && (typeof rate !== "number" || rate < 0 || rate > 100)) {
    throw new HttpError(422, "Le taux de commission doit être compris entre 0 et 100 %.");
  }
}

/** Période d'un compte rendu : par défaut les 7 derniers jours. */
function period(req: Req): [string, string] {
  const end = req.query.get("end") || todayLocal();
  const start = req.query.get("start") || new Date(Date.parse(`${end}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10);
  if (start > end) throw new HttpError(400, "La date de début doit précéder la date de fin.");
  return [start, end];
}

// Comptes rendus Word d'exemple, générés par le vrai backend (app/report.py)
// sur les données fictives de ce jeu : un par client de la démo.
const RAPPORTS = import.meta.glob("./rapports/*.docx", { query: "?url", import: "default", eager: true }) as Record<string, string>;

/** Brouillon « IA » du commentaire : rédigé à partir des chiffres réels de la période. */
function commentaire(db: Db, client: DbClient, start: string, end: string): string {
  const live = db.dossiers.filter((d) => d.client_id === client.id && !d.deleted_at);
  const ids = new Set(live.map((d) => d.id));
  const nbActions = db.events.filter((e) => ids.has(e.dossier_id) && localDate(e.created_at) >= start && localDate(e.created_at) <= end).length;
  const regles = live.filter((d) => d.settled_at && localDate(d.settled_at) >= start && localDate(d.settled_at) <= end);
  const recouvre = regles.reduce((s, d) => s + d.amount, 0);
  const actifs = live.filter(isActive);
  const encours = actifs.reduce((s, d) => s + d.amount, 0);
  const promesses = actifs.filter((d) => d.status === "promesse_reglement");
  const litiges = actifs.filter((d) => d.status === "en_litige");
  const e0 = (n: number) => euro(n).replace(/,\d\d €$/, " €");
  const pl = (n: number, s: string, p = `${s}s`) => `${n} ${n > 1 ? p : s}`;

  const phrases: string[] = [];
  phrases.push(
    recouvre > 0
      ? `Sur cette période, ${e0(recouvre)} ont été recouvrés (${pl(regles.length, "dossier soldé", "dossiers soldés")}), avec ${pl(nbActions, "action de relance", "actions de relance")} menées auprès de vos débiteurs.`
      : `Pas d'encaissement sur cette période, mais le suivi s'est poursuivi : ${pl(nbActions, "action de relance", "actions de relance")} menées auprès de vos débiteurs.`,
  );
  if (actifs.length) {
    let p = `L'encours restant s'élève à ${e0(encours)} sur ${pl(actifs.length, "dossier actif", "dossiers actifs")}`;
    if (promesses.length) {
      p += `, dont ${pl(promesses.length, "promesse de règlement", "promesses de règlement")} (${e0(promesses.reduce((s, d) => s + d.amount, 0))}) attendue${promesses.length > 1 ? "s" : ""} dans les prochains jours`;
    }
    phrases.push(`${p}.`);
  }
  if (litiges.length) {
    phrases.push(`${litiges.length > 1 ? `${litiges.length} dossiers en litige nécessitent` : "Un dossier en litige nécessite"} des pièces complémentaires de votre part (bon signé, devis accepté) pour avancer.`);
  }
  phrases.push("Nous poursuivons les relances téléphoniques et écrites sur les dossiers restants.");
  return phrases.join(" ");
}

// --- Accès au portail (côté CRM) ----------------------------------------------------

const portalUser = (db: Db, clientId: string) => db.users.find((u) => u.role === "client" && u.client_id === clientId);

function accessOut(u: DbUser, extra: { invite_url?: string | null; email_sent?: boolean } = {}) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    status: u.invite_token ? "invitation" : "actif",
    invite_expires_at: u.invite_expires_at,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
    invite_url: extra.invite_url ?? null,
    email_sent: extra.email_sent ?? false,
    email_error: null,
  };
}

/** Lien neuf (l'ancien cesse de marcher) ; l'e-mail est simulé, toujours « envoyé ». */
function issueInvitation(u: DbUser, sendEmail: boolean) {
  u.invite_token = `inv-${crypto.getRandomValues(new Uint32Array(2)).join("")}`;
  u.invite_expires_at = new Date(Date.now() + 7 * 86_400_000).toISOString();
  return accessOut(u, { invite_url: `${location.origin}${BASE}/invitation/${u.invite_token}`, email_sent: sendEmail });
}

const clientRoutes: Route<Db>[] = [
  ["GET", "/clients", admin(({ db }) =>
    db.clients
      .filter((c) => !c.deleted_at)
      .sort((a, b) => a.company_name.localeCompare(b.company_name, "fr"))
      .map((c) => withStats(db, c)),
  )],
  ["GET", "/clients/trash", admin(({ db }) =>
    db.clients.filter((c) => c.deleted_at).sort((a, b) => b.deleted_at!.localeCompare(a.deleted_at!)).map(clientOut),
  )],
  ["POST", "/clients", admin(({ db, body }) => {
    checkClientInput(db, { company_name: "", ...body });
    const c: DbClient = {
      id: newId("c"),
      company_name: String(body.company_name).trim(),
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      commission_rate: "commission_rate" in body ? body.commission_rate : 10,
      created_at: nowIso(),
      deleted_at: null,
    };
    db.clients.push(c);
    return clientOut(c);
  })],
  ["POST", "/clients/:id/report/comment", admin(async (req) => {
    const client = getClient(req.db, req.params.id);
    const [start, end] = period(req);
    await sleep(1200); // le temps d'une génération IA
    return { comment: commentaire(req.db, client, start, end) };
  })],
  ["GET", "/clients/:id/report", admin(async (req) => {
    const client = getClient(req.db, req.params.id);
    period(req);
    if ((req.query.get("comment") ?? "").length > 2000) throw new HttpError(400, "Commentaire trop long (2000 caractères max).");
    const url = RAPPORTS[`./rapports/${client.id}.docx`];
    if (!url) {
      throw new HttpError(501, "Téléchargement non disponible dans la démo pour un client créé pendant la visite : essayez avec un client du jeu de démonstration.");
    }
    const res = await fetch(url);
    if (!res.ok) throw new HttpError(502, "Le compte rendu d'exemple n'a pas pu être chargé.");
    return new Response(await res.blob(), {
      status: 200,
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    });
  })],
  ["PATCH", "/clients/:id", admin(({ db, params, body }) => {
    const c = getClient(db, params.id);
    checkClientInput(db, body ?? {}, c.id);
    for (const k of ["company_name", "contact_name", "contact_email", "contact_phone", "commission_rate"] as const) {
      if (k in body) (c as unknown as Record<string, unknown>)[k] = k === "company_name" ? String(body[k]).trim() : body[k];
    }
    return clientOut(c);
  })],
  ["DELETE", "/clients/:id", admin(({ db, params }) => {
    // Corbeille : même horodatage pour le client et ses dossiers encore vivants,
    // ce qui permet à la restauration de ne rattraper que ceux-là.
    const c = getClient(db, params.id);
    const ts = nowIso();
    c.deleted_at = ts;
    db.dossiers.filter((d) => d.client_id === c.id && !d.deleted_at).forEach((d) => (d.deleted_at = ts));
  })],
  ["POST", "/clients/:id/restore", admin(({ db, params }) => {
    const c = getClient(db, params.id, true);
    if (!c.deleted_at) throw new HttpError(400, "Ce client n'est pas dans la corbeille.");
    if (db.clients.some((x) => x.id !== c.id && x.company_name.toLowerCase() === c.company_name.toLowerCase())) {
      throw new HttpError(409, "Un autre client porte déjà ce nom — renommez-le avant de restaurer celui-ci.");
    }
    const ts = c.deleted_at;
    c.deleted_at = null;
    db.dossiers.filter((d) => d.client_id === c.id && d.deleted_at === ts).forEach((d) => (d.deleted_at = null));
    return clientOut(c);
  })],
  ["DELETE", "/clients/:id/purge", admin(({ db, params }) => {
    const c = getClient(db, params.id, true);
    if (!c.deleted_at) throw new HttpError(400, "Mettez d'abord ce client à la corbeille.");
    const ids = new Set(db.dossiers.filter((d) => d.client_id === c.id).map((d) => d.id));
    const batchIds = new Set(db.batches.filter((b) => b.client_id === c.id).map((b) => b.id));
    db.dossiers = db.dossiers.filter((d) => !ids.has(d.id));
    db.events = db.events.filter((e) => !ids.has(e.dossier_id));
    db.changes = db.changes.filter((x) => !ids.has(x.dossier_id) && !batchIds.has(x.batch_id));
    db.batches = db.batches.filter((b) => !batchIds.has(b.id));
    db.mappings = db.mappings.filter((m) => m.client_id !== c.id);
    db.users = db.users.filter((u) => u.client_id !== c.id);
    db.clients = db.clients.filter((x) => x.id !== c.id);
  })],
  ["GET", "/clients/:id/portal-access", admin(({ db, params }) => {
    getClient(db, params.id);
    const u = portalUser(db, params.id);
    return u ? accessOut(u) : null;
  })],
  ["POST", "/clients/:id/portal-access", admin(({ db, params, body }) => {
    const c = getClient(db, params.id);
    if (portalUser(db, c.id)) throw new HttpError(409, "Ce client a déjà un accès au portail.");
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(422, "Adresse email invalide.");
    if (!String(body?.full_name ?? "").trim()) throw new HttpError(422, "Le nom du contact est requis.");
    if (db.users.some((u) => u.email === email)) throw new HttpError(409, "Cette adresse email est déjà utilisée par un autre compte.");
    const u: DbUser = {
      id: newId("u"),
      email,
      full_name: String(body.full_name).trim(),
      role: "client",
      client_id: c.id,
      password: null,
      invite_token: null,
      invite_expires_at: null,
      last_login_at: null,
      created_at: nowIso(),
    };
    db.users.push(u);
    return issueInvitation(u, Boolean(body.send_email));
  })],
  ["POST", "/clients/:id/portal-access/invite", admin(({ db, params, query }) => {
    getClient(db, params.id);
    const u = portalUser(db, params.id);
    if (!u) throw new HttpError(404, "Ce client n'a pas d'accès au portail.");
    u.password = null; // neutralisé jusqu'à ce que le client en repose un
    return issueInvitation(u, query.get("send_email") === "true");
  })],
  ["DELETE", "/clients/:id/portal-access", admin(({ db, params }) => {
    getClient(db, params.id);
    const u = portalUser(db, params.id);
    if (!u) throw new HttpError(404, "Ce client n'a pas d'accès au portail.");
    db.users = db.users.filter((x) => x !== u);
  })],
];

// --- Dossiers -----------------------------------------------------------------------

function dossierOut(db: Db, d: DbDossier) {
  return { ...d, client_company: db.clients.find((c) => c.id === d.client_id)?.company_name ?? "" };
}

function batchOut(db: Db, b: DbBatch) {
  return { ...b, client_company: db.clients.find((c) => c.id === b.client_id)?.company_name ?? "" };
}

function getDossier(db: Db, id: string, includeDeleted = false): DbDossier {
  const d = db.dossiers.find((x) => x.id === id);
  if (!d || (d.deleted_at && !includeDeleted)) throw new HttpError(404, "Dossier introuvable");
  return d;
}

const byCreatedDesc = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);

const DOSSIER_FIELDS = ["client_id", "debtor_name", "amount", "status", "due_date", "next_action_date", "notes", "debtor_phone", "debtor_email", "invoice_reference", "invoice_date"] as const;

function checkDossierInput(db: Db, body: Record<string, unknown>) {
  for (const f of ["client_id", "debtor_name", "amount", "status"]) {
    if (f in body && body[f] === null) throw new HttpError(400, `Le champ « ${f} » ne peut pas être vidé.`);
  }
  if ("debtor_name" in body && !String(body.debtor_name).trim()) throw new HttpError(422, "Le nom du débiteur est requis.");
  if ("amount" in body && (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount < 0)) {
    throw new HttpError(422, "Le montant doit être un nombre positif.");
  }
  if ("status" in body && !STATUSES.includes(body.status as DossierStatus)) throw new HttpError(422, "Statut inconnu.");
  if ("client_id" in body && !db.clients.some((c) => c.id === body.client_id && !c.deleted_at)) throw new HttpError(404, "Client introuvable");
}

// Import : options du formulaire multipart, lues comme le fait FastAPI.
function importForm(db: Db, body: unknown) {
  if (!(body instanceof FormData)) throw new HttpError(422, "Formulaire d'import invalide.");
  const clientId = String(body.get("client_id") ?? "");
  if (!db.clients.some((c) => c.id === clientId)) throw new HttpError(404, "Client introuvable");
  const file = body.get("file");
  if (!(file instanceof File)) throw new HttpError(422, "Aucun fichier reçu.");
  const flag = (k: string) => body.get(k) === null || body.get(k) === "true";
  let mapping: Partial<ColumnMapping> | null = null;
  const raw = body.get("mapping");
  if (typeof raw === "string" && raw) {
    try {
      mapping = JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Correspondance de colonnes illisible.");
    }
  }
  return { clientId, file, hasHeader: flag("has_header"), markLost: flag("mark_missing_as_lost"), saveMapping: flag("save_mapping"), mapping };
}

/** Il faut une référence de facture sur au moins une ligne sur deux pour comparer le fichier à l'encours. */
const reconcilable = (rows: { invoice_reference: string | null }[], markLost: boolean) =>
  markLost && rows.filter((r) => r.invoice_reference).length * 2 >= rows.length;

function invoiceRefCandidates(db: Db, clientId: string | null) {
  const dossiers = db.dossiers
    .filter((d) => !d.deleted_at && !d.invoice_reference && d.notes && (!clientId || d.client_id === clientId))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const taken = new Map<string, Set<string>>();
  for (const d of db.dossiers) {
    if (d.invoice_reference && !d.deleted_at) {
      if (!taken.has(d.client_id)) taken.set(d.client_id, new Set());
      taken.get(d.client_id)!.add(d.invoice_reference);
    }
  }
  const out = [];
  for (const d of dossiers) {
    const found = referenceFromNotes(d.notes);
    if (!found) continue;
    const [reference, source] = found;
    if (!taken.has(d.client_id)) taken.set(d.client_id, new Set());
    const claimed = taken.get(d.client_id)!;
    const conflict = claimed.has(reference);
    if (!conflict) claimed.add(reference);
    out.push({ dossier_id: d.id, client_id: d.client_id, debtor_name: d.debtor_name, reference, source, conflict });
  }
  return out;
}

const dossierRoutes: Route<Db>[] = [
  ["GET", "/dossiers", admin(({ db, query }) => {
    const clientId = query.get("client_id");
    return db.dossiers
      .filter((d) => !d.deleted_at && (!clientId || d.client_id === clientId))
      .sort(byCreatedDesc)
      .map((d) => dossierOut(db, d));
  })],
  ["GET", "/dossiers/trash", admin(({ db, query }) => {
    const clientId = query.get("client_id");
    return db.dossiers
      .filter((d) => d.deleted_at && (!clientId || d.client_id === clientId))
      .sort((a, b) => b.deleted_at!.localeCompare(a.deleted_at!))
      .map((d) => dossierOut(db, d));
  })],
  ["POST", "/dossiers", admin(({ db, body }) => {
    checkDossierInput(db, { debtor_name: "", amount: null, client_id: null, ...body });
    const ts = nowIso();
    const d: DbDossier = {
      id: newId("d"),
      client_id: body.client_id,
      debtor_name: String(body.debtor_name).trim(),
      amount: body.amount,
      status: body.status ?? "nouveau",
      due_date: body.due_date ?? null,
      next_action_date: body.next_action_date ?? null,
      notes: body.notes ?? null,
      debtor_phone: body.debtor_phone ?? null,
      debtor_email: body.debtor_email ?? null,
      invoice_reference: body.invoice_reference ?? null,
      invoice_date: body.invoice_date ?? null,
      import_batch_id: null,
      mail_relance_level: 0,
      last_mail_relance_at: null,
      settled_at: null, // comme le backend : posée seulement par un passage en « réglé »
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    };
    db.dossiers.push(d);
    return dossierOut(db, d);
  })],
  ["GET", "/dossiers/import-batches", admin(({ db, query }) => {
    const clientId = query.get("client_id");
    return db.batches.filter((b) => !clientId || b.client_id === clientId).sort(byCreatedDesc).map((b) => batchOut(db, b));
  })],
  ["GET", "/dossiers/import/mapping", admin(({ db, query }) => db.mappings.find((m) => m.client_id === query.get("client_id")) ?? null)],
  ["DELETE", "/dossiers/import/mapping", admin(({ db, query }) => {
    db.mappings = db.mappings.filter((m) => m.client_id !== query.get("client_id"));
  })],
  ["POST", "/dossiers/import/preview", admin(async ({ db, body }) => {
    const form = importForm(db, body);
    let { hasHeader, mapping } = form;
    let source = "corrige";
    if (!mapping) {
      const saved = db.mappings.find((m) => m.client_id === form.clientId);
      if (saved) [mapping, source, hasHeader] = [saved.mapping, "memorise", saved.has_header];
      else source = "detecte";
    }
    const parsed = await parseFile(db, form.clientId, form.file, hasHeader, mapping);
    const rows = parsed.rows;
    const existing = db.dossiers.filter((d) => d.client_id === form.clientId && !d.deleted_at);
    const existingRefs = new Set(existing.map((d) => d.invoice_reference).filter(Boolean));
    const refsInFile = new Set(rows.map((r) => r.invoice_reference).filter(Boolean));
    const known = rows.filter((r) => r.invoice_reference && existingRefs.has(r.invoice_reference)).length;
    const reconciled = reconcilable(rows, form.markLost);
    return {
      columns: parsed.labels,
      has_header: hasHeader,
      mapping: parsed.mapping,
      detected: parsed.detected,
      mapping_source: source,
      rows_total: parsed.rowsTotal,
      rows_usable: rows.length,
      rows_missing_amount: rows.filter((r) => r.amount === null || r.amount < 0).length,
      rows_new: rows.length - known,
      rows_known: known,
      rows_lost: reconciled ? existing.filter((d) => isActive(d) && d.invoice_reference && !refsInFile.has(d.invoice_reference)).length : 0,
      reconciled,
      rows: rows.slice(0, 10).map((r) => ({
        ...r,
        leftover_label: r.leftover_label || null,
        already_known: Boolean(r.invoice_reference && existingRefs.has(r.invoice_reference)),
      })),
    };
  })],
  ["POST", "/dossiers/import", admin(async ({ db, body }) => {
    // Même logique que import_dossiers() : création des lignes inconnues,
    // complétion des champs vides et baisse de montant sur les connues,
    // passage en « perdu » des factures disparues — le tout journalisé.
    const form = importForm(db, body);
    let { hasHeader, mapping } = form;
    if (!mapping) {
      const saved = db.mappings.find((m) => m.client_id === form.clientId);
      if (saved) [mapping, hasHeader] = [saved.mapping, saved.has_header];
    }
    const parsed = await parseFile(db, form.clientId, form.file, hasHeader, mapping);
    const rows = parsed.rows;
    if (!rows.length) throw new HttpError(400, "Aucune ligne exploitable trouvée dans ce fichier.");

    const ts = nowIso();
    const batch: DbBatch = {
      id: newId("b"),
      client_id: form.clientId,
      filename: form.file.name || "fichier",
      rows_total: parsed.rowsTotal,
      rows_created: 0,
      rows_updated: 0,
      rows_skipped: parsed.rowsTotal - rows.length,
      rows_missing_amount: 0,
      rows_lost: 0,
      rows_amount_adjusted: 0,
      rows_not_comparable: 0,
      reconciled: false,
      created_at: ts,
    };
    const journal = (dossierId: string, field: string, oldV: string | null, newV: string | null) =>
      db.changes.push({ batch_id: batch.id, dossier_id: dossierId, field, old_value: oldV, new_value: newV });

    const byRef = new Map<string, DbDossier>();
    db.dossiers
      .filter((d) => d.client_id === form.clientId && d.invoice_reference && !d.deleted_at)
      .forEach((d) => byRef.set(d.invoice_reference!, d));

    const created: DbDossier[] = [];
    let updated = 0;
    for (const row of rows) {
      const ref = row.invoice_reference;
      const match = ref ? byRef.get(ref) : undefined;
      if (match) {
        const tracked = match.import_batch_id !== batch.id;
        for (const f of ["debtor_phone", "debtor_email", "invoice_date"] as const) {
          if (row[f] && !match[f]) {
            if (tracked) journal(match.id, f, null, row[f]);
            match[f] = row[f];
          }
        }
        const amount = row.amount;
        if (amount !== null && amount >= 0 && isActive(match) && (amount < match.amount || (match.amount === 0 && amount > 0))) {
          if (tracked) {
            journal(match.id, "amount", String(match.amount), String(amount));
            if (amount < match.amount) {
              addEvent(db, match.id, "note", `Montant ajusté : ${euro(match.amount)} → ${euro(amount)} — encaissement constaté dans le fichier « ${batch.filename} ».`);
              batch.rows_amount_adjusted++;
            }
          }
          match.amount = amount;
        }
        match.updated_at = ts;
        updated++;
        continue;
      }
      const notes: string[] = [];
      let amount = row.amount;
      if (amount === null) {
        amount = 0;
        batch.rows_missing_amount++;
        notes.push("Montant non détecté automatiquement à l'import.");
      } else if (amount < 0) {
        notes.push(`Montant négatif dans le fichier (${amount} €) — avoir ou régularisation, à vérifier.`);
        amount = 0;
        batch.rows_missing_amount++;
      }
      if (row.leftover_label) notes.push(`Infos fichier : ${row.leftover_label}`);
      const d: DbDossier = {
        id: newId("d"),
        client_id: form.clientId,
        debtor_name: row.debtor_name.slice(0, 255),
        amount,
        status: "nouveau",
        due_date: null,
        next_action_date: null,
        notes: notes.join(" | ") || null,
        debtor_phone: row.debtor_phone,
        debtor_email: row.debtor_email,
        invoice_reference: ref,
        invoice_date: row.invoice_date,
        import_batch_id: batch.id,
        mail_relance_level: 0,
        last_mail_relance_at: null,
        settled_at: null,
        created_at: ts,
        updated_at: ts,
        deleted_at: null,
      };
      db.dossiers.push(d);
      created.push(d);
      if (ref) byRef.set(ref, d);
    }

    batch.reconciled = reconcilable(rows, form.markLost);
    if (batch.reconciled) {
      const refsInFile = new Set(rows.map((r) => r.invoice_reference).filter(Boolean));
      for (const d of db.dossiers.filter((x) => x.client_id === form.clientId && !x.deleted_at && isActive(x) && x.import_batch_id !== batch.id)) {
        if (!d.invoice_reference) {
          batch.rows_not_comparable++;
          continue;
        }
        if (refsInFile.has(d.invoice_reference)) continue;
        journal(d.id, "status", d.status, "perdu");
        addEvent(db, d.id, "statut", `Statut changé : ${STATUS_LABELS[d.status]} → Perdu — facture absente du fichier « ${batch.filename} » importé le ${frDate(todayLocal())}.`);
        d.status = "perdu";
        d.updated_at = ts;
        batch.rows_lost++;
      }
    }
    batch.rows_created = created.length;
    batch.rows_updated = updated;
    db.batches.push(batch);
    if (form.saveMapping) {
      db.mappings = db.mappings.filter((m) => m.client_id !== form.clientId);
      db.mappings.push({ client_id: form.clientId, has_header: hasHeader, mapping: parsed.mapping, updated_at: ts });
    }
    return { dossiers: created.map((d) => dossierOut(db, d)), batch: batchOut(db, batch) };
  })],
  ["GET", "/dossiers/repair/invoice-references", admin(({ db, query }) => invoiceRefCandidates(db, query.get("client_id")))],
  ["POST", "/dossiers/repair/invoice-references", admin(({ db, query }) => {
    const candidates = invoiceRefCandidates(db, query.get("client_id"));
    let repaired = 0;
    for (const c of candidates) {
      const d = db.dossiers.find((x) => x.id === c.dossier_id);
      if (c.conflict || !d || d.invoice_reference) continue;
      d.invoice_reference = c.reference;
      d.updated_at = nowIso();
      addEvent(db, d.id, "note", `Référence de facture récupérée depuis les notes : ${c.reference} (colonne « ${c.source} » du fichier importé).`);
      repaired++;
    }
    return { repaired, skipped_conflicts: candidates.filter((c) => c.conflict).length };
  })],
  ["GET", "/dossiers/import-batches/:id/changes", admin(({ db, params }) => {
    if (!db.batches.some((b) => b.id === params.id)) throw new HttpError(404, "Import introuvable");
    return db.changes
      .filter((c) => c.batch_id === params.id)
      .flatMap((c) => {
        const d = db.dossiers.find((x) => x.id === c.dossier_id);
        return d ? [{ dossier_id: d.id, debtor_name: d.debtor_name, invoice_reference: d.invoice_reference, field: c.field, old_value: c.old_value, new_value: c.new_value }] : [];
      })
      .sort((a, b) => a.field.localeCompare(b.field) || a.debtor_name.localeCompare(b.debtor_name, "fr"));
  })],
  ["DELETE", "/dossiers/import-batches/:id", admin(({ db, params }) => {
    // Annulation : supprime les dossiers créés, rejoue à l'envers les
    // modifications, sauf celles retouchées à la main depuis.
    const batch = db.batches.find((b) => b.id === params.id);
    if (!batch) throw new HttpError(404, "Import introuvable");
    const createdIds = new Set(db.dossiers.filter((d) => d.import_batch_id === batch.id).map((d) => d.id));
    let statuses = 0;
    let fields = 0;
    let skipped = 0;
    for (const c of db.changes.filter((x) => x.batch_id === batch.id)) {
      const d = db.dossiers.find((x) => x.id === c.dossier_id);
      if (!d || createdIds.has(d.id)) continue;
      const rec = d as unknown as Record<string, unknown>;
      const current = rec[c.field];
      const still = c.field === "amount" ? Number(current ?? 0) === Number(c.new_value ?? 0) : (current ?? null) === c.new_value;
      if (!still) {
        skipped++;
        continue;
      }
      if (c.field === "status") {
        addEvent(db, d.id, "statut", `Statut changé : ${STATUS_LABELS[d.status]} → ${STATUS_LABELS[c.old_value as DossierStatus]} — annulation de l'import « ${batch.filename} ».`);
        d.status = c.old_value as DossierStatus;
        statuses++;
      } else if (c.field === "amount") {
        const previous = Number(c.old_value ?? 0);
        if (Number(c.new_value) < previous) {
          addEvent(db, d.id, "note", `Montant rétabli : ${euro(d.amount)} → ${euro(previous)} — annulation de l'import « ${batch.filename} ».`);
        }
        d.amount = previous;
        fields++;
      } else {
        rec[c.field] = c.old_value;
        fields++;
      }
      d.updated_at = nowIso();
    }
    db.dossiers = db.dossiers.filter((d) => !createdIds.has(d.id));
    db.events = db.events.filter((e) => !createdIds.has(e.dossier_id));
    db.changes = db.changes.filter((x) => x.batch_id !== batch.id && !createdIds.has(x.dossier_id));
    db.batches = db.batches.filter((b) => b.id !== batch.id);
    return { dossiers_deleted: createdIds.size, statuses_restored: statuses, fields_restored: fields, changes_skipped: skipped };
  })],
  ["GET", "/dossiers/:id", admin(({ db, params }) => dossierOut(db, getDossier(db, params.id)))],
  ["PATCH", "/dossiers/:id", admin(({ db, params, body }) => {
    const d = getDossier(db, params.id);
    const changes = body ?? {};
    checkDossierInput(db, changes);
    // Tout changement de statut est journalisé, et la date d'encaissement
    // posée (ou effacée) au passage en (ou hors de) « réglé ».
    const next = changes.status as DossierStatus | undefined;
    if (next && next !== d.status) {
      addEvent(db, d.id, "statut", `Statut changé : ${STATUS_LABELS[d.status]} → ${STATUS_LABELS[next]}`);
      if (next === "regle") d.settled_at = nowIso();
      else if (d.status === "regle") d.settled_at = null;
    }
    const rec = d as unknown as Record<string, unknown>;
    for (const f of DOSSIER_FIELDS) if (f in changes) rec[f] = f === "debtor_name" ? String(changes[f]).trim() : changes[f];
    d.updated_at = nowIso();
    return dossierOut(db, d);
  })],
  ["DELETE", "/dossiers/:id", admin(({ db, params }) => {
    getDossier(db, params.id).deleted_at = nowIso();
  })],
  ["POST", "/dossiers/:id/restore", admin(({ db, params }) => {
    const d = getDossier(db, params.id, true);
    if (!d.deleted_at) throw new HttpError(400, "Ce dossier n'est pas dans la corbeille.");
    const client = db.clients.find((c) => c.id === d.client_id);
    if (client?.deleted_at) throw new HttpError(400, "Le client de ce dossier est à la corbeille : restaurez d'abord le client.");
    d.deleted_at = null;
    return dossierOut(db, d);
  })],
  ["DELETE", "/dossiers/:id/purge", admin(({ db, params }) => {
    const d = getDossier(db, params.id, true);
    if (!d.deleted_at) throw new HttpError(400, "Mettez d'abord ce dossier à la corbeille.");
    db.dossiers = db.dossiers.filter((x) => x.id !== d.id);
    db.events = db.events.filter((e) => e.dossier_id !== d.id);
    db.changes = db.changes.filter((c) => c.dossier_id !== d.id);
  })],
  ["GET", "/dossiers/:id/events", admin(({ db, params }) => {
    getDossier(db, params.id);
    return db.events.filter((e) => e.dossier_id === params.id).sort(byCreatedDesc);
  })],
  ["POST", "/dossiers/:id/events", admin(({ db, params, body }) => {
    const d = getDossier(db, params.id);
    const type = (body?.event_type ?? "note") as EventType;
    if (!EVENT_TYPES.includes(type)) throw new HttpError(422, "Type d'action inconnu.");
    if (!String(body?.description ?? "").trim()) throw new HttpError(422, "La description est requise.");
    d.updated_at = nowIso();
    return addEvent(db, d.id, type, String(body.description));
  })],
  ["DELETE", "/dossiers/:id/events/:eventId", admin(({ db, params }) => {
    const ev = db.events.find((e) => e.id === params.eventId && e.dossier_id === params.id);
    if (!ev) throw new HttpError(404, "Événement introuvable");
    db.events = db.events.filter((e) => e !== ev);
  })],
];

// --- Relance par mail ------------------------------------------------------------------

const LEVEL_LABELS: Record<number, string> = { 1: "1re relance", 2: "2e relance" };
const OPEN: DossierStatus[] = ["nouveau", "relance_mail"];

function checkLevel(level: number): number {
  if (level !== 1 && level !== 2) throw new HttpError(404, "Il n'existe que deux niveaux de relance (1 et 2).");
  return level;
}

function getTemplate(db: Db, level: number) {
  let t = db.templates.find((x) => x.level === level);
  if (!t) {
    t = { level, subject: DEFAULT_TEMPLATES[level][0], body: DEFAULT_TEMPLATES[level][1], follow_up_enabled: true, follow_up_days: level === 1 ? 8 : 15, updated_at: nowIso() };
    db.templates.push(t);
  }
  return t;
}

/** Remplace les variables connues ; une variable inconnue reste visible telle quelle. */
function render(db: Db, text: string, d: DbDossier): string {
  const late = d.due_date ? Math.max(0, daysBetween(todayLocal(), d.due_date)) : 0;
  const values: Record<string, string> = {
    debiteur: d.debtor_name,
    client: db.clients.find((c) => c.id === d.client_id)?.company_name ?? "",
    montant: euro(d.amount),
    reference: d.invoice_reference || "—",
    date_facture: frDate(d.invoice_date),
    echeance: frDate(d.due_date),
    jours_retard: String(late),
  };
  return text.replace(/\{(debiteur|client|montant|reference|date_facture|echeance|jours_retard)\}/g, (_, k: string) => values[k]);
}

function checkSendable(d: DbDossier, level: number): string {
  if (!d.debtor_email) throw new HttpError(400, "Ce dossier n'a pas d'email de débiteur — renseignez-le dans sa fiche.");
  if (level === 2 && d.mail_relance_level < 1) throw new HttpError(400, "Envoyez d'abord la 1re relance à ce débiteur.");
  if (level <= d.mail_relance_level) throw new HttpError(400, "Cette relance a déjà été envoyée à ce débiteur.");
  if (!OPEN.includes(d.status)) throw new HttpError(400, "Ce dossier a dépassé l'étape de la relance écrite — suivez-le depuis la page Dossiers.");
  return d.debtor_email;
}

const relanceRoutes: Route<Db>[] = [
  ["GET", "/relance-mail/templates", admin(({ db }) => [1, 2].map((l) => getTemplate(db, l)))],
  ["PATCH", "/relance-mail/templates/:level", admin(({ db, params, body }) => {
    const t = getTemplate(db, checkLevel(Number(params.level)));
    if (body?.subject !== undefined && !String(body.subject ?? "").trim()) throw new HttpError(422, "L'objet ne peut pas être vide.");
    if (body?.body !== undefined && !String(body.body ?? "").trim()) throw new HttpError(422, "Le message ne peut pas être vide.");
    if (body?.follow_up_days != null && (body.follow_up_days < 1 || body.follow_up_days > 365)) {
      throw new HttpError(422, "Le délai de relance doit être compris entre 1 et 365 jours.");
    }
    for (const k of ["subject", "body", "follow_up_enabled", "follow_up_days"] as const) {
      if (body?.[k] !== undefined && body[k] !== null) (t as unknown as Record<string, unknown>)[k] = body[k];
    }
    t.updated_at = nowIso();
    return t;
  })],
  ["GET", "/relance-mail/dossiers/:id/preview", admin(({ db, params, query }) => {
    const level = checkLevel(Number(query.get("level")));
    const d = getDossier(db, params.id);
    const to = checkSendable(d, level);
    const t = getTemplate(db, level);
    return { level, to, subject: render(db, t.subject, d), body: render(db, t.body, d) };
  })],
  ["POST", "/relance-mail/dossiers/:id/send", admin(({ db, params, body }) => {
    // L'e-mail est simulé : rien ne part, mais le dossier avance comme en vrai.
    const level = checkLevel(Number(body?.level));
    const d = getDossier(db, params.id);
    const to = checkSendable(d, level);
    const t = getTemplate(db, level);
    const subject = body?.subject || render(db, t.subject, d);
    d.mail_relance_level = level;
    d.last_mail_relance_at = nowIso();
    d.status = "relance_mail";
    if (body?.next_action_date) d.next_action_date = body.next_action_date;
    d.updated_at = nowIso();
    addEvent(db, d.id, "email", `${LEVEL_LABELS[level]} envoyée par email à ${to} — objet « ${subject} »`);
    return dossierOut(db, d);
  })],
  ["POST", "/relance-mail/dossiers/:id/reset", admin(({ db, params, body }) => {
    const d = getDossier(db, params.id);
    const level = Number(body?.level);
    if (level !== 0 && level !== 1) throw new HttpError(422, "Niveau de retour invalide.");
    if (!OPEN.includes(d.status)) throw new HttpError(400, "Ce dossier a dépassé l'étape de la relance écrite — suivez-le depuis la page Dossiers.");
    if (level >= d.mail_relance_level) throw new HttpError(400, "Ce dossier est déjà à cette étape ou avant — pour avancer, envoyez la relance.");
    const cible = level === 0 ? "« Nouveaux dossiers »" : `« ${LEVEL_LABELS[level]} »`;
    addEvent(db, d.id, "statut", `Dossier ramené dans ${cible} — compteur de relances écrites ramené à ${level}. Les emails déjà envoyés restent dans cet historique.`);
    d.mail_relance_level = level;
    d.status = level === 0 ? "nouveau" : "relance_mail";
    d.updated_at = nowIso();
    return dossierOut(db, d);
  })],
];

// --- Règles IA ----------------------------------------------------------------------------

const aiRoutes: Route<Db>[] = [
  ["GET", "/ai-rules", admin(({ db }) => [...db.aiRules].sort(byCreatedDesc))],
  ["POST", "/ai-rules", admin(({ db, body }) => {
    if (!String(body?.text ?? "").trim()) throw new HttpError(422, "Le texte de la règle est requis.");
    const rule = { id: newId("r"), text: String(body.text), is_active: body.is_active ?? true, created_at: nowIso() };
    db.aiRules.push(rule);
    return rule;
  })],
  ["PATCH", "/ai-rules/:id", admin(({ db, params, body }) => {
    const rule = db.aiRules.find((r) => r.id === params.id);
    if (!rule) throw new HttpError(404, "Règle introuvable");
    if (typeof body?.text === "string") rule.text = body.text;
    if (typeof body?.is_active === "boolean") rule.is_active = body.is_active;
    return rule;
  })],
  ["DELETE", "/ai-rules/:id", admin(({ db, params }) => {
    if (!db.aiRules.some((r) => r.id === params.id)) throw new HttpError(404, "Règle introuvable");
    db.aiRules = db.aiRules.filter((r) => r.id !== params.id);
  })],
];

// --- Portail client (lecture seule, borné au client du jeton) ------------------------------

// Le client voit les actions menées pour lui, jamais les notes internes d'Ariane.
const VISIBLE: EventType[] = ["appel", "email", "courrier", "sms", "statut"];

function visibleEvents(db: Db, dossierId: string): DbEvent[] {
  return db.events.filter((e) => e.dossier_id === dossierId && VISIBLE.includes(e.event_type)).sort(byCreatedDesc);
}

const liveOf = (db: Db, clientId: string) => db.dossiers.filter((d) => d.client_id === clientId && !d.deleted_at).sort(byCreatedDesc);

const portalRoutes: Route<Db>[] = [
  ["GET", "/portal/summary", (req) => {
    const { client_id } = requireClient(req);
    const db = req.db;
    const dossiers = liveOf(db, client_id);
    const active = dossiers.filter(isActive);
    const settled = dossiers.filter((d) => d.status === "regle");
    const total = dossiers.reduce((s, d) => s + d.amount, 0);
    const recovered = settled.reduce((s, d) => s + d.amount, 0);
    const month = (iso: string) => localDate(iso).slice(0, 7);
    const thisMonth = todayLocal().slice(0, 7);
    // Les 6 derniers mois, du plus ancien au plus récent.
    const months: string[] = [];
    const [y0, m0] = thisMonth.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(Date.UTC(y0, m0 - 1 - i, 1));
      months.push(dt.toISOString().slice(0, 7));
    }
    const upcoming = active.map((d) => d.next_action_date).filter((x): x is string => Boolean(x)).sort();
    return {
      company_name: db.clients.find((c) => c.id === client_id)!.company_name,
      dossiers_count: dossiers.length,
      active_dossiers_count: active.length,
      settled_dossiers_count: settled.length,
      amount_outstanding: active.reduce((s, d) => s + d.amount, 0),
      amount_recovered: recovered,
      amount_total: total,
      recovery_rate: total ? Math.round((recovered / total) * 1000) / 10 : 0,
      amount_recovered_this_month: settled.filter((d) => d.settled_at && month(d.settled_at) === thisMonth).reduce((s, d) => s + d.amount, 0),
      next_action_date: upcoming[0] ?? null,
      by_status: STATUSES.flatMap((status) => {
        const list = dossiers.filter((d) => d.status === status);
        return list.length ? [{ status, count: list.length, amount: list.reduce((s, d) => s + d.amount, 0) }] : [];
      }),
      monthly_recovered: months.map((m) => {
        const list = settled.filter((d) => d.settled_at && month(d.settled_at) === m);
        return { month: m, amount: list.reduce((s, d) => s + d.amount, 0), count: list.length };
      }),
    };
  }],
  ["GET", "/portal/dossiers", (req) => {
    const { client_id } = requireClient(req);
    return liveOf(req.db, client_id).map((d) => {
      const events = visibleEvents(req.db, d.id);
      return {
        id: d.id,
        debtor_name: d.debtor_name,
        amount: d.amount,
        status: d.status,
        invoice_reference: d.invoice_reference,
        invoice_date: d.invoice_date,
        due_date: d.due_date,
        next_action_date: d.next_action_date,
        events_count: events.length,
        last_event_at: events[0]?.created_at ?? null,
        created_at: d.created_at,
        updated_at: d.updated_at,
      };
    });
  }],
  ["GET", "/portal/dossiers/:id/events", (req) => {
    const { client_id } = requireClient(req);
    const d = req.db.dossiers.find((x) => x.id === req.params.id);
    // Un dossier d'un autre client renvoie 404, sans révéler qu'il existe.
    if (!d || d.deleted_at || d.client_id !== client_id) throw new HttpError(404, "Dossier introuvable");
    return visibleEvents(req.db, d.id).map((e) => ({ ...e, debtor_name: d.debtor_name }));
  }],
];

// --- Formulaire de contact du site vitrine ---------------------------------------------------

const contactRoutes: Route<Db>[] = [
  ["POST", "/contact", ({ body }) => {
    if (body?.site_web) return undefined; // honeypot : succès silencieux
    for (const k of ["nom", "entreprise", "telephone", "email", "message"]) {
      if (!String(body?.[k] ?? "").trim()) throw new HttpError(422, "Vérifiez les champs du formulaire (email valide, champs obligatoires remplis).");
    }
    if (!EMAIL_RE.test(String(body.email))) throw new HttpError(422, "Vérifiez les champs du formulaire (email valide, champs obligatoires remplis).");
    return undefined; // e-mail simulé : rien n'est envoyé
  }],
];

installMockApi<Db>({
  base: BASE,
  name: "ARC GR",
  tokenKey: "arc_gr_token",
  seed,
  routes: [...authRoutes, ...clientRoutes, ...dossierRoutes, ...relanceRoutes, ...aiRoutes, ...portalRoutes, ...contactRoutes],
  logins: [
    { label: "Espace ARC (CRM)", token: "demo-admin", to: "/crm" },
    { label: `Portail client (${PORTAL_CLIENT_NAME})`, token: `demo-client-${PORTAL_CLIENT_ID}`, to: "/portail" },
  ],
  hint:
    `Connexion : <b>${ADMIN_EMAIL}</b> ou <b>${PORTAL_EMAIL}</b>, mot de passe <b>${DEMO_PASSWORD}</b>. ` +
    `<a href="${BASE}/invitation/${PENDING_INVITE_TOKEN}" style="text-decoration:underline">Invitation au portail en attente</a>.`,
});
