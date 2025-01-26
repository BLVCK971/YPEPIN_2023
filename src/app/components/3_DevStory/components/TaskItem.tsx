import React from "react";
import { ITache } from "../data/interfaces";
import { Li } from "./Li";
import Ul from "./Ul";

export const TaskItem: React.FC<{ tache: ITache }> = ({ tache }) => {
  if (!tache.soustaches) {
    return (
      <Li key={tache.texte} icon={tache.icone}>
        {tache.texte}
      </Li>
    );
  }

  return (
    <Li key={tache.texte} icon={tache.icone}>
      {tache.texte}
      <Ul>
        {tache.soustaches.map((soustache: ITache) => (
          <Li key={soustache.texte} icon={soustache.icone}>
            {soustache.texte}
          </Li>
        ))}
      </Ul>
    </Li>
  );
};
