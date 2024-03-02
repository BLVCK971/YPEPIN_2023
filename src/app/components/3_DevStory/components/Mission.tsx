import React, { ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Ul from "./Ul";
import { Li } from "./Li";
import Image from "next/image";
import { ICollab, IPoste, ITache, ITech } from "../data/interfaces";
import {
  faBuilding,
  faLaptopCode,
  faPenToSquare,
  faPeopleArrows,
} from "@fortawesome/free-solid-svg-icons";

import "./style.css";
import Slides from "./Slides/Slides";

export const Mission: React.FC<{
  mission: string;
  contexte: string;
  taches: ITache[];
  collabos: ICollab[];
  environ: ITech[];
}> = ({ mission, contexte, taches, collabos, environ }) => {
  return (
    <div className="text-base col-span-4 grid grid-cols-4 mt-6 p-4 gap-4 w-full bg-neutral-500 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-20 border border-neutral-800">
      <div className=" col-span-4 text-xl font-semibold mb-5">{mission}</div>

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faBuilding} /> <span /> Contexte :
        </div>
        <div className="text-base mb-10">{contexte}</div>
      </div>

      <div className="col-span-3">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPenToSquare} /> <span /> Tâches :
        </div>
        <div className="text-base mb-10">
          <Ul>
            {taches.map((tache) => {
              return ! tache.soustaches ? (
                <Li key={tache.texte} icon={tache.icone}>
                  {tache.texte}
                </Li>
              ) : (
                  <Li key={tache.texte} icon={tache.icone}>
                    {tache.texte}
                    <Ul>
                      {tache.soustaches.map((soustache: ITache) => {
                        return (
                          <Li key={soustache.texte} icon={soustache.icone}>
                            {soustache.texte}
                          </Li>
                        );
                      })}
                    </Ul>
                  </Li> 
              );
            })}
          </Ul>
        </div>
      </div>
      <div className="col-span-1">
      <Slides id="slide"/>
      </div>

      <div className="col-span-2">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faLaptopCode} /> <span /> Environnement
          Technique :
        </div>
        <div className="text-base">
          <Ul>
            {environ.map((techno) => {
              return (
                <Li key={techno.texte} icon={techno.icone}>
                  {techno.texte}
                </Li>
              );
            })}
          </Ul>
        </div>
      </div>
      <div className="col-span-2">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPeopleArrows} /> <span /> Collaborateurs &
          Roles :
        </div>
        <div className="text-base">
          <Ul>
            {collabos.map((collabo) => {
              return (
                <Li key={collabo.texte} icon={collabo.icone}>
                  {collabo.texte}
                </Li>
              );
            })}
          </Ul>
        </div>
      </div>
    </div>
  );
};

export default Mission;
