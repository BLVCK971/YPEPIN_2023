// Fausse API de la démo WONDO : reproduit dans le navigateur les routes du
// backend FastAPI (backend/app/routers/*.py) appelées par l'app mobile, avec les
// mêmes règles : adhésions et rôles par club (404 hors du club, 403 sans le bon
// rôle), séries de cours qui engendrent leurs séances, réservations, feuille
// d'appel à quatre statuts, grades par discipline, abonnements activés par un
// paiement encaissé, inscriptions en ligne à valider. Rien n'est envoyé : les
// e-mails (lien de mot de passe, inscription validée) sont simulés.
import { HttpError, installMockApi, json, type MockRequest, type Route, uid } from "../shared/runtime";
import {
  type AttendanceStatus,
  cappedToSeason,
  countOccurrences,
  type CourseRow,
  type Db,
  DEMO_PASSWORD,
  type DisciplineRow,
  type DojoRow,
  EMAIL_ADMIN,
  EMAIL_ELEVE,
  EMAIL_INSTRUCTEUR,
  type EnrollmentRow,
  gpToday,
  localDay,
  type MembershipRow,
  type MembershipStatus,
  type NewsRow,
  occurrences,
  type PaymentRow,
  type PaymentStatus,
  type PlanRow,
  type RegistrationRow,
  type Role,
  seasonBounds,
  seasonCode,
  seed,
  type SeriesRow,
  type StudentProfileRow,
  type SubscriptionRow,
  type TechniqueRow,
  tokenFor,
  USER_ADMIN,
  USER_ELEVE,
  USER_INSTRUCTEUR,
  type UserRow,
} from "./data";

const BASE = "/demos/wondo";
type Req = MockRequest<Db>;

const nowMs = () => Date.now();
const nowIso = () => new Date().toISOString();
/** Réponse 201 des routes de création, comme le backend. */
const created = (body: unknown) => json(body, 201);
const byText = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" });
const STAFF: Role[] = ["coach", "admin"];

/** Booléen de requête façon FastAPI ("true", "1", "false", "0"). */
function boolParam(req: Req, name: string, fallback: boolean): boolean {
  const v = req.query.get(name);
  if (v === null) return fallback;
  return ["true", "1", "yes", "on"].includes(v.toLowerCase());
}

/** Erreur de validation au format Pydantic : l'app la traduit champ par champ. */
function invalid(field: string, type: string, msg: string): never {
  const e = new HttpError(422, msg);
  (e as HttpError & { fields?: unknown }).fields = [{ loc: ["body", field], msg, type }];
  throw e;
}

// --- Authentification et autorisations (app/deps.py) ---------------------------

function currentUser(req: Req): UserRow {
  const userId = req.token?.startsWith("demo.") ? req.token.slice(5) : null;
  const user = userId ? req.db.users.find((u) => u.id === userId) : undefined;
  if (!user || !user.is_active) throw new HttpError(401, "Non authentifié");
  return user;
}

const activeMemberships = (db: Db, userId: string, dojoId?: string) =>
  db.memberships.filter((m) => m.user_id === userId && m.status === "active" && (!dojoId || m.dojo_id === dojoId));

/**
 * Adhésion active de l'appelant dans le club, filtrée par rôle si demandé.
 * 404 hors du club (ne pas confirmer son existence), 403 avec le mauvais rôle.
 */
function requireMembership(req: Req, dojoId: string, roles?: Role[]): MembershipRow {
  const user = currentUser(req);
  const mine = activeMemberships(req.db, user.id, dojoId);
  const found = roles ? mine.find((m) => roles.includes(m.role)) : mine[0];
  if (found) return found;
  if (roles && mine.length > 0) {
    throw new HttpError(
      403,
      roles.length === 1 && roles[0] === "admin"
        ? "Action réservée aux administrateurs de ce dojo."
        : "Action réservée aux instructeurs et administrateurs de ce dojo.",
    );
  }
  throw new HttpError(404, "Dojo introuvable");
}

const requireStaff = (req: Req, dojoId: string) => requireMembership(req, dojoId, STAFF);

/** Adhésion appartenant à l'appelant : on n'agit pas au nom d'un autre membre. */
function ownMembership(req: Req, membershipId: string): MembershipRow {
  const user = currentUser(req);
  const m = req.db.memberships.find((x) => x.id === membershipId);
  if (!m || m.user_id !== user.id || m.status !== "active") throw new HttpError(404, "Adhésion introuvable");
  return m;
}

/** Back-office (/admin/*) : administrateur d'au moins un club ; renvoie ses clubs. */
function adminScope(req: Req): string[] {
  const user = currentUser(req);
  const dojos = req.db.memberships
    .filter((m) => m.user_id === user.id && m.role === "admin" && m.status === "active")
    .map((m) => m.dojo_id);
  if (dojos.length === 0) throw new HttpError(403, "Réservé aux administrateurs.");
  return dojos;
}

// --- Lectures utiles ------------------------------------------------------------

const userOf = (db: Db, userId: string) => db.users.find((u) => u.id === userId)!;
const membershipOf = (db: Db, id: string | null | undefined) => (id ? db.memberships.find((m) => m.id === id) : undefined);
const profileOf = (db: Db, userId: string) => db.profiles.find((p) => p.user_id === userId);
const fullNameOf = (u: UserRow) => `${u.first_name} ${u.last_name}`;
const gradeOut = (db: Db, gradeId: string | null) => {
  const g = gradeId ? db.grades.find((x) => x.id === gradeId) : undefined;
  return g ? { ...g } : null;
};

function getDojo(db: Db, dojoId: string): DojoRow {
  const d = db.dojos.find((x) => x.id === dojoId);
  if (!d) throw new HttpError(404, "Dojo introuvable");
  return d;
}

function getCourse(db: Db, dojoId: string, courseId: string): CourseRow {
  const c = db.courses.find((x) => x.id === courseId);
  if (!c || c.dojo_id !== dojoId) throw new HttpError(404, "Cours introuvable");
  return c;
}

/** Élève du club (fiche, grades) : 404 sinon. `activeOnly` pour techniques et pointage. */
function getStudent(db: Db, dojoId: string, membershipId: string, activeOnly = false): MembershipRow {
  const m = membershipOf(db, membershipId);
  if (!m || m.dojo_id !== dojoId || m.role !== "student" || (activeOnly && m.status !== "active")) {
    throw new HttpError(404, "Élève introuvable");
  }
  return m;
}

/** Progression par discipline, triée par nom de discipline (services/grades.py). */
function studentGrades(db: Db, membershipId: string) {
  return db.studentGrades
    .filter((g) => g.membership_id === membershipId)
    .map((g) => ({
      discipline_id: g.discipline_id,
      discipline_name: db.disciplines.find((d) => d.id === g.discipline_id)!.name,
      grade: gradeOut(db, g.grade_id),
      obtained_at: g.obtained_at,
    }))
    .sort((a, b) => byText(a.discipline_name, b.discipline_name));
}

// --- Sérialisation (app/schemas.py) -----------------------------------------------

const userOut = (u: UserRow) => ({
  id: u.id,
  first_name: u.first_name,
  last_name: u.last_name,
  email: u.email,
  phone: u.phone,
  avatar_url: u.avatar_url,
  is_active: u.is_active,
  is_dev_admin: u.is_dev_admin,
  created_at: u.created_at,
});

function profileOut(p: StudentProfileRow) {
  const { user_id: _userId, ...rest } = p;
  return rest;
}

function dojoOut(d: DojoRow) {
  // Saison calculée au jour du club, comme le serveur.
  const today = gpToday();
  const [starts, ends] = seasonBounds(today);
  return { ...d, season_label: `Saison ${seasonCode(today)}`, season_starts_on: starts, season_ends_on: ends };
}

function membershipOut(db: Db, m: MembershipRow) {
  return {
    id: m.id,
    dojo_id: m.dojo_id,
    dojo_name: getDojo(db, m.dojo_id).name,
    role: m.role,
    status: m.status,
    grades: studentGrades(db, m.id),
    joined_at: m.joined_at,
  };
}

function myMemberships(db: Db, userId: string) {
  return activeMemberships(db, userId)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    .map((m) => membershipOut(db, m));
}

function profileResponse(db: Db, u: UserRow) {
  const p = profileOf(db, u.id);
  return { user: userOut(u), student_profile: p ? profileOut(p) : null, memberships: myMemberships(db, u.id) };
}

const coachName = (db: Db, membershipId: string) => {
  const m = membershipOf(db, membershipId);
  return m ? fullNameOf(userOf(db, m.user_id)) : null;
};

/** Places prises par cours, en un passage sur les réservations. */
function reservedCounts(db: Db): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of db.reservations) if (r.status === "reserved") counts.set(r.course_id, (counts.get(r.course_id) ?? 0) + 1);
  return counts;
}

/** Réservation active de l'appelant par cours (toutes ses adhésions du club). */
function myReservations(db: Db, membershipIds: string[]): Map<string, string> {
  const ids = new Set(membershipIds);
  const mine = new Map<string, string>();
  for (const r of db.reservations) if (r.status === "reserved" && ids.has(r.student_membership_id)) mine.set(r.course_id, r.id);
  return mine;
}

function courseOut(db: Db, c: CourseRow, counts: Map<string, number>, mine: Map<string, string>) {
  const reserved = counts.get(c.id) ?? 0;
  return {
    id: c.id,
    dojo_id: c.dojo_id,
    discipline_id: c.discipline_id,
    discipline_name: c.discipline_id ? (db.disciplines.find((d) => d.id === c.discipline_id)?.name ?? null) : null,
    coach_membership_id: c.coach_membership_id,
    coach_name: coachName(db, c.coach_membership_id),
    title: c.title,
    description: c.description,
    min_grade: gradeOut(db, c.min_grade_id),
    max_students: c.max_students,
    start_time: c.start_time,
    end_time: c.end_time,
    room: c.room,
    is_cancelled: c.is_cancelled,
    series_id: c.series_id,
    reserved_count: reserved,
    spots_left: Math.max(c.max_students - reserved, 0),
    my_reservation_id: mine.get(c.id) ?? null,
  };
}

const reservationOut = (r: Db["reservations"][number]) => ({
  id: r.id,
  course_id: r.course_id,
  student_membership_id: r.student_membership_id,
  status: r.status,
  reserved_at: r.reserved_at,
  cancelled_at: r.cancelled_at,
});

function seriesOut(db: Db, s: SeriesRow, myMembershipIds: string[]) {
  const active = db.enrollments.filter((e) => e.series_id === s.id && e.cancelled_at === null);
  const mine = active.find((e) => myMembershipIds.includes(e.student_membership_id));
  return {
    id: s.id,
    dojo_id: s.dojo_id,
    discipline_id: s.discipline_id,
    discipline_name: s.discipline_id ? (db.disciplines.find((d) => d.id === s.discipline_id)?.name ?? null) : null,
    coach_membership_id: s.coach_membership_id,
    coach_name: coachName(db, s.coach_membership_id),
    title: s.title,
    description: s.description,
    min_grade: gradeOut(db, s.min_grade_id),
    max_students: s.max_students,
    room: s.room,
    starts_on: s.starts_on,
    ends_on: s.ends_on,
    timezone: getDojo(db, s.dojo_id).timezone,
    slots: s.slots.map((x) => ({ ...x })),
    occurrences_count: db.courses.filter((c) => c.series_id === s.id).length,
    enrolled_count: active.length,
    my_enrollment_id: mine?.id ?? null,
  };
}

