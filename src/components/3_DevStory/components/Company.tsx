import React, { useState } from "react";
import { ICompany } from "../data/interfaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../ui/utils/cn";

// Carte d'une expérience : style unique pour toutes les entreprises (le logo
// porte l'identité), missions repliées par défaut.
export const Company: React.FC<{
  company: ICompany;
  children: React.ReactNode;
}> = ({ company, children }) => {
  const { nom, dates, contexte, postes, logos, missions } = company;
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Liseré d'accent */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet-500 to-cyan-400" aria-hidden="true" />

      <div className="p-5 md:p-7 pl-6 md:pl-8">
        <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300 tabular-nums">{dates}</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">{nom}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {postes.map((poste) => (
                <li
                  key={poste.texte}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-200"
                >
                  <FontAwesomeIcon icon={poste.icone} className="text-xs text-neutral-400" />
                  {poste.texte}
                </li>
              ))}
            </ul>
          </div>

          {logos.length > 0 && (
            <div className="flex items-center gap-3 sm:justify-end">
              {logos.map((logo) => (
                <div
                  key={logo.src}
                  className={cn("flex items-center", logo.surFondClair && "rounded-lg bg-white/90 p-1.5")}
                >
                  <img
                    src={logo.src}
                    alt={`Logo ${nom}`}
                    loading="lazy"
                    className={cn("w-auto object-contain", logo.surFondClair ? "h-10 md:h-12" : "h-12 md:h-16")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {contexte && <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-neutral-400">{contexte}</p>}

        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-label={ouvert ? "Replier les missions" : "Déplier les missions"}
          className="mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/15"
        >
          {ouvert ? "Masquer les missions" : `Voir les missions (${missions.length})`}
          <span className={cn("inline-block transition-transform duration-300", ouvert && "rotate-90")}>›</span>
        </button>

        <div
          className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", ouvert ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
          aria-hidden={!ouvert}
          inert={!ouvert}
        >
          <div className="overflow-hidden">
            <div className="mt-5 grid gap-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Company;
