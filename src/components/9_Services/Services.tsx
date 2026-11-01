import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faBrain,
  faChartLine,
  faCode,
  faComments,
  faRocket,
  faServer,
  faSitemap,
} from "@fortawesome/free-solid-svg-icons";
import Reveal from "../ui/Reveal";
import { Lang, useLang, useT } from "../../i18n";

// Offres freelance ICEKERA : chaque offre s'appuie sur des missions réellement
// livrées (voir Parcours et Projets). Pas de tarif ni de promesse inventée.
type Offre = {
  icone: IconProp;
  titre: string;
  promesse: string;
  inclus: string[];
  preuves: string[];
};

const OFFRES_FR: Offre[] = [
  {
    icone: faCode,
    titre: "Architecture & développement logiciel",
    promesse: "Applications métier, API et plateformes web ou mobiles conçues pour durer, de l'architecture à la mise en production.",
    inclus: [
      ".NET / C#, Python (FastAPI, Django), Angular, React",
      "Applications métier, API, SaaS et mobile (React Native)",
      "Tests, CI/CD et déploiement Docker",
    ],
    preuves: ["ERP KERA", "DREVIO", "ARC Gestion et Recouvrement", "WONDO"],
  },
  {
    icone: faBrain,
    titre: "AI Solutions",
    promesse: "Concevoir et livrer une solution IA complète, intégrée à vos outils et à vos données, avec des résultats vérifiables.",
    inclus: [
      "IA locale et souveraine (Ollama, Qwen) ou API (OpenAI, Claude)",
      "RAG sur vos documents, avec réponses sourcées",
      "Intégration de LLM, agents IA et serveurs MCP",
      "Automatisation intelligente, analyse d'images et de documents",
    ],
    preuves: ["Aivocat", "DREVIO (analyse IA)", "ERP KERA (MCP)", "ARC (comptes rendus IA)"],
  },
  {
    icone: faSitemap,
    titre: "Tech Lead & pilotage technique",
    promesse: "Prendre la responsabilité technique d'un produit : architecture, organisation de l'équipe et qualité des livrables.",
    inclus: [
      "Architecture logicielle, choix de stack et découpage en lots livrables",
      "Encadrement de développeurs et revue de code",
      "Organisation technique, tests et CI ; animation Agile (Scrum Master SAFe certifié)",
    ],
    preuves: ["DREVIO · 140+ PR relues", "Business Zone (DIGITOM)", "Schneider Electric (SAFe)"],
  },
];

// Offres secondaires : toujours proposées, présentées en plus petit
type Secondaire = { icone: IconProp; titre: string; texte: string };

const SECONDAIRES_FR: Secondaire[] = [
  { icone: faServer, titre: "Audit, migration & sécurité du SI", texte: "Données, serveurs, logiciels métier et accès (SESAM, Valado)." },
  { icone: faChartLine, titre: "Automatisation & data", texte: "Robots de collecte, ETL, traitements à grande échelle, Power BI (ATMP, SYLAE, DIGITOM)." },
];

type Etape = { icone: IconProp; titre: string; texte: string };

const ETAPES_FR: Etape[] = [
  { icone: faComments, titre: "Échange", texte: "Comprendre votre besoin, vos contraintes et vos priorités." },
  { icone: faSitemap, titre: "Cadrage", texte: "Périmètre, architecture et découpage en lots livrables." },
  { icone: faCode, titre: "Livraisons par lots", texte: "Des versions utilisables régulièrement, testées et relues." },
  { icone: faRocket, titre: "Mise en production", texte: "Déploiement automatisé, documentation et passation." },
];

const OFFRES_EN: Offre[] = [
  {
    icone: faCode,
    titre: "Software architecture & development",
    promesse: "Business applications, APIs and web or mobile platforms built to last, from architecture to production.",
    inclus: [
      ".NET / C#, Python (FastAPI, Django), Angular, React",
      "Business applications, APIs, SaaS and mobile (React Native)",
      "Tests, CI/CD and Docker deployment",
    ],
    preuves: ["ERP KERA", "DREVIO", "ARC Gestion et Recouvrement", "WONDO"],
  },
  {
    icone: faBrain,
    titre: "AI Solutions",
    promesse: "Design and deliver a complete AI solution, integrated with your tools and data, with verifiable results.",
    inclus: [
      "Local, sovereign AI (Ollama, Qwen) or APIs (OpenAI, Claude)",
      "RAG on your documents, with sourced answers",
      "LLM integration, AI agents and MCP servers",
      "Intelligent automation, image and document analysis",
    ],
    preuves: ["Aivocat", "DREVIO (AI analysis)", "ERP KERA (MCP)", "ARC (AI reports)"],
  },
  {
    icone: faSitemap,
    titre: "Tech Lead & technical management",
    promesse: "Take technical ownership of a product: architecture, team organisation and quality of deliverables.",
    inclus: [
      "Software architecture, stack choices and split into deliverable work packages",
      "Mentoring developers and code review",
      "Technical organisation, tests and CI; Agile facilitation (certified SAFe Scrum Master)",
    ],
    preuves: ["DREVIO · 140+ PRs reviewed", "Business Zone (DIGITOM)", "Schneider Electric (SAFe)"],
  },
];