/** Ligne de feuille d'appel ; `id` et `status` nuls = élève pas encore pointé. */
interface AttendanceOut {
  id: string | null;
  course_id: string;
  student_membership_id: string;
  student_name: string;
  photo_file_id: string | null;
  status: AttendanceStatus | null;
  notes: string | null;
}

function attendanceOut(db: Db, a: Db["attendance"][number]): AttendanceOut {
  const m = membershipOf(db, a.student_membership_id)!;
  const u = userOf(db, m.user_id);
  return {
    id: a.id,
    course_id: a.course_id,
    student_membership_id: a.student_membership_id,
    student_name: fullNameOf(u),
    photo_file_id: profileOf(db, u.id)?.photo_file_id ?? null,
    status: a.status,
    notes: a.notes,
  };
}

function studentOut(db: Db, m: MembershipRow) {
  const u = userOf(db, m.user_id);
  return {
    membership_id: m.id,
    user_id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    phone: u.phone,
    photo_file_id: profileOf(db, u.id)?.photo_file_id ?? null,
    grades: studentGrades(db, m.id),
    status: m.status,
    joined_at: m.joined_at,
  };
}

const sortByName = <T extends { first_name: string; last_name: string }>(rows: T[]) =>
  rows.sort((a, b) => byText(a.last_name, b.last_name) || byText(a.first_name, b.first_name));

/** Abonnement le plus récent d'une adhésion, et son drapeau d'impayé. */
function latestSubscription(db: Db, membershipId: string) {
  const sub = db.subscriptions
    .filter((s) => s.student_membership_id === membershipId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!sub) {
    return { subscription_id: null, subscription_plan: null, subscription_status: null, subscription_expires_at: null, has_unpaid: false };
  }
  return {
    subscription_id: sub.id,
    subscription_plan: db.plans.find((p) => p.id === sub.plan_id)?.name ?? null,
    subscription_status: sub.status,
    subscription_expires_at: sub.expires_at,
    has_unpaid: db.payments.some((p) => p.subscription_id === sub.id && (p.payment_status === "pending" || p.payment_status === "failed")),
  };
}

const techniquesTotal = (db: Db, dojoId: string) => db.techniques.filter((t) => t.dojo_id === dojoId || t.dojo_id === null).length;
const techniquesValidated = (db: Db, membershipId: string | null) =>
  db.studentTechniques.filter((t) => t.membership_id === membershipId && t.validated).length;

function techniqueOut(db: Db, t: TechniqueRow) {
  return {
    id: t.id,
    dojo_id: t.dojo_id,
    discipline_id: t.discipline_id,
    discipline_name: t.discipline_id ? (db.disciplines.find((d) => d.id === t.discipline_id)?.name ?? null) : null,
    name: t.name,
    description: t.description,
    required_grade: gradeOut(db, t.required_grade_id),
    video_url: t.video_url,
  };
}

/** Clé de tri qui compare les nombres du nom comme des nombres (« 2. » avant « 10. »). */
function naturalKey(name: string): (string | number)[] {
  return name.split(/(\d+)/).map((part, i) => (i % 2 ? Number(part) : part.toLowerCase()));
}

function compareNatural(a: string, b: string): number {
  const ka = naturalKey(a);
  const kb = naturalKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const x = ka[i];
    const y = kb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    if (typeof x === "number" && typeof y === "number") return x - y;
    return String(x) < String(y) ? -1 : 1;
  }
  return 0;
}

/** Référentiel du club, du niveau requis le plus bas au plus haut (routers/techniques.py). */
function catalog(db: Db, dojoId: string): TechniqueRow[] {
  const rank = (t: TechniqueRow) => (t.required_grade_id ? (db.grades.find((g) => g.id === t.required_grade_id)?.rank ?? -1) : -1);
  return db.techniques
    .filter((t) => t.dojo_id === dojoId || t.dojo_id === null)
    .sort((a, b) => rank(a) - rank(b) || compareNatural(a.name, b.name));
}

function withValidations(db: Db, techniques: TechniqueRow[], membershipId: string) {
  return techniques.map((t) => {
    const v = db.studentTechniques.find((x) => x.membership_id === membershipId && x.technique_id === t.id);
    const by = membershipOf(db, v?.validated_by_membership_id);
    return {
      technique: techniqueOut(db, t),
      validated: v?.validated ?? false,
      validated_at: v?.validated_at ?? null,
      validated_by_name: by ? fullNameOf(userOf(db, by.user_id)) : null,
      notes: v?.notes ?? null,
    };
  });
}

const planOut = (p: PlanRow) => ({ ...p });
const paymentOut = (p: PaymentRow) => ({ ...p });

function subscriptionOut(db: Db, s: SubscriptionRow) {
  return {
    id: s.id,
    student_membership_id: s.student_membership_id,
    plan: planOut(db.plans.find((p) => p.id === s.plan_id)!),
    status: s.status,
    started_at: s.started_at,
    expires_at: s.expires_at,
    cancelled_at: s.cancelled_at,
    payments: db.payments.filter((p) => p.subscription_id === s.id).sort((a, b) => a.created_at.localeCompare(b.created_at)).map(paymentOut),
  };
}

function newsOut(db: Db, n: NewsRow) {
  const author = membershipOf(db, n.author_membership_id);
  return {
    id: n.id,
    dojo_id: n.dojo_id,
    author_membership_id: n.author_membership_id,
    author_name: author ? fullNameOf(userOf(db, author.user_id)) : null,
    title: n.title,
    content: n.content,
    image_url: n.image_url,
    visibility: n.visibility,
    target_role: n.target_role,
    published_at: n.published_at,
    created_at: n.created_at,
  };
}

function registrationOut(r: RegistrationRow) {
  const { choices: _choices, ...rest } = r;
  return { ...rest, updated_at: r.processed_at ?? r.created_at };
}

const adminAccountOut = (u: UserRow) => ({ ...userOut(u), updated_at: u.updated_at });
const adminMembershipOut = (m: MembershipRow) => ({ ...m });

// --- Séries : séances engendrées et inscriptions (services/course_series.py) ------

const MAX_OCCURRENCES = 500;

function inherited(s: SeriesRow) {
  return {
    dojo_id: s.dojo_id,
    discipline_id: s.discipline_id,
    coach_membership_id: s.coach_membership_id,
    title: s.title,
    description: s.description,
    min_grade_id: s.min_grade_id,
    max_students: s.max_students,
    room: s.room,
  };
}

/** Supprime des séances et ce qui s'y rattache (réservations, présences). */
function deleteCourses(db: Db, ids: Set<string>) {
  db.courses = db.courses.filter((c) => !ids.has(c.id));
  db.reservations = db.reservations.filter((r) => !ids.has(r.course_id));
  db.attendance = db.attendance.filter((a) => !ids.has(a.course_id));
}

function validatePeriod(s: Pick<SeriesRow, "starts_on" | "ends_on" | "slots">) {
  if (s.ends_on < s.starts_on) throw new HttpError(400, "La fin de la période doit suivre son début.");
  if (s.slots.some((x) => x.start_time === x.end_time)) throw new HttpError(400, "Un créneau doit durer plus de zéro minute.");
  const total = countOccurrences(s.starts_on, s.ends_on, s.slots.map((x) => x.weekday));
  if (total === 0) throw new HttpError(400, "Aucune séance sur cette période : vérifie les jours choisis.");
  if (total > MAX_OCCURRENCES) throw new HttpError(400, `Cette période produirait ${total} séances (maximum ${MAX_OCCURRENCES}).`);
}

/**
 * Aligne les séances sur la série (`sync_courses`) : le passé ne bouge pas, les
 * séances à venir sont déplacées sur place (réservations conservées), celles
 * d'un jour sans créneau disparaissent, un jour nouveau fait naître les siennes.
 */
function syncCourses(db: Db, s: SeriesRow) {
  const now = nowMs();
  const fields = inherited(s);
  const courses = db.courses.filter((c) => c.series_id === s.id).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const first = courses.length === 0;
  const scheduled = occurrences(s);
  const currentStarts = new Set(scheduled.map(([start]) => start));
  const wanted = new Map(scheduled.filter(([start]) => first || Date.parse(start) > now));

  const place = (c: CourseRow, start: string) => {
    c.start_time = start;
    c.end_time = wanted.get(start)!;
    wanted.delete(start);
    Object.assign(c, fields);
  };

  const unplaced: CourseRow[] = [];
  for (const c of courses) {
    const future = Date.parse(c.start_time) > now;
    if (future && wanted.has(c.start_time)) place(c, c.start_time);
    else if (future || !currentStarts.has(c.start_time)) unplaced.push(c);
  }

  const freeByDay = new Map<string, string[]>();
  for (const start of [...wanted.keys()].sort()) {
    const day = localDay(new Date(start));
    freeByDay.set(day, [...(freeByDay.get(day) ?? []), start]);
  }
  const removed = new Set<string>();
  for (const c of unplaced) {
    const free = freeByDay.get(localDay(new Date(c.start_time)));
    if (Date.parse(c.start_time) <= now) {
      if (free?.length) wanted.delete(free.shift()!);
    } else if (free?.length) {
      place(c, free.shift()!);
    } else {
      removed.add(c.id);
    }
  }
  deleteCourses(db, removed);

  const enrolled = db.enrollments
    .filter((e) => e.series_id === s.id && e.cancelled_at === null)
    .sort((a, b) => a.enrolled_at.localeCompare(b.enrolled_at));
  for (const [start, end] of [...wanted.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const c: CourseRow = { id: uid(), ...fields, start_time: start, end_time: end, is_cancelled: false, series_id: s.id };
    db.courses.push(c);
    if (Date.parse(start) > now) {
      for (const e of enrolled.slice(0, c.max_students)) {
        db.reservations.push({ id: uid(), course_id: c.id, student_membership_id: e.student_membership_id, status: "reserved", reserved_at: nowIso(), cancelled_at: null, series_enrollment_id: e.id });
      }
    }
  }
  db.courses.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/** Séances à venir et non annulées d'une série. */
const futureCourses = (db: Db, seriesId: string) =>
  db.courses.filter((c) => c.series_id === seriesId && Date.parse(c.start_time) > nowMs() && !c.is_cancelled);

// --- Contrôles de cohérence (services/courses.py) ---------------------------------

function checkCoach(db: Db, dojoId: string, coachMembershipId: unknown) {
  const coach = membershipOf(db, String(coachMembershipId ?? ""));
  if (!coach || coach.dojo_id !== dojoId || coach.role !== "coach") throw new HttpError(400, "Cet instructeur n'appartient pas à ce dojo.");
}

function checkDiscipline(db: Db, dojoId: string, disciplineId: string | null | undefined) {
  if (!disciplineId) return;
  const d = db.disciplines.find((x) => x.id === disciplineId);
  if (!d || d.dojo_id !== dojoId) throw new HttpError(400, "Cette discipline n'appartient pas à ce dojo.");
}

function checkGrade(db: Db, disciplineId: string | null | undefined, gradeId: string | null | undefined) {
  if (!gradeId) return;
  if (!disciplineId) throw new HttpError(400, "Un niveau minimum suppose une discipline : ce cours n'en a pas.");
  const g = db.grades.find((x) => x.id === gradeId);
  if (!g || g.discipline_id !== disciplineId) throw new HttpError(400, "Ce niveau n'appartient pas à la discipline du cours.");
}

function checkTitle(title: unknown) {
  if (typeof title !== "string" || !title.trim()) invalid("title", "string_too_short", "String should have at least 1 character");
  if (title.length > 255) invalid("title", "string_too_long", "String should have at most 255 characters");
}

function checkMaxStudents(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) invalid("max_students", "int_parsing", "Input should be a valid integer");
  if (value < 1) invalid("max_students", "greater_than_equal", "Input should be greater than or equal to 1");
  if (value > 500) invalid("max_students", "less_than_equal", "Input should be less than or equal to 500");
}

/** "18:30" ou "18:30:00" → "18:30:00". */
function toTime(value: unknown, field: string): string {
  const m = typeof value === "string" ? /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value) : null;
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) invalid(field, "time_parsing", "Input should be in a valid time format");
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

function toDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid(field, "date_parsing", "Input should be a valid date");
  return value;
}

function toInstant(value: unknown, field: string): string {
  const t = typeof value === "string" ? Date.parse(value) : NaN;
  if (Number.isNaN(t)) invalid(field, "datetime_parsing", "Input should be a valid datetime");
  return new Date(t).toISOString();
}

// --- Abonnements et paiements ---------------------------------------------------

/** Ouvre un abonnement calé sur la saison (événement `before_insert` du modèle). */
function openSubscription(db: Db, membershipId: string, plan: PlanRow, status: SubscriptionRow["status"] = "pending"): SubscriptionRow {
  const started = nowIso();
  const s: SubscriptionRow = {
    id: uid(),
    student_membership_id: membershipId,
    plan_id: plan.id,
    status,
    started_at: started,
    expires_at: plan.duration_months ? `${cappedToSeason(gpToday(), plan.duration_months)}T23:59:59.000Z` : null,
    cancelled_at: null,
    created_at: started,
  };
  db.subscriptions.push(s);
  return s;
}

/** Un paiement encaissé active l'abonnement qui l'attendait (événement sur Payment). */
function activateOnPaid(db: Db, p: PaymentRow) {
  if (p.payment_status !== "paid") return;
  const s = db.subscriptions.find((x) => x.id === p.subscription_id);
  if (s && s.status === "pending") s.status = "active";
}

/** Ouvre la fiche élève du compte si elle manque (événement `after_insert` des adhésions). */
function ensureProfile(db: Db, userId: string): StudentProfileRow {
  let p = profileOf(db, userId);
  if (!p) {
    p = {
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
    };
    db.profiles.push(p);
  }
  return p;
}

// --- Inscriptions en ligne (services/registrations.py) ----------------------------

const euros = (n: number) => {
  const text = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n).replace(/ | /g, " ");
  return `${text.replace(/,00$/, "")} €`;
};

/** « Annuel : 260 € + 70 € de frais d'inscription/licence ». */
function planLabel(p: PlanRow): string {
  let label = `${p.name} : ${euros(p.price)}`;
  if (p.registration_fee) label += ` + ${euros(p.registration_fee)} de frais d'inscription/licence`;
  return label;
}

const clubPlans = (db: Db, dojoId: string) =>
  db.plans.filter((p) => p.dojo_id === dojoId).sort((a, b) => a.price - b.price || byText(a.name, b.name));
const plansFor = (plans: PlanRow[], d: DisciplineRow) => plans.filter((p) => p.discipline_id === null || p.discipline_id === d.id);

/** « Élodie  Marie-Anne » = « elodie marie anne » : sans accents, casse ni tirets. */
const normalized = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/-/g, " ").toLowerCase().split(/\s+/).filter(Boolean).join(" ");
const samePerson = (u: UserRow, r: RegistrationRow) =>
  normalized(u.first_name) === normalized(r.first_name) && normalized(u.last_name) === normalized(r.last_name);
const findAccount = (db: Db, r: RegistrationRow) => db.users.find((u) => u.email === r.email.trim().toLowerCase());

function getRegistration(req: Req, id: string): RegistrationRow {
  const scope = adminScope(req);
  const r = req.db.registrations.find((x) => x.id === id);
  if (!r || !scope.includes(r.dojo_id)) throw new HttpError(404, "Introuvable");
  return r;
}

function acceptRegistration(db: Db, r: RegistrationRow, wanted: { discipline_id: string; plan_id: string | null }[]) {
  // Choix revus par le club : formule facultative, formule retirée acceptée.
  const ids = wanted.map((c) => c.discipline_id);
  if (new Set(ids).size !== ids.length) throw new HttpError(400, "Une discipline est choisie deux fois.");
  const plans = clubPlans(db, r.dojo_id);
  const choices = wanted.map((c) => {
    const d = db.disciplines.find((x) => x.id === c.discipline_id && x.dojo_id === r.dojo_id);
    if (!d) throw new HttpError(400, "Une des disciplines choisies n'est pas proposée par ce club.");
    if (c.plan_id === null) return { discipline: d, plan: null };
    const plan = plansFor(plans, d).find((p) => p.id === c.plan_id);
    if (!plan) throw new HttpError(400, `Cette formule n'est pas proposée pour ${d.name}.`);
    return { discipline: d, plan };
  });

  if (r.status !== "pending") throw new HttpError(400, "Cette demande a déjà été traitée.");

  let user = findAccount(db, r);
  const now = nowIso();
  if (!user) {
    // Sans mot de passe : l'élève le choisira par le lien de l'e-mail de bienvenue.
    user = {
      id: uid(),
      first_name: r.first_name.trim(),
      last_name: r.last_name.trim(),
      email: r.email.trim().toLowerCase(),
      phone: r.mobile_phone,
      avatar_url: null,
      is_active: true,
      is_dev_admin: false,
      password: null,
      created_at: now,
      updated_at: now,
    };
    db.users.push(user);
  } else if (!samePerson(user, r)) {
    throw new HttpError(
      400,
      `L'email ${user.email} est déjà celui d'un compte à un autre nom. Chaque élève se connecte avec son propre email : corrigez celui de la demande, puis validez-la.`,
    );
  } else if (r.mobile_phone) {
    user.phone = r.mobile_phone;
  }

  let m = db.memberships.find((x) => x.dojo_id === r.dojo_id && x.user_id === user.id && x.role === "student");
  if (!m) {
    m = { id: uid(), dojo_id: r.dojo_id, user_id: user.id, role: "student", status: "active", joined_at: now, left_at: null, notes: null, created_at: now, updated_at: now };
    db.memberships.push(m);
  } else {
    m.status = "active";
    m.left_at = null;
  }
  const membership = m;

  const profile = ensureProfile(db, user.id);
  const fields = ["gender", "birth_date", "birth_place", "address", "postal_code", "city", "landline_phone", "emergency_contact_name", "emergency_contact_phone"] as const;
  for (const f of fields) {
    const v = r[f];
    if (v !== null && v !== "") (profile as unknown as Record<string, unknown>)[f] = v;
  }
  if (r.photo_file_id) profile.photo_file_id = r.photo_file_id;

  for (const { discipline } of choices) {
    if (!db.studentGrades.some((g) => g.membership_id === membership.id && g.discipline_id === discipline.id)) {
      db.studentGrades.push({ membership_id: membership.id, discipline_id: discipline.id, grade_id: null, obtained_at: null });
    }
  }

  // Un abonnement « à régler » par formule retenue, sans doublon d'une formule en cours.
  const running = new Set(
    db.subscriptions
      .filter((s) => s.student_membership_id === membership.id && (s.status === "pending" || s.status === "active") && (!s.expires_at || Date.parse(s.expires_at) > nowMs()))
      .map((s) => s.plan_id),
  );
  for (const plan of new Map(choices.filter((c) => c.plan).map((c) => [c.plan!.id, c.plan!])).values()) {
    if (!running.has(plan.id)) openSubscription(db, membership.id, plan, "pending");
  }

  if (r.comments) {
    const note = `Remarque à l'inscription (${r.season}) : ${r.comments}`;
    membership.notes = membership.notes ? `${membership.notes}\n${note}` : note;
  }

  r.choices = choices.map((c) => ({ discipline_id: c.discipline.id, plan_id: c.plan?.id ?? null }));
  r.status = "accepted";
  r.membership_id = membership.id;
  r.processed_at = now;
  return user;
}

/** E-mail simulé : la démo n'envoie rien, elle le signale dans la console. */
function simulatedEmail(to: string, subject: string) {
  console.info(`[démo] e-mail simulé à ${to} : « ${subject} »`);
}

// --- Suppression de compte (services/account_deletion.py) --------------------------

const normalizeConfirmation = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split(/\s+/).filter(Boolean).join(" ");

function deletionBlocker(db: Db, user: UserRow): string | null {
  const soleAdminOf = db.memberships
    .filter((m) => m.user_id === user.id && m.role === "admin" && m.status === "active")
    .filter((m) => !db.memberships.some((o) => o.dojo_id === m.dojo_id && o.role === "admin" && o.status === "active" && o.user_id !== user.id))
    .map((m) => getDojo(db, m.dojo_id).name)
    .sort(byText);
  if (soleAdminOf.length === 0) return null;
  return `Tu es le seul administrateur de ${soleAdminOf.join(", ")}. Confie ce rôle à quelqu'un d'autre avant de supprimer ton compte : sans administrateur, le club ne pourrait plus gérer ses adhérents.`;
}

function deleteAccount(db: Db, user: UserRow) {
  const now = nowIso();
  const ids = new Set(db.memberships.filter((m) => m.user_id === user.id).map((m) => m.id));
  db.registrations = db.registrations.filter((r) => !r.membership_id || !ids.has(r.membership_id));
  db.studentGrades = db.studentGrades.filter((g) => !ids.has(g.membership_id));
  db.studentTechniques = db.studentTechniques.filter((t) => !ids.has(t.membership_id));
  db.reservations = db.reservations.filter((r) => !ids.has(r.student_membership_id));
  db.enrollments = db.enrollments.filter((e) => !ids.has(e.student_membership_id));
  // Présences et paiements restent au club, détachés des remarques libres.
  for (const a of db.attendance) if (ids.has(a.student_membership_id)) a.notes = null;
  for (const s of db.subscriptions) {
    if (ids.has(s.student_membership_id) && (s.status === "pending" || s.status === "active")) {
      s.status = "cancelled";
      s.cancelled_at = now;
    }
  }
  for (const m of db.memberships) {
    if (!ids.has(m.id)) continue;
    m.status = "left";
    m.left_at = m.left_at ?? now;
    m.notes = null;
  }
  db.profiles = db.profiles.filter((p) => p.user_id !== user.id);
  Object.assign(user, {
    first_name: "Compte",
    last_name: "supprimé",
    email: `supprime-${user.id}@example.com`,
    password: null,
    phone: null,
    avatar_url: null,
    is_active: false,
    is_dev_admin: false,
    updated_at: now,
  });
}

