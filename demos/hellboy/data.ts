// Jeu de données fictif de la démo HellBoy : utilisateurs, dossiers sur tous
// les statuts, photos dessinées (assets/generate.py), dégâts pointés et
// chiffrages en centimes. Les photos, boîtes et estimations viennent de
// scenes.json, produit par le même script que les images : les boîtes
// tombent donc exactement sur les dégâts dessinés.
import type {
  AppUser,
  BoundingBox,
  CaseDamage,
  CaseDocument,
  CaseImportMetadata,
  CasePhoto,
  CaseRepairLine,
  CaseSource,
  CaseStatus,
  DamageSeverity,
  DamageType,
  DatasetExportFilters,
  DocumentKind,
  LaborScale,
  ParsedEstimate,
  PartType,
  PhotoViewType,
  RepairOperation,
  RotationDegrees,
  TrainingCase,
  VehicleZone,
} from "@/../../../packages/domain/dist/index.js";
import { SENSITIVE_VIEW_TYPES } from "@/../../../packages/domain/dist/index.js";
import { ilYa, jourIlYa } from "../shared/runtime";
import { buildRepairLines, collectSuggestedZones, registrationYear } from "./estimate";
import scenesJson from "./scenes.json";

export const BASE = "/demos/hellboy";
export const PASSWORD = "demo";

// ── Forme de scenes.json ────────────────────────────────────────────────────

export type ScenePhoto = {
  file: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  viewType: PhotoViewType;
  rotationDegrees: RotationDegrees;
};
export type SceneDamage = {
  key: string;
  zone: VehicleZone;
  damageType: DamageType;
  severity: DamageSeverity;
  photo: string | null;
  bbox: BoundingBox | null;
};
export type SceneDocument = { kind: DocumentKind; fileName: string; file: string; bytes: number; sha256: string };
export type Scene = {
  vehicle: { make: string; model: string; mileageKm: number };
  plate: string;
  photos: ScenePhoto[];
  damages: SceneDamage[];
  estimate?: ParsedEstimate;
  documents?: SceneDocument[];
};
export const SCENES = scenesJson as unknown as Record<string, Scene>;

// ── Base de données de la démo (sérialisable en JSON) ───────────────────────

export type UserRow = AppUser & { password: string };
export type CaseRow = TrainingCase & { importMetadata: CaseImportMetadata | null };
/** `url` : image servie à la place de /api/photos/:id/file (fichier de la démo ou data URL). */
export type PhotoRow = CasePhoto & { url: string };
export type DocumentRow = CaseDocument & { url: string };
export type ExportRow = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  schemaVersion: number;
  caseCount: number;
  photoCount: number;
  bytes: number;
  filters: DatasetExportFilters;
  filePath: string;
};
export type ImportOutcome = {
  sourceRef: string;
  status: "imported" | "skipped" | "failed";
  caseId?: string;
  reference?: string;
  reason?: string;
  warnings?: string[];
};
export type ImportRunRow = {
  id: string;
  status: "running" | "completed" | "failed";
  requestedCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  error: string | null;
  details: ImportOutcome[];
  startedAt: string;
  finishedAt: string | null;
  createdBy: string | null;
};

export type Db = {
  /** Session « cookie httpOnly » du vrai produit : tenue ici, côté fausse API. */
  sessionUserId: string | null;
  nextReference: number;
  users: UserRow[];
  cases: CaseRow[];
  photos: PhotoRow[];
  damages: CaseDamage[];
  repairLines: CaseRepairLine[];
  documents: DocumentRow[];
  exports: ExportRow[];
  importRuns: ImportRunRow[];
};

// Identifiants au format UUID, comme ceux de Postgres (gen_random_uuid).
const KIND = { user: "05e40000", case: "0ca5e000", photo: "0f070000", damage: "0da3a6e0", line: "011e0000", doc: "0d0c0000", export: "0e4e0000", run: "0a110000", drevio: "0d4e7100" } as const;
export function seedId(kind: keyof typeof KIND, n: number): string {
  return `${KIND[kind]}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`;
}

