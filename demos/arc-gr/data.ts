// Jeu de données de la démo ARC GR. Tout est fictif : entreprises, débiteurs,
// coordonnées (domaines .example, réservés et non routables) et montants.
// Seuls ARC GR et Ariane Arçon sont réels, avec leur accord.
// Les dates sont relatives à aujourd'hui (ilYa / jourIlYa) : la démo reste
// « vivante » quel que soit le jour où on l'ouvre.
import { ilYa, jourIlYa } from "../shared/runtime";

// --- Types (mêmes formes que le backend FastAPI) -----------------------------

export type DossierStatus =
  | "nouveau"
  | "relance_mail"
  | "en_relance"
  | "en_negociation"
  | "en_litige"
  | "promesse_reglement"
  | "regle"
  | "perdu";

export type EventType = "appel" | "email" | "courrier" | "sms" | "note" | "statut" | "autre";

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "client";
  client_id: string | null;
  /** Mot de passe en clair (démo) ; null tant qu'une invitation n'est pas acceptée. */
  password: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface DbClient {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  commission_rate: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface DbDossier {
  id: string;
  client_id: string;
  debtor_name: string;
  amount: number;
  status: DossierStatus;
  due_date: string | null;
  next_action_date: string | null;
  notes: string | null;
  debtor_phone: string | null;
  debtor_email: string | null;
  invoice_reference: string | null;
  invoice_date: string | null;
  import_batch_id: string | null;
  mail_relance_level: number;
  last_mail_relance_at: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbEvent {
  id: string;
  dossier_id: string;
  event_type: EventType;
  description: string;
  created_at: string;
}

export interface DbBatch {
  id: string;
  client_id: string;
  filename: string;
  rows_total: number;
  rows_created: number;
  rows_updated: number;
  rows_skipped: number;
  rows_missing_amount: number;
  rows_lost: number;
  rows_amount_adjusted: number;
  rows_not_comparable: number;
  reconciled: boolean;
  created_at: string;
}

/** Modification d'un import sur un dossier préexistant (pour l'annuler). */
export interface DbChange {
  batch_id: string;
  dossier_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface ColumnMapping {
  debtor_name: number | null;
  amount: number | null;
  debtor_phone: number[];
  debtor_email: number | null;
  invoice_reference: number | null;
  invoice_date: number | null;
}

export interface DbMapping {
  client_id: string;
  has_header: boolean;
  mapping: ColumnMapping;
  updated_at: string;
}

export interface DbTemplate {
  level: number;
  subject: string;
  body: string;
  follow_up_enabled: boolean;
  follow_up_days: number;
  updated_at: string;
}

export interface DbAiRule {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

export interface Db {
  users: DbUser[];
  clients: DbClient[];
  dossiers: DbDossier[];
  events: DbEvent[];
  batches: DbBatch[];
  changes: DbChange[];
  mappings: DbMapping[];
  templates: DbTemplate[];
  aiRules: DbAiRule[];
}

// --- Libellés partagés avec la fausse API --------------------------------------

export const STATUS_LABELS: Record<DossierStatus, string> = {
  nouveau: "Nouveau",
  relance_mail: "Relancé par mail",
  en_relance: "En relance",
  en_negociation: "En négociation",
  en_litige: "En litige",
  promesse_reglement: "Promesse de règlement",
  regle: "Réglé",
  perdu: "Perdu",
};

export const CLOSED: DossierStatus[] = ["regle", "perdu"];

/** Montant à la française, « 4 200,00 € », comme les textes du backend. */
export function euro(value: number): string {
  const [ent, dec] = value.toFixed(2).split(".");
  return `${ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} €`;
}

/** YYYY-MM-DD -> JJ/MM/AAAA. */
export function frDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Textes par défaut des deux relances écrites, repris du backend
// (routers/relance_mail.py) : la démo montre ce qu'Ariane envoie vraiment.
export const DEFAULT_TEMPLATES: Record<number, [string, string]> = {
  1: [
    "Facture {reference} — {client}",
    "Bonjour,\n\nSauf erreur de notre part, la facture {reference} émise le {date_facture} par {client}, d'un montant de {montant}, reste impayée à ce jour (échéance : {echeance}).\n\nIl s'agit très probablement d'un oubli. Nous vous remercions de procéder au règlement sous huitaine, ou de nous indiquer la date à laquelle vous pourrez le faire.\n\nSi ce montant a déjà été réglé, merci de nous transmettre votre justificatif de paiement : nous clôturerons le dossier immédiatement.\n\nNous restons à votre disposition.\n\nARC Gestion et Recouvrement\nMandaté par {client}",
  ],
  2: [
    "Relance — facture {reference} impayée depuis {jours_retard} jours",
    "Bonjour,\n\nNous vous avons contacté au sujet de la facture {reference} de {montant}, émise par {client} et échue depuis le {echeance}, soit {jours_retard} jours de retard. À ce jour, nous n'avons enregistré ni votre règlement ni votre réponse.\n\nNous vous invitons à régulariser cette situation sous 8 jours, ou à nous contacter pour convenir d'un échéancier — c'est encore la solution la plus simple pour tout le monde.\n\nSans retour de votre part passé ce délai, le dossier sera transmis pour la suite de la procédure de recouvrement.\n\nNous restons joignables pour en discuter.\n\nARC Gestion et Recouvrement\nMandaté par {client}",
  ],
};

// --- Identifiants de démo ------------------------------------------------------

export const DEMO_PASSWORD = "demo";
export const ADMIN_EMAIL = "contact@arc-gr.fr";
export const PORTAL_CLIENT_ID = "c-clim";
export const PORTAL_CLIENT_NAME = "Clim'Services Caraïbes";
export const PORTAL_EMAIL = "ludovic.nelson@clim-caraibes.example";
export const PENDING_INVITE_TOKEN = "demo-invitation-creole";

// --- Clients -----------------------------------------------------------------

type ClientSpec = [id: string, name: string, contact: string, email: string, phone: string, rate: number | null, age: number];

const CLIENTS: ClientSpec[] = [
  ["c-clim", PORTAL_CLIENT_NAME, "Ludovic Nelson", PORTAL_EMAIL, "0690 41 27 83", 12, 240],
  ["c-transports", "Transports Lamentin Express", "Jean-Marc Célestine", "jm.celestine@tle-transports.example", "0690 55 18 02", 10, 190],
  ["c-veto", "Clinique Vétérinaire des Abymes", "Dr Nadège Lubin", "accueil@veto-abymes.example", "0590 82 64 10", 15, 150],
  ["c-ferronnerie", "Ferronnerie Moule Métal", "Thierry Bourgeois", "contact@moule-metal.example", "0690 73 09 51", 10, 130],
  ["c-creole", "Agence Créole Événements", "Laëtitia Ravin", "laetitia@creole-evenements.example", "0696 24 88 17", 12, 75],
  ["c-distrib", "Distrib'Antilles Frais", "Patrick Élisabeth", "p.elisabeth@distrib-antilles.example", "0696 30 71 45", 8, 110],
  ["c-geometre", "Cabinet Géomètre Saint-Claude", "Hélène Marie-Sainte", "h.mariesainte@geometre-stclaude.example", "0590 80 12 36", 10, 70],
  // Client mis à la corbeille, avec ses dossiers (même horodatage : cascade).
  ["c-pressing", "Pressing Bord de Mer", "Sylvie Jean-Baptiste", "pressing.bdm@mail.example", "0690 12 45 78", 10, 200],
];

// --- Dossiers ----------------------------------------------------------------

type Ev = [type: EventType, description: string, joursIlYa: number];

interface Spec {
  id: string;
  client: string;
  debtor: string;
  amount: number;
  status: DossierStatus;
  /** Ancienneté du dossier, en jours. */
  age: number;
  ref?: string | null;
  email?: string;
  phone?: string;
  /** Prochaine action, en jours à partir d'aujourd'hui (négatif = en retard). */
  next?: number;
  notes?: string;
  /** Relances écrites envoyées : [niveau atteint, jours depuis le dernier envoi]. */
  mail?: [number, number];
  /** Encaissement, en jours. */
  settled?: number;
  batch?: string;
  /** Corbeille : jours depuis la suppression, ou horodatage exact (cascade). */
  deleted?: number | string;
  /** Historique explicite, sinon généré selon le statut. */
  events?: Ev[];
  /** Événements ajoutés à l'historique généré. */
  extra?: Ev[];
}

const SPECS: Spec[] = [
  // Clim'Services Caraïbes — client du portail, l'historique le plus fourni.
  { id: "d-clim-01", client: "c-clim", debtor: "Hôtel Anse Caraïbe", amount: 6840, status: "en_negociation", age: 48, ref: "CSC-2026-087", email: "compta@anse-caraibe.example", phone: "0590 88 41 20", next: -1, notes: "Maintenance annuelle des 42 splits. Interlocutrice : Mme Faustin (comptabilité)." },
  { id: "d-clim-02", client: "c-clim", debtor: "Restaurant Le Flamboyant", amount: 1290, status: "promesse_reglement", age: 30, ref: "CSC-2026-102", phone: "0690 32 18 77", next: 4 },
  { id: "d-clim-03", client: "c-clim", debtor: "Pharmacie de la Rivière", amount: 2475, status: "regle", age: 62, ref: "CSC-2026-071", settled: 0 },
  { id: "d-clim-04", client: "c-clim", debtor: "SCI Les Hauts de Gosier", amount: 3920, status: "en_relance", age: 26, ref: "CSC-2026-108", email: "gestion@hauts-gosier.example", next: 0, mail: [1, 19] },
  { id: "d-clim-05", client: "c-clim", debtor: "Boulangerie Pain Doré", amount: 860, status: "regle", age: 95, ref: "CSC-2026-052", settled: 34 },
  { id: "d-clim-06", client: "c-clim", debtor: "Cabinet Dentaire de Jarry", amount: 1980, status: "regle", age: 120, ref: "CSC-2026-038", settled: 66 },
  { id: "d-clim-07", client: "c-clim", debtor: "Supérette du Bourg", amount: 540, status: "relance_mail", age: 18, ref: "CSC-2026-115", email: "superette.bourg@mail.example", mail: [1, 6], next: 2 },
  { id: "d-clim-08", client: "c-clim", debtor: "EURL Kaz'Immo", amount: 4310, status: "nouveau", age: 3, ref: "CSC-2026-121", email: "contact@kazimmo.example" },
  { id: "d-clim-09", client: "c-clim", debtor: "Salle de sport Fit'Karib", amount: 2150, status: "en_litige", age: 75, ref: "CSC-2026-064", email: "direction@fitkarib.example", next: 6, notes: "Conteste l'intervention du 12 (panne revenue 3 jours après)." },
  { id: "d-clim-10", client: "c-clim", debtor: "Garage Auto Plus Jarry", amount: 1640, status: "regle", age: 150, ref: "CSC-2026-019", settled: 98 },
  { id: "d-clim-11", client: "c-clim", debtor: "Crèche Les P'tits Colibris", amount: 720, status: "regle", age: 180, ref: "CSC-2025-301", settled: 127 },
  { id: "d-clim-12", client: "c-clim", debtor: "M. Rodrigue Jean-Louis", amount: 380, status: "perdu", age: 210, ref: "CSC-2025-266" },
  { id: "d-clim-13", client: "c-clim", debtor: "Bar Le Ti-Punch", amount: 1150, status: "regle", age: 40, ref: "CSC-2026-095", settled: 12 },
  { id: "d-clim-14", client: "c-clim", debtor: "Agence immobilière Caraïbes Habitat", amount: 2890, status: "relance_mail", age: 33, ref: "CSC-2026-093", email: "compta@caraibes-habitat.example", mail: [2, 3], next: 12 },
  { id: "d-clim-15", client: "c-clim", debtor: "Hôtel Anse Caraïbe (doublon)", amount: 6840, status: "nouveau", age: 47, ref: null, notes: "Créé en double par erreur.", deleted: 2, events: [] },

  // Transports Lamentin Express — deux imports de fichier successifs.
  { id: "d-tle-01", client: "c-transports", debtor: "SARL Bois Tropical", amount: 2480, status: "en_relance", age: 38, ref: "TLE2026-0412", phone: "0590 26 74 11", email: "compta@boistropical.example", next: -2, batch: "b-tle-1", extra: [["note", "Montant ajusté : 3 480,00 € → 2 480,00 € — encaissement constaté dans le fichier « Impayes_TLE_septembre_2026.xlsx ».", 9]] },
  { id: "d-tle-02", client: "c-transports", debtor: "Quincaillerie Centrale Pointe-à-Pitre", amount: 1875, status: "en_negociation", age: 38, ref: "TLE2026-0398", phone: "0590 21 09 63", next: 3, batch: "b-tle-1" },
  { id: "d-tle-03", client: "c-transports", debtor: "Matériaux Express Jarry", amount: 5260, status: "perdu", age: 38, ref: "TLE2026-0377", batch: "b-tle-1", events: [
    ["appel", "Standard injoignable, message laissé au gérant.", 30],
    ["statut", "Statut changé : Nouveau → En relance", 30],
    ["courrier", "Lettre de relance envoyée au siège.", 21],
    ["statut", `Statut changé : En relance → Perdu — facture absente du fichier « Impayes_TLE_septembre_2026.xlsx » importé le ${frDate(jourIlYa(9))}.`, 9],
  ] },
  { id: "d-tle-04", client: "c-transports", debtor: "Primeurs du Moule", amount: 940, status: "promesse_reglement", age: 38, ref: "TLE2026-0421", phone: "0690 61 22 48", next: 2, batch: "b-tle-1" },
  { id: "d-tle-05", client: "c-transports", debtor: "Brasserie des Îles", amount: 2210, status: "nouveau", age: 38, ref: "TLE2026-0430", batch: "b-tle-1", notes: "Infos fichier : Montant TTC: 2 210,00 · Ville: Baie-Mahault" },
  { id: "d-tle-06", client: "c-transports", debtor: "Cash Carib Distribution", amount: 3150, status: "nouveau", age: 9, ref: "TLE2026-0467", email: "achats@cashcarib.example", batch: "b-tle-2", notes: "Infos fichier : Montant TTC: 3 150,00 · Ville: Les Abymes" },
  { id: "d-tle-07", client: "c-transports", debtor: "Ets Bonheur Frères", amount: 1320, status: "regle", age: 85, ref: "TLE2026-0311", settled: 20 },
  { id: "d-tle-08", client: "c-transports", debtor: "Location Engins Basse-Terre", amount: 4780, status: "relance_mail", age: 22, ref: "TLE2026-0445", email: "factures@leb-location.example", mail: [1, 9], next: -1 },

  // Clinique vétérinaire — petites créances de particuliers.
  { id: "d-vet-01", client: "c-veto", debtor: "Mme Joëlle Cassin", amount: 285, status: "relance_mail", age: 25, ref: "VET-26-0931", email: "joelle.cassin@mail.example", mail: [1, 11], next: -3 },
  { id: "d-vet-02", client: "c-veto", debtor: "Élevage canin du Morne-Rouge", amount: 1460, status: "en_relance", age: 44, ref: "VET-26-0874", phone: "0690 47 03 66", next: -4 },
  { id: "d-vet-03", client: "c-veto", debtor: "M. Fabrice Nankin", amount: 390, status: "regle", age: 52, ref: "VET-26-0859", settled: 8 },
  { id: "d-vet-04", client: "c-veto", debtor: "Centre équestre de Petit-Bourg", amount: 2730, status: "promesse_reglement", age: 36, ref: "VET-26-0902", phone: "0690 58 71 04", next: 7 },
  { id: "d-vet-05", client: "c-veto", debtor: "M. Gérald Marival", amount: 175, status: "nouveau", age: 5, ref: "VET-26-0958", email: "g.marival@mail.example" },
  { id: "d-vet-06", client: "c-veto", debtor: "Mme Sandrine Lacour", amount: 520, status: "nouveau", age: 2, ref: "VET-26-0961", phone: "0690 15 92 34" },
  { id: "d-vet-07", client: "c-veto", debtor: "Animalerie Tropic'Zoo", amount: 1890, status: "relance_mail", age: 40, ref: "VET-26-0866", email: "gerance@tropiczoo.example", mail: [2, 5], next: 10 },
  { id: "d-vet-08", client: "c-veto", debtor: "M. Patrice Dorival", amount: 210, status: "nouveau", age: 20, ref: "VET-26-0915", notes: "Facture réglée directement à la clinique avant relance.", deleted: 11, events: [] },

  // Ferronnerie — chantiers, montants plus élevés.
  { id: "d-fmm-01", client: "c-ferronnerie", debtor: "SAS BTP Soufrière", amount: 8750, status: "en_litige", age: 90, ref: "FMM-2026-044", email: "compta@btp-soufriere.example", next: 10, notes: "Garde-corps livrés, réserve émise à la réception. Dossier photo transmis par le client." },
  { id: "d-fmm-02", client: "c-ferronnerie", debtor: "Villa Hibiscus (M. et Mme Alexis)", amount: 3600, status: "en_negociation", age: 41, ref: "FMM-2026-058", phone: "0690 34 66 21", next: -3 },
  { id: "d-fmm-03", client: "c-ferronnerie", debtor: "Résidence Les Flamboyants (syndic)", amount: 2380, status: "regle", age: 70, ref: "FMM-2026-031", settled: 1 },
  { id: "d-fmm-04", client: "c-ferronnerie", debtor: "Menuiserie Alu Concept", amount: 1740, status: "en_relance", age: 19, ref: "FMM-2026-071", phone: "0690 82 30 19", next: 1 },
  { id: "d-fmm-05", client: "c-ferronnerie", debtor: "Entreprise Gabriel Rénovation", amount: 4120, status: "perdu", age: 160, ref: "FMM-2025-189" },
  { id: "d-fmm-06", client: "c-ferronnerie", debtor: "Restaurant La Case Créole", amount: 990, status: "nouveau", age: 1, ref: "FMM-2026-083", email: "contact@lacasecreole.example" },

  // Agence Créole Événements (Martinique) — invitation au portail en attente.
  { id: "d-ace-01", client: "c-creole", debtor: "Association Carnaval Foyal", amount: 2650, status: "en_relance", age: 34, ref: "ACE-2026-031", phone: "0696 40 12 87", next: -1 },
  { id: "d-ace-02", client: "c-creole", debtor: "Hôtel Rivage Sud", amount: 7480, status: "promesse_reglement", age: 27, ref: "ACE-2026-038", email: "events@rivage-sud.example", next: 5 },
  { id: "d-ace-03", client: "c-creole", debtor: "SARL Mariage d'Antan", amount: 1820, status: "regle", age: 58, ref: "ACE-2026-022", settled: 17 },
  { id: "d-ace-04", client: "c-creole", debtor: "CE Sucrerie du Nord", amount: 3340, status: "en_negociation", age: 46, ref: "ACE-2026-027", phone: "0696 72 55 30", next: 2 },
  { id: "d-ace-05", client: "c-creole", debtor: "M. Steeve Mondésir", amount: 960, status: "relance_mail", age: 15, ref: "ACE-2026-044", email: "s.mondesir@mail.example", mail: [1, 4], next: 4 },
  { id: "d-ace-06", client: "c-creole", debtor: "Club nautique du Robert", amount: 1210, status: "nouveau", age: 4, ref: "ACE-2026-049" },

  // Distrib'Antilles Frais (Martinique) — un import CSV dont la colonne de
  // référence n'a pas été reconnue : références restées en note (réparables).
  { id: "d-daf-01", client: "c-distrib", debtor: "Snack Le Colibri", amount: 1385, status: "en_relance", age: 52, ref: null, phone: "0696 41 20 88", next: 0, batch: "b-daf-1", notes: "Infos fichier : Pièce: FAC260871 · Commercial: Didier" },
  { id: "d-daf-02", client: "c-distrib", debtor: "Épicerie Fine Madinina", amount: 2960, status: "en_negociation", age: 50, ref: "FAC260455", phone: "0696 27 84 12", next: 4 },
  { id: "d-daf-03", client: "c-distrib", debtor: "Restaurant La Varangue", amount: 4415, status: "en_litige", age: 52, ref: null, next: 8, batch: "b-daf-1", notes: "Infos fichier : Pièce: FAC260455 · Commercial: Nadia" },
  { id: "d-daf-04", client: "c-distrib", debtor: "Traiteur Saveurs Créoles", amount: 3270, status: "regle", age: 50, ref: "FAC260512", settled: 23 },
  { id: "d-daf-05", client: "c-distrib", debtor: "Supermarché Proxi Trinité", amount: 6120, status: "promesse_reglement", age: 30, ref: "FAC260698", email: "compta@proxi-trinite.example", next: 1 },
  { id: "d-daf-06", client: "c-distrib", debtor: "Boutique Madras & Co", amount: 780, status: "relance_mail", age: 20, ref: "FAC260733", email: "boutique@madras-co.example", mail: [2, 1], next: 14 },
  { id: "d-daf-07", client: "c-distrib", debtor: "Cantine Ti-Moun", amount: 1540, status: "nouveau", age: 6, ref: "FAC260790", email: "gestion@cantine-timoun.example" },
  { id: "d-daf-08", client: "c-distrib", debtor: "Food-truck Lakou", amount: 640, status: "perdu", age: 140, ref: "FAC260214" },
  { id: "d-daf-09", client: "c-distrib", debtor: "Résidence hôtelière Les Trois Pointes", amount: 5390, status: "regle", age: 110, ref: "FAC260377", settled: 49 },

  // Cabinet de géomètre.
  { id: "d-gsc-01", client: "c-geometre", debtor: "SCI Terres de Vieux-Habitants", amount: 2100, status: "en_relance", age: 28, ref: "GSC-2026-016", email: "sci.tvh@mail.example", mail: [1, 15], next: -2 },
  { id: "d-gsc-02", client: "c-geometre", debtor: "M. et Mme Bellemare", amount: 1350, status: "regle", age: 64, ref: "GSC-2026-009", settled: 29 },
  { id: "d-gsc-03", client: "c-geometre", debtor: "Lotissement Morne Vert Promotion", amount: 5800, status: "nouveau", age: 2, ref: "GSC-2026-021", email: "promo@mornevert-lotissement.example" },

  // Dossiers du client à la corbeille (cascade).
  { id: "d-prs-01", client: "c-pressing", debtor: "Laverie Express Gosier", amount: 420, status: "en_relance", age: 45, ref: "PBM-2026-012", next: 3, deleted: "cascade" },
  { id: "d-prs-02", client: "c-pressing", debtor: "Résidence Coco Plage", amount: 1180, status: "nouveau", age: 12, ref: "PBM-2026-019", deleted: "cascade" },
];

// Variantes de libellés, choisies de façon déterministe par dossier.
const APPELS = [
  "Appel au service comptabilité : facture introuvable de leur côté, copie renvoyée par email.",
  "Message laissé au standard, rappel demandé sous 48 h.",
  "Échange avec le gérant : reconnaît la dette, trésorerie tendue ce mois-ci.",
  "Appel : la personne en charge des paiements est en congés, rappel la semaine prochaine.",
];
const NEGOCIATIONS = [
  "Proposition d'échéancier en 3 mensualités, en attente de validation du gérant.",
  "Le débiteur propose un règlement en deux fois ; accord du client demandé.",
  "Négociation d'une remise de 5 % contre un paiement comptant — à soumettre au client.",
];
const PROMESSES = [
  "Le gérant s'engage à régler la totalité par virement avant la fin de la semaine prochaine.",
  "Promesse de règlement par chèque, envoi annoncé sous 8 jours.",
  "Engagement écrit reçu : virement programmé au 10 du mois.",
];
const SUIVIS = [
  "SMS de rappel envoyé avec le récapitulatif de la facture.",
  "Relance téléphonique : paiement « en cours de validation » selon la comptabilité.",
  "Email de relance avec le relevé de compte joint.",
];

function pick<T>(list: T[], key: string): T {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

/** Historique plausible selon le statut, du plus ancien au plus récent. */
function historique(s: Spec, clientName: string, dueAge: number): Ev[] {
  const fin = s.settled ?? 0;
  const at = (f: number) => Math.round(s.age - (s.age - fin) * f);
  const ev: Ev[] = [];

  let precedent = "Nouveau";
  if (s.mail && s.email) {
    const [niveau, dernier] = s.mail;
    const premier = niveau === 2 ? dernier + 9 : dernier;
    ev.push(["email", `1re relance envoyée par email à ${s.email} — objet « Facture ${s.ref ?? "—"} — ${clientName} »`, premier]);
    if (niveau === 2) {
      ev.push(["email", `2e relance envoyée par email à ${s.email} — objet « Relance — facture ${s.ref ?? "—"} impayée depuis ${dueAge - dernier} jours »`, dernier]);
    }
    precedent = "Relancé par mail";
  }
  const passeA = (vers: DossierStatus, jours: number) => {
    ev.push(["statut", `Statut changé : ${precedent} → ${STATUS_LABELS[vers]}`, jours]);
    precedent = STATUS_LABELS[vers];
  };

  switch (s.status) {
    case "nouveau":
      if (!s.email) ev.push(["note", "Dossier reçu sans adresse email : coordonnées demandées au client.", at(0.3)]);
      break;
    case "relance_mail":
      break;
    case "en_relance":
      ev.push(["appel", pick(APPELS, s.id), at(0.55)]);
      passeA("en_relance", at(0.55));
      ev.push(["sms", pick(SUIVIS, s.id), at(0.85)]);
      break;
    case "en_negociation":
      ev.push(["appel", pick(APPELS, s.id), at(0.3)]);
      passeA("en_relance", at(0.3));
      ev.push(["appel", pick(NEGOCIATIONS, s.id), at(0.7)]);
      passeA("en_negociation", at(0.7));
      break;
    case "en_litige":
      ev.push(["courrier", "Lettre de relance envoyée avec copie de la facture et du bon d'intervention.", at(0.25)]);
      passeA("en_relance", at(0.25));
      ev.push(["courrier", "Contestation écrite reçue : le débiteur met en cause la prestation.", at(0.6)]);
      passeA("en_litige", at(0.6));
      ev.push(["note", "Pièces justificatives demandées au client (bon signé, photos, devis accepté).", at(0.8)]);
      break;
    case "promesse_reglement":
      ev.push(["appel", pick(APPELS, s.id), at(0.3)]);
      passeA("en_relance", at(0.3));
      ev.push(["appel", pick(PROMESSES, s.id), at(0.75)]);
      passeA("promesse_reglement", at(0.75));
      break;
    case "regle":
      ev.push(["appel", pick(APPELS, s.id), at(0.25)]);
      passeA("en_relance", at(0.25));
      ev.push(["appel", pick(PROMESSES, s.id), at(0.6)]);
      passeA("promesse_reglement", at(0.6));
      passeA("regle", fin);
      ev.push(["note", "Virement reçu sur le compte du client, dossier soldé.", fin]);
      break;
    case "perdu":
      ev.push(["courrier", "Mise en demeure envoyée en recommandé avec accusé de réception.", at(0.35)]);
      passeA("en_relance", at(0.35));
      ev.push(["note", "Société en liquidation judiciaire : créance déclarée auprès du mandataire, sans perspective de paiement.", at(0.8)]);
      passeA("perdu", at(0.8));
      break;
  }
  return ev;
}

function buildDossiers(clientNames: Record<string, string>, cascade: string): { dossiers: DbDossier[]; events: DbEvent[] } {
  const dossiers: DbDossier[] = [];
  const events: DbEvent[] = [];
  const nextDefaults = [-3, -1, 0, 2, 5, 9];
  for (const s of SPECS) {
    const dueAge = s.age + 15;
    const evs = s.events ?? [...historique(s, clientNames[s.client], dueAge), ...(s.extra ?? [])];
    evs.forEach(([type, description, jours], i) => {
      events.push({
        id: `${s.id}-e${i + 1}`,
        dossier_id: s.id,
        event_type: type,
        description,
        // Heures croissantes : deux actions du même jour restent dans l'ordre.
        created_at: ilYa(jours, 8 + i),
      });
    });
    const closed = CLOSED.includes(s.status);
    const next = closed ? null : s.next ?? (s.status === "nouveau" ? undefined : pick(nextDefaults, s.id));
    const lastActivity = Math.min(s.age, ...evs.map((e) => e[2]));
    dossiers.push({
      id: s.id,
      client_id: s.client,
      debtor_name: s.debtor,
      amount: s.amount,
      status: s.status,
      due_date: jourIlYa(dueAge),
      next_action_date: next == null ? null : jourIlYa(-next),
      notes: s.notes ?? null,
      debtor_phone: s.phone ?? null,
      debtor_email: s.email ?? null,
      invoice_reference: s.ref === undefined ? null : s.ref,
      invoice_date: jourIlYa(s.age + 45),
      import_batch_id: s.batch ?? null,
      mail_relance_level: s.mail?.[0] ?? 0,
      last_mail_relance_at: s.mail ? ilYa(s.mail[1], 9) : null,
      settled_at: s.settled === undefined ? null : ilYa(s.settled, 11),
      created_at: ilYa(s.age, 9),
      updated_at: ilYa(lastActivity, 17),
      deleted_at: s.deleted === undefined ? null : typeof s.deleted === "number" ? ilYa(s.deleted, 16) : cascade,
    });
  }
  return { dossiers, events };
}

// --- Jeu complet ---------------------------------------------------------------

export function seed(): Db {
  const cascade = ilYa(6, 15);
  const clients: DbClient[] = CLIENTS.map(([id, company_name, contact_name, contact_email, contact_phone, commission_rate, age]) => ({
    id,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    commission_rate,
    created_at: ilYa(age),
    deleted_at: id === "c-pressing" ? cascade : null,
  }));
  const names = Object.fromEntries(clients.map((c) => [c.id, c.company_name]));
  const { dossiers, events } = buildDossiers(names, cascade);

  return {
    users: [
      { id: "u-ariane", email: ADMIN_EMAIL, full_name: "Ariane Arçon", role: "admin", client_id: null, password: DEMO_PASSWORD, invite_token: null, invite_expires_at: null, last_login_at: ilYa(0, 8), created_at: ilYa(400) },
      { id: "u-clim", email: PORTAL_EMAIL, full_name: "Ludovic Nelson", role: "client", client_id: "c-clim", password: DEMO_PASSWORD, invite_token: null, invite_expires_at: null, last_login_at: ilYa(2, 18), created_at: ilYa(60) },
      { id: "u-creole", email: "laetitia@creole-evenements.example", full_name: "Laëtitia Ravin", role: "client", client_id: "c-creole", password: null, invite_token: PENDING_INVITE_TOKEN, invite_expires_at: ilYa(-5), last_login_at: null, created_at: ilYa(2, 14) },
    ],
    clients,
    dossiers,
    events,
    batches: [
      { id: "b-tle-1", client_id: "c-transports", filename: "Impayes_TLE_aout_2026.xlsx", rows_total: 7, rows_created: 5, rows_updated: 0, rows_skipped: 2, rows_missing_amount: 0, rows_lost: 0, rows_amount_adjusted: 0, rows_not_comparable: 0, reconciled: true, created_at: ilYa(38, 9) },
      { id: "b-tle-2", client_id: "c-transports", filename: "Impayes_TLE_septembre_2026.xlsx", rows_total: 6, rows_created: 1, rows_updated: 4, rows_skipped: 1, rows_missing_amount: 0, rows_lost: 1, rows_amount_adjusted: 1, rows_not_comparable: 0, reconciled: true, created_at: ilYa(9, 9) },
      { id: "b-daf-1", client_id: "c-distrib", filename: "releve_impayes_DAF_juillet.csv", rows_total: 3, rows_created: 2, rows_updated: 0, rows_skipped: 1, rows_missing_amount: 0, rows_lost: 0, rows_amount_adjusted: 0, rows_not_comparable: 0, reconciled: false, created_at: ilYa(52, 9) },
    ],
    changes: [
      { batch_id: "b-tle-2", dossier_id: "d-tle-01", field: "amount", old_value: "3480", new_value: "2480" },
      { batch_id: "b-tle-2", dossier_id: "d-tle-04", field: "debtor_phone", old_value: null, new_value: "0690 61 22 48" },
      { batch_id: "b-tle-2", dossier_id: "d-tle-03", field: "status", old_value: "en_relance", new_value: "perdu" },
    ],
    mappings: [
      {
        client_id: "c-transports",
        has_header: true,
        // Colonnes du fichier : N° Facture, Date facture, Client, Téléphone,
        // Email, Montant TTC, Reste dû, Ville.
        mapping: { debtor_name: 2, amount: 6, debtor_phone: [3], debtor_email: 4, invoice_reference: 0, invoice_date: 1 },
        updated_at: ilYa(9, 9),
      },
    ],
    templates: [1, 2].map((level) => ({
      level,
      subject: DEFAULT_TEMPLATES[level][0],
      body: DEFAULT_TEMPLATES[level][1],
      follow_up_enabled: true,
      follow_up_days: level === 1 ? 8 : 15,
      updated_at: ilYa(45),
    })),
    aiRules: [
      { id: "r-1", text: "Chaque ligne doit contenir un numéro de téléphone ou un email exploitable pour être relancée.", is_active: true, created_at: ilYa(20) },
      { id: "r-2", text: "Une ligne dont le montant est négatif est un avoir : ne pas créer de dossier, la signaler.", is_active: true, created_at: ilYa(18) },
      { id: "r-3", text: "Signaler les factures de plus de 2 ans : prescription commerciale à vérifier avant toute relance.", is_active: false, created_at: ilYa(11) },
    ],
  };
}
