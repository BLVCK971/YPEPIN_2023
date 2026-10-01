import Reveal from "../ui/Reveal";
import Experimentations from "../4_Portofolio/Portofolio";

// Projets phares : résumé court de missions détaillées dans le Parcours.
type Projet = {
  nom: string;
  categorie: string;
  periode: string;
  accroche: string;
  chiffre?: string;
  tags: string[];
  lien?: { href: string; label: string };
};

const PROJETS: Projet[] = [
  {
    nom: "Aivocat",
    categorie: "IA souveraine · Freelance",
    periode: "07/2026 - 08/2026",
    accroche:
      "Assistant juridique IA 100 % local pour un cabinet d'avocats : il analyse les pièces d'un dossier sans qu'aucune donnée ne sorte de la machine, et ses réponses citent leurs sources.",
    chiffre: "~650 tests · 100 % hors ligne",
    tags: ["Python", "FastAPI", "Qdrant", "Ollama", "Qwen 3.5", "RAG"],
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
  },
  {
    nom: "ARC Gestion et Recouvrement",
    categorie: "Site, CRM & portail · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Plateforme d'un cabinet de recouvrement : site vitrine, mini-CRM de suivi des relances, import des fichiers clients, comptes rendus Word générés avec l'IA et portail client privé.",
    tags: ["React", "FastAPI", "PostgreSQL", "API Claude", "Docker", "Traefik"],
    lien: { href: "https://arc-gr.fr", label: "arc-gr.fr" },
  },
  {
    nom: "Matheva",
    categorie: "Plateforme éducative · Freelance",
    periode: "08/2026 - 09/2026",
    accroche:
      "Plateforme de cours particuliers de mathématiques : test diagnostique public, espace professeur (élèves, séances, paiements) et espace parent, avec export Google Calendar.",
    tags: ["React", "TypeScript", "FastAPI", "PostgreSQL", "iCal"],
  },
];

export default function Projets() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-12 px-4">
      <div className="grid gap-6 md:grid-cols-2">
        {PROJETS.map((p, i) => (
          <Reveal key={p.nom} delay={(i % 2) * 120}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl hover:shadow-violet-900/30">
              {/* Halo d'accent au survol */}
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-400/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col">
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
                    Détail dans le parcours →
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
