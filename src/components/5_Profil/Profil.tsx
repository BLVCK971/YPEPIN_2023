import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faMicrosoft, faPython } from "@fortawesome/free-brands-svg-icons";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import StackGraph from "./StackGraph";
import { Lang, useLang, useT } from "../../i18n";

const experiences: Record<Lang, string[]> = { fr: [
  "Leadership technique et rôle de Scrum Master SAFe dans des trains Agile internationaux (+90 personnes)",
  "Intégration de systèmes legacy et modernisation d'architectures",
  "Développement de plateformes BI et data pour l'aide à la décision",
  "Automatisation avancée (scraping, ETL, pipelines asynchrones, orchestration)",
], en: [
  "Technical leadership and SAFe Scrum Master role in international Agile Release Trains (90+ people)",
  "Legacy system integration and architecture modernisation",
  "Development of BI and data platforms for decision support",
  "Advanced automation (scraping, ETL, asynchronous pipelines, orchestration)",
] };

// Les seuls libellés français des cartes de stack (le reste est en anglais)
const STACK_EN: Record<string, string> = {
  "CQRS, Médiateur, REPR": "CQRS, Mediator, REPR",
  Librairies: "Libraries",
  "Et aussi": "Also",
  "Tous les domaines déjà présents dans la stack .NET": "Every area already covered by the .NET stack",
  Autres: "Other",
};

const stacks: { titre: string; icone: IconProp; lignes: [string, string][] }[] = [
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
      ["Et aussi", "Tous les domaines déjà présents dans la stack .NET"],
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
            "Ingénieur logiciel FullStack (C# / Python) avec une forte orientation architecture, data et cloud. J'accompagne des organisations dans la conception et la mise en œuvre de systèmes scalables, fiables et maintenables, en combinant Clean Architecture, CQRS et bonnes pratiques DevOps.",
            "FullStack software engineer (C# / Python) with a strong focus on architecture, data and cloud. I help organisations design and deliver scalable, reliable and maintainable systems, combining Clean Architecture, CQRS and DevOps best practices."
          )}
        </p>
        <p className="mt-4">
          {t(
            "J'ai conçu et industrialisé des solutions critiques allant du desktop industriel (WPF, .NET) aux plateformes cloud sur AWS (ECS, RDS, DynamoDB, XRay), en passant par des pipelines de data et d'automatisation à grande échelle.",
            "I have designed and industrialised critical solutions ranging from industrial desktop software (WPF, .NET) to cloud platforms on AWS (ECS, RDS, DynamoDB, XRay), including large-scale data and automation pipelines."
          )}
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-1">
          {experiences[lang].map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p className="mt-4">
          {t(
            "Passionné par l'ingénierie logicielle, je privilégie des solutions robustes, testées et observables, avec une forte attention portée à la performance, la sécurité et la maintenabilité.",
            "Passionate about software engineering, I favour robust, tested and observable solutions, with close attention to performance, security and maintainability."
          )}
        </p>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {stacks.map((stack) => (
          <div key={stack.titre} className={card}>
            <h3 className="text-2xl font-semibold mb-4">
              <FontAwesomeIcon icon={stack.icone} /> {tr(stack.titre)}
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm md:text-base">
              {stack.lignes.map(([domaine, valeur]) => (
                <div key={domaine} className="contents">
                  <dt className="font-semibold opacity-80">{tr(domaine)}</dt>
                  <dd>{tr(valeur)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      </details>
    </div>
  );
}
