import React from "react";

interface ProjetProps {
    nom : string;
    desc : string;
    duree : string;
    texte : string[];
    envtech : string[];
}
const Projet: React.FC<ProjetProps> = ({nom, desc, duree, texte, envtech}) => {
  return (
    <div>{nom}{duree}
    {desc}
    {texte}
    {envtech}
    </div>
  );
};

export default Projet;
