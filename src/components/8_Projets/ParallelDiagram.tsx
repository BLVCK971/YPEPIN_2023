// Schéma "fan-out" d'ATMP : ~5 000 comptes répartis sur des tâches AWS ECS
// indépendantes qui tournent en parallèle, puis une pipeline SnapLogic par
// tâche vers le stockage et le monitoring. 100 % SVG (SMIL), sans JavaScript.
import { Lang, useLang } from "../../i18n";

type Boite = { x: number; y: number; w: number; h: number; titre: string; sous: string };

type Layout = {
  W: number;
  H: number;
  source: Boite;
  snap: Boite;
  sorties: Boite[];
  grille: { x0: number; y0: number; cols: number; rows: number };
  voies: string[]; // trajets source -> tâche -> SnapLogic
  sortiesChemins: string[];
};

const CELL = 22;
const PAS = 31;

type Textes = {
  source: { titre: string; sous: string };
  snap: { titre: string; sous: string };
  sorties: { titre: string; sous: string }[];
  ecs: string;
  aria: string;
};

const TEXTES: Record<Lang, Textes> = {
  fr: {
    source: { titre: "~5 000 comptes", sous: "NET ENTREPRISE" },
    snap: { titre: "SnapLogic", sous: "1 pipeline par tâche" },
    sorties: [
      { titre: "DynamoDB · S3", sous: "Données & états" },
      { titre: "XRay · mails", sous: "Monitoring & alertes" },
    ],
    ecs: "AWS ECS · tâches en parallèle · auto-scaling",
    aria: "Schéma ATMP : environ 5 000 comptes répartis sur des tâches AWS ECS indépendantes en parallèle, chacune déclenchant une pipeline SnapLogic vers DynamoDB et S3, avec monitoring XRay et alertes par mail",
  },
  en: {
    source: { titre: "~5,000 accounts", sous: "NET ENTREPRISE" },
    snap: { titre: "SnapLogic", sous: "1 pipeline per task" },
    sorties: [
      { titre: "DynamoDB · S3", sous: "Data & states" },
      { titre: "XRay · emails", sous: "Monitoring & alerts" },
    ],
    ecs: "AWS ECS · parallel tasks · auto-scaling",
    aria: "ATMP diagram: about 5,000 accounts spread over independent AWS ECS tasks running in parallel, each triggering a SnapLogic pipeline to DynamoDB and S3, with XRay monitoring and email alerts",
  },
};

const horizontal = ({ source: SOURCE, snap: SNAP, sorties: SORTIES }: Textes): Layout => {
  const g = { x0: 262, y0: 72, cols: 10, rows: 5 };
  const xFin = g.x0 + g.cols * PAS - (PAS - CELL);
  return {
    W: 960,
    H: 290,
    source: { x: 20, y: 117, w: 170, h: 60, ...SOURCE },
    snap: { x: 650, y: 117, w: 140, h: 60, ...SNAP },
    sorties: [
      { x: 820, y: 52, w: 130, h: 60, ...SORTIES[0] },
      { x: 820, y: 182, w: 130, h: 60, ...SORTIES[1] },
    ],
    grille: g,
    voies: Array.from({ length: g.rows }, (_, r) => {
      const y = g.y0 + r * PAS + CELL / 2;
      return `M190 147 C226 147 226 ${y} ${g.x0} ${y} L${xFin} ${y} C${xFin + 44} ${y} ${xFin + 44} 147 650 147`;
    }),
    sortiesChemins: ["M790 147 C805 147 805 82 820 82", "M790 147 C805 147 805 212 820 212"],
  };
};

const vertical = ({ source: SOURCE, snap: SNAP, sorties: SORTIES }: Textes): Layout => {
  const g = { x0: 91, y0: 132, cols: 6, rows: 6 };
  const yFin = g.y0 + g.rows * PAS - (PAS - CELL);
  return {
    W: 360,
    H: 580,
    source: { x: 95, y: 12, w: 170, h: 56, ...SOURCE },
    snap: { x: 110, y: 380, w: 140, h: 56, ...SNAP },
    sorties: [
      { x: 10, y: 504, w: 165, h: 58, ...SORTIES[0] },
      { x: 185, y: 504, w: 165, h: 58, ...SORTIES[1] },
    ],
    grille: g,
    voies: Array.from({ length: g.cols }, (_, c) => {
      const x = g.x0 + c * PAS + CELL / 2;
      return `M180 68 C180 100 ${x} 100 ${x} ${g.y0} L${x} ${yFin} C${x} ${yFin + 40} 180 ${yFin + 40} 180 380`;
    }),
    sortiesChemins: ["M180 436 C180 470 92 470 92 504", "M180 436 C180 470 268 470 268 504"],
  };
};

// Pseudo-aléatoire déterministe (même rendu serveur et client)
const alea = (i: number, graine: number) => ((i * 9301 + graine * 49297) % 233280) / 233280;

