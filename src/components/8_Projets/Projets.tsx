import Reveal from "../ui/Reveal";
import Experimentations from "../4_Portofolio/Portofolio";
import FlowDiagram, { Etape } from "./FlowDiagram";
import ParallelDiagram from "./ParallelDiagram";
import { Lang, useLang, useT } from "../../i18n";

// Projets phares : résumé court de missions détaillées dans le Parcours.
type Projet = {
  nom: string;
  categorie: string;
  periode: string;
  accroche: string;
  chiffre?: string;
  tags: string[];
  lien?: { href: string; label: string };
  schema?: { etapes: Etape[]; colonnes?: number; cadre?: string };
  // Schéma spécifique (fan-out ATMP) et carte pleine largeur
  parallele?: boolean;
};

const PROJETS_FR: Projet[] = [
  {
    nom: "Aivocat",
    categorie: "IA souveraine · Freelance",
    periode: "07/2026 - 08/2026",
    accroche:
      "Assistant juridique IA 100 % local pour un cabinet d'avocats : il analyse les pièces d'un dossier sans qu'aucune donnée ne sorte de la machine, et ses réponses citent leurs sources.",
    chiffre: "~650 tests · 100 % hors ligne",
    tags: ["Python", "FastAPI", "Qdrant", "Ollama", "Qwen 3.5", "RAG"],
    schema: {
      colonnes: 4,
      cadre: "PC du cabinet · 100 % hors ligne",
      etapes: [
        { titre: "Pièces & lois", sous: "PDF, Word, LEGI" },
        { titre: "OCR", sous: "RapidOCR" },
        { titre: "Vectorisation", sous: "bge-m3" },
        { titre: "Recherche", sous: "Qdrant + BM25" },
        { titre: "Reranking", sous: "cross-encoder" },
        { titre: "Génération", sous: "Qwen 3.5 9B" },
        { titre: "Réponse", sous: "sources citées" },
      ],
    },
  },
  {
    nom: "DREVIO",
    categorie: "Mobile & SaaS · Tech Lead",
    periode: "Depuis 05/2026",
    accroche:
      "Expertise automobile par IA : photos du véhicule, analyse des dommages, rapport d'expertise, devis pour chaque garage partenaire et paiement en ligne.",
    chiffre: "140+ PR relues · 60+ lots livrables",
    tags: ["React Native", "Expo", ".NET 10", "Supabase", "Stripe", "OpenAI"],
    lien: { href: "https://drevio.tech", label: "drevio.tech" },
    schema: {
      etapes: [
        { titre: "Scan guidé", sous: "React Native · Expo" },
        { titre: "Stockage privé", sous: "Supabase · RLS" },
        { titre: "Analyse IA", sous: "Worker · OpenAI" },
        { titre: "Rapport", sous: "Dommages localisés" },
        { titre: "Devis par garage", sous: "Tarifs de chaque garage" },
        { titre: "Paiement", sous: "Stripe" },
      ],
    },
  },
  {
    nom: "ATMP",
    categorie: "Automatisation à grande échelle · Ayming",
    periode: "06/2024 - 02/2025",
    accroche:
      "Récupération automatisée des taux AT/MP, feuilles de calcul et attestations pour environ 5 000 comptes clients via NET ENTREPRISE. Migration d'une solution Java vers une architecture Python asynchrone : chaque tâche AWS ECS s'exécute indépendamment et déclenche sa propre pipeline SnapLogic, avec auto-scaling selon la charge.",
    chiffre: "~5 000 comptes · ~1,5 M€ de perte par semaine de retard (DSI)",
    tags: ["Python", "Requests", "AWS ECS", "DynamoDB", "S3", "XRay", "SnapLogic"],
    parallele: true,
  },
  {
    nom: "ARC Gestion et Recouvrement",
    categorie: "Site, CRM & portail · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Plateforme d'un cabinet de recouvrement : site vitrine, mini-CRM de suivi des relances, import des fichiers clients, comptes rendus Word générés avec l'IA et portail client privé.",
    tags: ["React", "FastAPI", "PostgreSQL", "API Claude", "Docker", "Traefik"],
    lien: { href: "https://arc-gr.fr", label: "arc-gr.fr" },
    schema: {
      etapes: [
        { titre: "Import fichiers", sous: "Excel / CSV" },
        { titre: "Mini-CRM", sous: "Kanban des dossiers" },
        { titre: "Relances", sous: "Mails groupés" },
        { titre: "Compte rendu", sous: "Word + IA Claude" },
        { titre: "Portail client", sous: "Accès sécurisé JWT" },
      ],
    },
  },
  {
    nom: "Matheva",
    categorie: "Plateforme éducative · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Plateforme de cours particuliers de mathématiques : test diagnostique public, espace professeur (élèves, séances, paiements) et espace parent, avec export Google Calendar.",
    tags: ["React", "TypeScript", "FastAPI", "PostgreSQL", "iCal"],
    schema: {
      etapes: [
        { titre: "Test diagnostique", sous: "Scoring serveur" },
        { titre: "Élèves en attente", sous: "Leads captés" },
        { titre: "Séances", sous: "Calendrier · notions" },
        { titre: "Paiements", sous: "Générés automatiquement" },
        { titre: "Espace parent", sous: "Lien personnel" },
        { titre: "Google Calendar", sous: "Flux iCal" },
      ],
    },
  },
];

