import { faDocker } from "@fortawesome/free-brands-svg-icons";
import { IPoste } from "./interfaces";
import {
  faCode,
  faNetworkWired,
  faCodeBranch,
} from "@fortawesome/free-solid-svg-icons";

export const SchneiderPostes: IPoste[] = [
  { icone: faNetworkWired, texte: "Scrum Master" },
  { icone: faCode, texte: "Ingénieur Logiciel C#" },
];

export const DigitomPostes: IPoste[] = [
  { icone: faCode, texte: "Ingénieur Logiciel C# & Python" },
  { icone: faNetworkWired, texte: "Analyste & Formateur BI" },
  { icone: faCodeBranch, texte: "Intégrateur Odoo" },
  { icone: faDocker, texte: "Ingénieur DevOps" },
];