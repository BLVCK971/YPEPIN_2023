// Fausse API de la démo Matheva : reproduit dans le navigateur les routes du
// backend FastAPI (backend/app/routers/*.py) appelées par le front, avec la même
// logique métier (tarifs, paiements générés à la réalisation d'un cours, scoring
// du test diagnostique, portée parent dérivée du jeton). Rien n'est envoyé.
import { file, HttpError, installMockApi, json, type MockRequest, type Route, uid } from "../shared/runtime";
import {
  type CoursRow,
  type Db,
  type EleveRow,
  type LeadRow,
  type Niveau,
  type NotionRow,
  type PaiementRow,
  PARENT_DEMO_ID,
  PARENT_DEMO_LIEN,
  PROF_EMAIL,
  PROF_ID,
  PROF_PASSWORD,
  QUESTIONS,
  seed,
  type StatutNotion,
  type TypeCoursRow,
  type UserRow,
} from "./data";

const BASE = "/demos/matheva";
type Req = MockRequest<Db>;

const NIVEAUX: Niveau[] = ["6e", "5e", "4e", "3e", "2nde", "1ere", "terminale", "autre"];
const STATUTS_COURS = ["a_venir", "realise", "annule", "reporte_a_reprogrammer", "reporte_reprogramme"];
const STATUTS_NOTION: StatutNotion[] = ["a_revoir", "a_renforcer", "en_cours", "acquis"];

const maintenant = () => new Date().toISOString();
/** Réponse 201 des routes de création, comme le backend. */
const cree = (body: unknown) => json(body, 201);
const parLibelle = (a: { libelle: string }, b: { libelle: string }) => a.libelle.localeCompare(b.libelle, "fr");
const jeton = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

// Liens générés comme le backend (settings.public_url), mais vers la démo.
const lienParent = (token: string) => `${location.origin}${BASE}/parent/acces/${token}`;
const lienIcs = (token: string) => `${location.origin}${BASE}/api/calendrier/${token}.ics`;

// --- Authentification -----------------------------------------------------------
// Jetons de session lisibles : "demo-prof" ou "demo-parent-<id du compte>".

function utilisateur(req: Req): UserRow {
  const t = req.token;
  const id = t === "demo-prof" ? PROF_ID : t?.startsWith("demo-parent-") ? t.slice("demo-parent-".length) : null;
  const user = id ? req.db.users.find((u) => u.id === id) : undefined;
  if (!user) throw new HttpError(401, "Non authentifié");
  return user;
}

function exigeRole(req: Req, role: UserRow["role"]): UserRow {
  const user = utilisateur(req);
  if (user.role !== role) throw new HttpError(403, "Accès refusé");
  return user;
}

const prof = (h: (req: Req) => unknown) => (req: Req) => {
  exigeRole(req, "professeur");
  return h(req);
};

const sessionDe = (user: UserRow) => ({
  access_token: user.role === "professeur" ? "demo-prof" : `demo-parent-${user.id}`,
  token_type: "bearer",
});

// --- Validation minimale (422 comme Pydantic) -----------------------------------

function texte(v: unknown, champ: string): string {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(422, `Champ requis : ${champ}`);
  return v;
}

