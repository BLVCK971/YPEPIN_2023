// Lecture d'un fichier client pour l'import, portée de backend/app/excel_import.py :
// mêmes mots-clés d'en-tête, même détection par le contenu, même lecture des
// montants et des dates à la française.
// Un CSV est réellement lu dans le navigateur. Un classeur Excel ne peut pas
// l'être sans bibliothèque : la démo lui substitue un export fictif plausible
// du client choisi (mêmes factures que ses dossiers, un acompte encaissé,
// une facture disparue, de nouvelles lignes), toujours le même pour un même
// nom de fichier, afin que l'aperçu et l'import concordent.
import type { ColumnMapping, Db } from "./data";
import { CLOSED, frDate } from "./data";
import { HttpError, jourIlYa } from "../shared/runtime";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DEBTOR_KEYWORDS = ["nom du debiteur", "nom debiteur", "debiteur", "raison sociale", "societe", "entreprise", "client", "contact", "nom"];
const AMOUNT_KEYWORDS = ["montant du", "montant a payer", "montant restant", "reste du", "reste a payer", "solde du", "solde", "montant ttc", "montant ht", "montant", "creance", "total"];
const PHONE_KEYWORDS = ["telephone", "tel", "portable", "mobile", "gsm", "fixe"];
const EMAIL_KEYWORDS = ["adresse e-mail", "adresse mail", "e-mail", "email", "mail", "courriel"];
const INVOICE_REF_KEYWORDS = ["code facture", "numero de facture", "numero facture", "num facture", "reference facture", "n facture", "no facture", "no de facture", "facture n"];
const DATE_KEYWORDS = ["date de facture", "date facture", "date"];
const OTHER_REF_WORDS = ["devis", "commande", "chantier", "origine", "avoir", "bon de"];

const REFERENCE_LIKE_RE = /^[A-Za-z]{1,6}[-_/ .]?\d{3,}[A-Za-z0-9\-_/]*$/;
const NUMERIC_RE = /^-?[\d\s., ]+$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NOTES_FILE_MARKER = "Infos fichier :";

export interface Row {
  debtor_name: string;
  amount: number | null;
  debtor_phone: string | null;
  debtor_email: string | null;
  invoice_reference: string | null;
  invoice_date: string | null;
  leftover_label: string;
}

export interface ParsedFile {
  labels: string[];
  rowsTotal: number;
  mapping: ColumnMapping;
  detected: ColumnMapping;
  rows: Row[];
}

const emptyMapping = (): ColumnMapping => ({
  debtor_name: null,
  amount: null,
  debtor_phone: [],
  debtor_email: null,
  invoice_reference: null,
  invoice_date: null,
});

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/°/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (kw: string) => new RegExp(`\\b${escapeRe(kw)}\\b`);

function findColumn(headers: string[], keywords: string[]): number | null {
  const norm = headers.map(normalize);
  for (const kw of keywords) {
    const re = wordRe(kw);
    const i = norm.findIndex((h) => re.test(h));
    if (i >= 0) return i;
  }
  return null;
}

function findAllColumns(headers: string[], keywords: string[]): number[] {
  const res = keywords.map(wordRe);
  return headers.map(normalize).flatMap((h, i) => (res.some((re) => re.test(h)) ? [i] : []));
}

