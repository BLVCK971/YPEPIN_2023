// Schéma d'architecture animé : étapes disposées en serpentin, ligne qui
// s'écoule et "particules" de données qui traversent la chaîne.
// 100 % SVG (animateMotion) : rendu serveur possible, aucun JavaScript.

export type Etape = { titre: string; sous: string };

const COL_W = 180;
const ROW_H = 92;
const NODE_H = 54;
const MARGE_HAUT = 34;

type Props = {
  id: string;
  etapes: Etape[];
  colonnes?: number;
  // Libellé d'un cadre pointillé englobant toute la chaîne (ex. "100 % hors ligne")
  cadre?: string;
};

// Version large (≥ sm) et version 2 colonnes pour les petits écrans
export default function FlowDiagram({ colonnes = 3, ...props }: Props) {
  return (
    <>
      <div className={colonnes > 2 ? "hidden sm:block" : undefined}>
        <Schema {...props} colonnes={colonnes} />
      </div>
      {colonnes > 2 && (
        <div className="sm:hidden">
          <Schema {...props} id={`${props.id}-m`} colonnes={2} />
        </div>
      )}
    </>
  );
}

// Moments (0..1) d'un passage de particule sur l'étape située à la fraction f du trajet
const keyTimes = (f: number) => {
  const pts = [0, f - 0.05, f, f + 0.07, 1].map((t) => Math.min(1, Math.max(0, t)));
  const uniq: number[] = [];
  const vals: string[] = [];
  const v = ["0", "0", "1", "0", "0"];
  pts.forEach((t, i) => {
    if (uniq.length && t <= uniq[uniq.length - 1]) return;
    uniq.push(t);
    vals.push(v[i]);
  });
  if (uniq[uniq.length - 1] !== 1) {
    uniq.push(1);
    vals.push("0");
  }
  return { keyTimes: uniq.map((t) => t.toFixed(4)).join(";"), values: vals.join(";") };
};

function Schema({ id, etapes, colonnes = 3, cadre }: Props) {
  // Largeur 540 (3-4 colonnes) ou 360 en 2 colonnes : le texte reste lisible sur mobile
  const W = colonnes <= 2 ? COL_W * 2 : COL_W * 3;
  const colW = W / colonnes;
  const nodeW = colW - 22;
  const lignes = Math.ceil(etapes.length / colonnes);
  const H = MARGE_HAUT + lignes * ROW_H + 8;

  // Position en serpentin : ligne paire de gauche à droite, impaire de droite à gauche
  const pos = etapes.map((_, i) => {
    const ligne = Math.floor(i / colonnes);
    const k = i % colonnes;
    const col = ligne % 2 === 0 ? k : colonnes - 1 - k;
    return { x: col * colW + colW / 2, y: MARGE_HAUT + ligne * ROW_H + NODE_H / 2 + 6 };
  });

  const d = pos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const longueur = pos.reduce((acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p.x - pos[i - 1].x, p.y - pos[i - 1].y)), 0);
  const duree = Math.max(3, longueur / 90); // ~90 unités par seconde
  // Fraction du trajet à laquelle la particule atteint chaque étape
  const fractions = pos.map((_, i) => {
    let acc = 0;
    for (let j = 1; j <= i; j++) acc += Math.hypot(pos[j].x - pos[j - 1].x, pos[j].y - pos[j - 1].y);
    return longueur ? acc / longueur : 0;
  });
  const pathId = `flux-${id}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="flow-diagram w-full h-auto"
      role="img"
      aria-label={`Schéma : ${etapes.map((e) => e.titre).join(" → ")}`}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`halo-${id}`}>
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {cadre && (
        <g>
          <rect
            x={6}
            y={14}
            width={W - 12}
            height={H - 20}
            rx={14}
            fill="none"
            stroke="#22d3ee"
            strokeOpacity={0.35}
            strokeDasharray="5 6"
          />
          <rect x={18} y={5} width={cadre.length * 6.4 + 34} height={18} rx={9} fill="#0a0a12" />
          {/* Cadenas */}
          <g transform="translate(28 8)" stroke="#67e8f9" strokeWidth={1.4} fill="none">
            <rect x={0} y={5} width={9} height={7} rx={1.5} fill="#67e8f9" fillOpacity={0.25} />
            <path d="M2 5 V3.2 a2.5 2.5 0 0 1 5 0 V5" />
          </g>
          <text x={43} y={18} fontSize={11} fill="#67e8f9" fontWeight={600}>
            {cadre}
          </text>
        </g>
      )}

      {/* Ligne de fond + ligne pointillée qui s'écoule */}
      <path id={pathId} d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={`url(#grad-${id})`} strokeWidth={2} strokeDasharray="3 9" strokeLinecap="round" className="flow-dash" />

      {/* Particules de données (passent "sous" les étapes) */}
      {[0, 1, 2].map((k) => (
        <g key={k} className="flow-particle">
          <circle r={9} fill={`url(#halo-${id})`}>
            <animateMotion dur={`${duree}s`} begin={`${(k * duree) / 3}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={2.6} fill="#e0f2fe">
            <animateMotion dur={`${duree}s`} begin={`${(k * duree) / 3}s`} repeatCount="indefinite">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Étapes */}
      {etapes.map((e, i) => {
        const p = pos[i];
        const extremite = i === 0 || i === etapes.length - 1;
        return (
          <g key={e.titre} transform={`translate(${p.x - nodeW / 2} ${p.y - NODE_H / 2})`}>
            <rect
              width={nodeW}
              height={NODE_H}
              rx={10}
              fill="#0b0b14"
              fillOpacity={0.92}
              stroke={extremite ? "#22d3ee" : "rgba(255,255,255,0.18)"}
              strokeOpacity={extremite ? 0.7 : 1}
              strokeWidth={1.2}
            />
            {/* L'étape s'illumine au passage de chaque particule */}
            {[0, 1, 2].map((k) => {
              const kt = keyTimes(fractions[i]);
              return (
                <rect
                  key={k}
                  className="flow-glow"
                  width={nodeW}
                  height={NODE_H}
                  rx={10}
                  fill="#22d3ee"
                  fillOpacity={0.12}
                  stroke="#67e8f9"
                  strokeWidth={1.6}
                  opacity={0}
                >
                  <animate
                    attributeName="opacity"
                    values={kt.values}
                    keyTimes={kt.keyTimes}
                    dur={`${duree}s`}
                    begin={`${(k * duree) / 3}s`}
                    repeatCount="indefinite"
                  />
                </rect>
              );
            })}
            <text x={10} y={14} fontSize={9} fill="#71717a" fontWeight={600}>
              {String(i + 1).padStart(2, "0")}
            </text>
            <text x={nodeW / 2} y={25} textAnchor="middle" fontSize={12.5} fill="#f4f4f5" fontWeight={600}>
              {e.titre}
            </text>
            <text x={nodeW / 2} y={42} textAnchor="middle" fontSize={10.5} fill="#a1a1aa">
              {e.sous}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