function email(v: unknown, champ: string): string {
  if (typeof v !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new HttpError(422, `Email invalide : ${champ}`);
  return v.toLowerCase();
}

function niveau(v: unknown): Niveau {
  if (!NIVEAUX.includes(v as Niveau)) throw new HttpError(422, "Niveau invalide");
  return v as Niveau;
}

/** "14:00" -> "14:00:00", sérialisation d'un datetime.time par FastAPI. */
const heureComplete = (h: string) => (h.length === 5 ? `${h}:00` : h);

// --- Lectures et sérialisation (mêmes formes que backend/app/schemas.py) -------

function trouver<T extends { id: string }>(rows: T[], id: string, detail: string): T {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new HttpError(404, detail);
  return row;
}

const eleveDe = (db: Db, id: string) => trouver(db.eleves, id, "Élève introuvable");

function eleveOut(db: Db, e: EleveRow, parent_access_link: string | null = null) {
  return {
    id: e.id,
    nom: e.nom,
    prenom: e.prenom,
    niveau: e.niveau,
    parent_id: e.parent_id,
    parent_email: db.users.find((u) => u.id === e.parent_id)?.email ?? null,
    tarif_horaire: e.tarif_horaire,
    notes: e.notes,
    created_at: e.created_at,
    parent_access_link,
  };
}

/** Programme d'un élève : notions partagées de son niveau (ou génériques) + ses notions privées. */
function programme(db: Db, e: EleveRow): NotionRow[] {
  return db.notions
    .filter((n) => n.eleve_id === e.id || (n.eleve_id === null && (n.niveau === e.niveau || n.niveau === null)))
    .sort(parLibelle);
}

/** Suivi complété d'une ligne « à revoir » pour toute notion du programme sans statut. */
function suiviDe(db: Db, e: EleveRow, avecCommentaire: boolean) {
  return programme(db, e).map((n) => {
    const s = db.suivi.find((r) => r.eleve_id === e.id && r.notion_id === n.id);
    const base = { notion_id: n.id, notion_libelle: n.libelle, statut: s?.statut ?? "a_revoir", updated_at: s?.updated_at ?? e.created_at };
    return avecCommentaire ? { ...base, commentaire: s?.commentaire ?? null } : base;
  });
}

function notionOut(n: NotionRow) {
  return { id: n.id, libelle: n.libelle, niveau: n.niveau, eleve_id: n.eleve_id, created_at: n.created_at };
}

const typeDe = (db: Db, id: string | null) => (id ? db.typesCours.find((t) => t.id === id) ?? null : null);

/** Le tarif de l'élève prime sur celui du type de cours. */
function tarifHoraire(e: EleveRow, t: TypeCoursRow | null): number | null {
  return e.tarif_horaire ?? t?.tarif_horaire ?? null;
}

function montantEstime(c: CoursRow, e: EleveRow, t: TypeCoursRow | null): number | null {
  const tarif = tarifHoraire(e, t);
  return tarif === null ? null : Math.round(tarif * c.duree_minutes / 60 * 100) / 100;
}

function coursOut(db: Db, c: CoursRow, vueParent = false) {
  const e = eleveDe(db, c.eleve_id);
  const t = typeDe(db, c.type_cours_id);
  const out = {
    id: c.id,
    eleve_id: c.eleve_id,
    eleve_nom: e.nom,
    eleve_prenom: e.prenom,
    type_cours_id: c.type_cours_id,
    type_cours_libelle: t?.libelle ?? null,
    montant_estime: montantEstime(c, e, t),
    date: c.date,
    heure: c.heure,
    duree_minutes: c.duree_minutes,
    statut: c.statut,
    notions_travaillees: c.notions_travaillees,
    difficultes: c.difficultes,
    travail_a_faire: c.travail_a_faire,
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
  // Le commentaire interne du professeur n'est jamais exposé côté parent.
  return vueParent ? out : { ...out, commentaire: c.commentaire };
}

const parDateHeure = (a: CoursRow, b: CoursRow) =>
  `${a.date} ${a.heure} ${a.created_at}`.localeCompare(`${b.date} ${b.heure} ${b.created_at}`);

function paiementOut(db: Db, p: PaiementRow, vueParent = false) {
  const e = eleveDe(db, p.eleve_id);
  const c = p.cours_id ? db.cours.find((x) => x.id === p.cours_id) : undefined;
  const out = {
    id: p.id,
    eleve_id: p.eleve_id,
    eleve_nom: e.nom,
    eleve_prenom: e.prenom,
    cours_id: p.cours_id,
    cours_date: c?.date ?? null,
    cours_heure: c?.heure ?? null,
    montant: p.montant,
    date: p.date,
    statut: p.statut,
  };
  return vueParent ? out : { ...out, note: p.note, created_at: p.created_at };
}

const parDateDesc = (a: PaiementRow, b: PaiementRow) =>
  `${b.date} ${b.created_at}`.localeCompare(`${a.date} ${a.created_at}`);

/** Un cours réalisé ou annulé génère son paiement (dû), jamais en double. */
function paiementAuto(db: Db, c: CoursRow) {
  if (c.statut !== "realise" && c.statut !== "annule") return;
  if (db.paiements.some((p) => p.cours_id === c.id)) return;
  const montant = montantEstime(c, eleveDe(db, c.eleve_id), typeDe(db, c.type_cours_id));
  db.paiements.push({
    id: uid(),
    eleve_id: c.eleve_id,
    cours_id: c.id,
    montant: montant ?? 0,
    date: c.date,
    statut: "du",
    note: montant === null ? "Aucun tarif applicable (ni élève, ni type de cours) — montant à corriger." : null,
    created_at: maintenant(),
  });
}

// --- Comptes parents ------------------------------------------------------------

/** Rattache l'élève au compte parent de cet email, ou en crée un si un nom est fourni. */
function parentPourEmail(db: Db, parentEmail: unknown, nom: unknown): [string | null, string | null] {
  if (!parentEmail) return [null, null];
  const mail = email(parentEmail, "parent_email");
  const existant = db.users.find((u) => u.email === mail && u.role === "parent");
  if (existant) return [existant.id, null];
  if (typeof nom !== "string" || !nom.trim()) return [null, null];
  const access_token = jeton();
  const id = uid();
  db.users.push({ id, email: mail, full_name: nom.trim(), role: "parent", access_token, calendar_token: jeton(), created_at: maintenant() });
  return [id, lienParent(access_token)];
}

function parentRattache(db: Db, e: EleveRow): UserRow {
  if (!e.parent_id) throw new HttpError(400, "Aucun parent rattaché à cet élève.");
  return trouver(db.users, e.parent_id, "Compte parent introuvable");
}

// --- Test diagnostique ----------------------------------------------------------

function messageRestitution(pourcentage: number): string {
  if (pourcentage >= 80)
    return "Un très bon niveau général sur ce test ! Quelques points précis à consolider pour aborder la suite du programme avec encore plus de confiance.";
  if (pourcentage >= 50)
    return "Des bases plutôt solides, avec quelques notions à retravailler pour être vraiment serein·e pour la suite du programme.";
  return "Plusieurs notions clés méritent d'être reprises calmement — c'est justement le genre de point de départ qu'un accompagnement ciblé permet de rattraper vite.";
}

/** Scoring côté « serveur » : score global + catégories maîtrisées (≥ 50 %) ou à renforcer. */
function soumettreTest({ body, db }: Req) {
  if (body?.site_web) return { score_global: "0/0", score_pourcentage: 0, message: "Merci !" };
  const niv = niveau(body?.niveau);
  const parent_nom = texte(body?.parent_nom, "parent_nom");
  const parent_email = email(body?.parent_email, "parent_email");
  const questions = QUESTIONS.filter((q) => q.niveau === niv);
  if (!questions.length) throw new HttpError(404, "Aucun test disponible pour ce niveau.");

  const reponses = new Map<string, string>();
  for (const r of Array.isArray(body.reponses) ? body.reponses : []) reponses.set(r.question_id, r.reponse);

  const parCategorie = new Map<string, boolean[]>();
  for (const q of questions) {
    const liste = parCategorie.get(q.categorie) ?? [];
    liste.push(reponses.get(q.id) === q.bonne_reponse);
    parCategorie.set(q.categorie, liste);
  }
  const total = questions.length;
  const correctes = [...parCategorie.values()].flat().filter(Boolean).length;
  const pourcentage = Math.round((100 * correctes) / total);
  const taux = (v: boolean[]) => v.filter(Boolean).length / v.length;
  const categories = [...parCategorie.keys()].sort((a, b) => a.localeCompare(b, "fr"));
  const maitrisees = categories.filter((c) => taux(parCategorie.get(c)!) >= 0.5);
  const aRenforcer = categories.filter((c) => taux(parCategorie.get(c)!) < 0.5);

  // Lead enregistré pour l'espace professeur ; la notification e-mail est simulée.
  db.leads.push({
    id: uid(),
    niveau: niv,
    parent_nom,
    parent_email,
    parent_telephone: body.parent_telephone || null,
    enfant_prenom: body.enfant_prenom || null,
    score_global: `${correctes}/${total}`,
    notions_maitrisees: maitrisees.join(", ") || null,
    notions_a_renforcer: aRenforcer.join(", ") || null,
    eleve_id: null,
    annule_le: null,
    created_at: maintenant(),
  });
  return { score_global: `${correctes}/${total}`, score_pourcentage: pourcentage, message: messageRestitution(pourcentage) };
}

const leadOut = (l: LeadRow) => ({ ...l });

// --- Flux iCal ------------------------------------------------------------------

/** Décalage (ms) du fuseau Europe/Paris à un instant donné. */
function decalageParis(instant: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - instant;
}

/** Date + heure locales de Paris -> horodatage UTC iCal (20261001T150000Z). */
function utcIcal(date: string, heure: string, minutes = 0): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = heure.split(":").map(Number);
  const naif = Date.UTC(y, m - 1, d, h, mi + minutes);
  const instant = naif - decalageParis(naif);
  return new Date(instant).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const echapperIcal = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

function fluxIcal(db: Db, user: UserRow): string {
  const enfants = new Set(db.eleves.filter((e) => e.parent_id === user.id).map((e) => e.id));
  const rows = db.cours
    .filter((c) => (user.role === "professeur" || enfants.has(c.eleve_id)) && c.statut !== "reporte_a_reprogrammer")
    .sort(parDateHeure);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lignes = ["BEGIN:VCALENDAR", "PRODID:-//Matheva//Calendrier des cours//FR", "VERSION:2.0", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Matheva — Cours", "X-WR-TIMEZONE:Europe/Paris"];
  for (const c of rows) {
    const e = eleveDe(db, c.eleve_id);
    const t = typeDe(db, c.type_cours_id);
    const description = [user.role === "professeur" ? c.commentaire : null, c.travail_a_faire ? `À faire : ${c.travail_a_faire}` : null]
      .filter(Boolean)
      .join("\n\n");
    lignes.push(
      "BEGIN:VEVENT",
      `UID:${c.id}@matheva.demo`,
      `SUMMARY:${echapperIcal(`${e.prenom} ${e.nom}${t ? ` — ${t.libelle}` : ""}`)}`,
      `DTSTART:${utcIcal(c.date, c.heure)}`,
      `DTEND:${utcIcal(c.date, c.heure, c.duree_minutes)}`,
      `DTSTAMP:${stamp}`,
      `STATUS:${c.statut === "annule" ? "CANCELLED" : "CONFIRMED"}`,
      ...(description ? [`DESCRIPTION:${echapperIcal(description)}`] : []),
      "END:VEVENT",
    );
  }
  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n") + "\r\n";
}

// --- Routes ---------------------------------------------------------------------

const routes: Route<Db>[] = [
  // Authentification
  [
    "POST",
    "/auth/login",
    ({ body, db }) => {
      const user = db.users.find((u) => u.email === String(body?.email ?? "").toLowerCase());
      if (!user || user.role !== "professeur" || body?.password !== PROF_PASSWORD)
        throw new HttpError(401, "Email ou mot de passe incorrect.");
      return sessionDe(user);
    },
  ],
  [
    "POST",
    "/auth/parent-access",
    ({ body, db }) => {
      const user = db.users.find((u) => u.role === "parent" && u.access_token === body?.token);
      if (!user) throw new HttpError(401, "Lien d'accès invalide.");
      return sessionDe(user);
    },
  ],
  [
    "GET",
    "/auth/me",
    (req) => {
      const u = utilisateur(req);
      return { id: u.id, email: u.email, full_name: u.full_name, role: u.role };
    },
  ],

  // Site public : contact et test diagnostique (e-mails simulés)
  [
    "POST",
    "/contact",
    ({ body }) => {
      if (body?.site_web) return undefined;
      texte(body?.nom, "nom");
      email(body?.email, "email");
      texte(body?.message, "message");
      return undefined;
    },
  ],
  [
    "GET",
    "/test-diagnostique/niveaux",
    () => {
      const compte = new Map<Niveau, number>();
      for (const q of QUESTIONS) compte.set(q.niveau, (compte.get(q.niveau) ?? 0) + 1);
      return [...compte].map(([niveau, nb_questions]) => ({ niveau, nb_questions }));
    },
  ],
  [
    "GET",
    "/test-diagnostique/questions",
    ({ query }) => {
      const niv = niveau(query.get("niveau"));
      const rows = QUESTIONS.filter((q) => q.niveau === niv);
      if (!rows.length) throw new HttpError(404, "Aucun test disponible pour ce niveau pour l'instant.");
      // Jamais la bonne réponse côté public.
      return rows.map(({ bonne_reponse: _, niveau: __, ...q }) => q);
    },
  ],
  ["POST", "/test-diagnostique/soumettre", soumettreTest],
  [
    "GET",
    "/test-diagnostique/leads",
    prof(({ query, db }) => {
      const statut = query.get("statut") ?? "en_attente";
      return db.leads
        .filter((l) =>
          statut === "en_attente" ? !l.eleve_id && !l.annule_le
          : statut === "converti" ? !!l.eleve_id
          : statut === "annule" ? !l.eleve_id && !!l.annule_le
          : true,
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(leadOut);
    }),
  ],
  [
    "POST",
    "/test-diagnostique/leads/:id/annuler",
    prof(({ params, db }) => {
      const lead = trouver(db.leads, params.id, "Lead introuvable");
      if (lead.eleve_id) throw new HttpError(409, "Ce lead a déjà été transformé en élève.");
      lead.annule_le = maintenant();
      return leadOut(lead);
    }),
  ],
  [
    "POST",
    "/test-diagnostique/leads/:id/reactiver",
    prof(({ params, db }) => {
      const lead = trouver(db.leads, params.id, "Lead introuvable");
      lead.annule_le = null;
      return leadOut(lead);
    }),
  ],

  // Élèves
  [
    "GET",
    "/eleves",
    prof(({ db }) =>
      [...db.eleves]
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"))
        .map((e) => eleveOut(db, e)),
    ),
  ],
  [
    "POST",
    "/eleves",
    prof(({ body, db }) => {
      const lead = body?.test_diagnostique_id ? trouver(db.leads, body.test_diagnostique_id, "Lead introuvable") : null;
      const nom = texte(body?.nom, "nom");
      const prenom = texte(body?.prenom, "prenom");
      const niv = niveau(body?.niveau);
      const [parent_id, lien] = parentPourEmail(db, body.parent_email, body.parent_full_name);
      const eleve: EleveRow = {
        id: uid(),
        nom,
        prenom,
        niveau: niv,
        parent_id,
        tarif_horaire: body.tarif_horaire ?? null,
        notes: body.notes ?? null,
        created_at: maintenant(),
      };
      db.eleves.push(eleve);
      if (lead) {
        lead.eleve_id = eleve.id;
        lead.annule_le = null;
      }
      return cree(eleveOut(db, eleve, lien));
    }),
  ],
  [
    "GET",
    "/eleves/:id",
    prof(({ params, db }) => {
      const e = eleveDe(db, params.id);
      return { ...eleveOut(db, e), suivi: suiviDe(db, e, true) };
    }),
  ],
  [
    "PATCH",
    "/eleves/:id",
    prof(({ params, body, db }) => {
      const e = eleveDe(db, params.id);
      if ("nom" in body) e.nom = texte(body.nom, "nom");
      if ("prenom" in body) e.prenom = texte(body.prenom, "prenom");
      if ("niveau" in body) e.niveau = niveau(body.niveau);
      if ("tarif_horaire" in body) e.tarif_horaire = body.tarif_horaire;
      if ("notes" in body) e.notes = body.notes;
      let lien: string | null = null;
      if ("parent_email" in body) [e.parent_id, lien] = parentPourEmail(db, body.parent_email, body.parent_full_name);
      return eleveOut(db, e, lien);
    }),
  ],
  [
    "DELETE",
    "/eleves/:id",
    prof(({ params, db }) => {
      eleveDe(db, params.id);
      // Séances, paiements, suivi et notions privées partent avec l'élève ; le
      // compte parent reste, les leads sont simplement détachés.
      db.paiements = db.paiements.filter((p) => p.eleve_id !== params.id);
      db.cours = db.cours.filter((c) => c.eleve_id !== params.id);
      db.suivi = db.suivi.filter((s) => s.eleve_id !== params.id);
      db.notions = db.notions.filter((n) => n.eleve_id !== params.id);
      for (const l of db.leads) if (l.eleve_id === params.id) l.eleve_id = null;
      db.eleves = db.eleves.filter((e) => e.id !== params.id);
      return undefined;
    }),
  ],
  [
    "PUT",
    "/eleves/:id/suivi/:notionId",
    prof(({ params, body, db }) => {
      eleveDe(db, params.id);
      const notion = trouver(db.notions, params.notionId, "Notion introuvable");
      if (body?.statut != null && !STATUTS_NOTION.includes(body.statut)) throw new HttpError(422, "Statut invalide");
      let row = db.suivi.find((s) => s.eleve_id === params.id && s.notion_id === notion.id);
      if (!row) {
        row = { eleve_id: params.id, notion_id: notion.id, statut: body?.statut ?? "a_revoir", commentaire: body?.commentaire ?? null, updated_at: maintenant() };
        db.suivi.push(row);
      } else {
        // Statut et commentaire indépendants : seul le champ envoyé change.
        if (body?.statut != null) row.statut = body.statut;
        if ("commentaire" in body) row.commentaire = body.commentaire;
        row.updated_at = maintenant();
      }
      return { notion_id: notion.id, notion_libelle: notion.libelle, statut: row.statut, commentaire: row.commentaire, updated_at: row.updated_at };
    }),
  ],
  [
    "POST",
    "/eleves/:id/notions",
    prof(({ params, body, db }) => {
      const e = eleveDe(db, params.id);
      const notion: NotionRow = {
        id: uid(),
        libelle: texte(body?.libelle, "libelle"),
        niveau: body.niveau ? niveau(body.niveau) : null,
        eleve_id: e.id,
        created_at: maintenant(),
      };
      db.notions.push(notion);
      return cree(notionOut(notion));
    }),
  ],
  [
    "PATCH",
    "/eleves/:id/parent",
    prof(({ params, body, db }) => {
      const e = eleveDe(db, params.id);
      const parent = parentRattache(db, e);
      const mail = email(body?.email, "email");
      const autre = db.users.find((u) => u.email === mail && u.role === "parent" && u.id !== parent.id);
      if (autre) e.parent_id = autre.id;
      else {
        // Correction sur place : le lien déjà transmis reste valable.
        parent.email = mail;
        if (body.full_name) parent.full_name = body.full_name;
      }
      return eleveOut(db, e);
    }),
  ],
  [
    "GET",
    "/eleves/:id/parent/link",
    prof(({ params, db }) => {
      const parent = parentRattache(db, eleveDe(db, params.id));
      if (!parent.access_token) throw new HttpError(404, "Ce compte parent n'a pas de lien d'accès.");
      return { parent_access_link: lienParent(parent.access_token) };
    }),
  ],
  [
    "POST",
    "/eleves/:id/parent/regenerate-link",
    prof(({ params, db }) => {
      const parent = parentRattache(db, eleveDe(db, params.id));
      parent.access_token = jeton();
      return { parent_access_link: lienParent(parent.access_token) };
    }),
  ],

  // Programme partagé (notions)
  [
    "GET",
    "/notions",
    prof(({ query, db }) => {
      const niv = query.get("niveau");
      return db.notions
        .filter((n) => n.eleve_id === null && (!niv || n.niveau === niv || n.niveau === null))
        .sort(parLibelle)
        .map(notionOut);
    }),
  ],
  [
    "POST",
    "/notions",
    prof(({ body, db }) => {
      const libelle = texte(body?.libelle, "libelle");
      const niv = body.niveau ? niveau(body.niveau) : null;
      if (db.notions.some((n) => n.libelle === libelle && n.niveau === niv && n.eleve_id === null))
        throw new HttpError(409, "Cette notion existe déjà pour ce niveau.");
      const notion: NotionRow = { id: uid(), libelle, niveau: niv, eleve_id: null, created_at: maintenant() };
      db.notions.push(notion);
      return cree(notionOut(notion));
    }),
  ],
  [
    "PATCH",
    "/notions/:id",
    prof(({ params, body, db }) => {
      const notion = db.notions.find((n) => n.id === params.id && n.eleve_id === null);
      if (!notion) throw new HttpError(404, "Notion introuvable");
      if ("libelle" in body) notion.libelle = texte(body.libelle, "libelle");
      if ("niveau" in body) notion.niveau = body.niveau ? niveau(body.niveau) : null;
      return notionOut(notion);
    }),
  ],
  [
    "DELETE",
    "/notions/:id",
    prof(({ params, db }) => {
      if (!db.notions.some((n) => n.id === params.id && n.eleve_id === null)) throw new HttpError(404, "Notion introuvable");
      db.suivi = db.suivi.filter((s) => s.notion_id !== params.id);
      db.notions = db.notions.filter((n) => n.id !== params.id);
      return undefined;
    }),
  ],

  // Types de cours
  ["GET", "/types-cours", prof(({ db }) => [...db.typesCours].sort(parLibelle))],
  [
    "POST",
    "/types-cours",
    prof(({ body, db }) => {
      const libelle = texte(body?.libelle, "libelle");
      if (db.typesCours.some((t) => t.libelle === libelle)) throw new HttpError(409, "Ce type de cours existe déjà.");
      const type: TypeCoursRow = { id: uid(), libelle, tarif_horaire: Number(body.tarif_horaire), created_at: maintenant() };
      db.typesCours.push(type);
      return cree(type);
    }),
  ],
  [
    "PATCH",
    "/types-cours/:id",
    prof(({ params, body, db }) => {
      const type = trouver(db.typesCours, params.id, "Type de cours introuvable");
      if ("libelle" in body) type.libelle = texte(body.libelle, "libelle");
      if (body.tarif_horaire != null) type.tarif_horaire = Number(body.tarif_horaire);
      return type;
    }),
  ],
  [
    "DELETE",
    "/types-cours/:id",
    prof(({ params, db }) => {
      trouver(db.typesCours, params.id, "Type de cours introuvable");
      if (db.cours.some((c) => c.type_cours_id === params.id))
        throw new HttpError(409, "Ce type de cours est utilisé par au moins un cours — réaffectez-les avant de le supprimer.");
      db.typesCours = db.typesCours.filter((t) => t.id !== params.id);
      return undefined;
    }),
  ],

  // Séances (calendrier et fiche de séance)
  [
    "GET",
    "/cours",
    prof(({ query, db }) => {
      const eleveId = query.get("eleve_id");
      return db.cours
        .filter((c) => !eleveId || c.eleve_id === eleveId)
        .sort(parDateHeure)
        .map((c) => coursOut(db, c));
    }),
  ],
  [
    "POST",
    "/cours",
    prof(({ body, db }) => {
      eleveDe(db, texte(body?.eleve_id, "eleve_id"));
      if (body.type_cours_id) trouver(db.typesCours, body.type_cours_id, "Type de cours introuvable");
      const statut = body.statut ?? "a_venir";
      if (!STATUTS_COURS.includes(statut)) throw new HttpError(422, "Statut invalide");
      const c: CoursRow = {
        id: uid(),
        eleve_id: body.eleve_id,
        type_cours_id: body.type_cours_id || null,
        date: texte(body.date, "date"),
        heure: heureComplete(body.heure || "14:00"),
        duree_minutes: Number(body.duree_minutes ?? 60),
        statut,
        notions_travaillees: body.notions_travaillees ?? null,
        difficultes: body.difficultes ?? null,
        travail_a_faire: body.travail_a_faire ?? null,
        commentaire: body.commentaire ?? null,
        created_at: maintenant(),
        updated_at: maintenant(),
      };
      db.cours.push(c);
      paiementAuto(db, c);
      return cree(coursOut(db, c));
    }),
  ],
  ["GET", "/cours/:id", prof(({ params, db }) => coursOut(db, trouver(db.cours, params.id, "Cours introuvable")))],
  [
    "PATCH",
    "/cours/:id",
    prof(({ params, body, db }) => {
      const c = trouver(db.cours, params.id, "Cours introuvable");
      if ("type_cours_id" in body && body.type_cours_id) trouver(db.typesCours, body.type_cours_id, "Type de cours introuvable");
      if ("statut" in body && !STATUTS_COURS.includes(body.statut)) throw new HttpError(422, "Statut invalide");
      for (const champ of ["type_cours_id", "date", "duree_minutes", "statut", "notions_travaillees", "difficultes", "travail_a_faire", "commentaire"] as const) {
        if (champ in body) (c as unknown as Record<string, unknown>)[champ] = body[champ];
      }
      if (body.heure) c.heure = heureComplete(body.heure);
      c.updated_at = maintenant();
      paiementAuto(db, c);
      return coursOut(db, c);
    }),
  ],
  [
    "DELETE",
    "/cours/:id",
    prof(({ params, db }) => {
      trouver(db.cours, params.id, "Cours introuvable");
      db.paiements = db.paiements.filter((p) => p.cours_id !== params.id);
      db.cours = db.cours.filter((c) => c.id !== params.id);
      return undefined;
    }),
  ],

  // Paiements
  [
    "GET",
    "/paiements",
    prof(({ query, db }) => {
      const eleveId = query.get("eleve_id");
      const coursId = query.get("cours_id");
      const statut = query.get("statut");
      return db.paiements
        .filter((p) => (!eleveId || p.eleve_id === eleveId) && (!coursId || p.cours_id === coursId) && (!statut || p.statut === statut))
        .sort(parDateDesc)
        .map((p) => paiementOut(db, p));
    }),
  ],
  [
    "POST",
    "/paiements",
    prof(({ body, db }) => {
      eleveDe(db, texte(body?.eleve_id, "eleve_id"));
      if (body.cours_id) {
        trouver(db.cours, body.cours_id, "Cours introuvable");
        if (db.paiements.some((p) => p.cours_id === body.cours_id)) throw new HttpError(409, "Ce cours a déjà un paiement associé.");
      }
      const p: PaiementRow = {
        id: uid(),
        eleve_id: body.eleve_id,
        cours_id: body.cours_id || null,
        montant: Number(body.montant),
        date: texte(body.date, "date"),
        statut: body.statut ?? "du",
        note: body.note ?? null,
        created_at: maintenant(),
      };
      db.paiements.push(p);
      return cree(paiementOut(db, p));
    }),
  ],
  [
    "PATCH",
    "/paiements/:id",
    prof(({ params, body, db }) => {
      const p = trouver(db.paiements, params.id, "Paiement introuvable");
      if (body.montant != null) p.montant = Number(body.montant);
      if (body.date) p.date = body.date;
      if (body.statut) p.statut = body.statut;
      if ("note" in body) p.note = body.note;
      return paiementOut(db, p);
    }),
  ],
  [
    "DELETE",
    "/paiements/:id",
    prof(({ params, db }) => {
      trouver(db.paiements, params.id, "Paiement introuvable");
      db.paiements = db.paiements.filter((p) => p.id !== params.id);
      return undefined;
    }),
  ],

  // Flux iCal (professeur ou parent, portée dérivée du compte)
  [
    "GET",
    "/calendrier/lien",
    (req) => ({ ics_url: lienIcs(utilisateur(req).calendar_token) }),
  ],
  [
    "POST",
    "/calendrier/lien/regenerate",
    (req) => {
      const user = utilisateur(req);
      user.calendar_token = jeton();
      return { ics_url: lienIcs(user.calendar_token) };
    },
  ],
  [
    "GET",
    "/calendrier/:fichier",
    ({ params, db }) => {
      const user = db.users.find((u) => `${u.calendar_token}.ics` === params.fichier);
      if (!user) throw new HttpError(404, "Lien invalide");
      return file(fluxIcal(db, user), "text/calendar; charset=utf-8", "matheva.ics");
    },
  ],

  // Espace parent : lecture seule, limité aux enfants du compte connecté
  [
    "GET",
    "/parent/eleves",
    (req) => {
      const user = exigeRole(req, "parent");
      return req.db.eleves
        .filter((e) => e.parent_id === user.id)
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"))
        .map((e) => ({ id: e.id, nom: e.nom, prenom: e.prenom, niveau: e.niveau, created_at: e.created_at, suivi: suiviDe(req.db, e, false) }));
    },
  ],
  [
    "GET",
    "/parent/cours",
    (req) => {
      const user = exigeRole(req, "parent");
      const enfants = new Set(req.db.eleves.filter((e) => e.parent_id === user.id).map((e) => e.id));
      return req.db.cours.filter((c) => enfants.has(c.eleve_id)).sort(parDateHeure).map((c) => coursOut(req.db, c, true));
    },
  ],
  [
    "GET",
    "/parent/paiements",
    (req) => {
      const user = exigeRole(req, "parent");
      const enfants = new Set(req.db.eleves.filter((e) => e.parent_id === user.id).map((e) => e.id));
      return req.db.paiements.filter((p) => enfants.has(p.eleve_id)).sort(parDateDesc).map((p) => paiementOut(req.db, p, true));
    },
  ],
];

installMockApi<Db>({
  base: BASE,
  name: "Matheva",
  tokenKey: "matheva_token",
  seed,
  routes,
  logins: [
    { label: "Espace professeur (Maeva)", token: "demo-prof", to: "/prof" },
    { label: "Espace parent (Claire Moreau)", token: `demo-parent-${PARENT_DEMO_ID}`, to: "/parent" },
  ],
  hint:
    `Professeur : <b>${PROF_EMAIL}</b> / <b>${PROF_PASSWORD}</b><br>` +
    `Parent : <a href="${BASE}/parent/acces/${PARENT_DEMO_LIEN}" style="color:#22d3ee">lien d'accès personnel</a> (sans mot de passe)`,
});

