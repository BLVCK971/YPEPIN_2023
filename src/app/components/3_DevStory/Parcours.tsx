import Company from "./components/Company";
import {  BZ, DigitomPostes, ESME, OdooDocker, SchneiderPostes } from "./data/data";
import "./components/Company.css";
import avisto from 'public/logos/avisto.png'
import schneider from 'public/logos/SCHNEIDER.png'
import digitom from 'public/logos/DIGITOM.png'
import Mission from "./components/Mission";


export default function Parcours() {
  return (
    <div className="md:p-24 p-2">
      <Company
        Id="Schneider"
        nom="Avisto / Schneider Electric"
        dates="06/2023 - Aujourd'hui"
        companyPostes={SchneiderPostes}
        companyLogos={[avisto,schneider]}
      >
        <Mission 
          mission={ESME.nom}
          contexte={ESME.contexte}
          taches={ESME.taches}
          environ={ESME.techs}
          collabos={ESME.collabs}/>
      </Company>

      <Company
        Id="Digitom"
        nom="Digitom"
        dates="10/2018 - 06/2023"
        companyPostes={DigitomPostes}
        companyLogos={[digitom]}
      >

        <Mission 
          mission={BZ.nom}
          contexte={BZ.contexte}
          taches={BZ.taches}
          environ={BZ.techs}
          collabos={BZ.collabs}/>
        <Mission 
          mission={OdooDocker.nom}
          contexte={OdooDocker.contexte}
          taches={OdooDocker.taches}
          environ={OdooDocker.techs}
          collabos={OdooDocker.collabs}/>
      </Company>
    </div>
  );
}
