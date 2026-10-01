import React, { useState } from "react";
import { ICompany } from "../data/interfaces";
import { ArrowIcon } from "../CustomIcons/ArrowIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Company.css";

const companyColors: { [key: string]: string } = {
  Freelance: "FreelanceBox",
  Drevio: "DrevioBox",
  Proelan: "SchneiderBox",
  Avisto: "AvistoBox",
  Digitom: "DigitomBox",
  Ayming: "AymingBox",
};

export const Company: React.FC<{
  company: ICompany;
  children: React.ReactNode;
}> = ({ company, children }) => {
  const { id: Id, nom, dates, contexte, postes: companyPostes, logos: companyLogos } = company;
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sm:grid-cols-12 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:w-auto rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5 ${companyColors[Id]}`}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <div className="text-xl font-bold">
            <h3 className="flex items-center">
              {nom}
            </h3>
            <div className="text-lg font-semibold">{dates}</div>
            <div className="mt-5 text-base font-semibold">
              <div className="mt-2 mb-3">Postes occupés : </div>
              {companyPostes.map((poste) => (
                <div key={poste.texte} className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                    <FontAwesomeIcon icon={poste.icone} className="w-8 h-8" />
                  </div>
                  <span>{poste.texte}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-center justify-between flex-wrap gap-4">
          <div className="flex justify-start items-center gap-4 flex-wrap">
            {companyLogos.map((logo) => (
              <div
                key={logo.src}
                className={`flex items-center justify-start h-full ${logo.surFondClair ? "bg-white/90 rounded-xl p-2" : ""}`}
              >
                <img
                  src={logo.src}
                  alt={`Logo ${nom}`}
                  className={logo.surFondClair ? "h-14 sm:h-28 object-contain" : "h-16 sm:h-32 object-contain"}
                />
              </div>
            ))}
          </div>
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-white/20 rounded-lg shadow-lg hover:shadow-xl ml-auto"
            aria-label={isCollapsed ? "Déplier les missions" : "Replier les missions"}
          >
            <span className="hidden sm:inline whitespace-nowrap">
              {isCollapsed ? "Voir les missions" : "Masquer les missions"}
            </span>
            <div
              className="transition-transform duration-300"
              style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
            >
              <ArrowIcon />
            </div>
          </button>
        </div>
      </div>
      <div
        className={`transition-all duration-300 mt-4 origin-top ${isCollapsed
          ? 'grid-rows-[0fr] opacity-0 scale-y-0'
          : 'grid-rows-[1fr] opacity-100 scale-y-100'
          }`}
        style={{ display: 'grid' }}
      >
        <div className="overflow-hidden">
          {contexte && (
            <div className="text-base bg-white/5 rounded-xl p-4">{contexte}</div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Company;