export const reference = (n: number) => `HB-${String(n).padStart(6, "0")}`;
export const photoFileUrl = (file: string) => `${BASE}/photos/${file}`;
export const documentFileUrl = (file: string) => `${BASE}/documents/${file}`;

export const USER_ADMIN = seedId("user", 1);
export const USER_REVIEWER = seedId("user", 2);
export const USER_ANNOTATOR = seedId("user", 3);
export const USER_VIEWER = seedId("user", 4);

export const DEMO_EMAILS = {
  admin: "camille.roussel@hellboy.test",
  reviewer: "ines.moreau@hellboy.test",
  annotator: "lucas.bernard@hellboy.test",
  viewer: "paul.lefevre@hellboy.test",
};

// ── Dossiers ────────────────────────────────────────────────────────────────

type ManualLine = {
  damage: string | null;
  operation: RepairOperation;
  scale: LaborScale | null;
  label: string;
  partType?: PartType;
  partRef?: string;
  part?: number;
  minutes?: number;
  labor?: number;
  paint?: number;
};

type CaseDef = {
  scene: string | null;
  status: CaseStatus;
  source: CaseSource;
  createdBy: string;
  createdDays: number;
  validated?: { by: string; days: number };
  rejection?: string;
  sourceRef?: string;
  vehicleYear?: number;
  laborRateCents?: number | null;
  bodyshop?: string | null;
  incidentDays?: number;
  estimateDays?: number;
  notes?: string | null;
  /** Dégâts du dossier ; absents (archive non encore annotée) quand false. */
  withDamages?: boolean;
  damageNotes?: Record<string, string>;
  lines?: ManualLine[];
};

export const DREVIO_REF_C04 = seedId("drevio", 4);
export const DREVIO_REF_C13 = seedId("drevio", 13);

