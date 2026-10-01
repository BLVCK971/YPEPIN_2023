import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Ul from "./Ul";
import { Li } from "./Li";
import { IMission } from "../data/interfaces";
import {
  faBuilding,
  faLaptopCode,
  faPenToSquare,
  faPeopleArrows,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { TaskItem } from "./TaskItem";

import "./style.css";

export const Mission: React.FC<{ mission: IMission }> = ({ mission }) => {
  const { nom, periode, contexte, taches, resultats, techs, collabs, image } = mission;
  return (
    <div className="text-base col-span-4 grid grid-cols-4 mt-6 p-4 gap-4 w-full bg-neutral-500 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-20 border border-neutral-800">
      <div className="col-span-4 mb-5">
        <h4 className="text-xl font-semibold">{nom}</h4>
        {periode && <div className="text-sm opacity-70 mt-1">{periode}</div>}
      </div>

      {image && (
        <figure className="col-span-4 mb-6">
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            className="w-full max-w-3xl mx-auto h-auto rounded-xl border border-neutral-800 shadow-lg"
          />
        </figure>
      )}

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faBuilding} /> <span /> Contexte :
        </div>
        <div className="text-base mb-10">{contexte}</div>
      </div>

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPenToSquare} /> <span /> Tâches :
        </div>
        <div className="text-base mb-10">
          <Ul>
            {taches.map((tache) => (
              <TaskItem key={tache.texte} tache={tache} />
            ))}
          </Ul>
        </div>
      </div>

      {resultats && (
        <div className="col-span-4">
          <div className="text-lg mb-2">
            <FontAwesomeIcon icon={faTrophy} /> <span /> Résultats & Impact :
          </div>
          <div className="text-base mb-10">
            <Ul>
              {resultats.map((resultat) => (
                <TaskItem key={resultat.texte} tache={resultat} />
              ))}
            </Ul>
          </div>
        </div>
      )}

      <div className={collabs ? "col-span-4 md:col-span-2" : "col-span-4"}>
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faLaptopCode} /> <span /> Environnement
          Technique :
        </div>
        <div className="text-base">
          <Ul>
            {techs.map((techno) => (
              <Li key={techno.texte} icon={techno.icone}>
                {techno.texte}
              </Li>
            ))}
          </Ul>
        </div>
      </div>
      {collabs && (
        <div className="col-span-4 md:col-span-2">
          <div className="text-lg mb-2">
            <FontAwesomeIcon icon={faPeopleArrows} /> <span /> Collaborateurs &
            Roles :
          </div>
          <div className="text-base">
            <Ul>
              {collabs.map((collabo) => (
                <Li key={collabo.texte} icon={collabo.icone}>
                  {collabo.texte}
                </Li>
              ))}
            </Ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mission;
