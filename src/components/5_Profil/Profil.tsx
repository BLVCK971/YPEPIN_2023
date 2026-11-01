import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faMicrosoft, faPython } from "@fortawesome/free-brands-svg-icons";
import { faBrain, faCode, faLayerGroup, faPeopleGroup, faSitemap } from "@fortawesome/free-solid-svg-icons";
import StackGraph from "./StackGraph";
import { Lang, useLang, useT } from "../../i18n";

// Les quatre compétences du positionnement, chacune adossée à des missions du
// parcours (aucune réalisation qui n'y figure pas). Termes IA en anglais.
type Pilier = { icone: IconProp; titre: string; texte: string; preuves: string[] };

const PILIERS: Record<Lang, Pilier[]> = { fr: [
  {
    icone: faCode,
    titre: "Ingénierie logicielle senior",
    texte: "Applications professionnelles complexes en .NET et Python, du desktop industriel au cloud : modernisation de systèmes legacy, automatisation à grande échelle, BI, avec tests et CI/CD.",
    preuves: ["Schneider Electric", "Ayming", "ERP KERA"],
  },
  {
    icone: faPeopleGroup,
    titre: "Technical Leadership",
    texte: "Encadrement de développeurs, découpage du produit en lots livrables, revue de code et supervision de la qualité des livrables. Scrum Master SAFe certifié.",
    preuves: ["DREVIO · 140+ PR relues", "Business Zone", "SAFe (8 personnes)"],
  },
  {
    icone: faSitemap,
    titre: "Architecture logicielle",
    texte: "Conception de solutions complètes : choix technologiques, API et workflows, intégration de systèmes, sécurité et déploiement. Architectures décidées et portées de bout en bout.",
    preuves: ["DREVIO", "ATMP · AWS", "ERP KERA", "Aivocat"],
  },
  {
    icone: faBrain,
    titre: "AI Solutions Engineering",
    texte: "Solutions intégrant des modèles d'IA comme des briques logicielles à part entière : RAG local, LLM (Qwen, OpenAI, Claude), analyse d'images, agents et serveurs MCP, avec évaluation et supervision humaine.",
    preuves: ["Aivocat", "DREVIO", "ERP KERA · MCP"],
  },
], en: [
  {
    icone: faCode,
    titre: "Senior Software Engineering",
    texte: "Complex business applications in .NET and Python, from industrial desktop software to the cloud: legacy modernisation, large-scale automation, BI, with tests and CI/CD.",
    preuves: ["Schneider Electric", "Ayming", "ERP KERA"],
  },
  {
    icone: faPeopleGroup,
    titre: "Technical Leadership",
    texte: "Mentoring developers, splitting the product into deliverable work packages, code review and supervising the quality of deliverables. Certified SAFe Scrum Master.",
    preuves: ["DREVIO · 140+ PRs reviewed", "Business Zone", "SAFe (8 people)"],
  },
  {
    icone: faSitemap,
    titre: "Software Architecture",
    texte: "Designing complete solutions: technology choices, APIs and workflows, system integration, security and deployment. Architectures decided and carried end to end.",
    preuves: ["DREVIO", "ATMP · AWS", "ERP KERA", "Aivocat"],
  },
  {
    icone: faBrain,
    titre: "AI Solutions Engineering",
    texte: "Solutions that integrate AI models as first-class software components: local RAG, LLMs (Qwen, OpenAI, Claude), image analysis, agents and MCP servers, with evaluation and human oversight.",
    preuves: ["Aivocat", "DREVIO", "ERP KERA · MCP"],
  },
] };

// Les seuls libellés français des cartes de stack (le reste est en anglais)
const STACK_EN: Record<string, string> = {
  "CQRS, Médiateur, REPR": "CQRS, Mediator, REPR",
  Librairies: "Libraries",
  "Et aussi : tous les domaines déjà présents dans la stack .NET": "Also: every area already covered by the .NET stack",
  Autres: "Other",
  "Stack IA": "AI stack",
  "OpenAI (analyse d'images), OpenCV, RapidOCR": "OpenAI (image analysis), OpenCV, RapidOCR",
  "Jeux de test, Seuils d'abstention, Citations vérifiées": "Test sets, Abstention thresholds, Verified citations",
};

