import Company from "./components/Company";
import {  BZ, DigitomPostes, ESME, OdooDocker, SchneiderPostes, AymingPostes, roboatmp, robosylae, robocred } from "./data/data";
import "./components/Company.css";
import ayming from '/public/logos/AYMING.png'
import schneider from '/public/logos/SCHNEIDER.png'
import digitom from '/public/logos/DIGITOM.png'
import Mission from "./components/Mission";


export default function Parcours() {
  return (
    <div className="md:p-24 p-2">
        <Company
        Id="Ayming"
        nom="Ayming"
        dates="06/2024 - 02/2025"
        companyPostes={AymingPostes}
        companyLogos={[ayming]}
      >
        <Mission 
          mission={roboatmp.nom}
          contexte={roboatmp.contexte}
          taches={roboatmp.taches}
          environ={roboatmp.techs}
          collabos={roboatmp.collabs}/>

        <Mission 
          mission={robosylae.nom}
          contexte={robosylae.contexte}
          taches={robosylae.taches}
          environ={robosylae.techs}
          collabos={robosylae.collabs}/>

        <Mission 
          mission={robocred.nom}
          contexte={robocred.contexte}
          taches={robocred.taches}
          environ={robocred.techs}
          collabos={robocred.collabs}/>
      </Company>

      <Company
        Id="Schneider"
        nom="Schneider Electric"
        dates="06/2023 - 05/2024"
        companyPostes={SchneiderPostes}
        companyLogos={[schneider]}
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
