// Jeu de données fictif de la démo WONDO : deux clubs inventés (SHIN Dojo,
// Dojo Karukera), leurs disciplines, élèves, instructeurs, cours, présences,
// abonnements, actualités et inscriptions en ligne. Aucune personne réelle,
// aucun e-mail réel (domaine réservé .example), aucun numéro attribué.
//
// Les lignes reprennent les tables du backend (backend/app/models.py), sous une
// forme normalisée et sérialisable en JSON : la fausse API (mock.ts) en tire les
// mêmes réponses que les routeurs FastAPI.
//
// Heures des cours : l'app affiche les instants dans le fuseau de l'appareil.
// Pour qu'un visiteur de métropole lise « 18:30 » là où le club de Guadeloupe
// l'annonce, les séances sont fabriquées dans le fuseau du navigateur. Seules la
// saison (1er sept – 15 juillet) et la date du jour suivent le fuseau du club.

export type Role = "student" | "coach" | "admin";
export type MembershipStatus = "pending" | "active" | "suspended" | "left";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type NewsVisibility = "public" | "dojo_members" | "role_only";
export type RegistrationStatus = "pending" | "accepted" | "rejected";

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_dev_admin: boolean;
  /** Mot de passe en clair : démo uniquement. Nul = compte jamais activé. */
  password: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileRow {
  user_id: string;
  birth_date: string | null;
  photo_file_id: string | null;
  gender: "male" | "female" | null;
  birth_place: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  landline_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
}

export interface DojoRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  brand_color: string | null;
  is_active: boolean;
  timezone: string;
}

