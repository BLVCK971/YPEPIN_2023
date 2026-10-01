// Fausse API de la démo HellBoy : reproduit dans le navigateur les routes
// Fastify de apps/api (auth, utilisateurs, dossiers, photos, dégâts,
// chiffrage, imports, export dataset) avec les mêmes règles — table des droits
// de packages/domain, cycle de vie des dossiers, contrôles de complétude,
// montants en centimes entiers, boîtes dans [0,1], seuls les dossiers validés
// à l'export. Rien ne part vers un serveur.
//
// Deux écarts avec le vrai produit, imposés par le site statique :
// - les erreurs sont renvoyées au format { message, details } que lit
//   apiClient.ts (HttpError du runtime commun renvoie { detail }) ;
// - les fichiers servis par l'API (/api/photos/:id/file, PDF joints, archive
//   d'export) sont chargés par <img src> ou <a href>, hors de fetch : les URL
//   sont redirigées vers les fichiers de la démo, et les clics sur un lien
//   /api/ passent par la fausse API.
import {
  blockingIssues,
  can,
  caseSeverity,
  caseTotalCents,
  CASE_SOURCE_CODES,
  CASE_STATUS_CODES,
  completenessIssues,
  COMPLETENESS_LABELS,
  DAMAGE_TYPE_CODES,
  DATASET_SCHEMA_VERSION,
  DATASET_STATUS,
  LABOR_SCALE_CODES,
  normalizeCode,
  PART_TYPE_CODES,
  parseDamageType,
  parseSeverity,
  parseViewType,
  parseZone,
  permissionsFor,
  REPAIR_OPERATION_CODES,
  ROLE_CODES,
  SENSITIVE_VIEW_TYPES,
  SEVERITY_CODES,
  userDisplayName,
  VIEW_TYPE_CODES,
  ZONE_COVERAGE,
  ZONE_CODES,
  type BoundingBox,
  type CaseDamage,
  type CaseRepairLine,
  type CaseStatus,
  type DatasetExportFilters,
  type DatasetRecord,
  type DatasetStats,
  type Permission,
  type RepairOperation,
  type UserRole,
} from "@/../../../packages/domain/dist/index.js";
import { installMockApi, json, type MockRequest, type Route } from "../shared/runtime";
import {
  archiveNotes,
  BASE,
  type CaseRow,
  type Db,
  DEMO_EMAILS,
  DREVIO_REF_C04,
  DREVIO_REF_C13,
  type ExportRow,
  type ImportOutcome,
  linesFromEstimate,
  newId,
  PASSWORD,
  type PhotoRow,
  reference,
  SCENES,
  sceneDocuments,
  scenePhotos,
  seed,
  seedId,
  USER_ADMIN,
  USER_ANNOTATOR,
  USER_REVIEWER,
  type UserRow,
} from "./data";
import { plateFromArchiveName, registrationYear } from "./estimate";
import { buildZip, type ZipEntry } from "./zip";

type Req = MockRequest<Db>;

// ── Erreurs au format de l'API HellBoy ──────────────────────────────────────

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string, details?: unknown): never => {
  throw new ApiError(status, message, details);
};

/** Dernière db vue par un handler : la même instance pour toute la vie de la page. */
let currentDb: Db | null = null;

function route(method: string, pattern: string, handler: (req: Req) => unknown): Route<Db> {
  return [
    method,
    pattern,
    async (req) => {
      currentDb = req.db;
      try {
        const out = await handler(req);
        return out as never;
      } catch (e) {
        if (e instanceof ApiError) {
          return json({ message: e.message, ...(e.details === undefined ? {} : { details: e.details }) }, e.status);
        }
        throw e;
      }
    },
  ];
}

const now = () => new Date().toISOString();

// ── Session et droits ───────────────────────────────────────────────────────

function sessionUser(req: Req): UserRow {
  const user = req.db.users.find((u) => u.id === req.db.sessionUserId);
  // Comme le vrai plugin de session : un compte désactivé perd sa session.
  if (!user || !user.isActive) return fail(401, "Authentification requise");
  return user;
}

function requirePermission(req: Req, permission: Permission): UserRow {
  const user = sessionUser(req);
  if (!can(user.role, permission)) fail(403, `Action réservée : votre rôle ne permet pas « ${permission} ».`);
  return user;
}

function publicUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    displayName: userDisplayName(u),
    role: u.role,
    isActive: u.isActive,
    permissions: permissionsFor(u.role),
  };
}

function managedUser(u: UserRow) {
  const { password: _password, ...rest } = u;
  return { ...rest, displayName: userDisplayName(u) };
}

function fullName(db: Db, userId: string | null): string | null {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  const name = [u.firstName ?? "", u.lastName ?? ""].join(" ").trim();
  return name.length > 0 ? name : null;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// ── Validation (reprend les schémas zod de l'API) ───────────────────────────

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const body = (req: Req): Record<string, unknown> => (isObject(req.body) ? req.body : {});
const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

function optText(o: Record<string, unknown>, key: string, max: number, label: string): string | null | undefined {
  if (!has(o, key)) return undefined;
  const v = o[key];
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return fail(400, `${label} : texte attendu`);
  const t = v.trim();
  if (t.length > max) fail(400, `${label} : ${max} caractères au maximum`);
  return t.length === 0 ? null : t;
}

function optInt(o: Record<string, unknown>, key: string, min: number, max: number, label: string): number | null | undefined {
  if (!has(o, key)) return undefined;
  const v = o[key];
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) return fail(400, `${label} invalide`);
  return v;
}

function optDate(o: Record<string, unknown>, key: string): string | null | undefined {
  if (!has(o, key)) return undefined;
  const v = o[key];
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return fail(400, "Date attendue au format AAAA-MM-JJ");
  return v.trim();
}

function oneOf<T extends string>(codes: readonly T[], v: unknown, label: string): T {
  if (typeof v !== "string" || !(codes as readonly string[]).includes(v)) return fail(400, `${label} : valeur hors vocabulaire (« ${String(v)} »)`);
  return v as T;
}

const EURO_CENTS_MAX = 100_000_000;
function cents(o: Record<string, unknown>, key: string, label: string): number | undefined {
  if (!has(o, key) || o[key] === undefined) return undefined;
  const v = o[key];
  // Entiers en centimes uniquement : un montant flottant serait du bruit d'arrondi dans le dataset.
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > EURO_CENTS_MAX) {
    return fail(400, `${label} : montant entier en centimes attendu`);
  }
  return v;
}

function bbox(v: unknown): BoundingBox | null {
  if (v === null || v === undefined) return null;
  if (!isObject(v)) return fail(400, "Zone pointée invalide");
  const { x, y, width, height } = v as Record<string, unknown>;
  const nums = [x, y, width, height];
  if (!nums.every((n) => typeof n === "number" && Number.isFinite(n))) return fail(400, "Zone pointée invalide");
  const b = { x: x as number, y: y as number, width: width as number, height: height as number };
  if (b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1 || b.width <= 0 || b.width > 1 || b.height <= 0 || b.height > 1) {
    fail(400, "Zone pointée invalide : coordonnées normalisées dans [0, 1] attendues");
  }
  if (b.x + b.width > 1.0001 || b.y + b.height > 1.0001) fail(400, "La zone pointée sort de l'image");
  return b;
}

// ── Dossiers ────────────────────────────────────────────────────────────────

function findCase(db: Db, id: string): CaseRow {
  return db.cases.find((c) => c.id === id) ?? fail(404, "Dossier introuvable");
}

