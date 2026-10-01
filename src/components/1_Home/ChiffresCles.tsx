import { useEffect, useRef, useState } from "react";

// Chiffres clés tirés du CV (aucune valeur inventée), animés au défilement.
type Chiffre = { valeur: number; prefixe?: string; suffixe?: string; label: string; source: string };

const CHIFFRES: Chiffre[] = [
  { valeur: 7, suffixe: "+ ans", label: "d'expérience", source: "Depuis 2019" },
  { valeur: 5000, prefixe: "~", label: "comptes clients automatisés", source: "ATMP · Ayming" },
  { valeur: 2, prefixe: "1–", suffixe: " M€", label: "de bénéfice estimé par mois", source: "ATMP · Ayming" },
  { valeur: 265000, prefixe: "~", label: "fichiers audités en lecture seule", source: "SESAM · ICEKERA" },
  { valeur: 140, suffixe: "+", label: "pull requests relues", source: "DREVIO Mobile" },
  { valeur: 650, prefixe: "~", label: "tests automatisés", source: "Aivocat · ICEKERA" },
];

const format = (n: number) => n.toLocaleString("fr-FR");

function Compteur({ chiffre }: { chiffre: Chiffre }) {
  // Rendu serveur : valeur finale (SEO). Côté client : décompte à l'apparition.
  const [n, setN] = useState(chiffre.valeur);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const debut = performance.now();
      const duree = 1600;
      const tick = (t: number) => {
        const p = Math.min(1, (t - debut) / duree);
        const ease = 1 - Math.pow(1 - p, 3);
        setN(Math.round(chiffre.valeur * ease));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [chiffre.valeur]);

  return (
    <span ref={ref} className="tabular-nums">
      {chiffre.prefixe}
      {format(n)}
      {chiffre.suffixe}
    </span>
  );
}

export default function ChiffresCles() {
  return (
    <dl className="relative z-10 mt-16 grid w-full max-w-5xl grid-cols-2 md:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
      {CHIFFRES.map((c) => (
        <div key={c.label} className="flex flex-col gap-1 bg-black/50 backdrop-blur-md p-4 md:p-6">
          <dd className="order-1 text-2xl md:text-4xl font-semibold text-white">
            <Compteur chiffre={c} />
          </dd>
          <dt className="order-2 text-sm md:text-base text-neutral-300">{c.label}</dt>
          <span className="order-3 text-xs text-neutral-500">{c.source}</span>
        </div>
      ))}
    </dl>
  );
}