function parseAmount(raw: string): number | null {
  if (!raw || !NUMERIC_RE.test(raw.trim())) return null;
  let cleaned = raw.trim().replace(/[\s ]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  else if (cleaned.includes(",")) cleaned = cleaned.replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function parseDate(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (dmy) [d, m, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

const column = (rows: string[][], i: number) => rows.map((r) => r[i] ?? "");

function guessAmountColumn(rows: string[][], ncols: number): number | null {
  let best: number | null = null;
  let bestRatio = 0;
  for (let i = 0; i < ncols; i++) {
    const filled = column(rows, i).filter(Boolean);
    if (!filled.length) continue;
    const ratio = filled.filter((v) => parseAmount(v) !== null).length / filled.length;
    if (ratio >= 0.6 && ratio > bestRatio) [best, bestRatio] = [i, ratio];
  }
  return best;
}

function guessDebtorColumn(rows: string[][], ncols: number, exclude: number | null): number | null {
  for (let i = 0; i < ncols; i++) if (i !== exclude && column(rows, i).some(Boolean)) return i;
  return null;
}

function guessEmailColumn(rows: string[][], ncols: number): number | null {
  for (let i = 0; i < ncols; i++) {
    const filled = column(rows, i).filter(Boolean);
    if (filled.length && filled.filter((v) => EMAIL_RE.test(v)).length / filled.length >= 0.5) return i;
  }
  return null;
}

function guessInvoiceRefColumn(headers: string[] | null, rows: string[][], ncols: number, exclude: Set<number>): number | null {
  if (!rows.length) return null;
  const norm = headers ? headers.map(normalize) : [];
  for (let i = 0; i < ncols; i++) {
    if (exclude.has(i)) continue;
    if (norm[i] && OTHER_REF_WORDS.some((w) => norm[i].includes(w))) continue;
    const filled = column(rows, i).map((v) => v.trim()).filter(Boolean);
    if (filled.length < rows.length * 0.8) continue;
    if (filled.filter((v) => REFERENCE_LIKE_RE.test(v)).length < filled.length * 0.8) continue;
    if (new Set(filled).size < filled.length * 0.95) continue;
    return i;
  }
  return null;
}

function detectMapping(headers: string[] | null, rows: string[][], ncols: number): ColumnMapping {
  let debtor = headers ? findColumn(headers, DEBTOR_KEYWORDS) : null;
  let amount = headers ? findColumn(headers, AMOUNT_KEYWORDS) : null;
  const phones = headers ? findAllColumns(headers, PHONE_KEYWORDS) : [];
  let email = headers ? findColumn(headers, EMAIL_KEYWORDS) : null;
  let ref = headers ? findColumn(headers, INVOICE_REF_KEYWORDS) : null;
  const date = headers ? findColumn(headers, DATE_KEYWORDS) : null;

  if (amount === null) amount = guessAmountColumn(rows, ncols);
  if (debtor === null) debtor = guessDebtorColumn(rows, ncols, amount);
  if (email === null) email = guessEmailColumn(rows, ncols);
  if (ref === null) {
    const taken = new Set([debtor, amount, email, date, ...phones].filter((c): c is number => c !== null));
    ref = guessInvoiceRefColumn(headers, rows, ncols, taken);
  }
  return { debtor_name: debtor, amount, debtor_phone: phones, debtor_email: email, invoice_reference: ref, invoice_date: date };
}

/** Correspondance relue en écartant les colonnes absentes de CE fichier. */
function clampMapping(data: Partial<ColumnMapping>, ncols: number): ColumnMapping {
  const one = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < ncols ? v : null);
  const phones = Array.isArray(data.debtor_phone) ? data.debtor_phone : typeof data.debtor_phone === "number" ? [data.debtor_phone] : [];
  return {
    debtor_name: one(data.debtor_name),
    amount: one(data.amount),
    debtor_phone: phones.filter((c) => one(c) !== null),
    debtor_email: one(data.debtor_email),
    invoice_reference: one(data.invoice_reference),
    invoice_date: one(data.invoice_date),
  };
}

function usedColumns(m: ColumnMapping): Set<number> {
  const used = [m.debtor_name, m.amount, m.debtor_email, m.invoice_reference, m.invoice_date].filter((c): c is number => c !== null);
  return new Set([...used, ...m.debtor_phone]);
}

function parseRows(headers: string[] | null, rows: string[][], ncols: number, m: ColumnMapping): Row[] {
  const structured = usedColumns(m);
  const out: Row[] = [];
  for (const row of rows) {
    const cells = Array.from({ length: ncols }, (_, i) => row[i] ?? "");
    const cell = (i: number | null) => (i === null ? "" : cells[i].trim());
    const label = (keep: (i: number) => boolean) =>
      cells
        .map((v, i) => (v && keep(i) ? (headers?.[i] ? `${headers[i]}: ${v}` : v) : ""))
        .filter(Boolean)
        .join(" · ");
    let debtor = cell(m.debtor_name);
    const raw = label(() => true);
    if (m.debtor_name !== null) {
      if (!debtor) continue; // ligne de total / sous-total
    } else {
      if (!raw) continue;
      debtor = raw.slice(0, 255);
    }
    const phone = m.debtor_phone.map((c) => cells[c].trim()).find(Boolean) ?? null;
    out.push({
      debtor_name: debtor,
      amount: m.amount === null ? null : parseAmount(cells[m.amount]),
      debtor_phone: phone ? phone.slice(0, 50) : null,
      debtor_email: cell(m.debtor_email) || null,
      invoice_reference: cell(m.invoice_reference).slice(0, 100) || null,
      invoice_date: m.invoice_date === null ? null : parseDate(cells[m.invoice_date]),
      leftover_label: label((i) => !structured.has(i)),
    });
  }
  return out;
}

function columnLetter(index: number): string {
  let letters = "";
  let i = index;
  for (;;) {
    letters = String.fromCharCode(65 + (i % 26)) + letters;
    i = Math.floor(i / 26);
    if (i === 0) return letters;
    i -= 1;
  }
}

// --- Lecture du contenu --------------------------------------------------------

function rowsFromCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const sample = clean.slice(0, 2048);
  const sep = (sample.match(/;/g)?.length ?? 0) >= (sample.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    const cells = row.map((c) => c.trim());
    if (cells.some(Boolean)) rows.push(cells);
    row = [];
    cell = "";
  };
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n") endRow();
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) endRow();
  if (rows.length > 20_000) throw new HttpError(400, "Fichier trop long (20 000 lignes max).");
  return rows;
}

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const NOUVEAUX_DEBITEURS: [string, string, string][] = [
  ["Boucherie du Marché Saint-Antoine", "0590 82 17 45", "boucherie.st-antoine@mail.example"],
  ["SARL Ébénisterie Créole", "0690 27 63 90", "contact@ebenisterie-creole.example"],
  ["Auto-école Ti-Volan", "0690 44 81 06", ""],
  ["Mme Christelle Lambourdière", "0690 93 20 57", "c.lambourdiere@mail.example"],
  ["Snack Bokit Lakaz", "0690 71 48 32", ""],
  ["Location Kayak Grand Cul-de-Sac", "0690 66 05 19", "resa@kayak-gcs.example"],
  ["Cabinet d'architecte Ti Kaz", "0590 89 33 71", "agence@tikaz-archi.example"],
  ["Rhumerie artisanale Belle Anse", "0590 98 12 64", "compta@belleanse-rhum.example"],
  ["M. Dimitri Rosier", "0690 38 74 25", ""],
  ["Salon de coiffure Kréyòl Style", "0690 52 19 88", "kreyolstyle@mail.example"],
];

const fmtAmount = (n: number) => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Export Excel fictif du client, déterministe pour un même nom de fichier. */
function sampleRows(db: Db, clientId: string, filename: string): string[][] {
  const h = hash(`${clientId}|${filename}`);
  const live = db.dossiers
    .filter((d) => d.client_id === clientId && !d.deleted_at && d.invoice_reference && !CLOSED.includes(d.status))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const rows: string[][] = [["N° Facture", "Date facture", "Client", "Téléphone", "Email", "Montant TTC", "Reste dû", "Ville"]];
  const villes = ["Pointe-à-Pitre", "Baie-Mahault", "Le Gosier", "Les Abymes", "Sainte-Anne", "Le Lamentin", "Fort-de-France"];
  // La plus ancienne facture n'est plus dans le fichier (abandonnée par le
  // client) ; une autre a reçu un acompte.
  live.slice(live.length > 2 ? 1 : 0).forEach((d, i) => {
    const acompte = i === 0 && d.amount >= 500 ? Math.round((d.amount * 0.3) / 10) * 10 : 0;
    rows.push([
      d.invoice_reference!,
      frDate(d.invoice_date),
      d.debtor_name,
      d.debtor_phone ?? `0690 ${String(10 + ((h >>> i) % 89)).padStart(2, "0")} ${String(10 + i * 7)} ${String(20 + i * 3)}`,
      d.debtor_email ?? "",
      fmtAmount(d.amount),
      fmtAmount(d.amount - acompte),
      villes[(h + i) % villes.length],
    ]);
  });
  // Nouvelles factures numérotées comme celles du client (même préfixe, même largeur).
  const modele = live[0]?.invoice_reference ?? "FA-2026-0000";
  const prefix = modele.replace(/\d+$/, "");
  const largeur = modele.length - prefix.length;
  const ref = (n: number) => `${prefix}${String(n).padStart(largeur, "0")}`;
  const taken = new Set(db.dossiers.map((d) => d.invoice_reference));
  for (let k = 0; k < 3; k++) {
    const [nom, tel, mail] = NOUVEAUX_DEBITEURS[(h + k * 3) % NOUVEAUX_DEBITEURS.length];
    let num = 900 + ((h >>> (k * 4)) % 90);
    while (taken.has(ref(num))) num++;
    taken.add(ref(num));
    const montant = 380 + ((h >>> (k * 5)) % 4200);
    rows.push([
      ref(num),
      frDate(jourIlYa(20 + k * 6)),
      nom,
      tel,
      mail,
      fmtAmount(montant),
      k === 2 ? "à vérifier" : fmtAmount(montant),
      villes[(h + k + 3) % villes.length],
    ]);
  }
  // Ligne de total en bas de l'export : ignorée (pas de débiteur).
  rows.push(["", "", "", "", "", "", "TOTAL", ""]);
  return rows;
}

/** Lit le fichier puis lui applique la correspondance fournie, ou la détection. */
export async function parseFile(db: Db, clientId: string, file: File, hasHeader: boolean, mapping: Partial<ColumnMapping> | null): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE) throw new HttpError(413, "Fichier trop volumineux (5 Mo max).");
  const name = file.name.toLowerCase();
  let all: string[][];
  if (name.endsWith(".csv")) all = rowsFromCsv(await file.text());
  else if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) all = sampleRows(db, clientId, file.name);
  else throw new HttpError(400, "Format non supporté. Utilisez un fichier .xlsx ou .csv.");

  if (!all.length) return { labels: [], rowsTotal: 0, mapping: emptyMapping(), detected: emptyMapping(), rows: [] };
  const headers = hasHeader ? all[0] : null;
  const data = hasHeader ? all.slice(1) : all;
  const ncols = Math.max(...(headers ? [headers] : []).concat(data).map((r) => r.length));
  const labels = Array.from({ length: ncols }, (_, i) => headers?.[i]?.trim() || `Colonne ${columnLetter(i)}`);
  if (!data.length) return { labels, rowsTotal: 0, mapping: emptyMapping(), detected: emptyMapping(), rows: [] };

  const detected = detectMapping(headers, data, ncols);
  const applied = mapping ? clampMapping(mapping, ncols) : detected;
  return { labels, rowsTotal: data.length, mapping: applied, detected, rows: parseRows(headers, data, ncols, applied) };
}

/** Numéro de facture resté dans les notes d'un dossier importé : [référence, colonne d'origine]. */
export function referenceFromNotes(notes: string | null): [string, string] | null {
  if (!notes || !notes.includes(NOTES_FILE_MARKER)) return null;
  const segments = notes.split(NOTES_FILE_MARKER)[1].split("·").map((s) => s.trim());
  const labelled: [string, string][] = [];
  for (const seg of segments) {
    const i = seg.indexOf(":");
    if (i >= 0 && seg.slice(i + 1).trim()) labelled.push([seg.slice(0, i).trim(), seg.slice(i + 1).trim()]);
  }
  for (const kw of INVOICE_REF_KEYWORDS) {
    const hit = labelled.find(([label]) => normalize(label).includes(kw));
    if (hit) return [hit[1].slice(0, 100), hit[0]];
  }
  for (const [label, value] of labelled) {
    if (OTHER_REF_WORDS.some((w) => normalize(label).includes(w))) continue;
    if (REFERENCE_LIKE_RE.test(value)) return [value.slice(0, 100), label];
  }
  const bare = segments.find((s) => !s.includes(":") && REFERENCE_LIKE_RE.test(s));
  return bare ? [bare.slice(0, 100), "format reconnu"] : null;
}