function caseRows(db: Db, c: CaseRow) {
  const photos = db.photos.filter((p) => p.caseId === c.id).sort((a, b) => a.imageOrder - b.imageOrder || a.createdAt.localeCompare(b.createdAt));
  const damages = db.damages.filter((d) => d.caseId === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const repairLines = db.repairLines.filter((l) => l.caseId === c.id).sort((a, b) => a.lineOrder - b.lineOrder || a.createdAt.localeCompare(b.createdAt));
  const documents = db.documents.filter((d) => d.caseId === c.id);
  return { photos, damages, repairLines, documents };
}

function isCaseEditable(user: UserRow, c: CaseRow): boolean {
  if (!can(user.role, "case:write")) return false;
  if (c.status === "validated") return false;
  if (user.role === "annotator" && c.createdBy !== user.id) return false;
  return true;
}

function assertCaseEditable(user: UserRow, c: CaseRow): void {
  if (isCaseEditable(user, c)) return;
  if (c.status === "validated") {
    fail(409, "Ce dossier est validé et figé. Rouvrez-le pour le modifier — il a peut-être déjà servi à un export.");
  }
  fail(403, "Vous ne pouvez pas modifier ce dossier.");
}

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  draft: ["ready"],
  ready: ["validated", "rejected", "draft"],
  validated: ["rejected", "draft"],
  rejected: ["ready", "draft"],
};

function assertTransition(from: CaseStatus, to: CaseStatus): void {
  if (!TRANSITIONS[from].includes(to)) fail(409, `Transition impossible : un dossier « ${from} » ne peut pas passer « ${to} ».`);
}

function assertSubmittable(db: Db, c: CaseRow): void {
  const rows = caseRows(db, c);
  const blocking = blockingIssues(completenessIssues({ trainingCase: c, ...rows }));
  if (blocking.length > 0) {
    fail(422, `Dossier incomplet : ${blocking.map((i) => COMPLETENESS_LABELS[i]).join(", ")}.`, { issues: blocking });
  }
}

function stripCase(c: CaseRow) {
  const { importMetadata: _meta, ...trainingCase } = c;
  return trainingCase;
}
const stripPhoto = ({ url: _url, ...p }: PhotoRow) => p;

function presentDetail(db: Db, c: CaseRow, user: UserRow) {
  const rows = caseRows(db, c);
  return {
    trainingCase: stripCase(c),
    photos: rows.photos.map(stripPhoto),
    damages: rows.damages,
    repairLines: rows.repairLines,
    documents: rows.documents.map(({ url: _url, ...d }) => d),
    importMetadata: c.importMetadata,
    completeness: completenessIssues({ trainingCase: c, ...rows }),
    totalCents: caseTotalCents(rows.repairLines),
    severity: caseSeverity(rows.damages),
    canEdit: isCaseEditable(user, c),
    isOwnCase: c.createdBy === user.id,
  };
}

const touch = (c: CaseRow) => {
  c.updatedAt = now();
};

function newCase(db: Db, values: Partial<CaseRow> & Pick<CaseRow, "source" | "createdBy">): CaseRow {
  const n = db.nextReference++;
  const t = now();
  const row: CaseRow = {
    id: newId(),
    reference: reference(n),
    status: "draft",
    sourceRef: null,
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleMileageKm: null,
    vehiclePlate: null,
    vehicleVin: null,
    laborRateCents: null,
    bodyshop: null,
    incidentDate: null,
    estimateDate: null,
    currency: "EUR",
    notes: null,
    rejectionReason: null,
    validatedBy: null,
    validatedAt: null,
    createdAt: t,
    updatedAt: t,
    importMetadata: null,
    ...values,
  };
  db.cases.unshift(row);
  return row;
}

function caseInput(o: Record<string, unknown>) {
  const out: Partial<CaseRow> = {};
  const set = <K extends keyof CaseRow>(k: K, v: CaseRow[K] | undefined) => {
    if (v !== undefined) out[k] = v;
  };
  set("vehicleMake", optText(o, "vehicleMake", 80, "Marque"));
  set("vehicleModel", optText(o, "vehicleModel", 80, "Modèle"));
  set("vehicleYear", optInt(o, "vehicleYear", 1950, 2100, "Année"));
  set("vehicleMileageKm", optInt(o, "vehicleMileageKm", 0, 2_000_000, "Kilométrage"));
  set("laborRateCents", optInt(o, "laborRateCents", 0, EURO_CENTS_MAX, "Taux horaire"));
  set("bodyshop", optText(o, "bodyshop", 160, "Carrossier"));
  set("incidentDate", optDate(o, "incidentDate"));
  set("estimateDate", optDate(o, "estimateDate"));
  set("notes", optText(o, "notes", 4000, "Notes"));
  return out;
}

function listCases(req: Req) {
  const user = requirePermission(req, "case:read");
  const q = req.query;
  const status = q.get("status") || undefined;
  const source = q.get("source") || undefined;
  if (status && !(CASE_STATUS_CODES as string[]).includes(status)) fail(400, "Filtres invalides");
  if (source && !(CASE_SOURCE_CODES as string[]).includes(source)) fail(400, "Filtres invalides");
  const search = (q.get("search") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(q.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(q.get("pageSize") ?? "25", 10) || 25));
  // z.coerce.boolean() de l'API : toute valeur non vide vaut vrai.
  const mine = (q.get("mine") ?? "") !== "";

  const db = req.db;
  const matching = db.cases
    .filter((c) => !status || c.status === status)
    .filter((c) => !source || c.source === source)
    .filter((c) => !mine || c.createdBy === user.id)
    .filter((c) => !search || [c.reference, c.vehiclePlate, c.vehicleMake, c.vehicleModel].some((v) => v?.toLowerCase().includes(search)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const items = matching.slice((page - 1) * pageSize, page * pageSize).map((c) => {
    const rows = caseRows(db, c);
    return {
      ...stripCase(c),
      photoCount: rows.photos.length,
      damageCount: rows.damages.length,
      totalCents: caseTotalCents(rows.repairLines),
      createdByName: fullName(db, c.createdBy),
    };
  });
  return { items, total: matching.length, page, pageSize };
}

function deleteCaseCascade(db: Db, caseId: string) {
  db.cases = db.cases.filter((c) => c.id !== caseId);
  db.photos = db.photos.filter((p) => p.caseId !== caseId);
  db.damages = db.damages.filter((d) => d.caseId !== caseId);
  db.repairLines = db.repairLines.filter((l) => l.caseId !== caseId);
  db.documents = db.documents.filter((d) => d.caseId !== caseId);
}

function lifecycle(to: CaseStatus | "submit") {
  return (req: Req) => {
    const db = req.db;
    const c = findCase(db, req.params.id);
    if (to === "submit") {
      const user = requirePermission(req, "case:submit");
      assertCaseEditable(user, c);
      assertTransition(c.status, "ready");
      assertSubmittable(db, c);
      Object.assign(c, { status: "ready", rejectionReason: null });
      touch(c);
      return presentDetail(db, c, user);
    }
    const user = requirePermission(req, "case:review");
    if (to === "validated") {
      assertTransition(c.status, "validated");
      // Pas d'entrée dans le dataset par la validation en contournant la complétude.
      assertSubmittable(db, c);
      Object.assign(c, { status: "validated", validatedBy: user.id, validatedAt: now(), rejectionReason: null });
    } else if (to === "rejected") {
      const reason = body(req).reason;
      if (typeof reason !== "string" || reason.trim().length < 3) fail(400, "Indiquez pourquoi le dossier est écarté");
      if ((reason as string).trim().length > 500) fail(400, "Motif trop long (500 caractères au maximum)");
      assertTransition(c.status, "rejected");
      Object.assign(c, { status: "rejected", rejectionReason: (reason as string).trim(), validatedBy: null, validatedAt: null });
    } else {
      assertTransition(c.status, "draft");
      Object.assign(c, { status: "draft", validatedBy: null, validatedAt: null, rejectionReason: null });
    }
    touch(c);
    return presentDetail(db, c, user);
  };
}

// ── Photos ──────────────────────────────────────────────────────────────────

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Contexte non sécurisé : empreinte de repli, suffisante pour dédoublonner dans la démo.
    let h = 2166136261;
    new Uint8Array(data).forEach((b) => (h = Math.imul(h ^ b, 16777619)));
    return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
  }
}

