import { useEffect, useRef, useState } from "react";
import { Lang, useLang } from "../../i18n";

// Chiffres clés tirés du CV (aucune valeur inventée), animés au défilement.
type Chiffre = { valeur: number; decimales?: number; prefixe?: string; suffixe?: string; label: string; source: string };

const CHIFFRES: Record<Lang, Chiffre[]> = { fr: [
  { valeur: 7, suffixe: "+ ans", label: "d'expérience", source: "Depuis 2019" },
  { valeur: 5000, prefixe: "~", label: "comptes clients automatisés", source: "ATMP · Ayming" },
  { valeur: 1.5, decimales: 1, prefixe: "~", suffixe: " M€", label: "de perte par semaine de retard", source: "ATMP · estimation de la DSI Ayming" },
  { valeur: 265000, prefixe: "~", label: "fichiers audités en lecture seule", source: "SESAM · ICEKERA" },
  { valeur: 140, suffixe: "+", label: "pull requests relues", source: "DREVIO Mobile" },
  { valeur: 650, prefixe: "~", label: "tests automatisés", source: "Aivocat · ICEKERA" },
], en: [
  { valeur: 7, suffixe: "+ years", label: "of experience", source: "Since 2019" },
  { valeur: 5000, prefixe: "~", label: "client accounts automated", source: "ATMP · Ayming" },
  { valeur: 1.5, decimales: 1, prefixe: "~€", suffixe: "M", label: "lost per week of delay", source: "ATMP · Ayming IT director's estimate" },
  { valeur: 265000, prefixe: "~", label: "files audited read-only", source: "SESAM · ICEKERA" },
  { valeur: 140, suffixe: "+", label: "pull requests reviewed", source: "DREVIO Mobile" },
  { valeur: 650, prefixe: "~", label: "automated tests", source: "Aivocat · ICEKERA" },
] };

const format = (n: number, lang: Lang, decimales = 0) =>
  n.toLocaleString(lang === "en" ? "en-US" : "fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

function Compteur({ chiffre }: { chiffre: Chiffre }) {
  const lang = useLang();
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
        const f = 10 ** (chiffre.decimales ?? 0);
        setN(Math.round(chiffre.valeur * ease * f) / f);
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
      {format(n, lang, chiffre.decimales)}
      {chiffre.suffixe}
    </span>
  );
}

export default function ChiffresCles() {
  const lang = useLang();
  return (
    <dl className="relative z-10 mt-16 grid w-full max-w-5xl grid-cols-2 md:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
      {CHIFFRES[lang].map((c) => (
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