const SECONDAIRES_EN: Secondaire[] = [
  { icone: faServer, titre: "IT audit, migration & security", texte: "Data, servers, business software and access (SESAM, Valado)." },
  { icone: faChartLine, titre: "Automation & data", texte: "Data collection bots, ETL, large-scale processing, Power BI (ATMP, SYLAE, DIGITOM)." },
];

const ETAPES_EN: Etape[] = [
  { icone: faComments, titre: "Discussion", texte: "Understand your needs, your constraints and your priorities." },
  { icone: faSitemap, titre: "Scoping", texte: "Scope, architecture and split into deliverable work packages." },
  { icone: faCode, titre: "Incremental delivery", texte: "Usable versions delivered regularly, tested and reviewed." },
  { icone: faRocket, titre: "Go-live", texte: "Automated deployment, documentation and handover." },
];

const OFFRES: Record<Lang, Offre[]> = { fr: OFFRES_FR, en: OFFRES_EN };
const SECONDAIRES: Record<Lang, Secondaire[]> = { fr: SECONDAIRES_FR, en: SECONDAIRES_EN };

const lienProduit = "font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline";
const ETAPES: Record<Lang, Etape[]> = { fr: ETAPES_FR, en: ETAPES_EN };

export default function Services() {
  const lang = useLang();
  const t = useT();
  return (
    <div className="flex w-full max-w-6xl flex-col gap-12 px-4">
      <Reveal>
        <p className="max-w-3xl text-base md:text-lg leading-relaxed text-neutral-300">
          {t("En freelance sous la marque", "As a freelancer under the")}{" "}
          <span className="font-semibold text-white">ICEKERA</span>{" "}
          {t(
            "(EI Yoel PEPIN), j'accompagne entreprises et indépendants, en Guadeloupe, en France et à distance. Chaque offre ci-dessous s'appuie sur des projets réellement livrés.",
            "brand (EI Yoel PEPIN), I support companies and independent professionals in Guadeloupe, in France and remotely. Each offer below is backed by projects actually delivered."
          )}
        </p>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-neutral-400">
          {t("Produits ICEKERA :", "ICEKERA products:")}{" "}
          <a href="https://erp.kera.gp" target="_blank" rel="noopener" className={lienProduit}>
            ERP KERA
          </a>
          {t(
            ", le logiciel de gestion et de facturation des indépendants et TPE de Guadeloupe, et ",
            ", management and invoicing software for freelancers and small businesses in Guadeloupe, and "
          )}
          <a href="https://kera.gp" target="_blank" rel="noopener" className={lienProduit}>
            KERA GP
          </a>
          {t(", le portail des applications développées en Guadeloupe.", ", a portal of apps built in Guadeloupe.")}
        </p>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {OFFRES[lang].map((o, i) => (
          <Reveal key={o.titre} delay={(i % 3) * 100}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-violet-900/30">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-400/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/30 text-cyan-200 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                  <FontAwesomeIcon icon={o.icone} />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{o.titre}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-300">{o.promesse}</p>
                <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                  {o.inclus.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t("Réalisé pour", "Delivered for")}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {o.preuves.map((p) => (
                      <li key={p} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </Reveal>
        ))}

      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t("Également", "Also")}</p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2">
              {SECONDAIRES[lang].map((o) => (
                <li key={o.titre} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-200">
                    <FontAwesomeIcon icon={o.icone} className="text-sm" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{o.titre}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">{o.texte}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Carte d'appel à l'action */}
        <Reveal delay={100}>
          <a
            href="#Contact"
            className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-cyan-400/40 bg-gradient-to-br from-violet-600/20 to-cyan-500/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-violet-900/30"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">{t("Un autre besoin ?", "Something else?")}</p>
              <p className="mt-3 text-xl font-semibold tracking-tight">
                {t("Parlons de votre projet, même s'il ne rentre dans aucune case.", "Let's talk about your project, even if it doesn't fit in any box.")}
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-medium text-cyan-200">
              {t("Discutons-en", "Let's discuss it")}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </a>
        </Reveal>
      </div>

      {/* Façon de travailler */}
      <Reveal>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-xl">
          <h3 className="text-xl font-semibold tracking-tight">{t("Comment je travaille", "How I work")}</h3>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES[lang].map((e, i) => (
              <li key={e.titre} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-sm font-semibold text-cyan-200 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="font-semibold">{e.titre}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </div>
  );
}