/**
 * Image envoyée → data URL réduite, seule forme qui survit au rechargement
 * (la db est gardée en sessionStorage, quelques Mo au plus). Le vrai produit
 * ne réencode jamais les pixels ; la démo le fait pour tenir dans le stockage
 * du navigateur, et l'orientation EXIF est alors appliquée par le décodage
 * (d'où une rotation d'affichage à 0).
 */
async function shrinkImage(file: Blob): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, 1024 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { url: canvas.toDataURL("image/jpeg", 0.8), width, height };
}

const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

async function uploadPhoto(req: Req) {
  const db = req.db;
  const user = requirePermission(req, "case:write");
  const c = findCase(db, req.params.id);
  assertCaseEditable(user, c);
  const viewType = req.query.get("viewType") ?? "autre";
  if (!(VIEW_TYPE_CODES as string[]).includes(viewType)) fail(400, "Type de vue inconnu");

  const file = req.body instanceof FormData ? req.body.get("file") : null;
  if (!(file instanceof Blob)) return fail(400, "Aucun fichier reçu");
  if (!ACCEPTED_IMAGES.includes(file.type)) fail(400, `Format non accepté (${file.type || "inconnu"}). Attendu : JPEG, PNG ou WebP.`);
  if (file.size > 25 * 1024 * 1024) fail(422, "Fichier trop volumineux (limite 25 Mo).");

  const sha256 = await sha256Hex(await file.arrayBuffer());
  // Même photo renvoyée deux fois : on rend l'existante (angle mis à jour), comme l'ON CONFLICT de l'API.
  const existing = db.photos.find((p) => p.caseId === c.id && p.sha256 === sha256);
  if (existing) {
    existing.viewType = viewType as PhotoRow["viewType"];
    return { photo: stripPhoto(existing) };
  }

  let image: { url: string; width: number; height: number };
  try {
    image = await shrinkImage(file);
  } catch {
    return fail(422, "Image illisible.");
  }
  const order = db.photos.filter((p) => p.caseId === c.id).reduce((max, p) => Math.max(max, p.imageOrder + 1), 0);
  const photo: PhotoRow = {
    id: newId(),
    caseId: c.id,
    storagePath: `cases/${c.id}/${sha256}.jpg`,
    viewType: viewType as PhotoRow["viewType"],
    imageOrder: order,
    width: image.width,
    height: image.height,
    bytes: file.size,
    sha256,
    rotationDegrees: 0,
    createdAt: now(),
    url: image.url,
  };
  db.photos.push(photo);
  touch(c);
  return { photo: stripPhoto(photo) };
}

function editablePhoto(req: Req) {
  const db = req.db;
  const user = requirePermission(req, "case:write");
  const photo = db.photos.find((p) => p.id === req.params.id) ?? fail(404, "Photo introuvable");
  const c = findCase(db, photo.caseId);
  assertCaseEditable(user, c);
  return { photo, c };
}

// ── Dégâts et chiffrage ─────────────────────────────────────────────────────

function editableCase(req: Req, caseId: string) {
  const user = requirePermission(req, "case:write");
  const c = findCase(req.db, caseId);
  assertCaseEditable(user, c);
  return c;
}

function assertPhotoBelongs(db: Db, photoId: string, caseId: string) {
  const photo = db.photos.find((p) => p.id === photoId);
  if (!photo || photo.caseId !== caseId) fail(422, "Cette photo n'appartient pas au dossier.");
}

function assertDamageBelongs(db: Db, damageId: string, caseId: string) {
  const damage = db.damages.find((d) => d.id === damageId);
  if (!damage || damage.caseId !== caseId) fail(422, "Ce dégât n'appartient pas au dossier.");
}

function damageFields(o: Record<string, unknown>, partial: boolean) {
  const out: Partial<CaseDamage> = {};
  if (!partial || has(o, "zone")) out.zone = oneOf(ZONE_CODES, o.zone, "Zone");
  if (!partial || has(o, "damageType")) out.damageType = oneOf(DAMAGE_TYPE_CODES, o.damageType, "Nature de dégât");
  if (!partial || has(o, "severity")) out.severity = oneOf(SEVERITY_CODES, o.severity, "Gravité");
  if (has(o, "photoId")) {
    const v = o.photoId;
    if (v !== null && v !== undefined && typeof v !== "string") fail(400, "Photo invalide");
    out.photoId = (v as string | null | undefined) ?? null;
  }
  if (has(o, "bbox")) out.bbox = bbox(o.bbox);
  const notes = optText(o, "notes", 1000, "Notes");
  if (notes !== undefined) out.notes = notes;
  return out;
}

function lineFields(o: Record<string, unknown>, partial: boolean) {
  const out: Partial<CaseRepairLine> = {};
  if (!partial || has(o, "operation")) out.operation = oneOf(REPAIR_OPERATION_CODES, o.operation, "Opération") as RepairOperation;
  if (has(o, "partType") && o.partType !== undefined) out.partType = oneOf(PART_TYPE_CODES, o.partType, "Type de pièce");
  else if (!partial) out.partType = "none";
  if (has(o, "laborScale")) out.laborScale = o.laborScale === null || o.laborScale === undefined ? null : oneOf(LABOR_SCALE_CODES, o.laborScale, "Barème");
  if (has(o, "damageId")) {
    const v = o.damageId;
    if (v !== null && v !== undefined && typeof v !== "string") fail(400, "Dégât invalide");
    out.damageId = (v as string | null | undefined) ?? null;
  }
  const ref = optText(o, "partRef", 80, "Référence");
  if (ref !== undefined) out.partRef = ref;
  const label = optText(o, "partLabel", 200, "Libellé");
  if (label !== undefined) out.partLabel = label;
  const part = cents(o, "partCostCents", "Coût pièce");
  const labor = cents(o, "laborCostCents", "Coût main-d'œuvre");
  const paint = cents(o, "paintCostCents", "Coût peinture");
  if (part !== undefined) out.partCostCents = part;
  if (labor !== undefined) out.laborCostCents = labor;
  if (paint !== undefined) out.paintCostCents = paint;
  if (has(o, "laborMinutes") && o.laborMinutes !== undefined) {
    const m = o.laborMinutes;
    if (typeof m !== "number" || !Number.isInteger(m) || m < 0 || m > 100_000) fail(400, "Temps de main-d'œuvre invalide (minutes entières)");
    out.laborMinutes = m as number;
  }
  if (!partial) {
    out.partCostCents ??= 0;
    out.laborCostCents ??= 0;
    out.paintCostCents ??= 0;
    out.laborMinutes ??= 0;
  }
  return out;
}

/** Total recalculé à chaque écriture : colonne générée en base dans le vrai produit. */
const withTotal = (l: CaseRepairLine) => {
  l.totalCents = l.partCostCents + l.laborCostCents + l.paintCostCents;
  return l;
};

// ── Statistiques et export ──────────────────────────────────────────────────