const CASES: CaseDef[] = [
  {
    scene: "c01", status: "validated", source: "manual", createdBy: USER_ANNOTATOR, createdDays: 52,
    validated: { by: USER_REVIEWER, days: 47 }, vehicleYear: 2021, laborRateCents: 6500,
    bodyshop: "CARROSSERIE DES ACACIAS", incidentDays: 57, estimateDays: 54,
    notes: "Accrochage en stationnement, côté arrière gauche.",
    damageNotes: { d2: "Enfoncement au-dessus du passage de roue, peinture intacte." },
    lines: [
      { damage: "d2", operation: "repair", scale: "t1", label: "Débosselage aile AR G", minutes: 90, labor: 9750 },
      { damage: "d2", operation: "paint", scale: "paint", label: "Peinture aile AR G", minutes: 84, paint: 9800 },
      { damage: "d1", operation: "polish", scale: "t1", label: "Lustrage pare-chocs AR", minutes: 30, labor: 3250 },
      { damage: null, operation: "paint", scale: "ingredients", label: "Ingrédients peinture", paint: 4760 },
    ],
  },
  {
    scene: "c02", status: "validated", source: "archive_import", createdBy: USER_ADMIN, createdDays: 55,
    validated: { by: USER_REVIEWER, days: 50 },
    damageNotes: { d2: "Optique fendue, éclat manquant côté extérieur.", d1: "Déchirure sous la plaque." },
  },
  {
    scene: "c03", status: "validated", source: "manual", createdBy: USER_REVIEWER, createdDays: 44,
    validated: { by: USER_ADMIN, days: 40 }, vehicleYear: 2016, laborRateCents: 6200,
    bodyshop: "ATELIER CARROSSERIE BELLEVUE", incidentDays: 47, estimateDays: 45,
    lines: [
      { damage: "d1", operation: "repair", scale: "t2", label: "Débosselage porte AV G", minutes: 120, labor: 14400 },
      { damage: "d1", operation: "disassembly", scale: "t1", label: "Dépose-repose garniture porte AV G", minutes: 42, labor: 4340 },
      { damage: "d1", operation: "paint", scale: "paint", label: "Peinture porte AV G", minutes: 96, paint: 10560 },
      { damage: "d2", operation: "polish", scale: "t1", label: "Polissage porte AR G", minutes: 36, labor: 3720 },
      { damage: null, operation: "paint", scale: "ingredients", label: "Ingrédients peinture", paint: 3840 },
    ],
  },
  {
    scene: "c04", status: "validated", source: "drevio_import", createdBy: USER_ADMIN, createdDays: 38,
    validated: { by: USER_REVIEWER, days: 33 }, sourceRef: DREVIO_REF_C04, laborRateCents: 6000,
    estimateDays: 39, notes: `Importé depuis DREVIO (dossier ${DREVIO_REF_C04}, DE-104-MO). Taux horaire saisi à la relecture.`,
    lines: [
      { damage: "d1", operation: "smart_repair", scale: "t1", label: "Smart repair porte AR D", minutes: 60, labor: 6000 },
      { damage: "d2", operation: "paint", scale: "paint", label: "Retouche bas de caisse D", minutes: 30, paint: 3300 },
      { damage: null, operation: "paint", scale: "ingredients", label: "Ingrédients peinture", paint: 1200 },
    ],
  },
  {
    scene: "c05", status: "validated", source: "archive_import", createdBy: USER_ADMIN, createdDays: 38,
    validated: { by: USER_REVIEWER, days: 30 },
    damageNotes: { d1: "Coque et miroir arrachés, support visible." },
  },
  {
    scene: "c06", status: "ready", source: "manual", createdBy: USER_ANNOTATOR, createdDays: 9,
    vehicleYear: 2022, laborRateCents: 5800, bodyshop: "GARAGE DU MOULIN - CARROSSERIE", incidentDays: 12, estimateDays: 10,
    lines: [
      { damage: "d2", operation: "replace", scale: "t1", label: "Grille de calandre", partType: "oem", partRef: "DEMO-GR-0106", part: 8940, minutes: 30, labor: 2900 },
      { damage: "d1", operation: "polish", scale: "t1", label: "Lustrage pare-chocs AV", minutes: 45, labor: 4350 },
    ],
  },
  {
    scene: "c07", status: "ready", source: "archive_import", createdBy: USER_ADMIN, createdDays: 10,
  },
  {
    // Archive déposée hier : photos non triées et couchées, aucun dégât créé.
    scene: "c08", status: "draft", source: "archive_import", createdBy: USER_ADMIN, createdDays: 1, withDamages: false,
  },
  {
    scene: "c09", status: "draft", source: "manual", createdBy: USER_ANNOTATOR, createdDays: 4,
    vehicleYear: 2018, laborRateCents: null, incidentDays: 6,
    notes: "Chiffrage du carrossier attendu.",
  },
  {
    scene: null, status: "draft", source: "manual", createdBy: USER_ANNOTATOR, createdDays: 0.1,
  },
  {
    scene: "c11", status: "rejected", source: "manual", createdBy: USER_ANNOTATOR, createdDays: 20,
    rejection: "Gros plan flou : la nature du dégât n'est pas lisible, reprendre la photo.",
    vehicleYear: 2020, laborRateCents: 6300, incidentDays: 23, estimateDays: 21,
    lines: [{ damage: "d1", operation: "polish", scale: "t1", label: "Polissage porte AV G", minutes: 40, labor: 4200 }],
  },
  {
    scene: "c12", status: "validated", source: "archive_import", createdBy: USER_ADMIN, createdDays: 28,
    validated: { by: USER_REVIEWER, days: 24 },
  },
  {
    scene: "c13", status: "ready", source: "drevio_import", createdBy: USER_ADMIN, createdDays: 6,
    sourceRef: DREVIO_REF_C13, laborRateCents: 6100, estimateDays: 7,
    notes: `Importé depuis DREVIO (dossier ${DREVIO_REF_C13}, DE-113-MO).`,
    lines: [
      { damage: "d1", operation: "repair", scale: "t1", label: "Réparation porte AV D", minutes: 72, labor: 7320 },
      { damage: "d1", operation: "paint", scale: "paint", label: "Peinture porte AV D", minutes: 96, paint: 10080 },
      { damage: "d2", operation: "paint", scale: "paint", label: "Retouche aile AV D", minutes: 24, paint: 2520 },
      { damage: null, operation: "paint", scale: "ingredients", label: "Ingrédients peinture", paint: 2900 },
    ],
  },
];