const PROJETS_EN: Projet[] = [
  {
    nom: "Aivocat",
    categorie: "Sovereign AI · Freelance",
    periode: "07/2026 - 08/2026",
    accroche:
      "100% local AI legal assistant for a law firm: it analyses the documents of a case file without any data leaving the machine, and its answers cite their sources.",
    chiffre: "~650 tests · 100% offline",
    tags: ["Python", "FastAPI", "Qdrant", "Ollama", "Qwen 3.5", "RAG"],
    schema: {
      colonnes: 4,
      cadre: "Law firm's PC · 100% offline",
      etapes: [
        { titre: "Files & laws", sous: "PDF, Word, LEGI" },
        { titre: "OCR", sous: "RapidOCR" },
        { titre: "Embedding", sous: "bge-m3" },
        { titre: "Search", sous: "Qdrant + BM25" },
        { titre: "Reranking", sous: "cross-encoder" },
        { titre: "Generation", sous: "Qwen 3.5 9B" },
        { titre: "Answer", sous: "cited sources" },
      ],
    },
  },
  {
    nom: "DREVIO",
    categorie: "Mobile & SaaS · Tech Lead",
    periode: "Since 05/2026",
    accroche:
      "AI-powered vehicle damage assessment: photos of the vehicle, damage analysis, assessment report, a quote for each partner garage and online payment.",
    chiffre: "140+ PRs reviewed · 60+ deliverable work packages",
    tags: ["React Native", "Expo", ".NET 10", "Supabase", "Stripe", "OpenAI"],
    lien: { href: "https://drevio.tech", label: "drevio.tech" },
    schema: {
      etapes: [
        { titre: "Guided scan", sous: "React Native · Expo" },
        { titre: "Private storage", sous: "Supabase · RLS" },
        { titre: "AI analysis", sous: "Worker · OpenAI" },
        { titre: "Report", sous: "Located damage" },
        { titre: "Quote per garage", sous: "Each garage's rates" },
        { titre: "Payment", sous: "Stripe" },
      ],
    },
  },
  {
    nom: "ATMP",
    categorie: "Large-scale automation · Ayming",
    periode: "06/2024 - 02/2025",
    accroche:
      "Automated retrieval of AT/MP (workplace accident) rates, calculation sheets and certificates for about 5,000 client accounts through NET ENTREPRISE. Migration from a Java solution to an asynchronous Python architecture: each AWS ECS task runs independently and triggers its own SnapLogic pipeline, with load-based auto-scaling.",
    chiffre: "~5,000 accounts · ~€1.5M lost per week of delay (IT director)",
    tags: ["Python", "Requests", "AWS ECS", "DynamoDB", "S3", "XRay", "SnapLogic"],
    parallele: true,
  },
  {
    nom: "ARC Gestion et Recouvrement",
    categorie: "Website, CRM & portal · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Platform for a debt collection firm: showcase website, mini-CRM to track reminders, client file import, AI-generated Word reports and a private client portal.",
    tags: ["React", "FastAPI", "PostgreSQL", "Claude API", "Docker", "Traefik"],
    lien: { href: "https://arc-gr.fr", label: "arc-gr.fr" },
    schema: {
      etapes: [
        { titre: "File import", sous: "Excel / CSV" },
        { titre: "Mini-CRM", sous: "Case Kanban board" },
        { titre: "Reminders", sous: "Bulk emails" },
        { titre: "Report", sous: "Word + Claude AI" },
        { titre: "Client portal", sous: "Secure JWT access" },
      ],
    },
  },
  {
    nom: "Matheva",
    categorie: "Education platform · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Private maths tutoring platform: public diagnostic test, tutor area (students, sessions, payments) and parent area, with Google Calendar export.",
    tags: ["React", "TypeScript", "FastAPI", "PostgreSQL", "iCal"],
    schema: {
      etapes: [
        { titre: "Diagnostic test", sous: "Server-side scoring" },
        { titre: "Waiting students", sous: "Captured leads" },
        { titre: "Sessions", sous: "Calendar · topics" },
        { titre: "Payments", sous: "Generated automatically" },
        { titre: "Parent area", sous: "Personal link" },
        { titre: "Google Calendar", sous: "iCal feed" },
      ],
    },
  },
];

const PROJETS: Record<Lang, Projet[]> = { fr: PROJETS_FR, en: PROJETS_EN };

export default function Projets() {
  const lang = useLang();
  const t = useT();
  return (
    <div className="flex w-full max-w-6xl flex-col gap-12 px-4">
      <div className="grid gap-6 md:grid-cols-2">
        {PROJETS[lang].map((p, i) => (
          <Reveal key={p.nom} delay={p.parallele ? 0 : (i % 2) * 120} className={p.parallele ? "md:col-span-2" : undefined}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl hover:shadow-violet-900/30">
              {/* Halo d'accent au survol */}
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-400/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col">
                <div className="-mx-2 mb-5 rounded-xl border border-white/5 bg-black/30 p-2">
                  {p.parallele ? (
                    <ParallelDiagram id="atmp" />
                  ) : (
                    p.schema && <FlowDiagram id={p.nom.split(" ")[0].toLowerCase()} {...p.schema} />
                  )}
                </div>
                <p className="text-sm font-medium text-cyan-300">{p.categorie}</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">{p.nom}</h3>
                <p className="mt-1 text-sm text-neutral-500 tabular-nums">{p.periode}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-300">{p.accroche}</p>
                {p.chiffre && (
                  <p className="mt-4 w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
                    {p.chiffre}
                  </p>
                )}
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-4 pt-6 text-sm font-medium">
                  <a href="#Parcours" className="text-neutral-300 hover:text-white transition-colors">
                    {t("Détail dans le parcours", "Details in my experience")} →
                  </a>
                  {p.lien && (
                    <a
                      href={p.lien.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      {p.lien.label} ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Experimentations />
    </div>
  );
}
