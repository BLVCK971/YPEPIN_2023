import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faBuilding,
  faPeopleArrows,
  faCode,
  faUser,
  faGears,
  faNetworkWired,
  faLaptopCode,
  faCodeBranch,
  faTerminal,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

import Ul from "../components/Ul";
import Li from "../components/Li";

export default function DeviceIntegration() {
  return (
    <div className="text-base col-span-4 grid grid-cols-4 p-4 mt-6">
      <div className=" col-span-4 text-xl font-semibold mb-5">
        EcoStructure Machine Expert - Team Device Integration
      </div>

      <div className="col-span-4">
        <div className="text-lg mb-2 ">
          <FontAwesomeIcon icon={faBuilding} /> <span /> Contexte :
        </div>

        <div className="text-base mb-10">
          Développement et Maintenance de la communication entre les automates
          Schneider et l&apos;application Machine Expert
        </div>
      </div>

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPenToSquare} /> <span /> Tâches :
        </div>

        <div className="text-base mb-10">
          <Ul>
            <Li icon={faCheck}>
              Application de la méthodologie Scrum en méthode agile SAFe
              d&apos;une équipe de 8 au sein d&apos;un train de 90 personnes
              <br />
              (basé en France, Allemagne, Inde et Singapour),
            </Li>
            <Li icon={faCheck}>
              Développement C# d&apos;un IDE avec WinForms afin de programmer
              des automates d&apos;usines.
            </Li>
          </Ul>
        </div>
      </div>

      <div className="col-span-2">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faLaptopCode} /> <span /> Environnement
          Technique :
        </div>
        <div className="text-base">
          <Ul>
            <Li icon={faCode}>.NET, WinForms, IEC</Li>
            <Li icon={faTerminal}>Typescript, Python</Li>
            <Li icon={faNetworkWired}>OPCUA, Eip, ModbusTCP, Sercos</Li>
            <Li icon={faCodeBranch}>Jira , GitHub Enterprise , iObeya</Li>
          </Ul>
        </div>
      </div>

      <div className="col-span-2">
        <div className="text-lg  mb-2">
          <FontAwesomeIcon icon={faPeopleArrows} /> <span /> Collaborateurs &
          Roles :
        </div>

        <Ul>
          <Li icon={faUser}>Stéphane ORSSAUD, Product Owner</Li>
          <Li icon={faUser}>Guillaume LANDRU, Product Owner</Li>
          <Li icon={faUser}>William POITEVIN, Ingénieur C#</Li>
          <Li icon={faUser}>Romain GARNIER, Ingénieur C#</Li>
        </Ul>
      </div>
    </div>
  );
}
