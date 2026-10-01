import { useEffect, useRef } from "react";
import Company from "./components/Company";
import Mission from "./components/Mission";
import { companies } from "./data/data";
import Reveal from "../ui/Reveal";

// Frise du parcours : une ligne verticale se dessine au défilement et chaque
// expérience s'allume quand elle est atteinte (repère à 60 % de l'écran).
export default function Parcours() {
  const frise = useRef<HTMLDivElement>(null);
  const trait = useRef<HTMLDivElement>(null);
  const points = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = frise.current;
    if (!el) return;
    let frame = 0;

    const maj = () => {
      frame = 0;
      const repere = window.innerHeight * 0.6;
      const r = el.getBoundingClientRect();
      const progression = Math.min(1, Math.max(0, (repere - r.top) / r.height));
      if (trait.current) trait.current.style.transform = `scaleY(${progression})`;
      for (const p of points.current) {
        if (p) p.dataset.actif = String(p.getBoundingClientRect().top < repere);
      }
    };
    const planifier = () => {
      if (!frame) frame = requestAnimationFrame(maj);
    };

    maj();
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    // Déplier des missions change la hauteur de la frise
    const ro = new ResizeObserver(planifier);
    ro.observe(el);
    return () => {
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={frise} className="relative w-full max-w-6xl px-4">
      {/* Rail + tracé animé */}
      <div className="absolute bottom-0 left-[28px] md:left-[36px] top-0 w-[2px] rounded-full bg-white/10" aria-hidden="true" />
      <div
        ref={trait}
        className="absolute bottom-0 left-[28px] md:left-[36px] top-0 w-[2px] origin-top rounded-full bg-gradient-to-b from-violet-500 via-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-transform duration-150 ease-out"
        style={{ transform: "scaleY(0)" }}
        aria-hidden="true"
      />

      <ol className="flex flex-col gap-6 pl-8 md:pl-12">
        {companies.map((company, i) => (
          <li key={company.id} className="relative">
            {/* Repère de l'expérience */}
            <span
              ref={(el) => {
                points.current[i] = el;
              }}
              data-actif="false"
              className="absolute -left-[27px] md:-left-[35px] top-8 h-4 w-4 rounded-full border-2 border-white/25 bg-black transition-all duration-500 data-[actif=true]:border-cyan-300 data-[actif=true]:bg-cyan-400 data-[actif=true]:shadow-[0_0_14px_rgba(34,211,238,0.9)]"
              aria-hidden="true"
            />
            <Reveal>
              <Company company={company}>
                {company.missions.map((mission) => (
                  <Mission key={mission.nom} mission={mission} />
                ))}
              </Company>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