function stats(db: Db): DatasetStats {
  const count = <T>(items: T[], key: (t: T) => string) =>
    items.reduce<Record<string, number>>((acc, t) => ((acc[key(t)] = (acc[key(t)] ?? 0) + 1), acc), {});
  const validatedIds = new Set(db.cases.filter((c) => c.status === DATASET_STATUS).map((c) => c.id));
  const validatedDamages = db.damages.filter((d) => validatedIds.has(d.caseId));
  const byStatus = count(db.cases, (c) => c.status);
  const sortDesc = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).sort((a, b) => b[1] - a[1]));
  return {
    totalCases: db.cases.length,
    byStatus,
    bySource: count(db.cases, (c) => c.source),
    validatedCases: byStatus[DATASET_STATUS] ?? 0,
    photoCount: db.photos.length,
    damageCount: db.damages.length,
    boxedDamageCount: db.damages.filter((d) => d.bbox !== null).length,
    unclassifiedPhotoCount: db.photos.filter((p) => validatedIds.has(p.caseId) && p.viewType === "autre").length,
    byZone: sortDesc(count(validatedDamages, (d) => d.zone)),
    byDamageType: sortDesc(count(validatedDamages, (d) => d.damageType)),
    bySeverity: count(validatedDamages, (d) => d.severity),
    totalRepairCents: db.repairLines.reduce((sum, l) => sum + l.totalCents, 0),
  };
}

function exportableCases(db: Db, f: DatasetExportFilters): CaseRow[] {
  return db.cases
    .filter((c) => c.status === DATASET_STATUS)
    .filter((c) => !f.validatedFrom || (c.validatedAt ?? "") >= f.validatedFrom)
    .filter((c) => !f.validatedTo || (c.validatedAt ?? "") <= f.validatedTo)
    .filter((c) => !f.sources?.length || f.sources.includes(c.source))
    .filter((c) => !f.onlyWithBoundingBoxes || db.damages.some((d) => d.caseId === c.id && d.bbox !== null))
    .sort((a, b) => (a.validatedAt ?? "").localeCompare(b.validatedAt ?? "") || a.reference.localeCompare(b.reference));
}

/** Contenu de l'archive : manifeste, photos retenues et README, comme dataset.service.ts. */
function exportPlan(db: Db, f: DatasetExportFilters) {
  const cases = exportableCases(db, f);
  const files: { name: string; url: string }[] = [];
  const records: DatasetRecord[] = cases.map((c) => {
    const { photos, damages, repairLines } = caseRows(db, c);
    // Documents nominatifs et plaques écartés par défaut.
    const included = f.includeSensitivePhotos ? photos : photos.filter((p) => !(SENSITIVE_VIEW_TYPES as string[]).includes(p.viewType));
    const fileById = new Map<string, string>();
    for (const p of included) {
      const name = `photos/${c.reference}/${p.storagePath.split("/").pop()}`;
      fileById.set(p.id, name);
      files.push({ name, url: p.url });
    }
    const damageIndex = new Map(damages.map((d, i) => [d.id, i]));
    const total = caseTotalCents(repairLines);
    return {
      schemaVersion: DATASET_SCHEMA_VERSION,
      reference: c.reference,
      caseId: c.id,
      source: c.source,
      sourceRef: c.sourceRef,
      validatedAt: c.validatedAt,
      pricing: { bodyshop: c.bodyshop, incidentDate: c.incidentDate, estimateDate: c.estimateDate },
      vehicle: { make: c.vehicleMake, model: c.vehicleModel, year: c.vehicleYear, mileageKm: c.vehicleMileageKm },
      photos: included.map((p) => ({
        file: fileById.get(p.id)!,
        viewType: p.viewType,
        order: p.imageOrder,
        width: p.width,
        height: p.height,
        rotationDegrees: p.rotationDegrees,
        sha256: p.sha256,
      })),
      damages: damages.map((d) => ({
        zone: d.zone,
        zoneCovers: ZONE_COVERAGE[d.zone] ?? null,
        damageType: d.damageType,
        severity: d.severity,
        photo: d.photoId ? fileById.get(d.photoId) ?? null : null,
        bbox: d.photoId && fileById.has(d.photoId) ? d.bbox : null,
        notes: d.notes,
      })),
      repair: {
        currency: c.currency,
        laborRateCents: c.laborRateCents,
        lines: repairLines.map((l) => ({
          operation: l.operation,
          partType: l.partType,
          laborScale: l.laborScale,
          partRef: l.partRef,
          partLabel: l.partLabel,
          damageIndex: l.damageId ? damageIndex.get(l.damageId) ?? null : null,
          partCostCents: l.partCostCents,
          laborMinutes: l.laborMinutes,
          laborCostCents: l.laborCostCents,
          paintCostCents: l.paintCostCents,
          totalCents: l.totalCents,
        })),
        totalCents: total,
      },
      labels: {
        severity: caseSeverity(damages),
        zones: [...new Set(damages.map((d) => d.zone))],
        damageTypes: [...new Set(damages.map((d) => d.damageType))],
        damageCount: damages.length,
        totalCents: total,
      },
    };
  });
  return { cases, files, records };
}

function readme(createdAt: string, caseCount: number, photoCount: number, f: DatasetExportFilters): string {
  return [
    "Dataset HellBoy — DREVIO (DÉMO, données fictives)",
    "==================================================",
    "",
    `Version du schéma : ${DATASET_SCHEMA_VERSION}`,
    `Export du         : ${createdAt}`,
    `Dossiers          : ${caseCount}`,
    `Photos            : ${photoCount}`,
    "",
    "Contenu",
    "-------",
    "  manifest.jsonl   un dossier par ligne, encodé JSON (voir packages/domain/src/dataset.ts)",
    "  photos/<réf>/    les images citées par le manifeste",
    "",
    "Tous les montants sont des ENTIERS EN CENTIMES.",
    "`laborScale` dit à quoi correspond `laborMinutes` : barème T1, T2, T3,",
    "peinture ou ingrédients.",
    "",
    "Les boîtes englobantes sont normalisées dans [0,1], origine en haut à gauche,",
    "et exprimées dans le repère du FICHIER : utilisables telles quelles sur les",
    "pixels bruts. `rotationDegrees` ne sert qu'à afficher l'image d'aplomb.",
    "",
    "Photos dessinées pour la démonstration : aucune image réelle.",
    "",
    "Filtres appliqués",
    "-----------------",
    JSON.stringify(f, null, 2),
    "",
  ].join("\n");
}

/** Archives déjà construites pendant la session (non sérialisables : reconstruites au besoin). */
const builtExports = new Map<string, Uint8Array>();

async function buildExportZip(db: Db, row: Pick<ExportRow, "createdAt" | "filters">) {
  const plan = exportPlan(db, row.filters);
  const enc = new TextEncoder();
  const entries: ZipEntry[] = [];
  for (const f of plan.files) {
    const response = await fetch(f.url);
    entries.push({ name: f.name, data: new Uint8Array(await response.arrayBuffer()) });
  }
  entries.push({ name: "manifest.jsonl", data: enc.encode(plan.records.map((r) => JSON.stringify(r)).join("\n") + "\n") });
  entries.push({ name: "README.txt", data: enc.encode(readme(row.createdAt, plan.cases.length, plan.files.length, row.filters)) });
  return { zip: buildZip(entries), caseCount: plan.cases.length, photoCount: plan.files.length };
}

function exportFilters(o: Record<string, unknown>): DatasetExportFilters {
  const iso = (k: string) => {
    const v = o[k];
    if (v === undefined) return undefined;
    if (typeof v !== "string" || Number.isNaN(Date.parse(v))) return fail(400, "Date de validation invalide");
    return v;
  };
  const sources = o.sources;
  if (sources !== undefined && (!Array.isArray(sources) || !sources.every((s) => (CASE_SOURCE_CODES as string[]).includes(s)))) {
    fail(400, "Provenance inconnue");
  }
  return {
    ...(iso("validatedFrom") ? { validatedFrom: iso("validatedFrom") } : {}),
    ...(iso("validatedTo") ? { validatedTo: iso("validatedTo") } : {}),
    ...(sources ? { sources: sources as DatasetExportFilters["sources"] } : {}),
    includeSensitivePhotos: o.includeSensitivePhotos === true,
    onlyWithBoundingBoxes: o.onlyWithBoundingBoxes === true,
  };
}