let counters = { photo: 0, damage: 0, line: 0, doc: 0 };

/** Photos d'une scène rattachées à un dossier ; renvoie aussi la table fichier → identifiant. */
export function scenePhotos(scene: Scene, caseId: string, createdAt: string, nextPhotoId: () => string) {
  const byFile = new Map<string, string>();
  const photos: PhotoRow[] = scene.photos.map((p, index) => {
    const id = nextPhotoId();
    byFile.set(p.file, id);
    return {
      id,
      caseId,
      storagePath: `cases/${caseId}/${p.sha256}.jpg`,
      viewType: p.viewType,
      imageOrder: index,
      width: p.width,
      height: p.height,
      bytes: p.bytes,
      sha256: p.sha256,
      rotationDegrees: p.rotationDegrees,
      createdAt,
      url: photoFileUrl(p.file),
    };
  });
  return { photos, byFile };
}

export function sceneDocuments(scene: Scene, caseId: string, createdAt: string, nextDocId: () => string): DocumentRow[] {
  return (scene.documents ?? []).map((d) => ({
    id: nextDocId(),
    caseId,
    kind: d.kind,
    fileName: d.fileName,
    storagePath: `cases/${caseId}/documents/${d.sha256}.pdf`,
    bytes: d.bytes,
    sha256: d.sha256,
    createdAt,
    url: documentFileUrl(d.file),
  }));
}

/** Lignes de chiffrage telles que l'import d'archive les crée (ordre du document, sans dégât rattaché). */
export function linesFromEstimate(estimate: ParsedEstimate, caseId: string, createdAt: string, nextLineId: () => string) {
  const { lines, warnings } = buildRepairLines(estimate);
  const rows: CaseRepairLine[] = lines.map((l, index) => ({
    id: nextLineId(),
    caseId,
    damageId: null,
    operation: l.operation,
    partType: l.partType,
    laborScale: l.laborScale,
    partRef: l.partRef,
    partLabel: l.partLabel,
    partCostCents: l.partCostCents,
    laborMinutes: l.laborMinutes,
    laborCostCents: l.laborCostCents,
    paintCostCents: l.paintCostCents,
    totalCents: l.partCostCents + l.laborCostCents + l.paintCostCents,
    lineOrder: index,
    createdAt,
  }));
  return { rows, warnings, suggestedZones: collectSuggestedZones(lines) };
}

/** Notes posées par le vrai import d'archive. */
export function archiveNotes(archiveName: string, e: ParsedEstimate): string {
  return [
    `Archive ${archiveName}.`,
    e.bodyshop ? `Carrossier : ${e.bodyshop}.` : null,
    e.documentNumber ? `Dossier ${e.documentNumber}.` : null,
    e.incidentDate ? `Sinistre du ${e.incidentDate}.` : null,
  ]
    .filter((part) => part !== null)
    .join(" ");
}