// --- Photos d'identité : illustrations générées, jamais de vraies photos ------------

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Portrait stylisé en kimono, couleurs tirées de l'identifiant : léger et déterministe. */
function avatarSvg(fileId: string): string {
  const h = hash(fileId);
  const hue = h % 360;
  const skins = ["#f1c7a5", "#d9a47c", "#b97b52", "#8d5a3b", "#6b4329"];
  const hairs = ["#1f1a17", "#3b2618", "#6b3e1f", "#9a6a3a", "#2b2b2b"];
  const skin = skins[(h >>> 8) % skins.length];
  const hair = hairs[(h >>> 12) % hairs.length];
  const long = (h >>> 16) % 2 === 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,72%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},65%,52%)"/></linearGradient></defs>
<rect width="96" height="96" fill="url(#g)"/>
${long ? `<path d="M29 40c0-14 8-22 19-22s19 8 19 22v20H29z" fill="${hair}"/>` : ""}
<circle cx="48" cy="40" r="16" fill="${skin}"/>
<path d="M32 38c0-11 7-17 16-17s16 6 16 17c-4-6-10-8-16-8s-12 2-16 8z" fill="${hair}"/>
<path d="M12 96c2-19 17-30 36-30s34 11 36 30z" fill="#f8fafc"/>
<path d="M37 67l11 17 11-17" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linejoin="round"/>
</svg>`;
}

/** La photo est-elle visible de l'appelant : la sienne, ou celle d'un membre/demandeur d'un club qu'il encadre. */
function canSeeFile(db: Db, user: UserRow, fileId: string): boolean {
  const staffDojos = new Set(activeMemberships(db, user.id).filter((m) => STAFF.includes(m.role)).map((m) => m.dojo_id));
  const owner = db.profiles.find((p) => p.photo_file_id === fileId);
  if (owner) {
    if (owner.user_id === user.id) return true;
    if (db.memberships.some((m) => m.user_id === owner.user_id && staffDojos.has(m.dojo_id))) return true;
  }
  return db.registrations.some((r) => r.photo_file_id === fileId && staffDojos.has(r.dojo_id));
}

// --- Routes -------------------------------------------------------------------------

function listCourses(req: Req) {
  const { db } = req;
  const dojoId = req.params.dojoId;
  const user = currentUser(req);
  requireMembership(req, dojoId);
  const myIds = db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === dojoId).map((m) => m.id);
  const mine = myReservations(db, myIds);

  const start = req.query.get("start");
  const end = req.query.get("end");
  const startMs = start ? Date.parse(start) : null;
  const endMs = end ? Date.parse(end) : null;
  const coach = req.query.get("coach_membership_id");
  const onlyReserved = boolParam(req, "only_reserved", false);
  const includeCancelled = boolParam(req, "include_cancelled", true);
  const limit = req.query.get("limit");

  let rows = db.courses.filter((c) => {
    if (c.dojo_id !== dojoId) return false;
    const t = Date.parse(c.start_time);
    if (startMs !== null && t < startMs) return false;
    if (endMs !== null && t > endMs) return false;
    if (coach && c.coach_membership_id !== coach) return false;
    if (!includeCancelled && c.is_cancelled) return false;
    if (onlyReserved && !mine.has(c.id)) return false;
    return true;
  });
  rows.sort((a, b) => a.start_time.localeCompare(b.start_time));
  if (limit) rows = rows.slice(0, Number(limit));
  const counts = reservedCounts(db);
  return rows.map((c) => courseOut(db, c, counts, mine));
}

function myStats(req: Req) {
  const { db } = req;
  const dojoId = req.params.dojoId;
  const user = currentUser(req);
  requireMembership(req, dojoId);
  // L'adhésion élève porte présences, réservations et grades : elle passe en premier.
  const mine = activeMemberships(db, user.id, dojoId).sort((a, b) => Number(b.role === "student") - Number(a.role === "student"));
  const m = mine[0] ?? null;
  const now = nowMs();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const courseById = new Map(db.courses.map((c) => [c.id, c]));
  const attended = m
    ? db.attendance.filter((a) => {
        const c = courseById.get(a.course_id);
        return a.student_membership_id === m.id && (a.status === "present" || a.status === "late") && c && Date.parse(c.start_time) >= monthStart.getTime();
      }).length
    : 0;
  const upcoming = m
    ? db.reservations.filter((r) => {
        const c = courseById.get(r.course_id);
        return r.student_membership_id === m.id && r.status === "reserved" && c && Date.parse(c.start_time) >= now;
      }).length
    : 0;
  return {
    courses_attended_this_month: attended,
    courses_reserved_upcoming: upcoming,
    techniques_validated: techniquesValidated(db, m?.id ?? null),
    techniques_total: techniquesTotal(db, dojoId),
    grades: m ? studentGrades(db, m.id) : [],
    member_since: m?.joined_at ?? null,
  };
}

function dojoStats(req: Req) {
  const { db } = req;
  const dojoId = req.params.dojoId;
  requireStaff(req, dojoId);
  const now = nowMs();
  const since30 = now - 30 * 86_400_000;
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const shift = (months: number) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + months, 1);
  };

  const inDojo = db.memberships.filter((m) => m.dojo_id === dojoId && m.status === "active");
  const countUsers = (rows: MembershipRow[]) => new Set(rows.map((m) => m.user_id)).size;
  const dojoMemberships = new Set(db.memberships.filter((m) => m.dojo_id === dojoId).map((m) => m.id));
  const dojoSubs = db.subscriptions.filter((s) => dojoMemberships.has(s.student_membership_id));
  const subIds = new Set(dojoSubs.map((s) => s.id));
  const payments = db.payments.filter((p) => subIds.has(p.subscription_id));

  // Recettes des six derniers mois, mois courant compris.
  const byMonth = new Map<string, number>();
  for (let offset = -5; offset <= 0; offset++) byMonth.set(monthKey(shift(offset)), 0);
  for (const p of payments) {
    if (p.payment_status !== "paid" || !p.paid_at) continue;
    const key = monthKey(new Date(p.paid_at));
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key)! + p.amount);
  }
  const unpaid = payments.filter((p) => p.payment_status === "pending" || p.payment_status === "failed");

  // Remplissage et assiduité sur les séances des 30 derniers jours.
  const counts = reservedCounts(db);
  const recent = db.courses.filter((c) => c.dojo_id === dojoId && !c.is_cancelled && Date.parse(c.start_time) >= since30 && Date.parse(c.start_time) <= now);
  let fillRate: number | null = null;
  let attendanceRate: number | null = null;
  if (recent.length) {
    const ratios = recent.filter((c) => c.max_students > 0).map((c) => Math.min((counts.get(c.id) ?? 0) / c.max_students, 1));
    fillRate = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
    const ids = new Set(recent.map((c) => c.id));
    const rows = db.attendance.filter((a) => ids.has(a.course_id));
    const present = rows.filter((a) => a.status === "present" || a.status === "late").length;
    const absent = rows.filter((a) => a.status === "absent").length;
    attendanceRate = present + absent > 0 ? present / (present + absent) : null;
  }

  const upcoming = db.courses
    .filter((c) => c.dojo_id === dojoId && !c.is_cancelled && Date.parse(c.start_time) >= now)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 6);

  const thisMonth = shift(0).getTime();
  const plans = db.plans.filter((p) => p.dojo_id === dojoId);
  return {
    active_members: countUsers(inDojo),
    active_students: countUsers(inDojo.filter((m) => m.role === "student")),
    active_coaches: countUsers(inDojo.filter((m) => m.role === "coach")),
    new_members_30d: countUsers(inDojo.filter((m) => Date.parse(m.joined_at) >= since30)),
    revenue_this_month: byMonth.get(monthKey(shift(0))) ?? 0,
    revenue_last_month: byMonth.get(monthKey(shift(-1))) ?? 0,
    revenue_by_month: [...byMonth.entries()].map(([month, revenue]) => ({ month, revenue })),
    unpaid_count: unpaid.length,
    unpaid_amount: unpaid.reduce((a, p) => a + p.amount, 0),
    fill_rate_30d: fillRate,
    attendance_rate_30d: attendanceRate,
    upcoming_courses: upcoming.map((c) => ({ course_id: c.id, title: c.title, start_time: c.start_time, reserved: counts.get(c.id) ?? 0, max_students: c.max_students })),
    plans: plans.map((p) => {
      const subs = dojoSubs.filter((s) => s.plan_id === p.id);
      const ids = new Set(subs.map((s) => s.id));
      return {
        plan_id: p.id,
        plan_name: p.name,
        active_subscriptions: subs.filter((s) => s.status === "active").length,
        revenue_this_month: payments
          .filter((x) => ids.has(x.subscription_id) && x.payment_status === "paid" && x.paid_at && Date.parse(x.paid_at) >= thisMonth)
          .reduce((a, x) => a + x.amount, 0),
      };
    }),
  };
}

function rosterOf(db: Db, courseId: string) {
  const existing = new Map(db.attendance.filter((a) => a.course_id === courseId).map((a) => [a.student_membership_id, a]));
  const roster: AttendanceOut[] = [];
  const seen = new Set<string>();
  for (const r of db.reservations) {
    if (r.course_id !== courseId || r.status !== "reserved") continue;
    // Même filtre que l'enregistrement : un élève suspendu ou parti n'est pas proposé.
    const m = membershipOf(db, r.student_membership_id);
    if (!m || m.role !== "student" || m.status !== "active") continue;
    seen.add(m.id);
    const a = existing.get(m.id);
    if (a) roster.push(attendanceOut(db, a));
    else {
      const u = userOf(db, m.user_id);
      roster.push({ id: null, course_id: courseId, student_membership_id: m.id, student_name: fullNameOf(u), photo_file_id: profileOf(db, u.id)?.photo_file_id ?? null, status: null, notes: null });
    }
  }
  for (const [mid, a] of existing) if (!seen.has(mid)) roster.push(attendanceOut(db, a));
  return roster.sort((a, b) => byText(a.student_name, b.student_name));
}

const listAttendance = (db: Db, courseId: string) =>
  db.attendance
    .filter((a) => a.course_id === courseId)
    .map((a) => attendanceOut(db, a))
    .sort((a, b) => byText(a.student_name, b.student_name));

const ATTENDANCE: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function newsList(req: Req) {
  const { db } = req;
  const dojoId = req.params.dojoId;
  const user = currentUser(req);
  requireMembership(req, dojoId);
  const roles = new Set(activeMemberships(db, user.id, dojoId).map((m) => m.role));
  const staff = roles.has("coach") || roles.has("admin");
  const now = nowMs();
  return db.news
    .filter((n) => n.dojo_id === dojoId)
    .filter((n) => staff || (n.published_at !== null && Date.parse(n.published_at) <= now && (n.visibility !== "role_only" || (n.target_role !== null && roles.has(n.target_role)))))
    .sort((a, b) => {
      if (a.published_at && b.published_at && a.published_at !== b.published_at) return b.published_at.localeCompare(a.published_at);
      if (!a.published_at !== !b.published_at) return a.published_at ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    })
    .map((n) => newsOut(db, n));
}

function checkNews(n: Pick<NewsRow, "visibility" | "target_role">) {
  if (!["public", "dojo_members", "role_only"].includes(n.visibility)) invalid("visibility", "enum", "Input should be 'public', 'dojo_members' or 'role_only'");
  if (n.visibility === "role_only" && !n.target_role) throw new HttpError(400, "Une actualité réservée à un rôle doit préciser lequel.");
}

const routes: Route<Db>[] = [
  // --- Authentification (routers/auth.py) ---
  [
    "POST",
    "/auth/login",
    ({ db, body }) => {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const user = db.users.find((u) => u.email === email);
      if (!user || user.password === null || user.password !== body?.password) throw new HttpError(401, "Email ou mot de passe incorrect.");
      if (!user.is_active) throw new HttpError(403, "Ce compte est désactivé.");
      return { access_token: tokenFor(user.id), token_type: "bearer" };
    },
  ],
  [
    "POST",
    "/auth/register",
    ({ db, body }) => {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (String(body?.password ?? "").length < 8) invalid("password", "string_too_short", "String should have at least 8 characters");
      if (db.users.some((u) => u.email === email)) throw new HttpError(409, "Un compte existe déjà avec cet email.");
      const now = nowIso();
      const user: UserRow = { id: uid(), first_name: body.first_name, last_name: body.last_name, email, phone: null, avatar_url: null, is_active: true, is_dev_admin: false, password: body.password, created_at: now, updated_at: now };
      db.users.push(user);
      return created({ access_token: tokenFor(user.id), token_type: "bearer" });
    },
  ],
  ["GET", "/auth/me", (req) => profileResponse(req.db, currentUser(req))],
  [
    "PATCH",
    "/auth/me",
    (req) => {
      const user = currentUser(req);
      for (const f of ["first_name", "last_name"] as const) {
        if (req.body?.[f] !== undefined) {
          if (!String(req.body[f] ?? "").trim()) invalid(f, "string_too_short", "String should have at least 1 character");
          user[f] = req.body[f];
        }
      }
      for (const f of ["phone", "avatar_url"] as const) if (req.body?.[f] !== undefined) user[f] = req.body[f];
      user.updated_at = nowIso();
      return userOut(user);
    },
  ],
  [
    "PATCH",
    "/auth/me/student-profile",
    (req) => {
      const user = currentUser(req);
      const profile = ensureProfile(req.db, user.id);
      const fields = ["birth_date", "gender", "birth_place", "address", "postal_code", "city", "landline_phone", "emergency_contact_name", "emergency_contact_phone", "medical_notes"] as const;
      for (const f of fields) {
        if (req.body?.[f] === undefined) continue;
        if (f === "birth_date" && req.body[f] !== null) toDate(req.body[f], f);
        (profile as unknown as Record<string, unknown>)[f] = req.body[f];
      }
      return profileOut(profile);
    },
  ],
  [
    "PATCH",
    "/auth/me/password",
    (req) => {
      const user = currentUser(req);
      // 400 et non 401 : un 401 déconnecterait l'app pour une faute de frappe.
      if (user.password === null || user.password !== req.body?.current_password) throw new HttpError(400, "Mot de passe actuel incorrect.");
      if (String(req.body?.new_password ?? "").length < 8) invalid("new_password", "string_too_short", "String should have at least 8 characters");
      user.password = req.body.new_password;
      return { status: "ok" };
    },
  ],
  [
    "DELETE",
    "/auth/me",
    (req) => {
      const user = currentUser(req);
      if (normalizeConfirmation(String(req.body?.confirmation ?? "")) !== normalizeConfirmation(`SUPPRIMER LES DONNEES ${user.last_name}`)) {
        throw new HttpError(400, "La phrase de confirmation ne correspond pas. Rien n'a été supprimé.");
      }
      const blocker = deletionBlocker(req.db, user);
      if (blocker) throw new HttpError(409, blocker);
      deleteAccount(req.db, user);
      return undefined;
    },
  ],
  [
    "POST",
    "/auth/password-reset/request",
    ({ db, body }) => {
      // Même réponse que le compte existe ou non : l'API ne dit pas quelles adresses ont un compte.
      const email = String(body?.email ?? "").trim().toLowerCase();
      const user = db.users.find((u) => u.email === email && u.is_active);
      if (user) simulatedEmail(user.email, "Choisir un nouveau mot de passe");
      return json({ status: "accepted" }, 202);
    },
  ],

  // --- Clubs et adhésions (routers/dojos.py) ---
  ["GET", "/dojos/me", (req) => myMemberships(req.db, currentUser(req).id)],
  [
    "GET",
    "/dojos",
    (req) => {
      const user = currentUser(req);
      const ids = new Set(activeMemberships(req.db, user.id).map((m) => m.dojo_id));
      return req.db.dojos
        .filter((d) => ids.has(d.id) && d.is_active)
        .sort((a, b) => byText(a.name, b.name))
        .map(dojoOut);
    },
  ],
  [
    "GET",
    "/dojos/:dojoId",
    (req) => {
      requireMembership(req, req.params.dojoId);
      return dojoOut(getDojo(req.db, req.params.dojoId));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/students",
    (req) => {
      const { db } = req;
      requireStaff(req, req.params.dojoId);
      const rows = db.memberships
        .filter((m) => m.dojo_id === req.params.dojoId && m.role === "student" && m.status === "active")
        .map((m) => studentOut(db, m));
      return sortByName(rows);
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/students/:membershipId",
    (req) => {
      const { db } = req;
      const dojoId = req.params.dojoId;
      requireStaff(req, dojoId);
      const m = getStudent(db, dojoId, req.params.membershipId);
      const now = nowMs();
      const courseById = new Map(db.courses.map((c) => [c.id, c]));
      const past = db.attendance.filter((a) => {
        const c = courseById.get(a.course_id);
        return a.student_membership_id === m.id && c && Date.parse(c.start_time) <= now;
      });
      const present = past.filter((a) => a.status === "present" || a.status === "late").length;
      const profile = profileOf(db, m.user_id);
      const birth = profile?.birth_date ?? null;
      let age: number | null = null;
      if (birth) {
        const [y, mo, d] = birth.split("-").map(Number);
        const t = new Date();
        age = t.getFullYear() - y - (t.getMonth() + 1 < mo || (t.getMonth() + 1 === mo && t.getDate() < d) ? 1 : 0);
      }
      return {
        ...studentOut(db, m),
        birth_date: birth,
        age,
        attendance_rate: past.length ? present / past.length : null,
        attendance_present: present,
        attendance_total: past.length,
        techniques_validated: techniquesValidated(db, m.id),
        techniques_total: techniquesTotal(db, dojoId),
        emergency_contact_name: profile?.emergency_contact_name ?? null,
        emergency_contact_phone: profile?.emergency_contact_phone ?? null,
        medical_notes: profile?.medical_notes ?? null,
        notes: m.notes,
        ...latestSubscription(db, m.id),
      };
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/members",
    (req) => {
      const { db } = req;
      requireStaff(req, req.params.dojoId);
      const statuses: MembershipStatus[] = ["active", "pending", "suspended"];
      const rows = db.memberships
        .filter((m) => m.dojo_id === req.params.dojoId && statuses.includes(m.status))
        .map((m) => {
          const u = userOf(db, m.user_id);
          return {
            membership_id: m.id,
            user_id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            phone: u.phone,
            role: m.role,
            status: m.status,
            joined_at: m.joined_at,
            photo_file_id: profileOf(db, u.id)?.photo_file_id ?? null,
            grades: studentGrades(db, m.id),
            ...latestSubscription(db, m.id),
          };
        });
      return sortByName(rows);
    },
  ],
  [
    "PATCH",
    "/dojos/:dojoId/students/:membershipId/grade",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      requireStaff(req, dojoId);
      const m = getStudent(db, dojoId, req.params.membershipId);
      const d = db.disciplines.find((x) => x.id === body?.discipline_id);
      if (!d || d.dojo_id !== dojoId) throw new HttpError(400, "Cette discipline n'appartient pas à ce dojo.");
      const gradeId: string | null = body?.grade_id ?? null;
      if (gradeId !== null) {
        const g = db.grades.find((x) => x.id === gradeId);
        if (!g || g.discipline_id !== d.id) throw new HttpError(400, "Ce niveau n'appartient pas à cette discipline.");
      }
      let row = db.studentGrades.find((g) => g.membership_id === m.id && g.discipline_id === d.id);
      if (!row) {
        row = { membership_id: m.id, discipline_id: d.id, grade_id: null, obtained_at: null };
        db.studentGrades.push(row);
      }
      row.grade_id = gradeId;
      row.obtained_at = gradeId ? nowIso() : null;
      if (typeof body?.notes === "string") m.notes = body.notes;
      return studentOut(db, m);
    },
  ],

  // --- Disciplines et techniques ---
  [
    "GET",
    "/dojos/:dojoId/disciplines",
    (req) => {
      const { db } = req;
      requireMembership(req, req.params.dojoId);
      return db.disciplines
        .filter((d) => d.dojo_id === req.params.dojoId)
        .sort((a, b) => byText(a.name, b.name))
        .map((d) => ({ ...d, grades: db.grades.filter((g) => g.discipline_id === d.id).sort((a, b) => a.rank - b.rank).map((g) => ({ ...g })) }));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/techniques",
    (req) => {
      requireMembership(req, req.params.dojoId);
      return catalog(req.db, req.params.dojoId).map((t) => techniqueOut(req.db, t));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/me/techniques",
    (req) => {
      const m = requireMembership(req, req.params.dojoId, ["student"]);
      return withValidations(req.db, catalog(req.db, req.params.dojoId), m.id);
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/students/:membershipId/techniques",
    (req) => {
      requireStaff(req, req.params.dojoId);
      const m = getStudent(req.db, req.params.dojoId, req.params.membershipId, true);
      return withValidations(req.db, catalog(req.db, req.params.dojoId), m.id);
    },
  ],
  [
    "PUT",
    "/dojos/:dojoId/students/:membershipId/techniques/:techniqueId",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      const staff = requireStaff(req, dojoId);
      const m = getStudent(db, dojoId, req.params.membershipId, true);
      const t = db.techniques.find((x) => x.id === req.params.techniqueId);
      if (!t || (t.dojo_id !== null && t.dojo_id !== dojoId)) throw new HttpError(404, "Technique introuvable");
      let row = db.studentTechniques.find((x) => x.membership_id === m.id && x.technique_id === t.id);
      if (!row) {
        row = { membership_id: m.id, technique_id: t.id, validated: false, validated_at: null, validated_by_membership_id: null, notes: null };
        db.studentTechniques.push(row);
      }
      const validated = Boolean(body?.validated);
      row.validated = validated;
      row.validated_at = validated ? nowIso() : null;
      row.validated_by_membership_id = validated ? staff.id : null;
      if (typeof body?.notes === "string") row.notes = body.notes;
      return withValidations(db, [t], m.id)[0];
    },
  ],

  // --- Statistiques (routers/stats.py) ---
  ["GET", "/dojos/:dojoId/stats", dojoStats],
  ["GET", "/dojos/:dojoId/me/stats", myStats],

  // --- Cours à l'unité et réservations (routers/courses.py) ---
  ["GET", "/dojos/:dojoId/courses", listCourses],
  [
    "GET",
    "/dojos/:dojoId/courses/:courseId",
    (req) => {
      const { db } = req;
      const user = currentUser(req);
      requireMembership(req, req.params.dojoId);
      const c = getCourse(db, req.params.dojoId, req.params.courseId);
      const myIds = db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === req.params.dojoId).map((m) => m.id);
      return courseOut(db, c, reservedCounts(db), myReservations(db, myIds));
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/courses",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      requireStaff(req, dojoId);
      checkTitle(body?.title);
      const maxStudents = body?.max_students ?? 20;
      checkMaxStudents(maxStudents);
      const start = toInstant(body?.start_time, "start_time");
      const end = toInstant(body?.end_time, "end_time");
      if (Date.parse(end) <= Date.parse(start)) throw new HttpError(400, "L'heure de fin doit suivre l'heure de début.");
      checkCoach(db, dojoId, body?.coach_membership_id);
      checkDiscipline(db, dojoId, body?.discipline_id);
      checkGrade(db, body?.discipline_id, body?.min_grade_id);
      const c: CourseRow = {
        id: uid(),
        dojo_id: dojoId,
        discipline_id: body?.discipline_id ?? null,
        coach_membership_id: body.coach_membership_id,
        title: body.title,
        description: body?.description ?? null,
        min_grade_id: body?.min_grade_id ?? null,
        max_students: maxStudents,
        start_time: start,
        end_time: end,
        room: body?.room ?? null,
        is_cancelled: false,
        series_id: null,
      };
      db.courses.push(c);
      db.courses.sort((a, b) => a.start_time.localeCompare(b.start_time));
      return created(courseOut(db, c, new Map(), new Map()));
    },
  ],
  [
    "PATCH",
    "/dojos/:dojoId/courses/:courseId",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      requireStaff(req, dojoId);
      const c = getCourse(db, dojoId, req.params.courseId);
      const data = { ...(body ?? {}) } as Record<string, unknown>;
      if (data.coach_membership_id) checkCoach(db, dojoId, data.coach_membership_id);
      if ("discipline_id" in data || "min_grade_id" in data) {
        const disciplineId = ("discipline_id" in data ? data.discipline_id : c.discipline_id) as string | null;
        checkDiscipline(db, dojoId, disciplineId);
        checkGrade(db, disciplineId, ("min_grade_id" in data ? data.min_grade_id : c.min_grade_id) as string | null);
      }
      if ("title" in data) checkTitle(data.title);
      if ("max_students" in data && data.max_students !== null) checkMaxStudents(data.max_students);
      if (data.start_time) data.start_time = toInstant(data.start_time, "start_time");
      if (data.end_time) data.end_time = toInstant(data.end_time, "end_time");
      const next = { ...c };
      for (const f of ["discipline_id", "coach_membership_id", "title", "description", "min_grade_id", "max_students", "start_time", "end_time", "room", "is_cancelled"] as const) {
        if (f in data && !(data[f] === null && ["coach_membership_id", "title", "max_students", "start_time", "end_time", "is_cancelled"].includes(f))) {
          (next as Record<string, unknown>)[f] = data[f];
        }
      }
      if (Date.parse(next.end_time) <= Date.parse(next.start_time)) throw new HttpError(400, "L'heure de fin doit suivre l'heure de début.");
      Object.assign(c, next);
      db.courses.sort((a, b) => a.start_time.localeCompare(b.start_time));
      return courseOut(db, c, reservedCounts(db), new Map());
    },
  ],
  [
    "DELETE",
    "/dojos/:dojoId/courses/:courseId",
    (req) => {
      requireStaff(req, req.params.dojoId);
      const c = getCourse(req.db, req.params.dojoId, req.params.courseId);
      deleteCourses(req.db, new Set([c.id]));
      return undefined;
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/courses/:courseId/reservations",
    (req) => {
      const { db } = req;
      const dojoId = req.params.dojoId;
      requireMembership(req, dojoId);
      const m = ownMembership(req, req.query.get("student_membership_id") ?? "");
      if (m.dojo_id !== dojoId) throw new HttpError(400, "Cette adhésion n'est pas celle de ce dojo.");
      const c = getCourse(db, dojoId, req.params.courseId);
      if (c.is_cancelled) throw new HttpError(409, "Ce cours est annulé.");
      if (Date.parse(c.start_time) <= nowMs()) throw new HttpError(409, "Ce cours a déjà commencé.");
      const existing = db.reservations.find((r) => r.course_id === c.id && r.student_membership_id === m.id);
      if (existing?.status === "reserved") throw new HttpError(409, "Place déjà réservée.");
      if ((reservedCounts(db).get(c.id) ?? 0) >= c.max_students) throw new HttpError(409, "Ce cours est complet.");
      let r = existing;
      if (r) {
        // Une réservation annulée est réactivée plutôt que dupliquée.
        r.status = "reserved";
        r.reserved_at = nowIso();
        r.cancelled_at = null;
      } else {
        r = { id: uid(), course_id: c.id, student_membership_id: m.id, status: "reserved", reserved_at: nowIso(), cancelled_at: null, series_enrollment_id: null };
        db.reservations.push(r);
      }
      return created(reservationOut(r));
    },
  ],
  [
    "DELETE",
    "/dojos/:dojoId/courses/:courseId/reservations/:reservationId",
    (req) => {
      requireMembership(req, req.params.dojoId);
      const r = req.db.reservations.find((x) => x.id === req.params.reservationId);
      if (!r || r.course_id !== req.params.courseId) throw new HttpError(404, "Réservation introuvable");
      ownMembership(req, r.student_membership_id);
      // La ligne reste : la place est libérée, l'historique conservé.
      r.status = "cancelled";
      r.cancelled_at = nowIso();
      return reservationOut(r);
    },
  ],

  // --- Feuille d'appel (routers/attendance.py) ---
  [
    "GET",
    "/dojos/:dojoId/courses/:courseId/attendance/roster",
    (req) => {
      requireStaff(req, req.params.dojoId);
      const c = getCourse(req.db, req.params.dojoId, req.params.courseId);
      return rosterOf(req.db, c.id);
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/courses/:courseId/attendance",
    (req) => {
      requireStaff(req, req.params.dojoId);
      const c = getCourse(req.db, req.params.dojoId, req.params.courseId);
      return listAttendance(req.db, c.id);
    },
  ],
  [
    "PUT",
    "/dojos/:dojoId/courses/:courseId/attendance",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      const staff = requireStaff(req, dojoId);
      const c = getCourse(db, dojoId, req.params.courseId);
      const entries: { student_membership_id: string; status: AttendanceStatus | null; notes?: string | null }[] = Array.isArray(body?.entries) ? body.entries : [];
      for (const e of entries) if (e.status !== null && !ATTENDANCE.includes(e.status)) invalid("status", "enum", "Input should be 'present', 'absent', 'late' or 'excused'");
      // Seuls les pointages posés sont contrôlés : retirer celui d'un élève parti reste possible.
      const unknown = entries.filter((e) => {
        if (e.status === null) return false;
        const m = membershipOf(db, e.student_membership_id);
        return !m || m.dojo_id !== dojoId || m.role !== "student" || m.status !== "active";
      });
      if (unknown.length) throw new HttpError(400, `${unknown.length} élève(s) ne font pas partie de ce dojo.`);
      for (const e of entries) {
        const existing = db.attendance.find((a) => a.course_id === c.id && a.student_membership_id === e.student_membership_id);
        if (e.status === null) {
          // Statut nul = retirer le pointage : l'élève redevient non pointé.
          if (existing) db.attendance = db.attendance.filter((a) => a !== existing);
          continue;
        }
        const row = existing ?? { id: uid(), course_id: c.id, student_membership_id: e.student_membership_id, status: e.status, notes: null, recorded_by_membership_id: null };
        if (!existing) db.attendance.push(row);
        row.status = e.status;
        row.notes = e.notes ?? null;
        row.recorded_by_membership_id = staff.id;
      }
      return listAttendance(db, c.id);
    },
  ],

  // --- Cours récurrents (routers/course_series.py) ---
  [
    "GET",
    "/dojos/:dojoId/course-series",
    (req) => {
      const { db } = req;
      const user = currentUser(req);
      requireMembership(req, req.params.dojoId);
      const mine = db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === req.params.dojoId).map((m) => m.id);
      return db.series
        .filter((s) => s.dojo_id === req.params.dojoId)
        .sort((a, b) => b.starts_on.localeCompare(a.starts_on) || byText(a.title, b.title))
        .map((s) => seriesOut(db, s, mine));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/course-series/:seriesId",
    (req) => {
      const user = currentUser(req);
      requireMembership(req, req.params.dojoId);
      const s = getSeries(req);
      const mine = req.db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === req.params.dojoId).map((m) => m.id);
      return seriesOut(req.db, s, mine);
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/course-series",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      const user = currentUser(req);
      requireStaff(req, dojoId);
      checkTitle(body?.title);
      const maxStudents = body?.max_students ?? 20;
      checkMaxStudents(maxStudents);
      checkCoach(db, dojoId, body?.coach_membership_id);
      checkDiscipline(db, dojoId, body?.discipline_id);
      checkGrade(db, body?.discipline_id, body?.min_grade_id);
      const slotsIn: unknown[] = Array.isArray(body?.slots) ? body.slots : [];
      if (slotsIn.length === 0) invalid("slots", "too_short", "List should have at least 1 item");
      const s: SeriesRow = {
        id: uid(),
        dojo_id: dojoId,
        discipline_id: body?.discipline_id ?? null,
        coach_membership_id: body.coach_membership_id,
        title: body.title,
        description: body?.description ?? null,
        min_grade_id: body?.min_grade_id ?? null,
        max_students: maxStudents,
        room: body?.room ?? null,
        starts_on: toDate(body?.starts_on, "starts_on"),
        ends_on: toDate(body?.ends_on, "ends_on"),
        slots: slotsIn.map((raw) => slotIn(raw)),
        created_at: nowIso(),
      };
      validatePeriod(s);
      db.series.push(s);
      // Crée la série ET ses séances, toute la période.
      syncCourses(db, s);
      const mine = db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === dojoId).map((m) => m.id);
      return created(seriesOut(db, s, mine));
    },
  ],
  [
    "PATCH",
    "/dojos/:dojoId/course-series/:seriesId",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      const user = currentUser(req);
      requireStaff(req, dojoId);
      const s = getSeries(req);
      const data = { ...(body ?? {}) } as Record<string, unknown>;
      if (data.coach_membership_id) checkCoach(db, dojoId, data.coach_membership_id);
      if ("discipline_id" in data || "min_grade_id" in data) {
        const disciplineId = ("discipline_id" in data ? data.discipline_id : s.discipline_id) as string | null;
        checkDiscipline(db, dojoId, disciplineId);
        checkGrade(db, disciplineId, ("min_grade_id" in data ? data.min_grade_id : s.min_grade_id) as string | null);
      }
      if ("title" in data) checkTitle(data.title);
      if ("max_students" in data && data.max_students !== null) checkMaxStudents(data.max_students);
      const next: SeriesRow = { ...s, slots: [...s.slots] };
      for (const f of ["title", "description", "discipline_id", "coach_membership_id", "min_grade_id", "max_students", "room"] as const) {
        if (f in data && !(data[f] === null && ["title", "coach_membership_id", "max_students"].includes(f))) (next as unknown as Record<string, unknown>)[f] = data[f];
      }
      if (data.starts_on) next.starts_on = toDate(data.starts_on, "starts_on");
      if (data.ends_on) next.ends_on = toDate(data.ends_on, "ends_on");
      if (Array.isArray(data.slots)) {
        if (data.slots.length === 0) invalid("slots", "too_short", "List should have at least 1 item");
        next.slots = data.slots.map((raw) => slotIn(raw));
      }
      validatePeriod(next);
      Object.assign(s, next);
      syncCourses(db, s);
      const mine = db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === dojoId).map((m) => m.id);
      return seriesOut(db, s, mine);
    },
  ],
  [
    "DELETE",
    "/dojos/:dojoId/course-series/:seriesId",
    (req) => {
      const { db } = req;
      requireStaff(req, req.params.dojoId);
      const s = getSeries(req);
      // Les séances à venir partent ; les passées restent, détachées, avec leurs présences.
      deleteCourses(db, new Set(db.courses.filter((c) => c.series_id === s.id && Date.parse(c.start_time) > nowMs()).map((c) => c.id)));
      for (const c of db.courses) if (c.series_id === s.id) c.series_id = null;
      const enrollmentIds = new Set(db.enrollments.filter((e) => e.series_id === s.id).map((e) => e.id));
      for (const r of db.reservations) if (r.series_enrollment_id && enrollmentIds.has(r.series_enrollment_id)) r.series_enrollment_id = null;
      db.enrollments = db.enrollments.filter((e) => e.series_id !== s.id);
      db.series = db.series.filter((x) => x.id !== s.id);
      return undefined;
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/course-series/:seriesId/enrollments",
    (req) => {
      const { db } = req;
      const dojoId = req.params.dojoId;
      requireMembership(req, dojoId);
      const m = ownMembership(req, req.query.get("student_membership_id") ?? "");
      if (m.dojo_id !== dojoId) throw new HttpError(400, "Cette adhésion n'est pas celle de ce dojo.");
      const s = getSeries(req);
      let e = db.enrollments.find((x) => x.series_id === s.id && x.student_membership_id === m.id);
      if (!e) {
        e = { id: uid(), series_id: s.id, student_membership_id: m.id, enrolled_at: nowIso(), cancelled_at: null } satisfies EnrollmentRow;
        db.enrollments.push(e);
      } else {
        e.cancelled_at = null;
        e.enrolled_at = nowIso();
      }
      const enrollment = e;
      let reserved = 0;
      let skipped = 0;
      const counts = reservedCounts(db);
      for (const c of futureCourses(db, s.id).sort((a, b) => a.start_time.localeCompare(b.start_time))) {
        const mine = db.reservations.find((r) => r.course_id === c.id && r.student_membership_id === m.id);
        if (mine?.status === "reserved") {
          // Déjà réservée à l'unité : rattachée, pour que « quitter la série » la libère aussi.
          mine.series_enrollment_id = enrollment.id;
          continue;
        }
        if ((counts.get(c.id) ?? 0) >= c.max_students) {
          skipped += 1;
          continue;
        }
        if (mine) {
          Object.assign(mine, { status: "reserved", reserved_at: nowIso(), cancelled_at: null, series_enrollment_id: enrollment.id });
        } else {
          db.reservations.push({ id: uid(), course_id: c.id, student_membership_id: m.id, status: "reserved", reserved_at: nowIso(), cancelled_at: null, series_enrollment_id: enrollment.id });
        }
        reserved += 1;
      }
      return created({ ...enrollment, reserved, skipped_full: skipped, cancelled: 0 });
    },
  ],
  [
    "DELETE",
    "/dojos/:dojoId/course-series/:seriesId/enrollments/:enrollmentId",
    (req) => {
      const { db } = req;
      requireMembership(req, req.params.dojoId);
      const s = getSeries(req);
      const e = db.enrollments.find((x) => x.id === req.params.enrollmentId);
      if (!e || e.series_id !== s.id) throw new HttpError(404, "Inscription introuvable");
      ownMembership(req, e.student_membership_id);
      const now = nowIso();
      const future = new Set(futureCourses(db, s.id).map((c) => c.id));
      let cancelled = 0;
      for (const r of db.reservations) {
        if (future.has(r.course_id) && r.series_enrollment_id === e.id && r.status === "reserved") {
          r.status = "cancelled";
          r.cancelled_at = now;
          cancelled += 1;
        }
      }
      e.cancelled_at = now;
      return { ...e, reserved: 0, skipped_full: 0, cancelled };
    },
  ],

  // --- Formules, abonnements, paiements (routers/subscriptions.py) ---
  [
    "GET",
    "/dojos/:dojoId/plans",
    (req) => {
      requireMembership(req, req.params.dojoId);
      return req.db.plans.filter((p) => p.dojo_id === req.params.dojoId && p.is_active).sort((a, b) => a.price - b.price).map(planOut);
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/subscriptions/me",
    (req) => {
      const { db } = req;
      const user = currentUser(req);
      requireMembership(req, req.params.dojoId);
      const mine = new Set(db.memberships.filter((m) => m.user_id === user.id && m.dojo_id === req.params.dojoId).map((m) => m.id));
      return db.subscriptions
        .filter((s) => mine.has(s.student_membership_id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((s) => subscriptionOut(db, s));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/subscriptions",
    (req) => {
      const { db } = req;
      requireStaff(req, req.params.dojoId);
      const inDojo = new Set(db.memberships.filter((m) => m.dojo_id === req.params.dojoId).map((m) => m.id));
      return db.subscriptions
        .filter((s) => inDojo.has(s.student_membership_id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((s) => subscriptionOut(db, s));
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/subscriptions",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      // L'argent du club ne se saisit pas depuis un compte d'instructeur.
      requireMembership(req, dojoId, ["admin"]);
      const m = membershipOf(db, body?.student_membership_id);
      if (!m || m.dojo_id !== dojoId || m.role !== "student" || m.status !== "active") throw new HttpError(400, "Cet élève n'a pas d'adhésion active dans ce dojo.");
      const plan = db.plans.find((p) => p.id === body?.plan_id);
      if (!plan || plan.dojo_id !== dojoId) throw new HttpError(400, "Cette formule n'appartient pas à ce dojo.");
      return created(subscriptionOut(db, openSubscription(db, m.id, plan)));
    },
  ],
  [
    "POST",
    "/dojos/:dojoId/payments",
    (req) => {
      const { db, body } = req;
      const dojoId = req.params.dojoId;
      requireMembership(req, dojoId, ["admin"]);
      const s = db.subscriptions.find((x) => x.id === body?.subscription_id);
      const m = membershipOf(db, s?.student_membership_id);
      if (!s || !m || m.dojo_id !== dojoId) throw new HttpError(400, "Cet abonnement n'appartient pas à ce dojo.");
      const amount = Number(body?.amount);
      if (!(amount > 0)) invalid("amount", "greater_than", "Input should be greater than 0");
      const status: PaymentStatus = body?.payment_status ?? "paid";
      if (!["pending", "paid", "failed", "refunded"].includes(status)) invalid("payment_status", "enum", "Input should be 'pending', 'paid', 'failed' or 'refunded'");
      const p: PaymentRow = {
        id: uid(),
        subscription_id: s.id,
        amount,
        payment_status: status,
        provider: body?.provider ?? null,
        transaction_id: body?.transaction_id ?? null,
        // Un règlement encaissé est daté, sinon les recettes du mois l'ignoreraient.
        paid_at: body?.paid_at ?? (status === "paid" ? nowIso() : null),
        created_at: nowIso(),
      };
      db.payments.push(p);
      activateOnPaid(db, p);
      return created(paymentOut(p));
    },
  ],
  [
    "GET",
    "/dojos/:dojoId/payments",
    (req) => {
      const { db } = req;
      requireStaff(req, req.params.dojoId);
      const inDojo = new Set(db.memberships.filter((m) => m.dojo_id === req.params.dojoId).map((m) => m.id));
      const subs = new Set(db.subscriptions.filter((s) => inDojo.has(s.student_membership_id)).map((s) => s.id));
      return db.payments
        .filter((p) => subs.has(p.subscription_id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(paymentOut);
    },
  ],

  // --- Actualités (routers/news.py) ---
  ["GET", "/dojos/:dojoId/news", newsList],
  [
    "POST",
    "/dojos/:dojoId/news",
    (req) => {
      const { db, body } = req;
      const staff = requireStaff(req, req.params.dojoId);
      checkTitle(body?.title);
      if (typeof body?.content !== "string" || !body.content.trim()) invalid("content", "string_too_short", "String should have at least 1 character");
      const n: NewsRow = {
        id: uid(),
        dojo_id: req.params.dojoId,
        author_membership_id: staff.id,
        title: body.title,
        content: body.content,
        image_url: body?.image_url ?? null,
        visibility: body?.visibility ?? "dojo_members",
        target_role: body?.target_role ?? null,
        published_at: body?.published_at ? toInstant(body.published_at, "published_at") : null,
        created_at: nowIso(),
      };
      checkNews(n);
      db.news.push(n);
      return created(newsOut(db, n));
    },
  ],
  [
    "PATCH",
    "/dojos/:dojoId/news/:newsId",
    (req) => {
      const { db, body } = req;
      requireStaff(req, req.params.dojoId);
      const n = db.news.find((x) => x.id === req.params.newsId && x.dojo_id === req.params.dojoId);
      if (!n) throw new HttpError(404, "Actualité introuvable");
      if (body?.title !== undefined) checkTitle(body.title);
      const next = { ...n };
      for (const f of ["title", "content", "image_url", "visibility", "target_role", "published_at"] as const) {
        if (body?.[f] === undefined) continue;
        (next as Record<string, unknown>)[f] = f === "published_at" && body[f] ? toInstant(body[f], f) : body[f];
      }
      checkNews(next);
      Object.assign(n, next);
      return newsOut(db, n);
    },
  ],
  [
    "DELETE",
    "/dojos/:dojoId/news/:newsId",
    (req) => {
      requireStaff(req, req.params.dojoId);
      const n = req.db.news.find((x) => x.id === req.params.newsId && x.dojo_id === req.params.dojoId);
      if (!n) throw new HttpError(404, "Actualité introuvable");
      req.db.news = req.db.news.filter((x) => x !== n);
      return undefined;
    },
  ],

  // --- Photos privées (routers/files.py) ---
  [
    "GET",
    "/files/:fileId",
    (req) => {
      const user = currentUser(req);
      const fileId = req.params.fileId;
      if (!fileId.startsWith("avatar-") || !canSeeFile(req.db, user, fileId)) throw new HttpError(404, "Fichier introuvable");
      return new Response(new Blob([avatarSvg(fileId)], { type: "image/svg+xml" }), { status: 200, headers: { "Content-Type": "image/svg+xml" } });
    },
  ],

  // --- Back-office : inscriptions en ligne (routers/admin.py) ---
  [
    "GET",
    "/admin/registration-requests",
    (req) => {
      const scope = adminScope(req);
      const dojoId = req.query.get("dojo_id");
      const status = req.query.get("status");
      const limit = Number(req.query.get("limit") ?? 100);
      const rows = req.db.registrations
        .filter((r) => scope.includes(r.dojo_id) && (!dojoId || r.dojo_id === dojoId) && (!status || r.status === status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { total: rows.length, items: rows.slice(0, limit).map(registrationOut) };
    },
  ],
  [
    "GET",
    "/admin/registration-requests/:id/review",
    (req) => {
      const { db } = req;
      const r = getRegistration(req, req.params.id);
      const account = findAccount(db, r);
      const plans = clubPlans(db, r.dojo_id);
      return {
        request: registrationOut(r),
        dojo_name: getDojo(db, r.dojo_id).name,
        disciplines: db.disciplines
          .filter((d) => d.dojo_id === r.dojo_id)
          .sort((a, b) => byText(a.name, b.name))
          .map((d) => ({ id: d.id, name: d.name, plans: plansFor(plans, d).map((p) => ({ id: p.id, label: planLabel(p) })) })),
        choices: r.choices.map((c) => ({ ...c })),
        // Sans le nom du titulaire : le compte peut appartenir à un autre club.
        existing_account: account
          ? {
              same_person: samePerson(account, r),
              already_student: db.memberships.some((m) => m.user_id === account.id && m.dojo_id === r.dojo_id && m.role === "student"),
            }
          : null,
        photo_file_id: r.photo_file_id,
      };
    },
  ],
  [
    "POST",
    "/admin/registration-requests/:id/accept",
    (req) => {
      const r = getRegistration(req, req.params.id);
      const choices = Array.isArray(req.body?.choices) ? req.body.choices : [];
      const user = acceptRegistration(req.db, r, choices.map((c: { discipline_id: string; plan_id?: string | null }) => ({ discipline_id: c.discipline_id, plan_id: c.plan_id ?? null })));
      simulatedEmail(user.email, `Bienvenue au ${getDojo(req.db, r.dojo_id).name} : choisissez votre mot de passe`);
      return { request: registrationOut(r), email_sent: true };
    },
  ],
  [
    "POST",
    "/admin/registration-requests/:id/reject",
    (req) => {
      const r = getRegistration(req, req.params.id);
      if (r.status !== "pending") throw new HttpError(400, "Cette demande a déjà été traitée.");
      r.status = "rejected";
      r.processed_at = nowIso();
      return registrationOut(r);
    },
  ],
  [
    "POST",
    "/admin/registration-requests/:id/send-access",
    (req) => {
      const { db } = req;
      const r = getRegistration(req, req.params.id);
      if (r.status !== "accepted") throw new HttpError(400, "Seule une demande validée ouvre l'accès à l'application.");
      const m = membershipOf(db, r.membership_id);
      const user = m ? userOf(db, m.user_id) : undefined;
      if (!user || !user.is_active) {
        throw new HttpError(400, "Aucun compte actif n'est rattaché à cette demande : vérifiez l'adhésion et le compte de l'élève.");
      }
      simulatedEmail(user.email, `Votre accès à l'application du ${getDojo(db, r.dojo_id).name}`);
      return { email: user.email };
    },
  ],
  [
    "PATCH",
    "/admin/registration-requests/:id",
    (req) => {
      const r = getRegistration(req, req.params.id);
      if (req.body?.email !== undefined) {
        const email = String(req.body.email).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) invalid("email", "value_error", "value is not a valid email address");
        r.email = email;
      }
      return registrationOut(r);
    },
  ],

  // --- Back-office : comptes et rôles ---
  [
    "GET",
    "/admin/users/:id",
    (req) => adminAccountOut(getScopedUser(req, req.params.id)),
  ],
  [
    "PATCH",
    "/admin/users/:id",
    (req) => {
      const { db, body } = req;
      const user = getScopedUser(req, req.params.id);
      if (body?.email !== undefined) {
        const email = String(body.email).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) invalid("email", "value_error", "value is not a valid email address");
        if (db.users.some((u) => u.id !== user.id && u.email === email.toLowerCase())) throw new HttpError(409, "Enregistrement impossible : doublon ou référence invalide.");
        user.email = email;
      }
      for (const f of ["first_name", "last_name"] as const) {
        if (body?.[f] === undefined) continue;
        if (!String(body[f] ?? "").trim()) invalid(f, "string_too_short", "String should have at least 1 character");
        user[f] = body[f];
      }
      if (body?.phone !== undefined) user.phone = body.phone;
      if (body?.is_active !== undefined) user.is_active = Boolean(body.is_active);
      user.updated_at = nowIso();
      return adminAccountOut(user);
    },
  ],
  [
    "GET",
    "/admin/dojo-memberships",
    (req) => {
      const scope = adminScope(req);
      const dojoId = req.query.get("dojo_id");
      const userId = req.query.get("user_id");
      const rows = req.db.memberships
        .filter((m) => scope.includes(m.dojo_id) && (!dojoId || m.dojo_id === dojoId) && (!userId || m.user_id === userId))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { total: rows.length, items: rows.slice(0, Number(req.query.get("limit") ?? 100)).map(adminMembershipOut) };
    },
  ],
  [
    "POST",
    "/admin/dojo-memberships",
    (req) => {
      const { db, body } = req;
      const scope = adminScope(req);
      if (!scope.includes(body?.dojo_id)) throw new HttpError(403, "Ce dojo n'est pas dans votre périmètre.");
      if (!["student", "coach", "admin"].includes(body?.role)) invalid("role", "enum", "Input should be 'student', 'coach' or 'admin'");
      const user = db.users.find((u) => u.id === body?.user_id);
      if (!user) throw new HttpError(409, "Enregistrement impossible : doublon ou référence invalide.");
      if (db.memberships.some((m) => m.dojo_id === body.dojo_id && m.user_id === user.id && m.role === body.role)) {
        throw new HttpError(409, "Enregistrement impossible : doublon ou référence invalide.");
      }
      const now = nowIso();
      const m: MembershipRow = { id: uid(), dojo_id: body.dojo_id, user_id: user.id, role: body.role, status: body?.status ?? "active", joined_at: now, left_at: null, notes: null, created_at: now, updated_at: now };
      db.memberships.push(m);
      if (m.role === "student") ensureProfile(db, user.id);
      return created(adminMembershipOut(m));
    },
  ],
  [
    "PATCH",
    "/admin/dojo-memberships/:id",
    (req) => {
      const { db, body } = req;
      const scope = adminScope(req);
      const m = membershipOf(db, req.params.id);
      if (!m || !scope.includes(m.dojo_id)) throw new HttpError(404, "Introuvable");
      if (body?.status !== undefined) {
        if (!["pending", "active", "suspended", "left"].includes(body.status)) invalid("status", "enum", "Input should be 'pending', 'active', 'suspended' or 'left'");
        m.status = body.status;
      }
      if (body?.left_at !== undefined) m.left_at = body.left_at;
      if (body?.notes !== undefined) m.notes = body.notes;
      m.updated_at = nowIso();
      return adminMembershipOut(m);
    },
  ],
];