// ── Import DREVIO (simulé) ──────────────────────────────────────────────────
// Dossiers « expertisés » côté DREVIO. Le vrai import reprend photos, dégâts et
// chiffrage HUMAIN ; ici les mêmes règles s'appliquent : lignes IA ignorées,
// dégât hors vocabulaire refusé, angle inconnu classé « Autre », taux horaire
// laissé vide (DREVIO ne le stocke pas).

type DrevioLine = { damage: string | null; repairType: string; partCost?: number; minutes?: number; labor?: number; paint?: number };
type DrevioCandidate = {
  id: string;
  scene: string;
  createdDays: number;
  reviewedDays: number;
  /** Vocabulaire tel que DREVIO le stocke, parfois hors des listes fermées. */
  damages: { key: string; zone: string; type: string; severity: string; label: string }[];
  /** Angle DREVIO brut par photo (même ordre que la scène), quand il diffère. */
  rawViews?: Record<number, string>;
  lines: DrevioLine[];
  aiLines: number;
};

const DREVIO: DrevioCandidate[] = [
  {
    id: seedId("drevio", 101), scene: "drv1", createdDays: 5, reviewedDays: 3, aiLines: 0,
    damages: [
      { key: "d1", zone: "front_right_door", type: "dent", severity: "moderate", label: "Enfoncement porte avant droite" },
      { key: "d2", zone: "Front Right Fender", type: "scratch", severity: "minor", label: "Rayures aile avant droite" },
    ],
    lines: [
      { damage: "d1", repairType: "repair", minutes: 90, labor: 9900 },
      { damage: "d1", repairType: "peinture", minutes: 96, paint: 11200 },
      { damage: "d2", repairType: "polish", minutes: 30, labor: 3300 },
    ],
  },
  {
    id: seedId("drevio", 102), scene: "drv2", createdDays: 9, reviewedDays: 6, aiLines: 2,
    damages: [{ key: "d1", zone: "rear_bumper", type: "scratch", severity: "minor", label: "Rayures pare-chocs arrière" }],
    lines: [
      { damage: "d1", repairType: "repair", minutes: 45, labor: 4500 },
      { damage: "d1", repairType: "paint", minutes: 120, paint: 18400 },
    ],
  },
  {
    id: seedId("drevio", 103), scene: "drv3", createdDays: 14, reviewedDays: 11, aiLines: 0,
    rawViews: { 1: "vue_3_4_ar_g" },
    damages: [
      { key: "d1", zone: "front_left_door", type: "scratch", severity: "medium", label: "Rayure porte avant gauche" },
      { key: "d2", zone: "Rear Left Panel", type: "dent", severity: "severe", label: "Choc custode arrière gauche" },
    ],
    lines: [
      { damage: "d1", repairType: "polish", minutes: 45, labor: 4950 },
      { damage: "d2", repairType: "repair", minutes: 150, labor: 16500 },
    ],
  },
];

const OPERATION_BY_REPAIR_TYPE: Record<string, RepairOperation> = {
  repair: "repair", reparation: "repair", replace: "replace", remplacement: "replace",
  paint: "paint", peinture: "paint", polish: "polish", smart_repair: "smart_repair",
};

function candidateRows(db: Db) {
  const imported = new Set(db.cases.map((c) => c.sourceRef));
  const fromScene = DREVIO.map((cand) => {
    const scene = SCENES[cand.scene];
    const total = cand.lines.reduce((s, l) => s + (l.partCost ?? 0) + (l.labor ?? 0) + (l.paint ?? 0), 0);
    return {
      id: cand.id,
      status: "completed",
      createdAt: new Date(Date.now() - cand.createdDays * 86_400_000).toISOString(),
      mileageKm: scene.vehicle.mileageKm,
      licensePlate: scene.plate,
      make: scene.vehicle.make,
      model: scene.vehicle.model,
      photoCount: scene.photos.length,
      damageCount: cand.damages.length,
      totalEstimatedCost: total / 100,
      hasAiEstimate: cand.aiLines > 0,
      reviewValidatedAt: new Date(Date.now() - cand.reviewedDays * 86_400_000).toISOString(),
      alreadyImported: imported.has(cand.id),
    };
  });
  // Les deux dossiers DREVIO déjà repris restent listés, grisés « Déjà importé ».
  const already = [DREVIO_REF_C13, DREVIO_REF_C04].map((ref) => {
    const c = db.cases.find((x) => x.sourceRef === ref);
    const key = ref === DREVIO_REF_C04 ? "c04" : "c13";
    const scene = SCENES[key];
    return {
      id: ref,
      status: "completed",
      createdAt: c?.createdAt ?? now(),
      mileageKm: scene.vehicle.mileageKm,
      licensePlate: scene.plate,
      make: scene.vehicle.make,
      model: scene.vehicle.model,
      photoCount: scene.photos.length,
      damageCount: scene.damages.length,
      totalEstimatedCost: null,
      hasAiEstimate: ref === DREVIO_REF_C04,
      reviewValidatedAt: c?.createdAt ?? null,
      alreadyImported: imported.has(ref),
    };
  });
  return [...fromScene, ...already];
}

function importDrevioCase(db: Db, sourceRef: string, userId: string): ImportOutcome {
  const existing = db.cases.find((c) => c.sourceRef === sourceRef);
  if (existing) return { sourceRef, status: "skipped", caseId: existing.id, reference: existing.reference, reason: "Déjà importé" };
  const cand = DREVIO.find((d) => d.id === sourceRef);
  if (!cand) return { sourceRef, status: "failed", reason: "Dossier DREVIO introuvable" };

  const scene = SCENES[cand.scene];
  const warnings: string[] = [];
  const createdAt = now();
  const c = newCase(db, {
    source: "drevio_import",
    sourceRef,
    vehicleMake: scene.vehicle.make,
    vehicleModel: scene.vehicle.model,
    vehicleMileageKm: scene.vehicle.mileageKm,
    estimateDate: new Date(Date.now() - cand.createdDays * 86_400_000).toISOString().slice(0, 10),
    notes: `Importé depuis DREVIO (dossier ${sourceRef}, ${scene.plate}).`,
    createdBy: userId,
  });

  const { photos } = scenePhotos(scene, c.id, createdAt, newId);
  photos.forEach((p, i) => {
    const raw = cand.rawViews?.[i];
    if (raw !== undefined) {
      const parsed = parseViewType(raw);
      if (parsed === null) {
        warnings.push(`Angle « ${raw} » inconnu, photo classée en « Autre »`);
        p.viewType = "autre";
      }
    }
  });
  db.photos.push(...photos);

  const damageIds = new Map<string, string>();
  for (const d of cand.damages) {
    const zone = parseZone(d.zone);
    const damageType = parseDamageType(d.type);
    const severity = parseSeverity(d.severity);
    if (zone === null || damageType === null || severity === null) {
      warnings.push(`Dégât non repris (zone « ${d.zone} », type « ${d.type} », gravité « ${d.severity} ») : hors vocabulaire, à ressaisir`);
      continue;
    }
    const id = newId();
    damageIds.set(d.key, id);
    db.damages.push({ id, caseId: c.id, photoId: null, zone, damageType, severity, bbox: null, notes: d.label, createdAt });
  }

  if (cand.aiLines > 0) {
    warnings.push(`${cand.aiLines} ligne(s) de chiffrage IA ignorée(s) — seul le chiffrage relu par un expert est repris`);
  }
  cand.lines.forEach((l, index) => {
    const operation = OPERATION_BY_REPAIR_TYPE[normalizeCode(l.repairType)] ?? "other";
    db.repairLines.push(
      withTotal({
        id: newId(), caseId: c.id, damageId: l.damage ? damageIds.get(l.damage) ?? null : null, operation, partType: "none",
        laborScale: null, partRef: null, partLabel: null, partCostCents: l.partCost ?? 0, laborMinutes: l.minutes ?? 0,
        laborCostCents: l.labor ?? 0, paintCostCents: l.paint ?? 0, totalCents: 0, lineOrder: index, createdAt,
      }),
    );
  });

  return { sourceRef, status: "imported", caseId: c.id, reference: c.reference, warnings: warnings.length > 0 ? warnings : undefined };
}

