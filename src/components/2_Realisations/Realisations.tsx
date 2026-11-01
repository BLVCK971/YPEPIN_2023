import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSitemap } from "@fortawesome/free-solid-svg-icons";
import Reveal from "../ui/Reveal";
import FlowDiagram from "../8_Projets/FlowDiagram";
import ParallelDiagram from "../8_Projets/ParallelDiagram";
import DemoAcces, { aAccesDemos, DemoChoisie } from "../8_Projets/DemoAcces";
import { PROJETS } from "../8_Projets/Projets";
import { Lang, useLang, useT } from "../../i18n";

// Les trois réalisations qui portent le positionnement, présentées avec la même
// structure : contexte métier → rôle → architecture et technologies → résultats.
// Tout vient du parcours (data.tsx) ou des réponses de Yoel : rien d'inventé.
// Schéma, période, tags et liens sont repris de la carte projet (Projets.tsx).
type Realisation = {
  projet: string; // nom de la carte dans PROJETS
  titre: string;
  sousTitre: string;
  role: string;
  contexte: string;
  responsabilites: string[];
  resultats: string[];
};

const REALISATIONS: Record<Lang, Realisation[]> = {
  fr: [
    {
      projet: "Aivocat",
      titre: "Aivocat",
      sousTitre: "IA locale et souveraine pour un cabinet d'avocats",
      role: "Conception et réalisation, seul",
      contexte:
        "Les avocats ne peuvent pas confier les pièces de leurs clients à ChatGPT : secret professionnel. Il fallait un assistant capable d'analyser un dossier et de répondre en citant ses sources, sur un simple PC du cabinet (RTX 3060), sans aucune connexion internet.",
      responsabilites: [
        "Architecture complète, du besoin du client au paquet d'installation, réalisée en totale autonomie",
        "Architecture RAG : ingestion multi-format avec OCR, vectorisation (bge-m3), recherche hybride Qdrant + BM25, reranking cross-encoder",
        "Intégration du LLM Qwen 3.5 9B via Ollama, avec partage des 12 Go de VRAM entre embeddings, reranker et modèle",
        "Recherche documentaire dans les textes de loi (open data LEGI/DILA), interrogés en parallèle des pièces du dossier",
        "Confidentialité des données juridiques : 100 % hors ligne, dossiers lus en lecture seule sur clé USB, licence signée liée à la machine",
      ],
      resultats: [
        "Environ 650 tests automatisés pour environ 15 000 lignes de Python",
        "« Jury » d'évaluation automatisé : précision des citations et taux de bonnes réponses mesurés sur des dossiers de test",
        "Réponses qui citent les passages exacts, ou s'abstiennent quand rien ne les appuie (seuils calibrés sur des mesures réelles)",
        "Livré avec un paquet d'installation entièrement hors ligne (14 Go), vérifié par empreintes SHA-256",
      ],
    },
    {
      projet: "DREVIO",
      titre: "DREVIO",
      sousTitre: "Architecture SaaS, IA et leadership technique",
      role: "Tech Lead & architecte logiciel",
      contexte:
        "Plateforme qui digitalise l'expertise des dommages automobiles : à partir des photos d'un véhicule, l'IA identifie et localise les dommages, produit un rapport d'expertise, calcule un devis pour chaque garage partenaire et gère le paiement en ligne.",
      responsabilites: [
        "Pilotage technique du projet : périmètre du MVP, backlog, découpage du produit en plus de 60 lots livrables",
        "Encadrement d'un développeur junior : rédaction et priorisation des tâches, suivi de leur réalisation, revue de code",
        "Architecture distribuée : API .NET 10 en Vertical Slice, worker asynchrone d'analyse, dashboard React, application mobile React Native / Expo",
        "Conception des API et des workflows : dossiers, médias, dommages, estimations, paiements et historique des événements",
        "Intégration de l'analyse d'images par IA : chaîne multimodale (photos, données du véhicule, modèles OpenAI) avec validation structurée des résultats",
        "Sécurité : PostgreSQL / Supabase, JWT, Row Level Security et stockage privé des photographies",
      ],
      resultats: [
        "Plus de 140 pull requests relues, durcissements après revue, contrôles TypeScript et lint",
        "Phase 1 (plateforme) livrée en août 2026 ; application iOS / Android en cours",
        "Phase 2 amorcée : HellBoy, la plateforme qui constitue le dataset d'entraînement du futur modèle DREVIO",
      ],
    },
    {
      projet: "ATMP",
      titre: "Ayming · ATMP",
      sousTitre: "Automatisation Python et architecture cloud AWS",
      role: "Architecte cloud & ingénieur Python",
      contexte:
        "ATMP récupère les taux AT/MP, feuilles de calcul et attestations d'environ 5 000 comptes clients sur NET ENTREPRISE. L'outil existait en Java, monolithique et sur des paradigmes anciens : Ayming m'a confié sa refonte en services multiples, adaptés à AWS et sécurisés. Selon la DSI, chaque semaine de retard coûtait environ 1,5 M€.",
      responsabilites: [
        "Conception de toute l'architecture cible sur AWS, présentée à l'équipe sous forme de schémas (Miro) avant la réalisation",
        "Passage du monolithe Java à des services Python asynchrones : chaque tâche AWS ECS s'exécute indépendamment et déclenche sa propre pipeline SnapLogic",
        "Traitement de gros volumes : scaling horizontal avec auto-scaling ECS selon la charge",
        "Sécurisation des identifiants clients : chiffrement AES-256 dans RDS, servis par une API ASP.NET en Clean Architecture (RobotCredentials)",
        "Fiabilité : gestion des erreurs métier (CGU à valider, mot de passe expiré) avec mise à jour de l'état dans DynamoDB et alertes, observabilité AWS X-Ray",
      ],
      resultats: [
        "Transition réussie de Java vers une architecture Python moderne, plus flexible, plus fiable et plus économique",
        "Environ 5 000 comptes clients traités automatiquement",
        "Autre automatisation livrée : SYLAE, un processus manuel qui mobilisait un employé plusieurs semaines par mois",
      ],
    },
  ],
  en: [
    {
      projet: "Aivocat",
      titre: "Aivocat",
      sousTitre: "Local, sovereign AI for a law firm",
      role: "Designed and built single-handedly",
      contexte:
        "Lawyers cannot hand their clients' documents to ChatGPT: professional secrecy. They needed an assistant able to analyse a case file and answer with cited sources, on an ordinary office PC (RTX 3060), with no internet connection at all.",
      responsabilites: [
        "Complete architecture, from the client's need to the installation package, delivered fully autonomously",
        "RAG architecture: multi-format ingestion with OCR, embeddings (bge-m3), hybrid Qdrant + BM25 search, cross-encoder reranking",
        "Integration of the Qwen 3.5 9B LLM through Ollama, sharing 12 GB of VRAM between embeddings, reranker and model",
        "Document search across legal texts (LEGI/DILA open data), queried alongside the case documents",
        "Legal data confidentiality: 100% offline, case files read-only from a USB drive, signed licence bound to the machine",
      ],
      resultats: [
        "About 650 automated tests for about 15,000 lines of Python",
        "Automated evaluation “jury”: citation accuracy and correct-answer rate measured on test case files",
        "Answers that quote the exact passages, or abstain when nothing supports them (thresholds calibrated on real measurements)",
        "Delivered as a fully offline installation package (14 GB), verified with SHA-256 checksums",
      ],
    },
    {
      projet: "DREVIO",
      titre: "DREVIO",
      sousTitre: "SaaS architecture, AI and technical leadership",
      role: "Tech Lead & software architect",
      contexte:
        "Platform that digitises vehicle damage assessment: from photos of a vehicle, AI identifies and locates the damage, produces an assessment report, computes a quote for each partner garage and handles online payment.",
      responsabilites: [
        "Technical project management: MVP scope, backlog, product split into 60+ deliverable work packages",
        "Mentoring a junior developer: writing and prioritising tasks, tracking their completion, code review",
        "Distributed architecture: .NET 10 Vertical Slice API, asynchronous analysis worker, React dashboard, React Native / Expo mobile app",
        "API and workflow design: case files, media, damage, estimates, payments and event history",
        "AI image analysis integration: multimodal pipeline (photos, vehicle data, OpenAI models) with structured validation of the results",
        "Security: PostgreSQL / Supabase, JWT, Row Level Security and private photo storage",
      ],
      resultats: [
        "140+ pull requests reviewed, hardening after review, TypeScript and lint checks",
        "Phase 1 (platform) delivered in August 2026; iOS / Android app in progress",
        "Phase 2 started: HellBoy, the platform building the training dataset for the future DREVIO model",
      ],
    },
    {
      projet: "ATMP",
      titre: "Ayming · ATMP",
      sousTitre: "Python automation and AWS cloud architecture",
      role: "Cloud architect & Python engineer",
      contexte:
        "ATMP retrieves occupational injury rates, calculation sheets and certificates for about 5,000 client accounts from NET ENTREPRISE. The tool existed in Java, monolithic and built on dated paradigms: Ayming asked me to rebuild it as multiple services, adapted to AWS and secured. According to the IT director, each week of delay cost about €1.5M.",
      responsabilites: [
        "Designed the entire target architecture on AWS, presented to the team as diagrams (Miro) before implementation",
        "Moved from the Java monolith to asynchronous Python services: each AWS ECS task runs independently and triggers its own SnapLogic pipeline",
        "Large volumes: horizontal scaling with load-based ECS auto-scaling",
        "Securing client credentials: AES-256 encryption in RDS, served by a Clean Architecture ASP.NET API (RobotCredentials)",
        "Reliability: handling of business errors (terms to accept, expired password) with status updates in DynamoDB and alerts, AWS X-Ray observability",
      ],
      resultats: [
        "Successful move from Java to a modern Python architecture, more flexible, more reliable and more cost-effective",
        "About 5,000 client accounts processed automatically",
        "Another automation delivered: SYLAE, a manual process that took an employee several weeks a month",
      ],
    },
  ],
};

