import BusinessZone from "../Projects/BusinessZone";
import "./Digitom.tsx.css"

export default function Digitom() {
  return (
    <div className=" DigitomBox sm:grid-cols-12  pb-6 pt-8 backdrop-blur-2xl  dark:border-neutral-800 lg:w-auto  lg:rounded-xl lg:border  lg:p-4 p-4  mb-5">

        <div className="grid grid-cols-4">
          <h1 className="mb-3 text-6xl font-bold col-span-3">
            Digitom
          </h1>
          <div className="text-5xl font-semibold col-span-1">
            10/2018 - 06/2023
          </div>
          <div className="text-lg">Postes occupés : </div>
          <div className="text-lg"> - Alternant</div>
          <div className="text-lg"> - Analyste BI</div>
          <div className="text-lg"> - Formateur BI : 1 Projet</div>
          <div className="text-lg"> - Intégrateur Odoo</div>
          <div className="text-lg"> - Ingénieur Logiciel Python</div>
          <div className="text-lg"> - Ingénieur DevOps : 2 Projets</div>
          <div className="text-lg"> - Ingénieur Logiciel C#</div>

          <BusinessZone/>
        </div>
    </div>
  );
}