export interface MembershipRow {
  id: string;
  dojo_id: string;
  user_id: string;
  role: Role;
  status: MembershipStatus;
  joined_at: string;
  left_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisciplineRow {
  id: string;
  dojo_id: string;
  name: string;
  description: string | null;
}

export interface GradeRow {
  id: string;
  discipline_id: string;
  name: string;
  color: string | null;
  rank: number;
}

export interface StudentGradeRow {
  membership_id: string;
  discipline_id: string;
  grade_id: string | null;
  obtained_at: string | null;
}

export interface TechniqueRow {
  id: string;
  dojo_id: string | null;
  discipline_id: string | null;
  name: string;
  description: string | null;
  required_grade_id: string | null;
  video_url: string | null;
}

export interface StudentTechniqueRow {
  membership_id: string;
  technique_id: string;
  validated: boolean;
  validated_at: string | null;
  validated_by_membership_id: string | null;
  notes: string | null;
}

export interface SlotRow {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface SeriesRow {
  id: string;
  dojo_id: string;
  discipline_id: string | null;
  coach_membership_id: string;
  title: string;
  description: string | null;
  min_grade_id: string | null;
  max_students: number;
  room: string | null;
  starts_on: string;
  ends_on: string;
  slots: SlotRow[];
  created_at: string;
}

export interface EnrollmentRow {
  id: string;
  series_id: string;
  student_membership_id: string;
  enrolled_at: string;
  cancelled_at: string | null;
}

export interface CourseRow {
  id: string;
  dojo_id: string;
  discipline_id: string | null;
  coach_membership_id: string;
  title: string;
  description: string | null;
  min_grade_id: string | null;
  max_students: number;
  start_time: string;
  end_time: string;
  room: string | null;
  is_cancelled: boolean;
  series_id: string | null;
}

export interface ReservationRow {
  id: string;
  course_id: string;
  student_membership_id: string;
  status: "reserved" | "cancelled" | "waitlisted";
  reserved_at: string;
  cancelled_at: string | null;
  series_enrollment_id: string | null;
}

export interface AttendanceRow {
  id: string;
  course_id: string;
  student_membership_id: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by_membership_id: string | null;
}

export interface PlanRow {
  id: string;
  dojo_id: string;
  discipline_id: string | null;
  name: string;
  description: string | null;
  price: number;
  registration_fee: number | null;
  duration_months: number;
  max_courses_per_week: number | null;
  is_active: boolean;
}

export interface SubscriptionRow {
  id: string;
  student_membership_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  subscription_id: string;
  amount: number;
  payment_status: PaymentStatus;
  provider: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface NewsRow {
  id: string;
  dojo_id: string;
  author_membership_id: string | null;
  title: string;
  content: string;
  image_url: string | null;
  visibility: NewsVisibility;
  target_role: Role | null;
  published_at: string | null;
  created_at: string;
}

export interface RegistrationRow {
  id: string;
  dojo_id: string;
  season: string;
  status: RegistrationStatus;
  last_name: string;
  first_name: string;
  gender: "male" | "female";
  birth_date: string;
  birth_place: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  mobile_phone: string;
  landline_phone: string | null;
  email: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  comments: string | null;
  photo_file_id: string | null;
  membership_id: string | null;
  processed_at: string | null;
  created_at: string;
  choices: { discipline_id: string; plan_id: string | null }[];
}

export interface Db {
  users: UserRow[];
  profiles: StudentProfileRow[];
  dojos: DojoRow[];
  memberships: MembershipRow[];
  disciplines: DisciplineRow[];
  grades: GradeRow[];
  studentGrades: StudentGradeRow[];
  techniques: TechniqueRow[];
  studentTechniques: StudentTechniqueRow[];
  series: SeriesRow[];
  enrollments: EnrollmentRow[];
  courses: CourseRow[];
  reservations: ReservationRow[];
  attendance: AttendanceRow[];
  plans: PlanRow[];
  subscriptions: SubscriptionRow[];
  payments: PaymentRow[];
  news: NewsRow[];
  registrations: RegistrationRow[];
}

// --- Comptes de démonstration ---------------------------------------------------

export const DEMO_PASSWORD = "demo";
export const EMAIL_ELEVE = "eleve@wondo.example";
export const EMAIL_INSTRUCTEUR = "instructeur@wondo.example";
export const EMAIL_ADMIN = "admin@wondo.example";
export const USER_ELEVE = "usr-lea";
export const USER_INSTRUCTEUR = "usr-thierry";
export const USER_ADMIN = "usr-sandrine";

/** Jeton de session de la démo : lisible, dérivé du compte. */
export const tokenFor = (userId: string) => `demo.${userId}`;

export const DOJO_TZ = "America/Guadeloupe";
/** Décalage fixe de la Guadeloupe (UTC-4, sans heure d'été). */
const GP_OFFSET_MS = -4 * 3_600_000;

// --- Dates ------------------------------------------------------------------------

const JOUR = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** "AAAA-MM-JJ" d'une date, lue dans le fuseau du navigateur. */
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date locale (minuit) d'une chaîne "AAAA-MM-JJ" — jamais new Date("AAAA-MM-JJ"), lu en UTC. */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "AAAA-MM-JJ" du jour en Guadeloupe. */
export function gpToday(now = Date.now()): string {
  const d = new Date(now + GP_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Année civile où commence la saison contenant `day` (bascule après le 15 juillet). */
export function seasonStartYear(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return m > 7 || (m === 7 && d > 15) ? y : y - 1;
}

export function seasonBounds(day: string): [string, string] {
  const y = seasonStartYear(day);
  return [`${y}-09-01`, `${y + 1}-07-15`];
}

export const seasonCode = (day: string) => `${seasonStartYear(day)}-${seasonStartYear(day) + 1}`;

/** Fin d'une formule de `months` mois démarrée le `start`, sans dépasser la saison (services/season.py). */
export function cappedToSeason(start: string, months: number): string {
  const [y, m, d] = start.split("-").map(Number);
  const total = m - 1 + months;
  const an = y + Math.floor(total / 12);
  const mois = (total % 12) + 1;
  const dernier = new Date(an, mois, 0).getDate();
  const naturelle = `${an}-${pad(mois)}-${pad(Math.min(d, dernier))}`;
  const fin = seasonBounds(start)[1];
  return naturelle < fin ? naturelle : fin;
}

/** Instant ISO à `jours` jours d'aujourd'hui (négatif = passé), à l'heure locale donnée. */
export function at(jours: number, heure = 10, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + jours);
  d.setHours(heure, minute, 0, 0);
  return d.toISOString();
}

/** "AAAA-MM-JJ" à `jours` jours d'aujourd'hui. */
export function dayAt(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return localDay(d);
}

/** 0 = lundi … 6 = dimanche, comme `date.weekday()` en Python. */
export const pyWeekday = (d: Date) => (d.getDay() + 6) % 7;

/**
 * Début et fin de chaque séance d'une série (services/course_series.py,
 * `occurrences`), heures des créneaux lues dans le fuseau du navigateur.
 */
export function occurrences(series: Pick<SeriesRow, "starts_on" | "ends_on" | "slots">): [string, string][] {
  const out: [string, string][] = [];
  const fin = parseDay(series.ends_on);
  for (let day = parseDay(series.starts_on); day <= fin; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    const slots = series.slots
      .filter((s) => s.weekday === pyWeekday(day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (const s of slots) {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm);
      let end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em);
      // Créneau qui franchit minuit : il finit le lendemain.
      if (end <= start) end = new Date(end.getTime() + JOUR);
      out.push([start.toISOString(), end.toISOString()]);
    }
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

export function countOccurrences(startsOn: string, endsOn: string, weekdays: number[]): number {
  if (endsOn < startsOn || weekdays.length === 0) return 0;
  let total = 0;
  const fin = parseDay(endsOn);
  for (let day = parseDay(startsOn); day <= fin; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    total += weekdays.filter((w) => w === pyWeekday(day)).length;
  }
  return total;
}

// Générateur pseudo-aléatoire à graine fixe : le jeu de données (présences,
// moyens de paiement) est le même à chaque ouverture de la démo.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Jeu de données -----------------------------------------------------------------

interface PersonSeed {
  key: string;
  first: string;
  last: string;
  email: string;
  phone: string | null;
  birth?: string;
  gender?: "male" | "female";
  joinedDaysAgo: number;
  /** Discipline → rang du grade (null = inscrit, pas encore gradé). */
  grades?: Record<string, number | null>;
  series?: string[];
  photo?: boolean;
  medical?: string;
  emergency?: [string, string];
  status?: MembershipStatus;
  notes?: string;
}

const COLORS = {
  blanc: "#f2f2f2",
  jaune: "#facc15",
  orange: "#f97316",
  vert: "#22c55e",
  bleu: "#3b82f6",
  violet: "#8b5cf6",
  marron: "#92400e",
  noir: "#1f1f1f",
};

export function seed(): Db {
  const now = Date.now();
  const today = gpToday(now);
  const [seasonStart, seasonEnd] = seasonBounds(today);
  const season = seasonCode(today);
  // Les séries couvrent la saison. En tout début de saison, ou entre deux
  // saisons, la période est élargie pour garder quelques semaines d'historique
  // et de cours à venir : une démo au planning vide ne montrerait rien.
  const todayLocal = localDay(new Date(now));
  const seriesStart = (parseDay(todayLocal).getTime() - parseDay(seasonStart).getTime()) / JOUR >= 21 ? seasonStart : dayAt(-28);
  const seriesEnd = (parseDay(seasonEnd).getTime() - parseDay(todayLocal).getTime()) / JOUR >= 42 ? seasonEnd : dayAt(56);
  const rand = prng(971);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];

  const db: Db = {
    users: [],
    profiles: [],
    dojos: [],
    memberships: [],
    disciplines: [],
    grades: [],
    studentGrades: [],
    techniques: [],
    studentTechniques: [],
    series: [],
    enrollments: [],
    courses: [],
    reservations: [],
    attendance: [],
    plans: [],
    subscriptions: [],
    payments: [],
    news: [],
    registrations: [],
  };
  let n = 0;
  const id = (prefix: string) => `${prefix}-${(++n).toString(36)}`;
  const daysAgoIso = (days: number, heure = 10) => at(-days, heure);

  // --- Clubs ---
  const shin: DojoRow = {
    id: "dojo-shin",
    name: "SHIN Dojo",
    slug: "shin-dojo",
    logo_url: "/demos/wondo/logo-shin-dojo.svg",
    address: "12 rue des Flamboyants",
    city: "Baie-Mahault",
    postal_code: "97122",
    country: "Guadeloupe",
    phone: "0590 00 00 01",
    email: "contact@shin-dojo.example",
    brand_color: "#e11d48",
    is_active: true,
    timezone: DOJO_TZ,
  };
  const karukera: DojoRow = {
    id: "dojo-karukera",
    name: "Dojo Karukera",
    slug: "dojo-karukera",
    logo_url: "/demos/wondo/logo-dojo-karukera.svg",
    address: "3 allée des Raisiniers",
    city: "Le Moule",
    postal_code: "97160",
    country: "Guadeloupe",
    phone: "0590 00 00 02",
    email: "contact@karukera.example",
    brand_color: "#0ea5e9",
    is_active: true,
    timezone: DOJO_TZ,
  };
  db.dojos.push(shin, karukera);

  // --- Disciplines et niveaux ---
  const discipline = (dojo: DojoRow, key: string, name: string, description: string, grades: [string, string | null][]) => {
    const d: DisciplineRow = { id: `dis-${key}`, dojo_id: dojo.id, name, description };
    db.disciplines.push(d);
    grades.forEach(([gname, color], rank) => db.grades.push({ id: `grd-${key}-${rank}`, discipline_id: d.id, name: gname, color, rank }));
    return d;
  };
  const judo = discipline(shin, "judo", "Judo", "Judo éducatif et sportif, enfants et adultes.", [
    ["Ceinture blanche", COLORS.blanc],
    ["Blanche-jaune", "#fde68a"],
    ["Ceinture jaune", COLORS.jaune],
    ["Jaune-orange", "#fdba74"],
    ["Ceinture orange", COLORS.orange],
    ["Orange-verte", "#86efac"],
    ["Ceinture verte", COLORS.vert],
    ["Ceinture bleue", COLORS.bleu],
    ["Ceinture marron", COLORS.marron],
    ["Ceinture noire", COLORS.noir],
  ]);
  const karate = discipline(shin, "karate", "Karaté", "Karaté shotokan : kihon, kata et kumite.", [
    ["Ceinture blanche", COLORS.blanc],
    ["Ceinture jaune", COLORS.jaune],
    ["Ceinture orange", COLORS.orange],
    ["Ceinture verte", COLORS.vert],
    ["Ceinture bleue", COLORS.bleu],
    ["Ceinture marron", COLORS.marron],
    ["Ceinture noire", COLORS.noir],
  ]);
  const jjb = discipline(shin, "jjb", "Jiu-jitsu brésilien", "Combat au sol, avec et sans kimono.", [
    ["Ceinture blanche", COLORS.blanc],
    ["Ceinture bleue", COLORS.bleu],
    ["Ceinture violette", COLORS.violet],
    ["Ceinture marron", COLORS.marron],
    ["Ceinture noire", COLORS.noir],
  ]);
  // Sans niveaux : l'app doit alors taire toute notion de grade.
  const selfDef = discipline(shin, "self", "Self-défense", "Techniques simples de protection, ouvert à tous.", []);
  const aikido = discipline(karukera, "aikido", "Aïkido", "Aïkido traditionnel, tous niveaux.", [
    ["6e kyu", null],
    ["5e kyu", null],
    ["4e kyu", null],
    ["3e kyu", null],
    ["2e kyu", null],
    ["1er kyu", null],
    ["Shodan", COLORS.noir],
  ]);
  const disciplinesByKey: Record<string, DisciplineRow> = { judo, karate, jjb, self: selfDef, aikido };
  const gradeId = (key: string, rank: number) => `grd-${key}-${rank}`;

  // --- Techniques (référentiel du club, par niveau requis) ---
  const techniques: [string, string, number | null, string][] = [
    ["judo", "O-goshi", 0, "Grande projection de hanche."],
    ["judo", "Kesa-gatame", 0, "Immobilisation en écharpe."],
    ["judo", "O-soto-gari", 1, "Grand fauchage extérieur."],
    ["judo", "Ippon-seoi-nage", 2, "Projection par-dessus l'épaule."],
    ["judo", "Tai-otoshi", 3, "Renversement du corps."],
    ["judo", "Uchi-mata", 5, "Fauchage par l'intérieur de la cuisse."],
    ["judo", "Juji-gatame", 6, "Clé de bras en croix."],
    ["judo", "Tomoe-nage", 7, "Projection en cercle, sacrifice arrière."],
    ["karate", "Oi-zuki", 0, "Coup de poing en avançant."],
    ["karate", "Mae-geri", 0, "Coup de pied de face."],
    ["karate", "Heian shodan", 1, "Premier kata de la série Heian."],
    ["karate", "Mawashi-geri", 2, "Coup de pied circulaire."],
    ["karate", "Heian nidan", 2, "Deuxième kata Heian."],
    ["karate", "Ura-mawashi-geri", 4, "Coup de pied circulaire inversé."],
    ["karate", "Bassai dai", 5, "Kata de la forteresse."],
    ["jjb", "Fuite de hanche (shrimp)", 0, "Déplacement de base au sol."],
    ["jjb", "Garde fermée", 0, "Contrôle depuis le dos."],
    ["jjb", "Balayage ciseaux", 0, "Renversement depuis la garde fermée."],
    ["jjb", "Clé de bras depuis la garde", 1, "Armlock classique."],
    ["jjb", "Triangle", 1, "Étranglement avec les jambes."],
    ["jjb", "Passage de garde toreando", 2, "Contourner les jambes du partenaire."],
    ["self", "Dégagement de saisie de poignet", null, "Se libérer par le pouce."],
    ["self", "Chute arrière", null, "Tomber sans se blesser."],
    ["self", "Distance de sécurité", null, "Garder l'espace, parler fort."],
    ["self", "Défense contre étranglement de face", null, "Rompre la saisie et sortir."],
    ["aikido", "Ikkyo", 0, "Premier principe d'immobilisation."],
    ["aikido", "Shiho-nage", 1, "Projection dans les quatre directions."],
    ["aikido", "Irimi-nage", 2, "Projection en entrant."],
    ["aikido", "Kote-gaeshi", 3, "Retournement du poignet."],
  ];
  for (const [key, name, rank, description] of techniques) {
    const d = disciplinesByKey[key];
    db.techniques.push({
      id: id("tec"),
      dojo_id: d.dojo_id,
      discipline_id: d.id,
      name,
      description,
      required_grade_id: rank === null ? null : gradeId(key, rank),
      video_url: null,
    });
  }

  // --- Personnes ---
  const addUser = (key: string, first: string, last: string, email: string, phone: string | null, createdDaysAgo: number) => {
    const u: UserRow = {
      id: `usr-${key}`,
      first_name: first,
      last_name: last,
      email,
      phone,
      avatar_url: null,
      is_active: true,
      is_dev_admin: false,
      password: DEMO_PASSWORD,
      created_at: daysAgoIso(createdDaysAgo),
      updated_at: daysAgoIso(createdDaysAgo),
    };
    db.users.push(u);
    return u;
  };
  const addProfile = (userId: string, p: Partial<StudentProfileRow> = {}) => {
    db.profiles.push({
      user_id: userId,
      birth_date: null,
      photo_file_id: null,
      gender: null,
      birth_place: null,
      address: null,
      postal_code: null,
      city: null,
      landline_phone: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_notes: null,
      ...p,
    });
  };
  const addMembership = (dojo: DojoRow, userId: string, role: Role, joinedDaysAgo: number, status: MembershipStatus = "active", notes: string | null = null) => {
    const m: MembershipRow = {
      id: `mbr-${userId.slice(4)}-${role}${dojo === karukera ? "-k" : ""}`,
      dojo_id: dojo.id,
      user_id: userId,
      role,
      status,
      joined_at: daysAgoIso(joinedDaysAgo, 9),
      left_at: null,
      notes,
      created_at: daysAgoIso(joinedDaysAgo, 9),
      updated_at: daysAgoIso(joinedDaysAgo, 9),
    };
    db.memberships.push(m);
    return m;
  };

  // Encadrement. L'admin de la démo est aussi instructrice de judo (deux vues)
  // et administre un second club (changement de club) ; l'instructeur de la
  // démo s'entraîne lui-même en jiu-jitsu brésilien (vue élève).
  const sandrine = addUser("sandrine", "Sandrine", "Delmas", EMAIL_ADMIN, "0690 00 10 01", 2200);
  const thierry = addUser("thierry", "Thierry", "Lambert", EMAIL_INSTRUCTEUR, "0690 00 10 02", 1500);
  const laura = addUser("laura", "Laura", "Céleste", "laura.celeste@mail.example", "0690 00 10 03", 900);
  const jeanMarc = addUser("jeanmarc", "Jean-Marc", "Ravel", "jm.ravel@mail.example", "0690 00 10 04", 1900);
  const patrick = addUser("patrick", "Patrick", "Siméon", "patrick.simeon@mail.example", "0690 00 10 05", 1200);
  const admShin = addMembership(shin, sandrine.id, "admin", 2200);
  const coachSandrine = addMembership(shin, sandrine.id, "coach", 2200);
  addMembership(karukera, sandrine.id, "admin", 400);
  const coachThierry = addMembership(shin, thierry.id, "coach", 1500);
  const coachLaura = addMembership(shin, laura.id, "coach", 900);
  const coachJeanMarc = addMembership(shin, jeanMarc.id, "coach", 1900);
  const coachPatrick = addMembership(karukera, patrick.id, "coach", 1200);

  // --- Formules ---
  const plan = (dojo: DojoRow, key: string, name: string, price: number, fee: number | null, months: number, extra: Partial<PlanRow> = {}) => {
    const p: PlanRow = {
      id: `pln-${key}`,
      dojo_id: dojo.id,
      discipline_id: null,
      name,
      description: null,
      price,
      registration_fee: fee,
      duration_months: months,
      max_courses_per_week: null,
      is_active: true,
      ...extra,
    };
    db.plans.push(p);
    return p;
  };
  const annuelAdulte = plan(shin, "annuel-adulte", "Annuel adulte", 260, 70, 12, { description: "Accès à tous les cours adultes de la saison." });
  const annuelEnfant = plan(shin, "annuel-enfant", "Annuel enfant", 200, 50, 12, { description: "Moins de 14 ans, cours enfants de la saison." });
  const trimestre = plan(shin, "trimestre", "Trimestre", 95, null, 3, { description: "Trois mois, sans frais d'inscription." });
  const mensuel = plan(shin, "mensuel", "Mensuel", 35, null, 1, { description: "Pour essayer, sans engagement." });
  const planSelf = plan(shin, "self", "Self-défense (1 cours/sem.)", 150, 30, 12, { discipline_id: selfDef.id, max_courses_per_week: 1 });
  plan(shin, "ancien", "Annuel (ancien tarif)", 240, 60, 12, { is_active: false });
  const annuelAikido = plan(karukera, "aikido", "Annuel aïkido", 220, 50, 12);

  // --- Cours récurrents de la saison ---
  const addSeries = (key: string, dojo: DojoRow, d: DisciplineRow, coach: MembershipRow, title: string, max: number, room: string, slots: [number, string, string][], minGrade: string | null = null, description: string | null = null) => {
    const s: SeriesRow = {
      id: `ser-${key}`,
      dojo_id: dojo.id,
      discipline_id: d.id,
      coach_membership_id: coach.id,
      title,
      description,
      min_grade_id: minGrade,
      max_students: max,
      room,
      starts_on: seriesStart,
      ends_on: seriesEnd,
      slots: slots.map(([weekday, start, end], i) => ({ id: `slt-${key}-${i}`, weekday, start_time: `${start}:00`, end_time: `${end}:00` })),
      created_at: at(-40),
    };
    db.series.push(s);
    for (const [start, end] of occurrences(s)) {
      db.courses.push({
        id: id("crs"),
        dojo_id: dojo.id,
        discipline_id: d.id,
        coach_membership_id: coach.id,
        title,
        description,
        min_grade_id: minGrade,
        max_students: max,
        start_time: start,
        end_time: end,
        room,
        is_cancelled: false,
        series_id: s.id,
      });
    }
    return s;
  };
  addSeries("judo-enfants", shin, judo, coachJeanMarc, "Judo enfants", 10, "Tatami principal", [[2, "14:00", "15:00"], [5, "10:00", "11:00"]], null, "6-12 ans. Kimono obligatoire.");
  addSeries("judo-adultes", shin, judo, coachSandrine, "Judo adultes", 12, "Tatami principal", [[1, "18:30", "20:00"], [3, "18:30", "20:00"]]);
  addSeries("karate", shin, karate, coachThierry, "Karaté", 10, "Salle 2", [[0, "18:00", "19:30"], [4, "18:00", "19:30"]]);
  addSeries("karate-compet", shin, karate, coachThierry, "Karaté compétition", 6, "Salle 2", [[3, "20:00", "21:00"]], gradeId("karate", 3), "Préparation aux compétitions régionales.");
  addSeries("jjb", shin, jjb, coachLaura, "Jiu-jitsu brésilien", 10, "Tatami principal", [[1, "20:00", "21:30"], [5, "11:30", "13:00"]]);
  addSeries("self", shin, selfDef, coachThierry, "Self-défense", 8, "Salle 2", [[2, "19:00", "20:00"]]);
  addSeries("aikido", karukera, aikido, coachPatrick, "Aïkido", 8, "Dojo", [[0, "19:00", "20:30"], [3, "19:00", "20:30"]]);

  // Séances à l'unité, hors série : portes ouvertes passées, stage à venir.
  const portesOuvertes: CourseRow = {
    id: id("crs"), dojo_id: shin.id, discipline_id: null, coach_membership_id: coachSandrine.id,
    title: "Portes ouvertes", description: "Découverte de toutes les disciplines du club.", min_grade_id: null,
    max_students: 40, start_time: at(-19, 9), end_time: at(-19, 12), room: "Tatami principal", is_cancelled: false, series_id: null,
  };
  const stage: CourseRow = {
    id: id("crs"), dojo_id: shin.id, discipline_id: judo.id, coach_membership_id: coachSandrine.id,
    title: "Stage régional de judo", description: "Stage ouvert aux ceintures jaunes et plus, avec un intervenant invité.",
    min_grade_id: gradeId("judo", 2), max_students: 30, start_time: at(16, 14), end_time: at(16, 17), room: "Hall des sports", is_cancelled: false, series_id: null,
  };
  db.courses.push(portesOuvertes, stage);
  db.courses.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Une séance de karaté annulée la semaine prochaine (réservations conservées).
  const annulee = db.courses.find((c) => c.series_id === "ser-karate" && Date.parse(c.start_time) > now + 5 * JOUR);
  if (annulee) annulee.is_cancelled = true;

  // --- Élèves ---
  const students: PersonSeed[] = [
    { key: "lea", first: "Léa", last: "Dorville", email: EMAIL_ELEVE, phone: "0690 00 20 01", birth: "1998-04-12", gender: "female", joinedDaysAgo: 760, grades: { judo: 6, self: null }, series: ["judo-adultes", "self"], photo: true, medical: "Asthme léger : ventoline dans son sac.", emergency: ["Marc Dorville", "0690 00 30 01"] },
    { key: "noah", first: "Noah", last: "Bérard", email: "famille.berard@mail.example", phone: "0690 00 20 02", birth: "2016-06-03", gender: "male", joinedDaysAgo: 400, grades: { judo: 2 }, series: ["judo-enfants"], emergency: ["Nadia Bérard", "0690 00 30 02"] },
    { key: "emma", first: "Emma", last: "Jean-Baptiste", email: "emma.jb@mail.example", phone: "0690 00 20 03", birth: "2001-11-20", gender: "female", joinedDaysAgo: 600, grades: { karate: 2 }, series: ["karate"], photo: true },
    { key: "lucas", first: "Lucas", last: "Gervais", email: "lucas.gervais@mail.example", phone: "0690 00 20 04", birth: "1994-02-08", gender: "male", joinedDaysAgo: 1700, grades: { judo: 8 }, series: ["judo-adultes"] },
    { key: "chloe", first: "Chloé", last: "Ramassamy", email: "chloe.ramassamy@mail.example", phone: "0690 00 20 05", birth: "1999-09-15", gender: "female", joinedDaysAgo: 820, grades: { karate: 3, self: null }, series: ["karate", "karate-compet", "self"], photo: true },
    { key: "hugo", first: "Hugo", last: "Lebon", email: "hugo.lebon@mail.example", phone: "0690 00 20 06", birth: "1990-07-30", gender: "male", joinedDaysAgo: 500, grades: { jjb: 1 }, series: ["jjb"] },
    { key: "jade", first: "Jade", last: "Nicolas", email: "famille.nicolas@mail.example", phone: "0690 00 20 07", birth: "2017-01-25", gender: "female", joinedDaysAgo: 380, grades: { judo: 1 }, series: ["judo-enfants"], photo: true },
    { key: "enzo", first: "Enzo", last: "Cabrera", email: "enzo.cabrera@mail.example", phone: "0690 00 20 08", birth: "1987-05-17", gender: "male", joinedDaysAgo: 1100, grades: { jjb: 2 }, series: ["jjb"] },
    { key: "manon", first: "Manon", last: "Thésée", email: "manon.thesee@mail.example", phone: "0690 00 20 09", birth: "2003-03-09", gender: "female", joinedDaysAgo: 900, grades: { judo: 7, jjb: 0 }, series: ["judo-adultes", "jjb"], photo: true },
    { key: "tom", first: "Tom", last: "Valentin", email: "famille.valentin@mail.example", phone: "0690 00 20 10", birth: "2015-10-11", gender: "male", joinedDaysAgo: 720, grades: { judo: 4 }, series: ["judo-enfants"] },
    { key: "camille", first: "Camille", last: "Rosier", email: "camille.rosier@mail.example", phone: "0690 00 20 11", birth: "1996-12-02", gender: "female", joinedDaysAgo: 26, grades: { self: null }, series: ["self"] },
    { key: "nathan", first: "Nathan", last: "Dubois", email: "famille.dubois@mail.example", phone: "0690 00 20 12", birth: "2012-08-21", gender: "male", joinedDaysAgo: 330, grades: { karate: 1 }, series: ["karate"] },
    { key: "sarah", first: "Sarah", last: "Mondésir", email: "sarah.mondesir@mail.example", phone: "0690 00 20 13", birth: "1992-04-28", gender: "female", joinedDaysAgo: 1300, grades: { karate: 4 }, series: ["karate", "karate-compet"], photo: true },
    { key: "mael", first: "Maël", last: "Bouchaud", email: "famille.bouchaud@mail.example", phone: "0690 00 20 14", birth: "2018-05-06", gender: "male", joinedDaysAgo: 24, grades: { judo: 0 }, series: ["judo-enfants"] },
    { key: "ines", first: "Inès", last: "Laurent", email: "ines.laurent@mail.example", phone: "0690 00 20 15", birth: "2005-02-14", gender: "female", joinedDaysAgo: 20, grades: { jjb: 0 }, series: ["jjb"] },
    { key: "yanis", first: "Yanis", last: "Coco", email: "yanis.coco@mail.example", phone: "0690 00 20 16", birth: "1985-09-03", gender: "male", joinedDaysAgo: 2400, grades: { judo: 9 }, series: ["judo-adultes"], notes: "Aide Sandrine sur le cours adultes du jeudi." },
    { key: "zoe", first: "Zoé", last: "Fontaine", email: "famille.fontaine@mail.example", phone: "0690 00 20 17", birth: "2014-07-19", gender: "female", joinedDaysAgo: 450, grades: { karate: 2 }, series: ["karate"], photo: true },
    { key: "gabriel", first: "Gabriel", last: "Alexis", email: "gabriel.alexis@mail.example", phone: "0690 00 20 18", birth: "2000-01-31", gender: "male", joinedDaysAgo: 11, grades: { jjb: 1, self: null }, series: ["jjb", "self"] },
    { key: "lina", first: "Lina", last: "Bernier", email: "famille.bernier@mail.example", phone: "0690 00 20 19", birth: "2013-11-08", gender: "female", joinedDaysAgo: 700, grades: { judo: 3 }, series: ["judo-enfants"] },
    { key: "maxime", first: "Maxime", last: "Hoarau", email: "maxime.hoarau@mail.example", phone: "0690 00 20 20", birth: "1997-06-24", gender: "male", joinedDaysAgo: 1000, grades: { karate: 5 }, status: "suspended", notes: "Suspendu : chèque de septembre refusé, en attente de régularisation." },
  ];
  const karukeraStudents: PersonSeed[] = [
    { key: "aurelie", first: "Aurélie", last: "Pineau", email: "aurelie.pineau@mail.example", phone: "0690 00 40 01", birth: "1991-03-03", gender: "female", joinedDaysAgo: 380, grades: { aikido: 2 }, series: ["aikido"] },
    { key: "david", first: "David", last: "Moutou", email: "david.moutou@mail.example", phone: "0690 00 40 02", birth: "1979-10-10", gender: "male", joinedDaysAgo: 390, grades: { aikido: 4 }, series: ["aikido"] },
    { key: "jessica", first: "Jessica", last: "Rémy", email: "jessica.remy@mail.example", phone: "0690 00 40 03", birth: "2002-06-21", gender: "female", joinedDaysAgo: 15, grades: { aikido: 0 }, series: ["aikido"] },
    { key: "frederic", first: "Frédéric", last: "Agathe", email: "frederic.agathe@mail.example", phone: "0690 00 40 04", birth: "1968-01-12", gender: "male", joinedDaysAgo: 395, grades: { aikido: 5 }, series: ["aikido"] },
  ];

  const memberships: Record<string, MembershipRow> = {};
  const addStudent = (dojo: DojoRow, p: PersonSeed) => {
    const u = addUser(p.key, p.first, p.last, p.email, p.phone, p.joinedDaysAgo + 3);
    addProfile(u.id, {
      birth_date: p.birth ?? null,
      gender: p.gender ?? null,
      photo_file_id: p.photo ? `avatar-${p.key}` : null,
      address: "Adresse fictive",
      postal_code: dojo.postal_code,
      city: dojo.city,
      emergency_contact_name: p.emergency?.[0] ?? null,
      emergency_contact_phone: p.emergency?.[1] ?? null,
      medical_notes: p.medical ?? null,
    });
    const m = addMembership(dojo, u.id, "student", p.joinedDaysAgo, p.status ?? "active", p.notes ?? null);
    memberships[p.key] = m;
    for (const [key, rank] of Object.entries(p.grades ?? {})) {
      db.studentGrades.push({
        membership_id: m.id,
        discipline_id: disciplinesByKey[key].id,
        grade_id: rank === null ? null : gradeId(key, rank),
        // Un niveau obtenu après l'arrivée au club, quelques mois avant aujourd'hui.
        obtained_at: rank === null ? null : daysAgoIso(Math.min(p.joinedDaysAgo, 60 + ((rank * 37) % 200)), 11),
      });
    }
    return m;
  };
  for (const p of students) addStudent(shin, p);
  for (const p of karukeraStudents) addStudent(karukera, p);

  // L'instructeur de la démo est aussi élève (jiu-jitsu brésilien) dans son club.
  const thierryEleve = addMembership(shin, thierry.id, "student", 700);
  addProfile(thierry.id, { birth_date: "1983-08-14", gender: "male", emergency_contact_name: "Sophie Lambert", emergency_contact_phone: "0690 00 30 20" });
  memberships.thierry = thierryEleve;
  db.studentGrades.push({ membership_id: thierryEleve.id, discipline_id: jjb.id, grade_id: gradeId("jjb", 1), obtained_at: daysAgoIso(150, 11) });

  // --- Inscriptions permanentes et réservations des séances ---
  const enroll = (seriesKey: string, m: MembershipRow) => {
    const e: EnrollmentRow = {
      id: id("enr"),
      series_id: `ser-${seriesKey}`,
      student_membership_id: m.id,
      enrolled_at: Date.parse(m.joined_at) > Date.parse(at(-40)) ? m.joined_at : at(-35, 9),
      cancelled_at: null,
    };
    db.enrollments.push(e);
    return e;
  };
  const enrollAll: [string, MembershipRow][] = [];
  for (const p of [...students, ...karukeraStudents]) {
    if ((p.status ?? "active") !== "active") continue;
    for (const s of p.series ?? []) enrollAll.push([s, memberships[p.key]]);
  }
  enrollAll.push(["jjb", thierryEleve]);
  for (const [seriesKey, m] of enrollAll) {
    const e = enroll(seriesKey, m);
    for (const c of db.courses) {
      if (c.series_id !== e.series_id || c.start_time < e.enrolled_at) continue;
      db.reservations.push({
        id: id("res"),
        course_id: c.id,
        student_membership_id: m.id,
        status: "reserved",
        reserved_at: e.enrolled_at,
        cancelled_at: null,
        series_enrollment_id: e.id,
      });
    }
  }
  // Réservations à l'unité : le stage et les portes ouvertes.
  for (const key of ["lea", "lucas", "manon", "yanis", "lina"]) {
    db.reservations.push({ id: id("res"), course_id: stage.id, student_membership_id: memberships[key].id, status: "reserved", reserved_at: at(-4, 19), cancelled_at: null, series_enrollment_id: null });
  }
  for (const key of ["camille", "mael", "ines", "gabriel", "noah", "lea"]) {
    db.reservations.push({ id: id("res"), course_id: portesOuvertes.id, student_membership_id: memberships[key].id, status: "reserved", reserved_at: at(-25, 19), cancelled_at: null, series_enrollment_id: null });
  }
  // Léa a annulé une séance à venir sans quitter la série.
  const leaAnnule = db.reservations.find((r) => {
    const c = db.courses.find((x) => x.id === r.course_id);
    return r.student_membership_id === memberships.lea.id && c?.series_id === "ser-judo-adultes" && Date.parse(c.start_time) > now + 6 * JOUR;
  });
  if (leaAnnule) {
    leaAnnule.status = "cancelled";
    leaAnnule.cancelled_at = at(-1, 21);
  }

  // --- Présences des séances passées ---
  // Les séances terminées depuis moins de deux jours restent à pointer : c'est
  // ce que l'instructeur trouve en ouvrant la feuille d'appel.
  const coachOf = new Map(db.courses.map((c) => [c.id, c.coach_membership_id]));
  const courseById = new Map(db.courses.map((c) => [c.id, c]));
  for (const r of db.reservations) {
    const c = courseById.get(r.course_id)!;
    if (r.status !== "reserved" || c.is_cancelled) continue;
    const end = Date.parse(c.end_time);
    if (end > now - 2 * JOUR) continue;
    // L'élève de la démo est assidue : sa fiche montre un bon taux de présence.
    const x = r.student_membership_id === memberships.lea.id ? rand() * 0.9 : rand();
    const status: AttendanceStatus = x < 0.8 ? "present" : x < 0.87 ? "late" : x < 0.95 ? "absent" : "excused";
    db.attendance.push({
      id: id("att"),
      course_id: c.id,
      student_membership_id: r.student_membership_id,
      status,
      notes: status === "excused" ? "Prévenu par message." : null,
      recorded_by_membership_id: coachOf.get(c.id) ?? null,
    });
  }

  // --- Techniques validées : celles des niveaux déjà atteints ---
  const gradeById = new Map(db.grades.map((g) => [g.id, g]));
  for (const sg of db.studentGrades) {
    const m = db.memberships.find((x) => x.id === sg.membership_id)!;
    const rank = sg.grade_id ? gradeById.get(sg.grade_id)!.rank : -1;
    const coach = db.series.find((s) => s.discipline_id === sg.discipline_id)?.coach_membership_id ?? null;
    for (const t of db.techniques.filter((t) => t.discipline_id === sg.discipline_id)) {
      const required = t.required_grade_id ? gradeById.get(t.required_grade_id)!.rank : 0;
      // Discipline sans niveaux : la moitié des techniques, pour montrer l'avancement.
      const validated = t.required_grade_id ? required <= rank : rand() < 0.5;
      if (!validated) continue;
      db.studentTechniques.push({
        membership_id: m.id,
        technique_id: t.id,
        validated: true,
        validated_at: daysAgoIso(Math.min(Math.round((Date.now() - Date.parse(m.joined_at)) / JOUR), 30 + Math.round(rand() * 300)), 20),
        validated_by_membership_id: coach,
        notes: null,
      });
    }
  }

  // --- Abonnements et paiements ---
  const providers = ["Chèque", "Espèces", "Virement", "Carte bancaire"];
  const subscribe = (m: MembershipRow, p: PlanRow, startDaysAgo: number, status: SubscriptionStatus, payments: [number, number, PaymentStatus][] = []) => {
    const startDay = dayAt(-startDaysAgo);
    const s: SubscriptionRow = {
      id: id("sub"),
      student_membership_id: m.id,
      plan_id: p.id,
      status,
      started_at: at(-startDaysAgo, 11),
      expires_at: `${cappedToSeason(startDay, p.duration_months)}T23:59:59.000Z`,
      cancelled_at: null,
      created_at: at(-startDaysAgo, 11),
    };
    db.subscriptions.push(s);
    for (const [amount, daysAgo, pstatus] of payments) {
      // Encaissé aujourd'hui : plus tôt dans la journée, jamais dans le futur ni la veille.
      const startOfToday = parseDay(localDay(new Date(now))).getTime();
      const paidAt = daysAgo === 0 ? new Date(Math.min(now - 5_000, Math.max(startOfToday + 60_000, now - 2 * 3_600_000))).toISOString() : at(-daysAgo, 17);
      db.payments.push({
        id: id("pay"),
        subscription_id: s.id,
        amount,
        payment_status: pstatus,
        // Une échéance à venir n'a encore ni moyen de paiement ni date d'encaissement.
        provider: pstatus === "pending" ? null : pick(providers),
        transaction_id: null,
        paid_at: pstatus === "paid" ? paidAt : null,
        created_at: pstatus === "paid" ? paidAt : s.created_at,
      });
    }
    return s;
  };
  const full = (p: PlanRow) => p.price + (p.registration_fee ?? 0);
  // Rentrée = début des séries : les abonnements de la saison y sont datés.
  const daysSinceSeason = Math.round((now - parseDay(seriesStart).getTime()) / JOUR);
  // Saison passée (avril-juin) : de quoi donner un historique au graphique des recettes.
  subscribe(memberships.lucas, trimestre, daysSinceSeason + 150, "expired", [[95, daysSinceSeason + 150, "paid"]]);
  subscribe(memberships.sarah, trimestre, daysSinceSeason + 140, "expired", [[95, daysSinceSeason + 140, "paid"]]);
  subscribe(memberships.enzo, mensuel, daysSinceSeason + 120, "expired", [[35, daysSinceSeason + 120, "paid"]]);
  subscribe(memberships.enzo, mensuel, daysSinceSeason + 90, "expired", [[35, daysSinceSeason + 90, "paid"]]);
  subscribe(memberships.hugo, trimestre, daysSinceSeason + 100, "expired", [[95, daysSinceSeason + 100, "paid"]]);
  subscribe(memberships.emma, mensuel, daysSinceSeason + 75, "expired", [[35, daysSinceSeason + 75, "paid"]]);
  subscribe(memberships.yanis, mensuel, daysSinceSeason + 60, "expired", [[35, daysSinceSeason + 60, "paid"]]);
  subscribe(memberships.chloe, trimestre, daysSinceSeason + 145, "expired", [[95, daysSinceSeason + 145, "paid"]]);
  subscribe(memberships.manon, trimestre, daysSinceSeason + 130, "expired", [[95, daysSinceSeason + 130, "paid"]]);
  subscribe(memberships.tom, trimestre, daysSinceSeason + 125, "expired", [[95, daysSinceSeason + 125, "paid"]]);
  subscribe(memberships.zoe, trimestre, daysSinceSeason + 110, "expired", [[95, daysSinceSeason + 110, "paid"]]);
  subscribe(memberships.lina, mensuel, daysSinceSeason + 95, "expired", [[35, daysSinceSeason + 95, "paid"]]);
  subscribe(memberships.lucas, mensuel, daysSinceSeason + 85, "expired", [[35, daysSinceSeason + 85, "paid"]]);
  subscribe(memberships.sarah, mensuel, daysSinceSeason + 80, "expired", [[35, daysSinceSeason + 80, "paid"]]);
  subscribe(memberships.yanis, mensuel, daysSinceSeason + 70, "expired", [[35, daysSinceSeason + 70, "paid"]]);
  // Saison en cours : réinscriptions dès fin août, rentrée en septembre.
  subscribe(memberships.lea, annuelAdulte, daysSinceSeason - 4, "active", [[130, daysSinceSeason - 4, "paid"], [100, -30, "pending"], [100, -91, "pending"]]);
  subscribe(memberships.lea, planSelf, daysSinceSeason - 4, "active", [[full(planSelf), daysSinceSeason - 4, "paid"]]);
  subscribe(memberships.noah, annuelEnfant, daysSinceSeason + 8, "active", [[full(annuelEnfant), daysSinceSeason + 8, "paid"]]);
  subscribe(memberships.emma, annuelAdulte, daysSinceSeason - 2, "active", [[full(annuelAdulte), daysSinceSeason - 2, "paid"]]);
  subscribe(memberships.lucas, annuelAdulte, daysSinceSeason + 10, "active", [[full(annuelAdulte), daysSinceSeason + 10, "paid"]]);
  subscribe(memberships.chloe, annuelAdulte, daysSinceSeason - 1, "active", [[110, daysSinceSeason - 1, "paid"], [110, 0, "paid"], [110, -61, "pending"]]);
  subscribe(memberships.hugo, annuelAdulte, daysSinceSeason - 3, "active", [[full(annuelAdulte), daysSinceSeason - 3, "paid"]]);
  subscribe(memberships.jade, annuelEnfant, daysSinceSeason - 5, "active", [[full(annuelEnfant), daysSinceSeason - 5, "paid"]]);
  subscribe(memberships.enzo, annuelAdulte, daysSinceSeason + 5, "active", [[full(annuelAdulte), daysSinceSeason + 5, "paid"]]);
  subscribe(memberships.manon, annuelAdulte, daysSinceSeason - 2, "active", [[full(annuelAdulte), daysSinceSeason - 2, "paid"]]);
  subscribe(memberships.tom, annuelEnfant, daysSinceSeason - 6, "active", [[125, daysSinceSeason - 6, "paid"], [125, 3, "paid"]]);
  subscribe(memberships.camille, planSelf, 26, "active", [[full(planSelf), 25, "paid"]]);
  subscribe(memberships.nathan, annuelEnfant, daysSinceSeason - 8, "active", [[full(annuelEnfant), daysSinceSeason - 8, "paid"]]);
  subscribe(memberships.sarah, annuelAdulte, daysSinceSeason + 6, "active", [[full(annuelAdulte), daysSinceSeason + 6, "paid"]]);
  subscribe(memberships.mael, annuelEnfant, 24, "active", [[full(annuelEnfant), 22, "paid"]]);
  subscribe(memberships.ines, trimestre, 20, "active", [[95, 20, "paid"]]);
  subscribe(memberships.yanis, annuelAdulte, daysSinceSeason - 3, "active", [[full(annuelAdulte), daysSinceSeason - 3, "paid"]]);
  subscribe(memberships.zoe, annuelEnfant, daysSinceSeason - 7, "active", [[full(annuelEnfant), daysSinceSeason - 7, "paid"]]);
  // Inscrit en ligne il y a peu : abonnement ouvert par la validation, pas encore réglé.
  subscribe(memberships.gabriel, annuelAdulte, 11, "pending");
  subscribe(memberships.lina, annuelEnfant, daysSinceSeason - 9, "active", [[full(annuelEnfant), daysSinceSeason - 9, "paid"]]);
  subscribe(memberships.maxime, annuelAdulte, daysSinceSeason + 2, "pending", [[full(annuelAdulte), daysSinceSeason + 2, "failed"]]);
  subscribe(memberships.thierry, annuelAdulte, daysSinceSeason - 1, "active", [[full(annuelAdulte), daysSinceSeason - 1, "paid"]]);
  for (const key of ["aurelie", "david", "frederic"]) subscribe(memberships[key], annuelAikido, daysSinceSeason - 3, "active", [[full(annuelAikido), daysSinceSeason - 3, "paid"]]);
  subscribe(memberships.jessica, annuelAikido, 15, "pending");

  // --- Actualités ---
  const news = (dojo: DojoRow, author: MembershipRow, title: string, content: string, publishedDaysAgo: number | null, visibility: NewsVisibility = "dojo_members", target: Role | null = null) => {
    db.news.push({
      id: id("nws"),
      dojo_id: dojo.id,
      author_membership_id: author.id,
      title,
      content,
      image_url: null,
      visibility,
      target_role: target,
      published_at: publishedDaysAgo === null ? null : at(-publishedDaysAgo, publishedDaysAgo < 0 ? 8 : 12),
      created_at: at(-Math.max(publishedDaysAgo ?? 0, 0) - 1, 9),
    });
  };
  news(shin, admShin, `Reprise de la saison ${season}`,
    "Les cours ont repris à leurs horaires habituels. Le planning de la semaine est dans l'onglet Planning, et chacun peut s'inscrire à l'année à ses cours.\n\nPensez à vérifier vos coordonnées dans votre profil : c'est ce que le club utilise pour vous joindre.",
    daysSinceSeason);
  news(shin, admShin, "Certificat médical",
    "Pour les nouveaux adhérents, le certificat médical de non contre-indication est à remettre avant fin octobre. Les réinscriptions peuvent remplir le questionnaire de santé.",
    20);
  news(shin, coachSandrine, "Stage régional de judo",
    "Un stage ouvert aux ceintures jaunes et plus aura lieu au Hall des sports, avec un intervenant invité. Réservez votre place depuis le planning : 30 places.",
    5, "public");
  news(shin, coachThierry, "Passage de grades karaté",
    "Les passages de grades karaté auront lieu en décembre. Les élèves concernés seront prévenus individuellement après les cours.",
    2);
  news(shin, admShin, "Réunion des instructeurs",
    "Réunion de rentrée de l'encadrement samedi après le cours de jiu-jitsu : planning des stages et organisation des passages de grades.",
    3, "role_only", "coach");
  // Brouillon programmé : visible de l'encadrement seulement, jusqu'à sa date.
  news(shin, admShin, "Fête du club",
    "La fête du club aura lieu en décembre : démonstrations, remise des ceintures et repas partagé. Détails à venir.",
    -10);
  news(karukera, coachPatrick, "Bienvenue au Dojo Karukera",
    "Les cours d'aïkido ont repris le lundi et le jeudi soir. Les débutants sont les bienvenus toute l'année.",
    daysSinceSeason - 1);

  // --- Inscriptions en ligne ---
  const registration = (r: Partial<RegistrationRow> & Pick<RegistrationRow, "first_name" | "last_name" | "gender" | "birth_date" | "email" | "mobile_phone" | "choices">, createdAt: string) => {
    db.registrations.push({
      id: id("reg"),
      dojo_id: shin.id,
      season,
      status: "pending",
      birth_place: null,
      address: "Adresse fictive",
      postal_code: "97122",
      city: "Baie-Mahault",
      landline_phone: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      comments: null,
      photo_file_id: null,
      membership_id: null,
      processed_at: null,
      created_at: createdAt,
      ...r,
    });
  };
  registration({
    first_name: "Elsa", last_name: "Marchand", gender: "female", birth_date: "2010-03-14", birth_place: "Lyon",
    email: "elsa.marchand@mail.example", mobile_phone: "0690 00 50 01", emergency_contact_name: "Claire Marchand", emergency_contact_phone: "0690 00 50 02",
    comments: "Deux ans de karaté en métropole, ceinture orange.", photo_file_id: "avatar-elsa",
    choices: [{ discipline_id: karate.id, plan_id: annuelEnfant.id }],
  }, at(-2, 15));
  // Frère d'un élève inscrit avec l'email du parent : l'API refuse de le
  // rattacher au compte existant, l'admin corrige l'email avant de valider.
  registration({
    first_name: "Timéo", last_name: "Bérard", gender: "male", birth_date: "2019-09-02",
    email: "famille.berard@mail.example", mobile_phone: "0690 00 20 02", emergency_contact_name: "Nadia Bérard", emergency_contact_phone: "0690 00 30 02",
    choices: [{ discipline_id: judo.id, plan_id: annuelEnfant.id }],
  }, at(-1, 20));
  registration({
    first_name: "Rodrigue", last_name: "Anselme", gender: "male", birth_date: "1989-05-27",
    email: "rodrigue.anselme@mail.example", mobile_phone: "0690 00 50 03", city: "Les Abymes", postal_code: "97139",
    choices: [{ discipline_id: jjb.id, plan_id: annuelAdulte.id }, { discipline_id: selfDef.id, plan_id: planSelf.id }],
  }, new Date(now - 6 * 3_600_000).toISOString());
  registration({
    first_name: "Gabriel", last_name: "Alexis", gender: "male", birth_date: "2000-01-31",
    email: "gabriel.alexis@mail.example", mobile_phone: "0690 00 20 18", status: "accepted",
    membership_id: memberships.gabriel.id, processed_at: at(-11, 18),
    choices: [{ discipline_id: jjb.id, plan_id: annuelAdulte.id }, { discipline_id: selfDef.id, plan_id: null }],
  }, at(-13, 15));
  registration({
    first_name: "Jade", last_name: "Nicolas", gender: "female", birth_date: "2017-01-25",
    email: "famille.nicolas@mail.example", mobile_phone: "0690 00 20 07", status: "rejected",
    comments: "Envoyé deux fois, désolée !", processed_at: at(-27, 18),
    choices: [{ discipline_id: judo.id, plan_id: annuelEnfant.id }],
  }, at(-28, 15));

  return db;
}