// ── Import d'archive garage (simulé) ────────────────────────────────────────
// Le ZIP déposé n'est pas ouvert : la démo « lit » à sa place l'une des deux
// archives fictives préparées (photos dessinées, estimation PDF fictive), puis
// applique exactement le traitement du vrai import. La seconde archive porte
// volontairement des manques (plaque, n° de série, couleur absents ; total
// imprimé incohérent) : ils restent à null et sont signalés, jamais devinés.

const ARCHIVE_SCENES = ["impA", "impB"];

function importArchive(req: Req) {
  const db = req.db;
  const user = requirePermission(req, "case:write");
  const file = req.body instanceof FormData ? req.body.get("file") : null;
  if (!(file instanceof File)) return fail(400, "Aucune archive reçue.");
  if (!/\.zip$/i.test(file.name)) fail(400, `Format attendu : une archive .zip (reçu « ${file.name} »).`);
  if (file.size === 0) fail(422, "Archive vide : aucune photo ni document exploitable.");

  const used = (key: string) => {
    const number = SCENES[key].estimate!.documentNumber;
    return db.cases.find((c) => c.source === "archive_import" && c.sourceRef?.endsWith(`/${number}`));
  };
  const key = ARCHIVE_SCENES.find((k) => !used(k));
  if (key === undefined) {
    const first = used(ARCHIVE_SCENES[0])!;
    return fail(409, `Cette estimation a déjà été importée (dossier ${first.reference}). Démo : les deux archives fictives ont été lues — « Réinitialiser » pour recommencer.`);
  }

  const scene = SCENES[key];
  const estimate = scene.estimate!;
  const warnings = ["Démo : le contenu du fichier déposé n'est pas lu ; une archive fictive de démonstration est importée à sa place."];
  const plate = estimate.vehicle.plate ?? plateFromArchiveName(file.name);
  if (estimate.vehicle.plate === null && plate !== null) {
    warnings.push(`Immatriculation absente de l'estimation, reprise du nom de l'archive (${plate}).`);
  }
  const createdAt = now();
  const c = newCase(db, { source: "archive_import", createdBy: user.id });
  const { rows, warnings: lineWarnings, suggestedZones } = linesFromEstimate(estimate, c.id, createdAt, newId);
  warnings.push(...lineWarnings);

  Object.assign(c, {
    sourceRef: `${plate ?? "SANS-PLAQUE"}/${estimate.documentNumber ?? "SANS-DOSSIER"}`,
    vehicleMake: estimate.vehicle.make,
    vehicleModel: estimate.vehicle.model,
    vehicleYear: registrationYear(estimate.vehicle.firstRegistration),
    vehicleMileageKm: estimate.vehicle.mileageKm,
    vehiclePlate: plate,
    vehicleVin: estimate.vehicle.vin,
    laborRateCents: estimate.rates.bodyworkT1Cents,
    bodyshop: estimate.bodyshop,
    incidentDate: estimate.incidentDate,
    estimateDate: estimate.documentDate,
    notes: archiveNotes(file.name, estimate),
    importMetadata: { archiveName: file.name, importedAt: createdAt, estimate, suggestedZones },
  } satisfies Partial<CaseRow>);

  // Aucun angle deviné, aucun dégât créé : c'est l'annotateur qui tranche sur la photo.
  const { photos } = scenePhotos(scene, c.id, createdAt, newId);
  photos.forEach((p) => (p.viewType = "autre"));
  const documents = sceneDocuments(scene, c.id, createdAt, newId);
  db.photos.push(...photos);
  db.documents.push(...documents);
  db.repairLines.push(...rows);

  return {
    caseId: c.id,
    reference: c.reference,
    photoCount: photos.length,
    documentCount: documents.length,
    repairLineCount: rows.length,
    totalCents: rows.reduce((sum, l) => sum + l.totalCents, 0),
    suggestedZones,
    warnings,
  };
}

// ── Routes ──────────────────────────────────────────────────────────────────

