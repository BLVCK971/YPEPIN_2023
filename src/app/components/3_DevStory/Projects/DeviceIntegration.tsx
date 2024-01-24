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
} from "@fortawesome/free-solid-svg-icons";

import Ul from "./Ul";
import Li from "./Li";

export default function DeviceIntegration() {
  return (
    <div className="text-lg col-span-4 p-24">
      <div className="text-5xl font-semibold">
        EcoStructure Machine Expert - Team Device Integration
      </div>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faBuilding} /> <span /> Contexte :
      </div>

      <div className="text-2xl my-10">
        Développement et Maintenance de la communication entre les automates
        Schneider et l&apos;application Machine Expert
      </div>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck} /> <span /> Tâches :
      </div>
      <Ul>
        <Li icon={faCheck}>
          Application de la méthodologie Scrum en méthode agile SAFe d&apos;une
          équipe de 8 au sein d&apos;un train de 90 personnes
          <br />
          (basé en France, Allemagne, Inde et Singapour),
        </Li>
        <Li icon={faCheck}>
          Développement C# d&apos;un IDE avec WinForms afin de programmer des
          automates d&apos;usines.
        </Li>
      </Ul>

      <div className="col-span-2">
        <div className="text-3xl my-10">
          <FontAwesomeIcon icon={faLaptopCode} /> <span /> Environnement
          Technique :
        </div>

        <Ul>
          <Li icon={faCode}>.NET, WinForms, IEC</Li>
          <Li icon={faTerminal}>Typescript, Python</Li>
          <Li icon={faNetworkWired}>OPCUA, Eip, ModbusTCP, Sercos</Li>
          <Li icon={faCodeBranch}>Jira , GitHub Enterprise , iObeya</Li>
        </Ul>
      </div>

      <div className="col-span-2">
        <div className="text-3xl my-10">
          <FontAwesomeIcon icon={faPeopleArrows} /> <span /> Collaborateurs &
          Roles :
        </div>

        <Ul>
          <Li icon={faUser}>ORSSAUD Stéphane, Product Owner</Li>
          <Li icon={faUser}>Guillaume, Product Owner</Li>
          <Li icon={faUser}>POITEVIN William, Ingénieur C#</Li>
          <Li icon={faUser}>GARNIER Romain, Ingénieur C#</Li>
        </Ul>
      </div>
    </div>
  );
}