function buildCase(def: CaseDef, n: number, db: Db) {
  const id = seedId("case", n);
  const createdAt = def.createdDays < 1 ? new Date(Date.now() - def.createdDays * 86_400_000).toISOString() : ilYa(def.createdDays, 9 + (n % 7));
  const scene = def.scene ? SCENES[def.scene] : null;
  const estimate = def.source === "archive_import" ? scene?.estimate ?? null : null;

  const row: CaseRow = {
    id,
    reference: reference(n),
    status: def.status,
    source: def.source,
    sourceRef: def.sourceRef ?? null,
    vehicleMake: scene?.vehicle.make ?? null,
    vehicleModel: scene?.vehicle.model ?? null,
    vehicleYear: def.vehicleYear ?? null,
    vehicleMileageKm: scene?.vehicle.mileageKm ?? null,
    vehiclePlate: null,
    vehicleVin: null,
    laborRateCents: def.laborRateCents ?? null,
    bodyshop: def.bodyshop ?? null,
    incidentDate: def.incidentDays !== undefined ? jourIlYa(def.incidentDays) : null,
    estimateDate: def.estimateDays !== undefined ? jourIlYa(def.estimateDays) : null,
    currency: "EUR",
    notes: def.notes ?? null,
    rejectionReason: def.rejection ?? null,
    createdBy: def.createdBy,
    validatedBy: def.validated?.by ?? null,
    validatedAt: def.validated ? ilYa(def.validated.days, 15) : null,
    createdAt,
    updatedAt: def.validated ? ilYa(def.validated.days, 15) : createdAt,
    importMetadata: null,
  };

  if (scene === null) {
    db.cases.push(row);
    return;
  }

  const { photos, byFile } = scenePhotos(scene, id, createdAt, () => seedId("photo", ++counters.photo));
  db.photos.push(...photos);

  if (estimate) {
    // Dossier issu d'une archive : véhicule, contexte de prix et chiffrage
    // viennent de l'estimation, comme dans le vrai import.
    const archiveName = `Documents_${scene.plate}.zip`;
    const { rows, suggestedZones } = linesFromEstimate(estimate, id, createdAt, () => seedId("line", ++counters.line));
    db.repairLines.push(...rows);
    db.documents.push(...sceneDocuments(scene, id, createdAt, () => seedId("doc", ++counters.doc)));
    Object.assign(row, {
      sourceRef: `${scene.plate}/${estimate.documentNumber}`,
      vehicleMake: estimate.vehicle.make,
      vehicleModel: estimate.vehicle.model,
      vehicleYear: registrationYear(estimate.vehicle.firstRegistration),
      vehicleMileageKm: estimate.vehicle.mileageKm,
      vehiclePlate: estimate.vehicle.plate,
      vehicleVin: estimate.vehicle.vin,
      laborRateCents: estimate.rates.bodyworkT1Cents,
      bodyshop: estimate.bodyshop,
      incidentDate: estimate.incidentDate,
      estimateDate: estimate.documentDate,
      notes: archiveNotes(archiveName, estimate),
      importMetadata: { archiveName, importedAt: createdAt, estimate, suggestedZones },
    } satisfies Partial<CaseRow>);
  }

  const damageIds = new Map<string, string>();
  if (def.withDamages !== false) {
    for (const d of scene.damages) {
      const damageId = seedId("damage", ++counters.damage);
      damageIds.set(d.key, damageId);
      db.damages.push({
        id: damageId,
        caseId: id,
        photoId: d.photo ? byFile.get(d.photo) ?? null : null,
        zone: d.zone,
        damageType: d.damageType,
        severity: d.severity,
        bbox: d.photo ? d.bbox : null,
        notes: def.damageNotes?.[d.key] ?? null,
        createdAt,
      });
    }
  }

  (def.lines ?? []).forEach((l, index) => {
    const part = l.part ?? 0;
    const labor = l.labor ?? 0;
    const paint = l.paint ?? 0;
    db.repairLines.push({
      id: seedId("line", ++counters.line),
      caseId: id,
      damageId: l.damage ? damageIds.get(l.damage) ?? null : null,
      operation: l.operation,
      partType: l.partType ?? "none",
      laborScale: l.scale,
      partRef: l.partRef ?? null,
      partLabel: l.label,
      partCostCents: part,
      laborMinutes: l.minutes ?? 0,
      laborCostCents: labor,
      paintCostCents: paint,
      totalCents: part + labor + paint,
      lineOrder: index,
      createdAt,
    });
  });

  db.cases.push(row);
}

