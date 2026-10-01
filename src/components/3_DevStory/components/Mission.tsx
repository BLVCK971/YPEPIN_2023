import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Ul from "./Ul";
import { Li } from "./Li";
import { IMission } from "../data/interfaces";
import { faLaptopCode, faPenToSquare, faPeopleArrows, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { TaskItem } from "./TaskItem";
import { cn } from "../../ui/utils/cn";

import "./style.css";

// Pastilles de technos : les premières technos de l'environnement technique
const pastilles = (mission: IMission) =>
  mission.techs
    .flatMap((t) => t.texte.split(/,\s*/))
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

const Bloc = ({ icone, titre, children }: { icone: typeof faTrophy; titre: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
      <FontAwesomeIcon icon={icone} className="mr-2" />
      {titre}
    </div>
    <div className="text-[15px] leading-relaxed text-neutral-200">{children}</div>
  </div>
);

export const Mission: React.FC<{ mission: IMission }> = ({ mission }) => {
  const { nom, periode, chiffreCle, contexte, taches, resultats, techs, collabs, image } = mission;
  const [ouvert, setOuvert] = useState(false);

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:p-5 transition-colors hover:border-white/20">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-lg font-semibold">{nom}</h4>
        {periode && <span className="text-sm text-neutral-400 tabular-nums">{periode}</span>}
      </div>

      {chiffreCle && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
          <FontAwesomeIcon icon={faTrophy} className="text-xs" aria-hidden="true" />
          {chiffreCle}
        </p>
      )}

      <p className={cn("mt-3 text-[15px] leading-relaxed text-neutral-300", !ouvert && "line-clamp-2")}>{contexte}</p>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Technologies">
        {pastilles(mission).map((t) => (
          <li key={t} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
            {t}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
      >
        {ouvert ? "Masquer le détail" : "Voir le détail"}
        <span className={cn("ml-1 inline-block transition-transform duration-300", ouvert && "rotate-90")}>›</span>
      </button>

      {/* Détail toujours présent dans le HTML (SEO), replié visuellement */}
      <div
        className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", ouvert ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        aria-hidden={!ouvert}
        inert={!ouvert}
      >
        <div className="overflow-hidden">
          <div className="mt-5 grid gap-6 border-t border-white/10 pt-5">
            {image && (
              <figure>
                <img
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  className="mx-auto h-auto w-full max-w-3xl rounded-xl border border-white/10 shadow-lg"
                />
              </figure>
            )}
            <Bloc icone={faPenToSquare} titre="Tâches">
              <Ul>
                {taches.map((tache) => (
                  <TaskItem key={tache.texte} tache={tache} />
                ))}
              </Ul>
            </Bloc>

            {resultats && (
              <Bloc icone={faTrophy} titre="Résultats & impact">
                <Ul>
                  {resultats.map((resultat) => (
                    <TaskItem key={resultat.texte} tache={resultat} />
                  ))}
                </Ul>
              </Bloc>
            )}

            <div className={cn("grid gap-6", collabs && "md:grid-cols-2")}>
              <Bloc icone={faLaptopCode} titre="Environnement technique">
                <Ul>
                  {techs.map((techno) => (
                    <Li key={techno.texte} icon={techno.icone}>
                      {techno.texte}
                    </Li>
                  ))}
                </Ul>
              </Bloc>
              {collabs && (
                <Bloc icone={faPeopleArrows} titre="Collaborateurs & rôles">
                  <Ul>
                    {collabs.map((collabo) => (
                      <Li key={collabo.texte} icon={collabo.icone}>
                        {collabo.texte}
                      </Li>
                    ))}
                  </Ul>
                </Bloc>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default Mission;
