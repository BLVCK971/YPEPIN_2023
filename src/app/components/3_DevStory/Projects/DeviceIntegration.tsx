import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/react-fontawesome";
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Ul, { Li } from "./listComponent";

export default function DeviceIntegration() {
  return (
    <div className="text-lg col-span-4 p-24">
      <div className="text-5xl font-semibold">
        EcoStructure Machine Expert - Team Device Integration
      </div>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck} /> <span /> Contexte :
      </div>

      <div className="text-2xl my-10">
      Développement et Maintenance de la communication entre les automates
          Schneider et l&apos;application Machine Expert
      </div>


      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck } /> <span /> Tâches :
      </div>

      <Ul>
      <Li icon = {faCheck as IconProp}> 
        
      </Li>
      </Ul>

      <ul className="fa-ul">
    
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Application de la méthodologie Scrum en méthode agile SAFe d&apos;une
          équipe de 8 au sein d&apos;un train de 90 personnes
          <br />
          (basé en France, Allemagne, Inde et Singapour),
        </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Développement C# d&apos;un IDE avec WinForms afin de programmer des
          automates d&apos;usines.
        </li>
      </ul>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck} /> <span /> Environnement Technique :
      </div>

      <ul className="fa-ul">
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          .NET, WinForms
        </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Jira , GitHub Enterprise , iObeya
        </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Typescript, Python
        </li>
      </ul>
    </div>
  );
}