const routes: Route<Db>[] = [
  // Authentification
  route("POST", "/auth/login", (req) => {
    const { email, password } = body(req);
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== "string" || password.length === 0) {
      fail(400, "Identifiants invalides");
    }
    const user = req.db.users.find((u) => u.email.toLowerCase() === (email as string).trim().toLowerCase());
    // Même message pour e-mail inconnu, mot de passe faux et compte désactivé.
    if (!user || user.password !== password || !user.isActive) return fail(401, "E-mail ou mot de passe incorrect.");
    user.lastLoginAt = now();
    req.db.sessionUserId = user.id;
    return { user: publicUser(user) };
  }),
  route("POST", "/auth/logout", (req) => {
    req.db.sessionUserId = null;
    return { ok: true };
  }),
  route("GET", "/auth/me", (req) => ({ user: publicUser(sessionUser(req)) })),
  route("POST", "/auth/password", (req) => {
    const user = sessionUser(req);
    const { currentPassword, newPassword } = body(req);
    if (typeof newPassword !== "string" || newPassword.length < 10) fail(400, "Le nouveau mot de passe doit faire au moins 10 caractères");
    if (currentPassword !== user.password) fail(400, "Mot de passe actuel incorrect.");
    user.password = newPassword as string;
    return { ok: true };
  }),

  // Utilisateurs
  route("GET", "/users", (req) => {
    requirePermission(req, "user:manage");
    const users = [...req.db.users].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.createdAt.localeCompare(b.createdAt));
    return { users: users.map(managedUser) };
  }),
  route("POST", "/users", (req) => {
    requirePermission(req, "user:manage");
    const o = body(req);
    const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) fail(400, "Adresse e-mail invalide");
    const role = o.role === undefined ? "annotator" : oneOf(ROLE_CODES, o.role, "Rôle");
    if (req.db.users.some((u) => u.email.toLowerCase() === email)) fail(409, "Un compte existe déjà avec cette adresse.");
    const name = (k: string) => (typeof o[k] === "string" && (o[k] as string).trim() ? (o[k] as string).trim().slice(0, 80) : null);
    // Mot de passe initial renvoyé une seule fois ; utilisable pour se connecter dans la démo.
    const temporaryPassword = generatePassword();
    const user: UserRow = {
      id: newId(), email, firstName: name("firstName"), lastName: name("lastName"), role: role as UserRole,
      isActive: true, createdAt: now(), lastLoginAt: null, password: temporaryPassword,
    };
    req.db.users.push(user);
    return { user: managedUser(user), temporaryPassword };
  }),
  route("PATCH", "/users/:id", (req) => {
    requirePermission(req, "user:manage");
    const target = req.db.users.find((u) => u.id === req.params.id) ?? fail(404, "Compte introuvable");
    const o = body(req);
    const role = has(o, "role") ? (oneOf(ROLE_CODES, o.role, "Rôle") as UserRole) : undefined;
    if (has(o, "isActive") && typeof o.isActive !== "boolean") fail(400, "Compte invalide");
    const losesAdmin = target.role === "admin" && ((role !== undefined && role !== "admin") || o.isActive === false);
    if (losesAdmin && !req.db.users.some((u) => u.role === "admin" && u.isActive && u.id !== target.id)) {
      fail(422, "C'est le dernier administrateur actif : promouvez quelqu'un d'autre avant de modifier ce compte.");
    }
    const firstName = optText(o, "firstName", 80, "Prénom");
    const lastName = optText(o, "lastName", 80, "Nom");
    if (firstName !== undefined) target.firstName = firstName;
    if (lastName !== undefined) target.lastName = lastName;
    if (role !== undefined) target.role = role;
    if (typeof o.isActive === "boolean") target.isActive = o.isActive;
    return { user: managedUser(target) };
  }),
  route("POST", "/users/:id/password", (req) => {
    requirePermission(req, "user:manage");
    const target = req.db.users.find((u) => u.id === req.params.id) ?? fail(404, "Compte introuvable");
    target.password = generatePassword();
    return { temporaryPassword: target.password };
  }),

  // Dossiers
  route("GET", "/cases", listCases),
  route("POST", "/cases", (req) => {
    const user = requirePermission(req, "case:write");
    const c = newCase(req.db, { ...caseInput(body(req)), source: "manual", createdBy: user.id });
    return json({ trainingCase: stripCase(c) }, 201);
  }),
  route("GET", "/cases/:id", (req) => {
    const user = requirePermission(req, "case:read");
    return presentDetail(req.db, findCase(req.db, req.params.id), user);
  }),
  route("PATCH", "/cases/:id", (req) => {
    const user = requirePermission(req, "case:write");
    const c = findCase(req.db, req.params.id);
    assertCaseEditable(user, c);
    const patch = caseInput(body(req));
    if (Object.keys(patch).length > 0) {
      Object.assign(c, patch);
      touch(c);
    }
    return presentDetail(req.db, c, user);
  }),
  route("DELETE", "/cases/:id", (req) => {
    requirePermission(req, "case:delete");
    findCase(req.db, req.params.id);
    deleteCaseCascade(req.db, req.params.id);
    return { ok: true };
  }),
  route("POST", "/cases/:id/submit", lifecycle("submit")),
  route("POST", "/cases/:id/validate", lifecycle("validated")),
  route("POST", "/cases/:id/reject", lifecycle("rejected")),
  route("POST", "/cases/:id/reopen", lifecycle("draft")),

  // Photos
  route("POST", "/cases/:id/photos", async (req) => json(await uploadPhoto(req), 201)),
  route("PATCH", "/photos/:id", (req) => {
    const { photo, c } = editablePhoto(req);
    const o = body(req);
    if (o.viewType !== undefined) photo.viewType = oneOf(VIEW_TYPE_CODES, o.viewType, "Type de vue");
    if (o.imageOrder !== undefined) {
      if (typeof o.imageOrder !== "number" || !Number.isInteger(o.imageOrder) || o.imageOrder < 0 || o.imageOrder > 1000) fail(400, "Ordre invalide");
      photo.imageOrder = o.imageOrder as number;
    }
    if (o.rotationDegrees !== undefined) {
      // Quarts de tour seulement : un angle libre fausserait la géométrie des boîtes.
      if (![0, 90, 180, 270].includes(o.rotationDegrees as number)) fail(400, "Rotation invalide : 0, 90, 180 ou 270");
      photo.rotationDegrees = o.rotationDegrees as PhotoRow["rotationDegrees"];
    }
    touch(c);
    return { photo: stripPhoto(photo) };
  }),
  route("DELETE", "/photos/:id", (req) => {
    const { photo, c } = editablePhoto(req);
    req.db.photos = req.db.photos.filter((p) => p.id !== photo.id);
    // Les dégâts gardent leur label et perdent leur ancrage (photo et zone).
    for (const d of req.db.damages) {
      if (d.photoId === photo.id) Object.assign(d, { photoId: null, bbox: null });
    }
    touch(c);
    return { ok: true };
  }),
  route("GET", "/photos/:id/file", (req) => {
    requirePermission(req, "case:read");
    const photo = req.db.photos.find((p) => p.id === req.params.id) ?? fail(404, "Photo introuvable");
    return fetch(photo.url);
  }),

  // Dégâts
  route("POST", "/cases/:id/damages", (req) => {
    const c = editableCase(req, req.params.id);
    const v = damageFields(body(req), false);
    if (v.photoId) assertPhotoBelongs(req.db, v.photoId, c.id);
    if (v.bbox && !v.photoId) fail(422, "Une zone pointée doit désigner une photo.");
    const damage: CaseDamage = {
      id: newId(), caseId: c.id, photoId: v.photoId ?? null, zone: v.zone!, damageType: v.damageType!, severity: v.severity!,
      bbox: v.bbox ?? null, notes: v.notes ?? null, createdAt: now(),
    };
    req.db.damages.push(damage);
    touch(c);
    return json({ damage }, 201);
  }),
  route("PATCH", "/damages/:id", (req) => {
    const damage = req.db.damages.find((d) => d.id === req.params.id) ?? fail(404, "Dégât introuvable");
    const c = editableCase(req, damage.caseId);
    const patch = damageFields(body(req), true);
    if (patch.photoId) assertPhotoBelongs(req.db, patch.photoId, c.id);
    // La boîte n'a de sens que rattachée à une photo : contrôle sur l'état APRÈS le patch.
    const nextPhoto = "photoId" in patch ? patch.photoId ?? null : damage.photoId;
    const nextBox = "bbox" in patch ? patch.bbox ?? null : damage.bbox;
    if (nextBox !== null && nextPhoto === null) fail(422, "Une zone pointée doit désigner une photo.");
    Object.assign(damage, patch);
    touch(c);
    return { damage };
  }),
  route("DELETE", "/damages/:id", (req) => {
    const damage = req.db.damages.find((d) => d.id === req.params.id) ?? fail(404, "Dégât introuvable");
    const c = editableCase(req, damage.caseId);
    req.db.damages = req.db.damages.filter((d) => d.id !== damage.id);
    // Le coût reste au total du dossier : seule son imputation disparaît.
    for (const l of req.db.repairLines) if (l.damageId === damage.id) l.damageId = null;
    touch(c);
    return { ok: true };
  }),

  // Chiffrage
  route("POST", "/cases/:id/repair-lines", (req) => {
    const c = editableCase(req, req.params.id);
    const v = lineFields(body(req), false);
    if (v.damageId) assertDamageBelongs(req.db, v.damageId, c.id);
    const order = req.db.repairLines.filter((l) => l.caseId === c.id).reduce((max, l) => Math.max(max, l.lineOrder + 1), 0);
    const repairLine = withTotal({
      id: newId(), caseId: c.id, damageId: v.damageId ?? null, operation: v.operation!, partType: v.partType ?? "none",
      laborScale: v.laborScale ?? null, partRef: v.partRef ?? null, partLabel: v.partLabel ?? null,
      partCostCents: v.partCostCents ?? 0, laborMinutes: v.laborMinutes ?? 0, laborCostCents: v.laborCostCents ?? 0,
      paintCostCents: v.paintCostCents ?? 0, totalCents: 0, lineOrder: order, createdAt: now(),
    });
    req.db.repairLines.push(repairLine);
    touch(c);
    return json({ repairLine }, 201);
  }),
  route("PATCH", "/repair-lines/:id", (req) => {
    const line = req.db.repairLines.find((l) => l.id === req.params.id) ?? fail(404, "Ligne de chiffrage introuvable");
    const c = editableCase(req, line.caseId);
    const patch = lineFields(body(req), true);
    if (patch.damageId) assertDamageBelongs(req.db, patch.damageId, c.id);
    Object.assign(line, patch);
    withTotal(line);
    touch(c);
    return { repairLine: line };
  }),
  route("DELETE", "/repair-lines/:id", (req) => {
    const line = req.db.repairLines.find((l) => l.id === req.params.id) ?? fail(404, "Ligne de chiffrage introuvable");
    const c = editableCase(req, line.caseId);
    req.db.repairLines = req.db.repairLines.filter((l) => l.id !== line.id);
    touch(c);
    return { ok: true };
  }),

  // Dataset
  route("GET", "/dataset/stats", (req) => {
    requirePermission(req, "case:read");
    return stats(req.db);
  }),
  route("GET", "/dataset/exports", (req) => {
    requirePermission(req, "dataset:export");
    const exports = [...req.db.exports]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
      .map(({ createdBy, ...e }) => ({ ...e, createdByName: fullName(req.db, createdBy) }));
    return { exports };
  }),
  route("POST", "/dataset/exports", async (req) => {
    const user = requirePermission(req, "dataset:export");
    const filters = exportFilters(body(req));
    if (exportableCases(req.db, filters).length === 0) fail(422, "Aucun dossier validé ne correspond aux filtres demandés.");
    const createdAt = now();
    const { zip, caseCount, photoCount } = await buildExportZip(req.db, { createdAt, filters });
    const fileName = `hellboy-dataset-${createdAt.replace(/[:.]/g, "-")}.zip`;
    const row: ExportRow = {
      id: newId(), createdAt, createdBy: user.id, schemaVersion: DATASET_SCHEMA_VERSION, caseCount, photoCount,
      bytes: zip.length, filters, filePath: `exports/${fileName}`,
    };
    req.db.exports.push(row);
    builtExports.set(row.id, zip);
    return json({ id: row.id, fileName, caseCount, photoCount, bytes: zip.length }, 201);
  }),
  route("GET", "/dataset/exports/:id/file", async (req) => {
    requirePermission(req, "dataset:export");
    const row = req.db.exports.find((e) => e.id === req.params.id) ?? fail(404, "Export introuvable");
    let zip = builtExports.get(row.id);
    if (!zip) {
      // Après un rechargement : archive reconstruite avec les filtres d'origine,
      // bornée aux dossiers validés avant la date de l'export.
      const to = row.filters.validatedTo && row.filters.validatedTo < row.createdAt ? row.filters.validatedTo : row.createdAt;
      zip = (await buildExportZip(req.db, { createdAt: row.createdAt, filters: { ...row.filters, validatedTo: to } })).zip;
      builtExports.set(row.id, zip);
    }
    const fileName = row.filePath.split("/").pop()!;
    return new Response(new Blob([zip as BlobPart], { type: "application/zip" }), {
      status: 200,
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fileName}"` },
    });
  }),

  // Import DREVIO
  route("GET", "/import/status", (req) => {
    requirePermission(req, "import:run");
    return { configured: true };
  }),
  route("GET", "/import/candidates", (req) => {
    requirePermission(req, "import:run");
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.get("limit") ?? "25", 10) || 25));
    return { candidates: candidateRows(req.db).slice(0, limit) };
  }),
  route("POST", "/import/run", (req) => {
    const user = requirePermission(req, "import:run");
    const refs = body(req).sourceRefs;
    if (!Array.isArray(refs) || refs.length < 1 || refs.length > 20 || !refs.every((r) => typeof r === "string")) {
      fail(400, "Sélectionnez entre 1 et 20 dossiers à importer");
    }
    const startedAt = now();
    const outcomes = (refs as string[]).map((ref) => importDrevioCase(req.db, ref, user.id));
    const runId = newId();
    req.db.importRuns.unshift({
      id: runId, status: "completed", requestedCount: outcomes.length,
      importedCount: outcomes.filter((o) => o.status === "imported").length,
      skippedCount: outcomes.filter((o) => o.status === "skipped").length,
      failedCount: outcomes.filter((o) => o.status === "failed").length,
      error: null, details: outcomes, startedAt, finishedAt: now(), createdBy: user.id,
    });
    return { runId, outcomes };
  }),
  route("GET", "/import/runs", (req) => {
    requirePermission(req, "import:run");
    const runs = [...req.db.importRuns]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 20)
      .map(({ createdBy, ...r }) => ({ ...r, createdByName: fullName(req.db, createdBy) }));
    return { runs };
  }),

  // Archives garage
  route("POST", "/archives", (req) => json(importArchive(req), 201)),
  route("GET", "/archives/documents/:id/file", (req) => {
    requirePermission(req, "case:read");
    const doc = req.db.documents.find((d) => d.id === req.params.id) ?? fail(404, "Document introuvable");
    return fetch(doc.url);
  }),
];

