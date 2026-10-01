import { useEffect, useRef, useState } from "react";
import Reveal from "../ui/Reveal";
import { cn } from "../ui/utils/cn";

// Carte des collaborations internationales : fond en points (public/carte-monde.svg,
// projection équirectangulaire lon -100..125, lat -20..65, 4 unités par degré),
// arcs qui se dessinent à l'apparition et données qui circulent dessus.
const W = 900;
const H = 340;
const projeter = (lon: number, lat: number) => ({ x: (lon + 100) * 4, y: (65 - lat) * 4 });

type Lieu = { id: string; nom: string; lon: number; lat: number; dx: number; dy: number; ancre?: "start" | "end" | "middle"; hub?: boolean };

const LIEUX: Lieu[] = [
  { id: "gp", nom: "Guadeloupe", lon: -61.53, lat: 16.24, dx: 0, dy: 20, ancre: "middle", hub: true },
  { id: "fr", nom: "France", lon: 2.35, lat: 48.86, dx: -10, dy: 4, ancre: "end", hub: true },
  { id: "es", nom: "Espagne", lon: -3.7, lat: 40.42, dx: -10, dy: 12, ancre: "end" },
  { id: "de", nom: "Allemagne", lon: 8.68, lat: 50.11, dx: 4, dy: -12, ancre: "middle" },
  { id: "rs", nom: "Serbie", lon: 20.46, lat: 44.79, dx: -2, dy: 20, ancre: "middle" },
  { id: "ro", nom: "Roumanie", lon: 26.1, lat: 44.43, dx: 10, dy: -6, ancre: "start", hub: true },
  { id: "in", nom: "Inde", lon: 77.59, lat: 12.97, dx: 0, dy: 22, ancre: "middle" },
  { id: "sg", nom: "Singapour", lon: 103.82, lat: 1.35, dx: 0, dy: 22, ancre: "middle" },
];

// Liens : [depuis, vers, courbure]
const LIENS: [string, string, number][] = [
  ["gp", "fr", 0.32],
  ["fr", "de", 0.6],
  ["fr", "rs", 0.45],
  ["fr", "in", 0.3],
  ["fr", "sg", 0.3],
  ["fr", "es", 0.6],
  ["fr", "ro", 0.4],
];

const LEGENDE = [
  { lieux: "Guadeloupe", texte: "Université des Antilles (MIAGE), DIGITOM, missions ICEKERA (SESAM)" },
  { lieux: "France", texte: "Ayming, AViSTO et PROELAN pour Schneider Electric" },
  { lieux: "Allemagne · Serbie · Inde · Singapour", texte: "Train Agile SAFe international de 90 personnes (AViSTO / Schneider)" },
  { lieux: "Roumanie", texte: "Télétravail depuis la Roumanie (DREVIO), et développement avec des développeurs roumains (PROELAN / Schneider)" },
  { lieux: "Espagne", texte: "Formation par l'équipe espagnole (PROELAN / Schneider)" },
];

const point = (id: string) => {
  const l = LIEUX.find((x) => x.id === id)!;
  return projeter(l.lon, l.lat);
};

// Arc quadratique, courbé vers le haut
const arc = (a: { x: number; y: number }, b: { x: number; y: number }, k: number) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${mx.toFixed(1)} ${(my - dist * k).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

export default function CarteCollaborations() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Reveal className="w-full max-w-6xl px-4 mt-16">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:p-7 backdrop-blur-xl">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">Collaborations internationales</h3>
        <p className="mt-1 text-sm text-neutral-400">
          De la Guadeloupe à la Roumanie, avec des équipes réparties en Europe et en Asie.
        </p>

        <div ref={ref} className={cn("carte mt-4", visible && "carte-visible")}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Carte des collaborations : Guadeloupe, France, Espagne, Allemagne, Serbie, Roumanie, Inde et Singapour">
            <defs>
              <linearGradient id="arc-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <image href="/carte-monde.svg" width={W} height={H} />

            {LIENS.map(([de, vers, k], i) => {
              const d = arc(point(de), point(vers), k);
              return (
                <g key={`${de}-${vers}`}>
                  <path
                    id={`arc-${de}-${vers}`}
                    d={d}
                    pathLength={1}
                    fill="none"
                    stroke="url(#arc-grad)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="arc"
                    style={{ transitionDelay: `${i * 180}ms` }}
                  />
                  <circle r={2.8} fill="#e0f2fe" className="flow-particle carte-particule">
                    <animateMotion dur="2.6s" begin={`${1.6 + i * 0.35}s`} repeatCount="indefinite">
                      <mpath href={`#arc-${de}-${vers}`} />
                    </animateMotion>
                  </circle>
                </g>
              );
            })}

            {LIEUX.map((l) => {
              const p = projeter(l.lon, l.lat);
              return (
                <g key={l.id} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
                  <circle r={l.hub ? 6 : 4} fill="#22d3ee" fillOpacity={0.25} className="flow-particle">
                    <animate attributeName="r" values={l.hub ? "6;16;6" : "4;11;4"} dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="fill-opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r={l.hub ? 4.5 : 3.2} fill={l.hub ? "#67e8f9" : "#a78bfa"} stroke="#0a0a12" strokeWidth={1.5} />
                  <text
                    x={l.dx}
                    y={l.dy}
                    textAnchor={l.ancre ?? "start"}
                    fontSize={l.hub ? 13 : 11.5}
                    fontWeight={l.hub ? 700 : 500}
                    fill={l.hub ? "#ffffff" : "#d4d4d8"}
                    paintOrder="stroke"
                    stroke="#0a0a12"
                    strokeWidth={3}
                  >
                    {l.nom}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Légende textuelle : le détail ne repose pas sur la carte seule */}
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {LEGENDE.map((l) => (
            <li key={l.lieux} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-cyan-300">{l.lieux}</div>
              <div className="mt-0.5 text-sm text-neutral-300">{l.texte}</div>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
