import Reveal from "./Reveal";

// Titre de section : petite étiquette d'accent + titre h2 sobre.
export default function SectionTitle({ etiquette, titre }: { etiquette: string; titre: string }) {
  return (
    <Reveal className="w-full max-w-6xl px-4 mb-10 md:mb-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{etiquette}</p>
      <h2 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight">{titre}</h2>
      <div className="mt-4 h-[2px] w-16 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
    </Reveal>
  );
}