function Noeud({ b, accent }: { b: Boite; accent?: boolean }) {
  return (
    <g transform={`translate(${b.x} ${b.y})`}>
      <rect
        width={b.w}
        height={b.h}
        rx={10}
        fill="#0b0b14"
        fillOpacity={0.95}
        stroke={accent ? "#22d3ee" : "rgba(255,255,255,0.18)"}
        strokeOpacity={accent ? 0.7 : 1}
        strokeWidth={1.2}
      />
      <text x={b.w / 2} y={b.h / 2 - 3} textAnchor="middle" fontSize={13} fill="#f4f4f5" fontWeight={600}>
        {b.titre}
      </text>
      <text x={b.w / 2} y={b.h / 2 + 14} textAnchor="middle" fontSize={10.5} fill="#a1a1aa">
        {b.sous}
      </text>
    </g>
  );
}

function Schema({ id, l, txt }: { id: string; l: Layout; txt: Textes }) {
  const { grille: g } = l;
  const gw = g.cols * PAS - (PAS - CELL);
  const gh = g.rows * PAS - (PAS - CELL);
  const dureeVoie = 3.4;

  return (
    <svg
      viewBox={`0 0 ${l.W} ${l.H}`}
      className="flow-diagram w-full h-auto"
      role="img"
      aria-label={txt.aria}
    >
      <defs>
        <radialGradient id={`halo-${id}`}>
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cadre AWS ECS */}
      <rect
        x={g.x0 - 16}
        y={g.y0 - 32}
        width={gw + 32}
        height={gh + 48}
        rx={14}
        fill="none"
        stroke="#f59e0b"
        strokeOpacity={0.45}
        strokeDasharray="5 6"
      />
      <text x={g.x0 - 4} y={g.y0 - 13} fontSize={11} fill="#fbbf24" fontWeight={600}>
        {txt.ecs}
      </text>

      {/* Voies : de la source vers chaque rangée de tâches, puis SnapLogic */}
      {l.voies.map((d, i) => (
        <g key={i}>
          <path id={`voie-${id}-${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
          <path d={d} fill="none" stroke="#8b5cf6" strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="3 9" className="flow-dash" />
        </g>
      ))}
      {l.sortiesChemins.map((d, i) => (
        <g key={i}>
          <path id={`sortie-${id}-${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
          <path d={d} fill="none" stroke="#22d3ee" strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="3 9" className="flow-dash" />
        </g>
      ))}

      {/* Particules */}
      {l.voies.map((_, i) => (
        <g key={i} className="flow-particle">
          {[0, 1].map((k) => (
            <g key={k}>
              <circle r={8} fill={`url(#halo-${id})`}>
                <animateMotion dur={`${dureeVoie}s`} begin={`${i * 0.55 + k * (dureeVoie / 2)}s`} repeatCount="indefinite">
                  <mpath href={`#voie-${id}-${i}`} />
                </animateMotion>
              </circle>
              <circle r={2.4} fill="#e0f2fe">
                <animateMotion dur={`${dureeVoie}s`} begin={`${i * 0.55 + k * (dureeVoie / 2)}s`} repeatCount="indefinite">
                  <mpath href={`#voie-${id}-${i}`} />
                </animateMotion>
              </circle>
            </g>
          ))}
        </g>
      ))}
      {l.sortiesChemins.map((_, i) => (
        <circle key={i} r={2.4} fill="#e0f2fe" className="flow-particle">
          <animateMotion dur="1.4s" begin={`${i * 0.7}s`} repeatCount="indefinite">
            <mpath href={`#sortie-${id}-${i}`} />
          </animateMotion>
        </circle>
      ))}

      {/* Grille des tâches ECS : chacune "tourne" à son propre rythme */}
      <g className="flow-grid">
      {Array.from({ length: g.cols * g.rows }, (_, i) => {
        const c = i % g.cols;
        const r = Math.floor(i / g.cols);
        const dur = 1.4 + alea(i, 3) * 1.8;
        const debut = alea(i, 7) * 3;
        const violet = alea(i, 11) > 0.5;
        return (
          <rect
            key={i}
            x={g.x0 + c * PAS}
            y={g.y0 + r * PAS}
            width={CELL}
            height={CELL}
            rx={5}
            fill={violet ? "#8b5cf6" : "#22d3ee"}
            fillOpacity={0.18}
            stroke={violet ? "#a78bfa" : "#67e8f9"}
            strokeOpacity={0.35}
          >
            <animate
              attributeName="fill-opacity"
              values="0.12;0.85;0.12"
              dur={`${dur.toFixed(2)}s`}
              begin={`${debut.toFixed(2)}s`}
              repeatCount="indefinite"
            />
          </rect>
        );
      })}
      </g>

      <Noeud b={l.source} accent />
      <Noeud b={l.snap} />
      {l.sorties.map((s) => (
        <Noeud key={s.titre} b={s} accent />
      ))}
    </svg>
  );
}

export default function ParallelDiagram({ id }: { id: string }) {
  const txt = TEXTES[useLang()];
  return (
    <>
      <div className="hidden sm:block">
        <Schema id={id} l={horizontal(txt)} txt={txt} />
      </div>
      <div className="sm:hidden">
        <Schema id={`${id}-m`} l={vertical(txt)} txt={txt} />
      </div>
    </>
  );
}