function getSeries(req: Req): SeriesRow {
  const s = req.db.series.find((x) => x.id === req.params.seriesId);
  if (!s || s.dojo_id !== req.params.dojoId) throw new HttpError(404, "Série introuvable");
  return s;
}

function slotIn(raw: unknown) {
  const slot = (raw ?? {}) as Record<string, unknown>;
  const weekday = Number(slot.weekday);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) invalid("weekday", "less_than_equal", "Input should be between 0 and 6");
  return { id: uid(), weekday, start_time: toTime(slot.start_time, "start_time"), end_time: toTime(slot.end_time, "end_time") };
}

/** Compte vu du back-office : seulement les personnes rattachées aux clubs de l'admin. */
function getScopedUser(req: Req, userId: string): UserRow {
  const scope = adminScope(req);
  const user = req.db.users.find((u) => u.id === userId);
  if (!user || !req.db.memberships.some((m) => m.user_id === user.id && scope.includes(m.dojo_id))) throw new HttpError(404, "Introuvable");
  return user;
}

// Les erreurs 422 portent la liste de champs façon Pydantic, que l'app met en
// forme ; HttpError du harnais ne connaît que `detail` texte, d'où cet habillage.
const routesAvecValidation: Route<Db>[] = routes.map(([method, pattern, handler]) => [
  method,
  pattern,
  async (req) => {
    try {
      return await handler(req);
    } catch (e) {
      const fields = (e as { fields?: unknown }).fields;
      if (e instanceof HttpError && e.status === 422 && fields) return json({ detail: fields }, 422);
      throw e;
    }
  },
]);