const stacks: { titre: string; icone: IconProp; lignes: [string, string][]; note?: string }[] = [
  {
    titre: "Stack C# .NET",
    icone: faMicrosoft,
    lignes: [
      ["Front", "ASP.NET (Blazor), WPF"],
      ["API", "Authentication, Authorization, JWT, Middlewares"],
      ["Caching", "Output Caching, Redis"],
      ["ORM", "Entity Framework, PostgreSQL, SQL Server"],
      ["Messaging", "RabbitMQ"],
      ["Logging", "Serilog"],
      ["Testing", "xUnit, Moq, Playwright, K6, Testcontainers"],
      ["Streaming", "Apache Kafka"],
      ["Real Time", "SignalR"],
      ["Task Scheduling", "Background Service, PeriodicTimer"],
      ["Cloud", "Azure, AWS RDS, S3, DynamoDB"],
      ["CI/CD", "GitHub Actions, Jenkins, Azure"],
      ["Patterns", "CQRS, Médiateur, REPR"],
      ["Architectures", "Clean Architecture, Vertical Slice"],
      ["Librairies", "AutoMapper, MediatR, FluentValidation, Swagger"],
    ],
  },
  {
    titre: "Stack Python",
    icone: faPython,
    lignes: [
      ["Framework", "Odoo"],
      ["BackEnd", "Django, FastAPI"],
      ["Scraping", "BeautifulSoup, Requests, Playwright"],
      ["Data Analysis", "Pandas, NumPy"],
      ["ML", "TensorFlow, PyTorch, NEAT, OpenCV"],
      ["ETLs", "CSV, XML, PDF"],
    ],
    note: "Et aussi : tous les domaines déjà présents dans la stack .NET",
  },
  {
    titre: "Stack IA",
    icone: faBrain,
    lignes: [
      ["LLM", "Qwen, OpenAI API, Claude API, Ollama"],
      ["RAG", "Qdrant, BM25, bge-m3, Reranking cross-encoder"],
      ["Vision & OCR", "OpenAI (analyse d'images), OpenCV, RapidOCR"],
      ["Agents", "MCP, Claude Code, OpenClaw"],
      ["Evaluation", "Jeux de test, Seuils d'abstention, Citations vérifiées"],
    ],
  },
  {
    titre: "Autres",
    icone: faLayerGroup,
    lignes: [
      ["Front", "JavaScript, TypeScript, React, HTML, CSS, Sass, Tailwind"],
      ["Orchestration", "SnapLogic"],
      ["DevOps", "Docker, Jenkins, GitHub Actions, Azure DevOps, AWS ECS"],
      ["AWS", "ECS, RDS, DynamoDB, S3"],
      ["Azure", "Azure AD, Azure Blob Storage, Azure SQL"],
      ["Security", "JWT, OAuth2, AES-256, Secrets Management"],
    ],
  },
];

const card =
  "rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-6";

export default function Profil() {
  const lang = useLang();
  const t = useT();
  const tr = (s: string) => (lang === "en" ? STACK_EN[s] ?? s : s);
  return (
    <div className="w-full max-w-6xl px-4 flex flex-col gap-6">
      <div className={`${card} text-base md:text-lg leading-relaxed`}>
        <p>
          {t(
            "Ingénieur logiciel senior et Tech Lead, environ 7 ans d'expérience (depuis 2019). Je conçois et livre des applications professionnelles complètes en .NET et Python : architecture, API, web et mobile, cloud AWS / Azure et intégration de modèles d'IA.",
            "Senior software engineer and Tech Lead with about 7 years of experience (since 2019). I design and deliver complete business applications in .NET and Python: architecture, APIs, web and mobile, AWS / Azure cloud and AI model integration."
          )}
        </p>
        <p className="mt-4">
          {t(
            "Après des environnements industriels exigeants (Schneider Electric, trains SAFe de plus de 90 personnes) et l'automatisation à grande échelle sur AWS (Ayming), je porte aujourd'hui des produits de bout en bout : Tech Lead et architecte chez DREVIO, architecte et développeur de mes propres solutions en freelance (ICEKERA).",
            "After demanding industrial environments (Schneider Electric, SAFe trains of 90+ people) and large-scale automation on AWS (Ayming), I now own products end to end: Tech Lead and architect at DREVIO, architect and developer of my own solutions as a freelancer (ICEKERA)."
          )}
        </p>
        <p className="mt-4">
          {t(
            "J'intègre l'IA comme une brique logicielle à part entière, avec la même exigence que le reste du système : architecture, tests, sécurité des données, maintenabilité et supervision humaine des résultats.",
            "I integrate AI as a first-class software component, held to the same standards as the rest of the system: architecture, tests, data security, maintainability and human oversight of the results."
          )}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {PILIERS[lang].map((p) => (
          <li key={p.titre} className={`${card} flex flex-col`}>
            <h3 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/40 to-cyan-500/30 text-cyan-200 ring-1 ring-white/10">
                <FontAwesomeIcon icon={p.icone} className="text-sm" />
              </span>
              {p.titre}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">{p.texte}</p>
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
              {p.preuves.map((x) => (
                <li key={x} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
                  {x}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* Réseau interactif : écrans moyens et grands (illisible en largeur téléphone) */}
      <div className="hidden md:block">
        <StackGraph />
      </div>

      {/* Stack complète du CV, repliée par défaut pour ne pas prendre de place */}
      <details className="group">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-fit mx-auto flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-white/20 rounded-lg shadow-lg hover:shadow-xl">
          <span className="group-open:hidden">{t("Voir le détail de la stack", "View the full stack")}</span>
          <span className="hidden group-open:inline">{t("Masquer le détail de la stack", "Hide the full stack")}</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-open:rotate-90"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </summary>
      {/* .NET et Autres en cartes pleine largeur, Python et IA côte à côte entre les deux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {stacks.map((stack, i) => {
          const large = i === 0 || i === stacks.length - 1;
          return (
          <div key={stack.titre} className={`${card} ${large ? "md:col-span-2" : ""}`}>
            <h3 className="text-2xl font-semibold mb-5 flex items-center gap-3">
              <FontAwesomeIcon icon={stack.icone} className="opacity-90" /> {tr(stack.titre)}
            </h3>
            <dl
              className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${
                large ? "lg:grid-cols-3" : ""
              }`}
            >
              {stack.lignes.map(([domaine, valeur]) => (
                <div key={domaine}>
                  <dt className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1.5">
                    {tr(domaine)}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {tr(valeur)
                      .split(", ")
                      .map((techno) => (
                        <span
                          key={techno}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-sm"
                        >
                          {techno}
                        </span>
                      ))}
                  </dd>
                </div>
              ))}
            </dl>
            {stack.note && <p className="mt-5 text-sm italic opacity-70">{tr(stack.note)}</p>}
          </div>
          );
        })}
      </div>
      </details>
    </div>
  );
}