const Liste = ({ titre, items, accent }: { titre: string; items: string[]; accent?: boolean }) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{titre}</h4>
    <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-neutral-200">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5">
          {accent ? (
            <FontAwesomeIcon icon={faCheck} className="mt-[5px] shrink-0 text-xs text-cyan-300" aria-hidden="true" />
          ) : (
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
          )}
          <span>{x}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default function Realisations() {
  const lang = useLang();
  const t = useT();
  const [demo, setDemo] = useState<DemoChoisie | null>(null);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 px-4">
      {demo && <DemoAcces demo={demo} onClose={() => setDemo(null)} />}
      {REALISATIONS[lang].map((r) => {
        const p = PROJETS[lang].find((x) => x.nom === r.projet);
        if (!p) throw new Error(`Projet « ${r.projet} » introuvable dans Projets.tsx`);
        return (
          <Reveal key={r.projet}>
            <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet-500 to-cyan-400" aria-hidden="true" />
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-cyan-300 tabular-nums">{p.periode}</p>
                    <h3 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">{r.titre}</h3>
                    <p className="mt-1 text-lg text-neutral-300">{r.sousTitre}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    <li className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-neutral-100">{r.role}</li>
                    <li className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
                      <FontAwesomeIcon icon={faSitemap} className="text-xs" aria-hidden="true" />
                      {t("Architecture conçue par moi", "Architecture designed by me")}
                    </li>
                  </ul>
                </div>

                <p className="mt-5 max-w-4xl text-[15px] md:text-base leading-relaxed text-neutral-300">{r.contexte}</p>

                <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1fr]">
                  <Liste titre={t("Responsabilités & architecture", "Responsibilities & architecture")} items={r.responsabilites} />
                  <div className="flex flex-col gap-6">
                    <div className="rounded-xl border border-white/5 bg-black/30 p-2">
                      {p.parallele ? (
                        <ParallelDiagram id="atmp-majeur" />
                      ) : (
                        p.schema && <FlowDiagram id={`${p.nom.toLowerCase()}-majeur`} {...p.schema} />
                      )}
                    </div>
                    <Liste titre={t("Résultats", "Results")} items={r.resultats} accent />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <ul className="flex flex-wrap gap-2" aria-label="Technologies">
                    {p.tags.map((x) => (
                      <li key={x} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
                        {x}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                    {p.demo && (
                      <a
                        href={p.demo}
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => {
                          if (aAccesDemos()) return;
                          e.preventDefault();
                          setDemo({ nom: p.nom, url: p.demo!, mode: "demande" });
                        }}
                        className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 text-cyan-200 transition-colors hover:bg-cyan-400/20 hover:text-white"
                        title={t("Application réelle, données fictives, accès sur demande", "Real application (French interface), sample data, access on request")}
                      >
                        {t("Essayer la démo", "Try the demo")} ↗
                      </a>
                    )}
                    {p.lien && (
                      <a href={p.lien.href} target="_blank" rel="noopener noreferrer" className="text-cyan-300 transition-colors hover:text-cyan-200">
                        {p.lien.label} ↗
                      </a>
                    )}
                    <a href="#Parcours" className="text-neutral-300 transition-colors hover:text-white">
                      {t("Détail dans le parcours", "Details in my experience")} →
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
