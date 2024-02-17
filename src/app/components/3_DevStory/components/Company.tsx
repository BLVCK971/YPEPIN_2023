import React, { ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Ul from "./Ul";
import { Li } from "./Li";
import Image, { StaticImageData } from "next/image";
import { IPoste } from "../data/interfaces";


const companyColors = {
    'Schneider': 'SchneiderBox',
    'Digitom': 'DigitomBox'
  }

export const Company: React.FC<{
  Id : string;
  nom: string;
  dates: string;
  companyPostes: IPoste[];
  companyLogos : StaticImageData [];
  children: ReactNode
}> = ({Id, nom, dates, companyPostes, children, companyLogos }) => {

  return (
    <div className={`sm:grid-cols-12 bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit  lg:w-auto  rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5 ${companyColors[Id]}`}>
      <div className="grid grid-cols-4">
        <h1 className="text-xl font-bold col-span-2">
          {nom}
          <div className="text-lg font-semibold">{dates}</div>
          <div className="mt-5 text-base font-semibold">
            <Ul>
              <div className="mt-2">Postes occupés : </div>

              {companyPostes.map((poste) => {
                return (
                  <Li key={poste.texte} icon={poste.icone}>
                    {poste.texte}
                  </Li>
                );
              })}
            </Ul>
          </div>
        </h1>
        {companyLogos.map((logo) => {
                return (
                  <Image  unoptimized
                  key={Id}
                  src={logo}
                  alt={`${Id}'s logo`}
                  style={{
                    width: '100%',
                    height: 'auto',
                  }}
                  className={`${companyLogos.length == 1 ? 'col-span-2' : ''}`}
                />
                );
              })}
        {children}
      </div>
    </div>
  );
};

export default Company;
