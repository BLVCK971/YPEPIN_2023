import { Lang, useLang, useT } from "../../i18n";

// Les quatre compétences du positionnement, affichées d'un bloc (lisibles en
// quelques secondes, contrairement à un défilement). Termes IA en anglais.
const PILIERS: Record<Lang, string[]> = {
  fr: ["Ingénierie logicielle senior", "Technical Leadership", "Architecture logicielle", "AI Solutions Engineering"],
  en: ["Senior Software Engineering", "Technical Leadership", "Software Architecture", "AI Solutions Engineering"],
};

export default function Poste() {
  const t = useT();
  const lang = useLang();
  return (
    <div className="relative z-10 mt-6 flex flex-col items-center gap-4 text-center">
      <p className="text-xl md:text-3xl font-semibold text-neutral-100">
        {t("Ingénieur logiciel senior & Tech Lead", "Senior Software Engineer & Tech Lead")}
      </p>
      <p className="text-base md:text-xl font-medium text-neutral-300">
        <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
          {t("Architecture logicielle & AI Solutions", "Software Architecture & AI Solutions")}
        </span>{" "}
        · <span className="text-cyan-300">.NET · Python</span>
      </p>
      <ul className="mt-1 flex max-w-3xl flex-wrap justify-center gap-2">
        {PILIERS[lang].map((p) => (
          <li key={p} className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-sm text-neutral-200 backdrop-blur-md">
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-2xl text-base md:text-lg text-neutral-400">
        {t(
          "7 ans d'expérience à concevoir et livrer des applications professionnelles complètes : architecture, développement .NET et Python, encadrement technique et intégration de l'IA (RAG, LLM locaux, analyse d'images), de la conception à la mise en production.",
          "7 years designing and delivering complete business applications: architecture, .NET and Python development, technical leadership and AI integration (RAG, local LLMs, image analysis), from design to production."
        )}
      </p>
    </div>
  );
}
