import { useEffect, useState } from "react";

// Rôles affichés un par un avec un effet de frappe (puis effacés).
// Rendu serveur : premier rôle complet ; la ligne entière reste lisible
// par les moteurs de recherche et les lecteurs d'écran (sr-only).
const ROLES = ["Tech Lead", "Architecture .NET", "Mobile", "Data & IA", "Consultant IT"];

export default function RolesTapes() {
  const [index, setIndex] = useState(0);
  const [texte, setTexte] = useState(ROLES[0]);
  const [efface, setEfface] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cible = ROLES[index];
    let t: number;
    if (!efface && texte === cible) {
      t = window.setTimeout(() => setEfface(true), 1800); // pause sur le rôle complet
    } else if (efface && texte === "") {
      setEfface(false);
      setIndex((i) => (i + 1) % ROLES.length);
    } else {
      t = window.setTimeout(
        () => setTexte(efface ? texte.slice(0, -1) : cible.slice(0, texte.length + 1)),
        efface ? 35 : 75
      );
    }
    return () => window.clearTimeout(t);
  }, [texte, efface, index]);

  return (
    <p className="text-base md:text-xl font-medium text-neutral-300">
      <span className="sr-only">{ROLES.join(" · ")}</span>
      <span aria-hidden="true">
        <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{texte}</span>
        <span className="ml-0.5 inline-block w-[2px] h-[1.1em] translate-y-[0.2em] bg-cyan-300 animate-pulse" />
      </span>
    </p>
  );
}
