import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faAward,
  faBuildingColumns,
  faCertificate,
  faCode,
  faGraduationCap,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import Reveal from "../ui/Reveal";
import { Lang, useLang, useT } from "../../i18n";

type Diplome = { annee: string; titre: string; detail: string; lieu: string };
type Certification = { annee: string; titre: string; lieu: string; icone: IconProp };
type HashCode = { annee: string; rang: number; total: number };
type Hackathon = { annee: string; titre: string; resultat: string; lieu: string };

type Contenu = {
  diplomes: Diplome[];
  certifications: Certification[];
  hackathon: Hackathon;
  hashcode: HashCode[];
};

// Classements Google HashCode identiques en FR et EN (seul le format des rangs change).
const HASHCODE: HashCode[] = [
  { annee: "2022", rang: 4728, total: 9031 },
  { annee: "2021", rang: 1545, total: 9004 },
  { annee: "2020", rang: 5830, total: 10724 },
];

const CONTENU: Record<Lang, Contenu> = {
  fr: {
    diplomes: [
      { annee: "2022", titre: "Master MIAGE", detail: "Spécialisation Data Science", lieu: "Université des Antilles (Guadeloupe)" },
      { annee: "2019", titre: "Licence MIAGE", detail: "Bachelor of Information Technology", lieu: "Université des Antilles (Guadeloupe)" },
    ],
    certifications: [
      { annee: "2024", titre: "SAFe 6.0 Scrum Master", lieu: "Scaled Agile Framework Inc.", icone: faAward },
      { annee: "2023", titre: "CS50x et CS50AI", lieu: "Harvard (Cambridge, Massachusetts)", icone: faCode },
    ],
    hackathon: { annee: "2022", titre: "Hack my Flat", resultat: "1ère place", lieu: "Hackathon de l'entreprise IAD" },
    hashcode: HASHCODE,
  },
  en: {
    diplomes: [
      { annee: "2022", titre: "Master's degree in MIAGE (IT for business)", detail: "Data Science specialisation", lieu: "Université des Antilles (Guadeloupe)" },
      { annee: "2019", titre: "Bachelor's degree in MIAGE", detail: "Bachelor of Information Technology", lieu: "Université des Antilles (Guadeloupe)" },
    ],
    certifications: [
      { annee: "2024", titre: "SAFe 6.0 Scrum Master", lieu: "Scaled Agile Framework Inc.", icone: faAward },
      { annee: "2023", titre: "CS50x and CS50AI", lieu: "Harvard (Cambridge, Massachusetts)", icone: faCode },
    ],
    hackathon: { annee: "2022", titre: "Hack my Flat", resultat: "1st place", lieu: "IAD company hackathon" },
    hashcode: HASHCODE,
  },
};

const card = "h-full rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-xl";

function EnTete({ icone, titre }: { icone: IconProp; titre: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/30 text-cyan-200 ring-1 ring-white/10">
        <FontAwesomeIcon icon={icone} />
      </span>
      <h3 className="text-xl font-semibold tracking-tight">{titre}</h3>
    </div>
  );
}

const anneeBadge =
  "inline-flex rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-cyan-200";

export default function Formation() {
  const lang = useLang();
  const t = useT();
  const c = CONTENU[lang];
  // Séparateur de milliers écrit à la main : identique au rendu serveur et navigateur.
  const nombre = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, lang === "fr" ? " " : ",");
  const rang = (n: number) => (lang === "fr" ? `${nombre(n)}e` : `${nombre(n)}th`);
  const meilleur = Math.min(...c.hashcode.map((h) => h.rang / h.total));

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-5 px-4 lg:grid-cols-5">
      {/* Diplômes : frise verticale */}
      <Reveal className="lg:col-span-3">
        <div className={card}>
          <EnTete icone={faGraduationCap} titre={t("Diplômes", "Degrees")} />
          <ol className="relative mt-8 space-y-8 border-l border-white/10 pl-6 ml-[21px]">
            {c.diplomes.map((d) => (
              <li key={d.titre} className="relative">
                <span
                  className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-cyan-300 bg-violet-600 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                  aria-hidden="true"
                />
                <span className={anneeBadge}>{d.annee}</span>
                <p className="mt-2 text-lg font-semibold leading-snug md:text-xl">{d.titre}</p>
                <p className="mt-1 font-medium text-cyan-200/90">{d.detail}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                  <FontAwesomeIcon icon={faBuildingColumns} className="text-xs" />
                  {d.lieu}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {/* Certifications */}
      <Reveal className="lg:col-span-2" delay={100}>
        <div className={card}>
          <EnTete icone={faCertificate} titre="Certifications" />
          <ul className="mt-8 space-y-4">
            {c.certifications.map((cert) => (
              <li
                key={cert.titre}
                className="group flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-cyan-400/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-200 transition-transform duration-300 group-hover:scale-110">
                  <FontAwesomeIcon icon={cert.icone} />
                </span>
                <div className="min-w-0">
                  <span className={anneeBadge}>{cert.annee}</span>
                  <p className="mt-1.5 font-semibold leading-snug">{cert.titre}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">{cert.lieu}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Concours */}
      <Reveal className="lg:col-span-5" delay={100}>
        <div className={card}>
          <EnTete icone={faTrophy} titre={t("Concours", "Competitions")} />
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {/* Victoire au hackathon mise en avant */}
            <div className="relative overflow-hidden rounded-xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 via-amber-500/5 to-transparent p-6 md:col-span-2">
              <FontAwesomeIcon
                icon={faTrophy}
                className="pointer-events-none absolute -bottom-4 -right-3 text-[7rem] text-amber-300/10"
                aria-hidden="true"
              />
              <div className="relative">
                <span className="inline-flex rounded-md border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-200">
                  {c.hackathon.annee}
                </span>
                <p className="mt-3 bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  {c.hackathon.resultat}
                </p>
                <p className="mt-2 text-lg font-semibold">{c.hackathon.titre}</p>
                <p className="mt-0.5 text-sm text-neutral-400">{c.hackathon.lieu}</p>
              </div>
            </div>

            {/* Google HashCode : classement sur trois éditions */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:col-span-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-semibold">Google HashCode</p>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {t("Classement mondial par équipe", "Worldwide team ranking")}
                </p>
              </div>
              <ul className="mt-5 space-y-4">
                {c.hashcode.map((h) => {
                  const part = h.rang / h.total;
                  const top = part === meilleur;
                  return (
                    <li key={h.annee} className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[3rem_1fr_9.5rem]">
                      <span className="text-sm font-semibold tabular-nums text-neutral-300">{h.annee}</span>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-white/10"
                        role="img"
                        aria-label={t(
                          `${rang(h.rang)} sur ${nombre(h.total)} équipes`,
                          `${rang(h.rang)} out of ${nombre(h.total)} teams`
                        )}
                      >
                        <div
                          className={`h-full rounded-full ${top ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/30"}`}
                          style={{ width: `${(1 - part) * 100}%` }}
                        />
                      </div>
                      <span className="col-start-2 text-sm tabular-nums text-neutral-300 sm:col-start-auto sm:text-right">
                        <span className={top ? "font-semibold text-cyan-200" : "font-semibold text-white"}>{rang(h.rang)}</span>
                        <span className="text-neutral-500"> / {nombre(h.total)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 text-xs text-neutral-500">
                {t(
                  "Barre : part des équipes classées derrière. Meilleur résultat en 2021 (top 17 %).",
                  "Bar: share of teams ranked below. Best result in 2021 (top 17%)."
                )}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
