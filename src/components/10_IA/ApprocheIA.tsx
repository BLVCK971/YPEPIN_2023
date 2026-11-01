import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCodePullRequest, faGears, faRobot, faTerminal, faUserCheck, faVial } from "@fortawesome/free-solid-svg-icons";
import Reveal from "../ui/Reveal";
import { Lang, useLang, useT } from "../../i18n";

// Développement assisté par IA : uniquement des pratiques réelles de Yoel
// (confirmées par lui) et adossées à des missions du parcours.
type Pratique = { icone: IconProp; titre: string; texte: string; preuve: string };

const PRATIQUES: Record<Lang, Pratique[]> = {
  fr: [
    {
      icone: faTerminal,
      titre: "Claude Code au quotidien",
      texte: "Des instructions de projet versionnées dans chaque dépôt (CLAUDE.md) : architecture, conventions et vérifications obligatoires. L'agent travaille dans un cadre défini, pas à l'aveugle.",
      preuve: "ERP KERA, WONDO, SESAM, ce site",
    },
    {
      icone: faGears,
      titre: "Automatisation du développement",
      texte: "Build, contrôle des types, lint, tests et déploiement enchaînés automatiquement (GitHub Actions) : un build qui échoue ne part pas en production.",
      preuve: "DREVIO, ARC, ERP KERA",
    },
    {
      icone: faRobot,
      titre: "Agents IA & MCP",
      texte: "Conception d'un serveur MCP pour ERP KERA (OAuth 2.1, demandes d'approbation), MCP Blender, Word et Unity au quotidien, et un agent simulant une utilisatrice pour éprouver une arborescence avant les vrais tests.",
      preuve: "ERP KERA, SESAM",
    },
    {
      icone: faVial,
      titre: "Tests automatisés",
      texte: "Le code produit avec l'IA est couvert comme le reste : environ 650 tests sur Aivocat, plus de 3 000 sur ERP KERA, 78 sur l'outil de migration Excel de SESAM.",
      preuve: "Aivocat, ERP KERA, SESAM",
    },
    {
      icone: faCodePullRequest,
      titre: "Revue de code & qualité",
      texte: "Chaque modification est relue, comprise et durcie avant d'être fusionnée, qu'elle vienne d'un développeur ou d'un assistant IA.",
      preuve: "DREVIO · 140+ PR relues",
    },
    {
      icone: faUserCheck,
      titre: "Supervision humaine",
      texte: "Les sorties de l'IA sont mesurées (« jury » d'évaluation, seuils d'abstention) et les actions sensibles exigent une validation humaine : l'IA prépare, l'humain décide.",
      preuve: "Aivocat, ERP KERA",
    },
  ],
  en: [
    {
      icone: faTerminal,
      titre: "Claude Code every day",
      texte: "Project instructions versioned in every repository (CLAUDE.md): architecture, conventions and mandatory checks. The agent works within a defined frame, not blindly.",
      preuve: "ERP KERA, WONDO, SESAM, this site",
    },
    {
      icone: faGears,
      titre: "Development automation",
      texte: "Build, type checking, lint, tests and deployment chained automatically (GitHub Actions): a failing build never reaches production.",
      preuve: "DREVIO, ARC, ERP KERA",
    },
    {
      icone: faRobot,
      titre: "AI agents & MCP",
      texte: "Designed an MCP server for ERP KERA (OAuth 2.1, approval requests), daily use of the Blender, Word and Unity MCPs, and an agent simulating a user to test a folder structure before real user tests.",
      preuve: "ERP KERA, SESAM",
    },
    {
      icone: faVial,
      titre: "Automated testing",
      texte: "AI-assisted code is covered like the rest: about 650 tests on Aivocat, 3,000+ on ERP KERA, 78 on SESAM's Excel migration tool.",
      preuve: "Aivocat, ERP KERA, SESAM",
    },
    {
      icone: faCodePullRequest,
      titre: "Code review & quality",
      texte: "Every change is reviewed, understood and hardened before it is merged, whether it comes from a developer or an AI assistant.",
      preuve: "DREVIO · 140+ PRs reviewed",
    },
    {
      icone: faUserCheck,
      titre: "Human oversight",
      texte: "AI outputs are measured (evaluation “jury”, abstention thresholds) and sensitive actions require human approval: the AI prepares, a human decides.",
      preuve: "Aivocat, ERP KERA",
    },
  ],
};

const OUTILS = ["Claude Code", "OpenClaw", "ChatGPT", "Qwen (Ollama)", "ComfyUI", "Strata", "MCP : Blender, Word, Unity, ERP KERA"];

export default function ApprocheIA() {
  const lang = useLang();
  const t = useT();
  return (
    <div className="flex w-full max-w-6xl flex-col gap-10 px-4">
      <Reveal>
        <p className="max-w-3xl text-base md:text-lg leading-relaxed text-neutral-300">
          {t(
            "L'IA est un accélérateur d'ingénierie, pas un pilote automatique. Je conçois l'architecture et découpe le travail ; l'IA aide à produire ; chaque résultat passe par des tests, une relecture et une validation humaine avant d'être livré.",
            "AI is an engineering accelerator, not an autopilot. I design the architecture and split the work; AI helps produce it; every result goes through tests, review and human validation before it ships."
          )}
        </p>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRATIQUES[lang].map((p, i) => (
          <Reveal key={p.titre} delay={(i % 3) * 100} className="h-full">
            <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/30 text-cyan-200 ring-1 ring-white/10">
                <FontAwesomeIcon icon={p.icone} />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.titre}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-300">{p.texte}</p>
              <p className="mt-auto pt-4 text-xs text-neutral-500">{p.preuve}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl md:flex-row md:items-center">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-400">{t("Outils", "Tools")}</p>
          <ul className="flex flex-wrap gap-2">
            {OUTILS.map((o) => (
              <li key={o} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-sm text-neutral-200">
                {o}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