// « Mot de passe oublié » ouvre la page publique du site (siteUrl), à la racine
// du domaine : hors de la démo, elle mènerait à une page introuvable.
const ouvrir = window.open.bind(window);
window.open = (url?: string | URL, target?: string, features?: string) => {
  const cible = url ? new URL(String(url), location.href) : null;
  if (cible && cible.origin === location.origin && cible.pathname === "/mot-de-passe-oublie") {
    window.alert(
      "Démo : dans l'application réelle, ce lien ouvre la page « Mot de passe oublié » du club, qui envoie un e-mail de réinitialisation.\n\nComptes de démonstration : mot de passe « demo ».",
    );
    return null;
  }
  return ouvrir(url, target, features);
};

// Jeu de données neuf (première visite ou « Réinitialiser ») : le club retenu
// par compte (dojoapp.dojo.<compte>) repart aussi du premier club.
function freshSeed(): Db {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith("dojoapp.dojo.")) localStorage.removeItem(key);
  } catch {
    // stockage indisponible : rien à oublier
  }
  return seed();
}

installMockApi<Db>({
  base: BASE,
  name: "WONDO",
  tokenKey: "dojoapp.token",
  seed: freshSeed,
  routes: routesAvecValidation,
  // Expo Router gère lui-même ses liens, déjà préfixés par baseUrl.
  keepLinks: false,
  hint: `Élève : ${EMAIL_ELEVE} · Instructeur : ${EMAIL_INSTRUCTEUR} · Admin : ${EMAIL_ADMIN} — mot de passe « ${DEMO_PASSWORD} ».`,
  logins: [
    // L'accueil (/) oriente chaque compte vers l'espace le plus étendu de son club.
    { label: "Élève", token: tokenFor(USER_ELEVE), to: "/" },
    { label: "Instructeur", token: tokenFor(USER_INSTRUCTEUR), to: "/" },
    { label: "Admin du club", token: tokenFor(USER_ADMIN), to: "/" },
  ],
});