export function seed(): Db {
  counters = { photo: 0, damage: 0, line: 0, doc: 0 };
  const user = (n: number, email: string, firstName: string, lastName: string, role: AppUser["role"], createdDays: number, lastLoginDays: number | null, isActive = true): UserRow => ({
    id: seedId("user", n), email, firstName, lastName, role, isActive,
    createdAt: ilYa(createdDays, 9), lastLoginAt: lastLoginDays === null ? null : ilYa(lastLoginDays, 8 + n), password: PASSWORD,
  });

  const db: Db = {
    sessionUserId: null,
    nextReference: CASES.length + 1,
    users: [
      user(1, DEMO_EMAILS.admin, "Camille", "Roussel", "admin", 90, 0),
      user(2, DEMO_EMAILS.reviewer, "Inès", "Moreau", "reviewer", 80, 1),
      user(3, DEMO_EMAILS.annotator, "Lucas", "Bernard", "annotator", 70, 0),
      user(4, DEMO_EMAILS.viewer, "Paul", "Lefèvre", "viewer", 60, 12),
      user(5, "sarah.petit@hellboy.test", "Sarah", "Petit", "annotator", 65, 35, false),
    ],
    cases: [],
    photos: [],
    damages: [],
    repairLines: [],
    documents: [],
    exports: [],
    importRuns: [],
  };

  CASES.forEach((def, i) => buildCase(def, i + 1, db));
  // La liste se lit du plus récent au plus ancien, comme l'ORDER BY de l'API.
  db.cases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Export passé : ses compteurs sont ceux que la démo reconstruit au
  // téléchargement (dossiers validés avant sa date, sans photos nominatives).
  const exportedAt = ilYa(21, 17);
  const exported = new Set(db.cases.filter((c) => c.status === "validated" && (c.validatedAt ?? "") <= exportedAt).map((c) => c.id));
  const exportedPhotos = db.photos.filter((p) => exported.has(p.caseId) && !(SENSITIVE_VIEW_TYPES as string[]).includes(p.viewType));
  db.exports.push({
    id: seedId("export", 1),
    createdAt: exportedAt,
    createdBy: USER_REVIEWER,
    schemaVersion: 4,
    caseCount: exported.size,
    photoCount: exportedPhotos.length,
    // Archive « stored » : photos + en-têtes ZIP + manifeste (ordre de grandeur).
    bytes: exportedPhotos.reduce((sum, p) => sum + p.bytes + 250, 0) + exported.size * 3300 + 1600,
    filters: { includeSensitivePhotos: false, onlyWithBoundingBoxes: false },
    filePath: `exports/hellboy-dataset-${exportedAt.replace(/[:.]/g, "-")}.zip`,
  });

  const c04 = db.cases.find((c) => c.sourceRef === DREVIO_REF_C04)!;
  const c13 = db.cases.find((c) => c.sourceRef === DREVIO_REF_C13)!;
  db.importRuns.push(
    {
      id: seedId("run", 2), status: "completed", requestedCount: 1, importedCount: 1, skippedCount: 0, failedCount: 0, error: null,
      details: [{ sourceRef: DREVIO_REF_C13, status: "imported", caseId: c13.id, reference: c13.reference }],
      startedAt: c13.createdAt, finishedAt: c13.createdAt, createdBy: USER_ADMIN,
    },
    {
      id: seedId("run", 1), status: "completed", requestedCount: 1, importedCount: 1, skippedCount: 0, failedCount: 0, error: null,
      details: [{ sourceRef: DREVIO_REF_C04, status: "imported", caseId: c04.id, reference: c04.reference,
        warnings: ["2 ligne(s) de chiffrage IA ignorée(s) — seul le chiffrage relu par un expert est repris"] }],
      startedAt: c04.createdAt, finishedAt: c04.createdAt, createdBy: USER_ADMIN,
    },
  );
  return db;
}
