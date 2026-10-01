import { useEffect, useMemo, useRef, useState } from "react";
import { companies } from "../3_DevStory/data/data";
import { IMission, ITache } from "../3_DevStory/data/interfaces";

// Réseau des compétences : 6 domaines autour du centre, les technologies
// autour de chaque domaine. Les missions associées à une techno sont
// calculées à partir des données du parcours (aucun chiffre saisi à la main).

type Domaine = { id: string; nom: string; couleur: string };
type Techno = { nom: string; domaine: string; motif: RegExp };

// Ordre = ordre du cercle : les voisins ont été validés (daltonisme,
// contraste) sur fond sombre avec le validateur de palette dataviz.
const DOMAINES: Domaine[] = [
  { id: "dotnet", nom: ".NET", couleur: "#3987e5" },
  { id: "python", nom: "Python", couleur: "#d95926" },
  { id: "data", nom: "Data & IA", couleur: "#199e70" },
  { id: "db", nom: "Bases de données", couleur: "#c98500" },
  { id: "front", nom: "Front & Mobile", couleur: "#d55181" },
  { id: "cloud", nom: "Cloud & DevOps", couleur: "#008300" },
];

const TECHNOS: Techno[] = [
  { nom: "C#", domaine: "dotnet", motif: /C#/ },
  { nom: "ASP.NET", domaine: "dotnet", motif: /ASP\.NET/ },
  { nom: "EF Core", domaine: "dotnet", motif: /Entity ?Framework/i },
  { nom: "WPF", domaine: "dotnet", motif: /\bWPF\b/ },
  { nom: "WinForms", domaine: "dotnet", motif: /WinForms/ },
  { nom: "MediatR / CQRS", domaine: "dotnet", motif: /MediatR|CQRS/ },
  { nom: "Clean Architecture", domaine: "dotnet", motif: /Clean Architecture/i },

  { nom: "Python", domaine: "python", motif: /\bPython\b/ },
  { nom: "FastAPI", domaine: "python", motif: /FastAPI/ },
  { nom: "Pandas", domaine: "python", motif: /Pandas/ },
  { nom: "Requests", domaine: "python", motif: /\bRequests\b/ },
  { nom: "Playwright", domaine: "python", motif: /Playwright/ },
  { nom: "SQLAlchemy", domaine: "python", motif: /SQLAlchemy/ },
  { nom: "Odoo", domaine: "python", motif: /\bOdoo\b/ },

  { nom: "Power BI", domaine: "data", motif: /Power ?BI/i },
  { nom: "OpenAI", domaine: "data", motif: /OpenAI/ },
  { nom: "API Claude", domaine: "data", motif: /Claude/ },
  { nom: "Qwen / Ollama", domaine: "data", motif: /Qwen|Ollama/ },
  { nom: "RAG / Qdrant", domaine: "data", motif: /\bRAG\b|Qdrant/ },
  { nom: "ETL", domaine: "data", motif: /\bETLs?\b/ },

  { nom: "PostgreSQL", domaine: "db", motif: /PostgreSQL/i },
  { nom: "SQL Server", domaine: "db", motif: /SQL Server/ },
  { nom: "DynamoDB", domaine: "db", motif: /DynamoDB/ },
  { nom: "Supabase", domaine: "db", motif: /Supabase/ },
  { nom: "Azure SQL", domaine: "db", motif: /Azure SQL/ },

  { nom: "React", domaine: "front", motif: /\bReact\b(?! Native)/ },
  { nom: "React Native", domaine: "front", motif: /React Native/ },
  { nom: "TypeScript", domaine: "front", motif: /TypeScript/ },
  { nom: "Angular", domaine: "front", motif: /Angular/ },
  { nom: "JavaScript", domaine: "front", motif: /JavaScript/ },
  { nom: "Tailwind", domaine: "front", motif: /Tailwind/ },

  { nom: "Docker", domaine: "cloud", motif: /Docker/ },
  { nom: "AWS", domaine: "cloud", motif: /\bAWS\b/ },
  { nom: "Azure", domaine: "cloud", motif: /Azure(?! SQL)/ },
  { nom: "GitHub Actions", domaine: "cloud", motif: /GitHub Actions/ },
  { nom: "Traefik", domaine: "cloud", motif: /Traefik/ },
  { nom: "SnapLogic", domaine: "cloud", motif: /SnapLogic/ },
];

type Usage = { entreprise: string; mission: string };

const texteMission = (m: IMission) => {
  const taches = (t: ITache[]): string[] =>
    t.flatMap((x) => [x.texte, ...(x.soustaches ? taches(x.soustaches) : [])]);
  return [m.nom, m.contexte, ...taches(m.taches), ...(m.resultats ? taches(m.resultats) : []), ...m.techs.map((t) => t.texte)].join(" \n ");
};

const usagesDe = (techno: Techno): Usage[] =>
  companies.flatMap((c) =>
    c.missions
      .filter((m) => techno.motif.test(texteMission(m)))
      .map((m) => ({ entreprise: c.nom, mission: m.nom.split(" - ")[0] }))
  );

// --- Mise en page (viewBox 1100 x 740) ---------------------------------------
const W = 1100;
const H = 740;
const CX = W / 2;
const CY = H / 2;
const RX = 300; // rayon horizontal de l'anneau des domaines
const RY = 205;

type Noeud = {
  id: string;
  label: string;
  type: "centre" | "domaine" | "techno";
  domaine?: Domaine;
  x: number;
  y: number;
  r: number;
  parent?: string;
  usages?: Usage[];
  angle?: number; // direction de la techno par rapport à son domaine (radians)
  phase: number;
};

const construireNoeuds = (): Noeud[] => {
  const noeuds: Noeud[] = [{ id: "centre", label: "Yoel", type: "centre", x: CX, y: CY, r: 30, phase: 0 }];
  DOMAINES.forEach((d, i) => {
    const angle = (-90 + i * 60) * (Math.PI / 180);
    const hx = CX + RX * Math.cos(angle);
    const hy = CY + RY * Math.sin(angle);
    noeuds.push({ id: d.id, label: d.nom, type: "domaine", domaine: d, x: hx, y: hy, r: 20, phase: i });
    const technos = TECHNOS.filter((t) => t.domaine === d.id);
    const ouverture = 160; // degrés couverts par l'éventail des technos
    technos.forEach((t, j) => {
      const a = angle + ((-ouverture / 2 + (ouverture * (j + 0.5)) / technos.length) * Math.PI) / 180;
      const rayon = j % 2 === 0 ? 100 : 152;
      const usages = usagesDe(t);
      noeuds.push({
        id: `${d.id}-${t.nom}`,
        label: t.nom,
        type: "techno",
        domaine: d,
        parent: d.id,
        x: hx + rayon * Math.cos(a),
        y: hy + rayon * 0.82 * Math.sin(a),
        // Surface proportionnelle au nombre de missions
        r: 5 + 2.2 * Math.sqrt(usages.length),
        usages,
        angle: a,
        phase: i * 7 + j,
      });
    });
  });
  return noeuds;
};

export default function StackGraph() {
  const noeuds = useMemo(construireNoeuds, []);
  const parId = useMemo(() => new Map(noeuds.map((n) => [n.id, n])), [noeuds]);
  const liens = useMemo(
    () =>
      noeuds
        .filter((n) => n.type !== "centre")
        .map((n) => ({ de: n.type === "domaine" ? "centre" : (n.parent as string), vers: n.id })),
    [noeuds]
  );

  const [selection, setSelection] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const noeudRefs = useRef(new Map<string, SVGGElement>());
  const lienRefs = useRef(new Map<string, SVGLineElement>());

  // Apparition au scroll
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Flottement léger des nœuds (désactivé si l'utilisateur réduit les animations)
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const debut = performance.now();
    const pos = new Map<string, { x: number; y: number }>();
    const tick = (now: number) => {
      const t = (now - debut) / 1000;
      for (const n of noeuds) {
        const amp = n.type === "techno" ? 4 : n.type === "domaine" ? 2.5 : 0;
        const x = n.x + amp * Math.sin(t * 0.6 + n.phase);
        const y = n.y + amp * Math.cos(t * 0.5 + n.phase * 1.3);
        pos.set(n.id, { x, y });
        noeudRefs.current.get(n.id)?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      }
      for (const l of liens) {
        const a = pos.get(l.de);
        const b = pos.get(l.vers);
        const el = lienRefs.current.get(l.vers);
        if (a && b && el) {
          el.setAttribute("x1", a.x.toFixed(1));
          el.setAttribute("y1", a.y.toFixed(1));
          el.setAttribute("x2", b.x.toFixed(1));
          el.setAttribute("y2", b.y.toFixed(1));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, noeuds, liens]);

  const sel = selection ? parId.get(selection) : undefined;
  // Un nœud est "actif" s'il est sélectionné, son domaine, ou le centre
  const estActif = (n: Noeud) => {
    if (!sel) return true;
    if (sel.type === "domaine") return n.id === sel.id || n.parent === sel.id || n.type === "centre";
    if (sel.type === "techno") return n.id === sel.id || n.id === sel.parent || n.type === "centre";
    return true;
  };

  const technosDuDomaine = sel?.type === "domaine" ? noeuds.filter((n) => n.parent === sel.id) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-500/20 backdrop-blur-lg p-2 md:p-4">
        {/* Légende : identité jamais portée par la couleur seule (les hubs sont aussi libellés) */}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 px-2 pt-1 text-sm text-neutral-300">
          {DOMAINES.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.couleur }} />
              {d.nom}
            </li>
          ))}
        </ul>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="group"
          aria-label="Réseau des compétences : domaines et technologies"
          onMouseLeave={() => setSelection(null)}
        >
          <g>
            {liens.map((l) => {
              const a = parId.get(l.de)!;
              const b = parId.get(l.vers)!;
              // Lien mis en avant : celui qui mène à la sélection ou en part
              const actif = !sel || b.id === sel.id || b.parent === sel.id || b.id === sel.parent;
              return (
                <line
                  key={l.vers}
                  ref={(el) => {
                    if (el) lienRefs.current.set(l.vers, el);
                  }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={actif && sel ? b.domaine?.couleur ?? "#ffffff" : "rgba(255,255,255,0.14)"}
                  strokeWidth={actif && sel ? 2 : 1}
                  style={{
                    opacity: visible ? (actif ? 1 : 0.15) : 0,
                    transition: "opacity 600ms ease, stroke 200ms",
                    transitionDelay: visible && !sel ? `${b.type === "domaine" ? 100 : 400}ms` : "0ms",
                  }}
                />
              );
            })}
          </g>
          <g>
            {noeuds.map((n, idx) => {
              const actif = estActif(n);
              const estSel = sel?.id === n.id;
              // Libellé radial : il part dans la direction de la techno depuis son domaine
              const cos = Math.cos(n.angle ?? 0);
              const sin = Math.sin(n.angle ?? 0);
              const horizontal = Math.abs(cos) > 0.4;
              const lx = n.type !== "techno" ? 0 : horizontal ? Math.sign(cos) * (n.r + 6) : 0;
              const ly = n.type === "domaine" ? -(n.r + 9) : n.type !== "techno" || horizontal ? 0 : Math.sign(sin) * (n.r + 6);
              const ancre = n.type !== "techno" || !horizontal ? "middle" : cos > 0 ? "start" : "end";
              const dy = n.type === "domaine" ? 0 : horizontal ? "0.35em" : sin > 0 ? "0.8em" : "-0.15em";
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) noeudRefs.current.set(n.id, el);
                  }}
                  transform={`translate(${n.x} ${n.y})`}
                  tabIndex={n.type === "centre" ? -1 : 0}
                  role={n.type === "centre" ? undefined : "button"}
                  aria-label={
                    n.type === "techno"
                      ? `${n.label}, ${n.usages?.length ?? 0} mission(s)`
                      : n.type === "domaine"
                        ? `Domaine ${n.label}`
                        : undefined
                  }
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => n.type !== "centre" && setSelection(n.id)}
                  onFocus={() => n.type !== "centre" && setSelection(n.id)}
                  onClick={() => n.type !== "centre" && setSelection(n.id)}
                >
                  <g
                    style={{
                      opacity: visible ? (actif ? 1 : 0.2) : 0,
                      transform: visible ? "scale(1)" : "scale(0.2)",
                      transition: "opacity 500ms ease, transform 700ms cubic-bezier(.2,.8,.2,1)",
                      transitionDelay: visible && !sel ? `${n.type === "centre" ? 0 : n.type === "domaine" ? 150 : 350 + (idx % 12) * 40}ms` : "0ms",
                    }}
                  >
                    {/* Zone de survol plus grande que la marque */}
                    <circle r={Math.max(n.r + 10, 16)} fill="transparent" />
                    {n.type === "centre" ? (
                      <>
                        <circle r={n.r} fill="#ffffff" fillOpacity={0.08} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={1.5} />
                        <text textAnchor="middle" dy="0.35em" fill="#ffffff" fontSize={16} fontWeight={600}>
                          {n.label}
                        </text>
                      </>
                    ) : (
                      <>
                        <circle
                          r={estSel ? n.r + 3 : n.r}
                          fill={n.domaine!.couleur}
                          stroke="#120d1a"
                          strokeWidth={2}
                          style={{ transition: "r 200ms" }}
                        />
                        {estSel && <circle r={n.r + 7} fill="none" stroke={n.domaine!.couleur} strokeWidth={2} />}
                        <text
                          x={lx}
                          y={ly}
                          dy={dy}
                          textAnchor={ancre}
                          fill={n.type === "domaine" ? "#ffffff" : "#d4d4d4"}
                          fontSize={n.type === "domaine" ? 17 : 13}
                          fontWeight={n.type === "domaine" ? 700 : 500}
                          paintOrder="stroke"
                          stroke="#120d1a"
                          strokeWidth={3}
                          strokeOpacity={0.6}
                        >
                          {n.label}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Panneau de détail (hover, focus clavier ou tap) */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-500/20 backdrop-blur-lg p-4 md:p-6 min-h-[12rem]" aria-live="polite">
        {!sel && (
          <div className="text-neutral-300">
            <h3 className="text-xl font-semibold text-white mb-2">Explorer la stack</h3>
            <p>
              Survolez (ou touchez) une technologie pour voir dans quelles missions elle a été utilisée, ou
              un domaine pour voir ses technologies.
            </p>
            <p className="mt-3 text-sm">La taille d'un point est proportionnelle au nombre de missions.</p>
          </div>
        )}
        {sel?.type === "techno" && (
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <span className="inline-block w-4 h-[2px]" style={{ background: sel.domaine!.couleur }} />
              {sel.domaine!.nom}
            </div>
            <h3 className="text-2xl font-semibold text-white mt-1">{sel.label}</h3>
            <p className="mt-1 text-neutral-300">
              <span className="text-white font-semibold text-lg">{sel.usages!.length}</span>{" "}
              mission{sel.usages!.length > 1 ? "s" : ""}
            </p>
            <ul className="mt-4 space-y-2">
              {sel.usages!.map((u) => (
                <li key={u.entreprise + u.mission} className="text-sm">
                  <div className="text-white">{u.mission}</div>
                  <div className="text-neutral-400">{u.entreprise}</div>
                </li>
              ))}
              {sel.usages!.length === 0 && (
                <li className="text-sm text-neutral-400">Pas de mission détaillée sur ce site.</li>
              )}
            </ul>
          </div>
        )}
        {sel?.type === "domaine" && (
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <span className="inline-block w-4 h-[2px]" style={{ background: sel.domaine!.couleur }} />
              Domaine
            </div>
            <h3 className="text-2xl font-semibold text-white mt-1">{sel.label}</h3>
            <ul className="mt-4 space-y-1">
              {technosDuDomaine
                .slice()
                .sort((a, b) => (b.usages?.length ?? 0) - (a.usages?.length ?? 0))
                .map((t) => (
                  <li key={t.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-white">{t.label}</span>
                    <span className="text-neutral-400 tabular-nums">
                      {t.usages?.length ?? 0} mission{(t.usages?.length ?? 0) > 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
