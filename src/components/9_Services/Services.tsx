import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faBrain,
  faChartLine,
  faCode,
  faComments,
  faPeopleGroup,
  faRocket,
  faServer,
  faSitemap,
} from "@fortawesome/free-solid-svg-icons";
import Reveal from "../ui/Reveal";

// Offres freelance ICEKERA : chaque offre s'appuie sur des missions réellement
// livrées (voir Parcours et Projets). Pas de tarif ni de promesse inventée.
type Offre = {
  icone: IconProp;
  titre: string;
  promesse: string;
  inclus: string[];
  preuves: string[];
};

const OFFRES: Offre[] = [
  {
    icone: faCode,
    titre: "Développement sur mesure",
    promesse: "Sites, CRM, portails clients et applications métier, de la conception à la mise en production.",
    inclus: [
      "Web, mobile (React Native) et API (.NET, FastAPI)",
      "Base de données, authentification et rôles",
      "Déploiement Docker et CI/CD sur votre serveur",
    ],
    preuves: ["ARC Gestion et Recouvrement", "Matheva", "DREVIO"],
  },
  {
    icone: faBrain,
    titre: "IA locale & confidentielle",
    promesse: "Des assistants IA qui travaillent sur vos documents sans qu'aucune donnée ne quitte vos locaux.",
    inclus: [
      "RAG sur vos documents, avec réponses sourcées",
      "LLM locaux (Ollama, Qwen) ou API selon le besoin",
      "OCR, recherche hybride et évaluation de la qualité",
    ],
    preuves: ["Aivocat", "DREVIO (analyse IA)", "ARC (comptes rendus IA)"],
  },
  {
    icone: faServer,
    titre: "Audit, migration & sécurité du SI",
    promesse: "Reprendre en main un système d'information : données, serveurs, logiciels métier et accès.",
    inclus: [
      "Audit outillé et en lecture seule de vos fichiers",
      "Migrations (NAS, serveurs, Sage Batigest, Excel)",
      "Droits d'accès, accès distant sécurisé, sauvegarde",
    ],
    preuves: ["SESAM", "Valado"],
  },
  {
    icone: faChartLine,
    titre: "Automatisation & data",
    promesse: "Automatiser les tâches répétitives et transformer vos données en tableaux de bord utiles.",
    inclus: [
      "Robots de collecte et ETL (Python, AWS)",
      "Traitements à grande échelle et en parallèle",
      "Rapports Power BI et formation de vos équipes",
    ],
    preuves: ["ATMP · ~5 000 comptes", "SYLAE", "Power BI (DIGITOM)"],
  },
  {
    icone: faSitemap,
    titre: "Tech Lead & architecte à temps partagé",
    promesse: "Cadrer le produit, choisir l'architecture et faire avancer une équipe de développement.",
    inclus: [
      "Architecture, stack et découpage en lots livrables",
      "Revue de code et qualité (tests, CI)",
      "Animation Agile (Scrum Master SAFe certifié)",
    ],
    preuves: ["DREVIO · 140+ PR relues", "Schneider Electric (SAFe)"],
  },
];

const ETAPES: { icone: IconProp; titre: string; texte: string }[] = [
  { icone: faComments, titre: "Échange", texte: "Comprendre votre besoin, vos contraintes et vos priorités." },
  { icone: faSitemap, titre: "Cadrage", texte: "Périmètre, architecture et découpage en lots livrables." },
  { icone: faCode, titre: "Livraisons par lots", texte: "Des versions utilisables régulièrement, testées et relues." },
  { icone: faRocket, titre: "Mise en production", texte: "Déploiement automatisé, documentation et passation." },
];

export default function Services() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-12 px-4">
      <Reveal>
        <p className="max-w-3xl text-base md:text-lg leading-relaxed text-neutral-300">
          En freelance sous la marque <span className="font-semibold text-white">ICEKERA</span> (EI Yoel PEPIN),
          j'accompagne entreprises et indépendants, en Guadeloupe, en France et à distance. Chaque offre
          ci-dessous s'appuie sur des projets réellement livrés.
        </p>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OFFRES.map((o, i) => (
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Réalisé pour</p>
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

        {/* Carte d'appel à l'action */}
        <Reveal delay={200}>
          <a
            href="#Contact"
            className="group flex h-full min-h-[16rem] flex-col justify-between rounded-2xl border border-dashed border-cyan-400/40 bg-gradient-to-br from-violet-600/20 to-cyan-500/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-violet-900/30"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Un autre besoin ?</p>
              <p className="mt-3 text-xl font-semibold tracking-tight">
                Parlons de votre projet, même s'il ne rentre dans aucune case.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-medium text-cyan-200">
              Discutons-en
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </a>
        </Reveal>
      </div>

      {/* Façon de travailler */}
      <Reveal>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-xl">
          <h3 className="text-xl font-semibold tracking-tight">Comment je travaille</h3>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map((e, i) => (
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