// ── Fichiers servis par l'API hors de fetch ─────────────────────────────────

function readDb(): Db | null {
  if (currentDb) return currentDb;
  try {
    const saved = sessionStorage.getItem(`demo:${BASE}:db`);
    return saved ? (JSON.parse(saved) as Db) : null;
  } catch {
    return null;
  }
}

const PHOTO_FILE = /^\/api\/photos\/([^/?#]+)\/file$/;
const DOCUMENT_FILE = /^\/api\/archives\/documents\/([^/?#]+)\/file$/;

/** URL réelle d'un fichier de la démo pour une URL d'API, ou null. */
function fileUrl(value: string): string | null {
  const db = readDb();
  if (!db) return null;
  const photo = PHOTO_FILE.exec(value);
  if (photo) return db.photos.find((p) => p.id === photo[1])?.url ?? null;
  const doc = DOCUMENT_FILE.exec(value);
  if (doc) return db.documents.find((d) => d.id === doc[1])?.url ?? null;
  return null;
}

function redirectFileUrls() {
  // React pose src et href par setAttribute : on les redirige au passage.
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if ((name === "src" || name === "href") && typeof value === "string" && value.startsWith("/api/")) {
      const real = fileUrl(value);
      if (real) return setAttribute.call(this, name, real);
    }
    return setAttribute.call(this, name, value);
  };
  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (desc?.set) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      ...desc,
      set(value: string) {
        desc.set!.call(this, (typeof value === "string" && value.startsWith("/api/") && fileUrl(value)) || value);
      },
    });
  }

  // Liens restés sur /api/ (archive d'export) : téléchargés via la fausse API.
  document.addEventListener(
    "click",
    (event) => {
      const a = (event.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href");
      if (!a || !href?.startsWith("/api/")) return;
      event.preventDefault();
      void (async () => {
        const response = await fetch(href);
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          window.alert(payload?.message ?? `Erreur ${response.status}`);
          return;
        }
        const disposition = response.headers.get("Content-Disposition") ?? "";
        const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? href.split("/").slice(-2, -1)[0];
        const url = URL.createObjectURL(await response.blob());
        if (a.hasAttribute("download") || disposition.startsWith("attachment")) {
          const link = document.createElement("a");
          link.href = url;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } else {
          window.open(url, "_blank", "noopener");
        }
      })();
    },
    true,
  );
}

redirectFileUrls();

const openSession = (userId: string) => (db: Db) => {
  db.sessionUserId = userId;
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    // Le compte de démo doit rester utilisable (et conforme à l'aide du bandeau)
    // même si on l'a désactivé ou réinitialisé dans l'écran Utilisateurs.
    user.isActive = true;
    user.password = PASSWORD;
    user.lastLoginAt = now();
  }
};

installMockApi<Db>({
  base: BASE,
  name: "HellBoy",
  seed,
  routes,
  logins: [
    { label: "Admin · Camille Roussel", session: openSession(USER_ADMIN), to: "/#accueil" },
    { label: "Relecteur · Inès Moreau", session: openSession(USER_REVIEWER), to: "/#dossiers" },
    { label: "Annotateur · Lucas Bernard", session: openSession(USER_ANNOTATOR), to: "/#dossiers" },
  ],
  hint:
    `Connexion manuelle, mot de passe <b>${PASSWORD}</b> : ${DEMO_EMAILS.admin} (admin), ${DEMO_EMAILS.reviewer} (relecteur), ` +
    `${DEMO_EMAILS.annotator} (annotateur), ${DEMO_EMAILS.viewer} (lecture seule).`,
});
