import { faDocker } from "@fortawesome/free-brands-svg-icons";
import { ICollab, IMission, IPoste, ITache, ITech } from "./interfaces";
import {
  faCode,
  faNetworkWired,
  faCodeBranch,
  faUser,
  faDiagramNext,
  faVault,
  faShareFromSquare,
  faGears,
  faUserGroup,
  faChartPie,
  faUsersGear,
  faSitemap,
  faPenToSquare,
  faCheck,
  faDatabase,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";





/// SCHNEIDER .............

export const SchneiderPostes: IPoste[] = [
  { icone: faNetworkWired, texte: "Scrum Master" },
  { icone: faCode, texte: "Ingénieur Logiciel C#" },
];


export const ESME: IMission = {
  nom : "EcoStructure Machine Expert - Team Device Integration",
  contexte : "Développement et Maintenance de la communication entre les automates Schneider et l'application Machine Expert",
  taches : [
    { icone: faCheck, texte: "Application de la méthodologie Scrum en méthode agile SAFe d'une équipe de 8 au sein d'un train de 90 personnes<br />(basé en France, Allemagne, Inde et Singapour)"},
    { icone: faCheck, texte: "Développement C# d&apos;un IDE avec WinForms afin de programmer des automates d&apos;usines."}
  ],
  techs : [
    { icone: faCode, texte: ".NET, WinForms, IEC"},
    { icone: faTerminal, texte: "Typescript, Python"},
    { icone: faNetworkWired, texte: "OPCUA, Eip, ModbusTCP, Sercos"},
    { icone: faCodeBranch, texte: "Jira , GitHub Enterprise, iObeya"}
  ],
  collabs : [
    { icone: faUser, texte: "Stéphane ORSSAUD, Product Owner"},
    { icone: faUser, texte: "Guillaume LANDRU, Product Owner"},
    { icone: faUser, texte: "William POITEVIN, Ingénieur C#"},
    { icone: faUser, texte: "Romain GARNIER, Ingénieur C#"},
    { icone: faUser, texte: "Romain CANOVAS, Ingénieur Typescript", linkedin: "https://www.linkedin.com/in/romain-canovas/"},
    { icone: faUser, texte: "Ljiljana Angeleski, Test Engineer", linkedin : "https://www.linkedin.com/in/ljiljana-angeleski-a9389123/"},
  ]
}


/// DIGITOM .............
export const DigitomPostes: IPoste[] = [
  { icone: faCode, texte: "Ingénieur Logiciel C# & Python" },
  { icone: faNetworkWired, texte: "Analyste & Formateur BI" },
  { icone: faCodeBranch, texte: "Intégrateur Odoo" },
  { icone: faDocker, texte: "Ingénieur DevOps" },
];

/// BusinessZone

export const BZ: IMission = {
  nom : "Business Zone",
  contexte : "Une application Web ASP.NET MVC en C# en Clean Architecture permettant le partage contrôlé de rapports Power BI pour les clients de DIGITOM dans leur service.",
  taches : [
    { icone: faCheck, texte: "TechLead sur l'ensemble du projet, chapeauté par Régis GEROMEGNACE"},
    { icone: faPenToSquare, texte: "Besoin perçu sur plusieurs projets et sur de futures problématiques : Conception de l&apos;idée, du Cahier des Charges, Présentation à la Direction du POC, Conception UML, Développement, Lancement de produit"},
    { icone: faSitemap, texte: "CleanArchitecture en place permettant une application modulaire, maintenable et évolutive."},
    { icone: faGears, texte: "Fonctionnalités :", soustaches : 
    [
      { icone: faUsersGear, texte: "Authentification, administration et système d'autorisations"},
      { icone: faChartPie, texte: "Intégration de Power BI"},
      { icone: faUserGroup, texte: "Gestion des rôles"},
      { icone: faVault, texte: "Sécurité des données"},
      { icone: faShareFromSquare, texte: "Partage contrôlé de rapport Power BI"}
    ]},
    { icone: faGears, texte: "Fonctionnalités prévues :", soustaches : 
    [
      { icone: faDiagramNext, texte: "Multi Tenant : Accès sur la même instance de plusieurs instance AzureAD/PowerBIService"},
      { icone: faDiagramNext, texte: "Pré-Filtre : Pour un rapport Power BI partagé, Filtrage dynamique selon l'identification sur BZ"},
      { icone: faDiagramNext, texte: "Multi BDD : Elaboration de rapports pouvant s&apos;adapter à la majorité des BDD des ERP du marché."},
      { icone: faDiagramNext, texte: "Multi Service : Standardisation des rapports pour répondre aux besoins principaux de n&apos;importe quelle entreprise. Amélioration continue des rapports de clients ayant déjà souscrit à BZ"},
      { icone: faDiagramNext, texte: "Multi BI : Prise en charge de BusinessObject, Tableau voire Framework de visualisation (JS, Python, R ou autres) pour éviter une limitation de la solution à Power BI Embedded."}
    ]}
  ],
  techs : [
    { icone: faCode, texte: "C#, .NET MVC, EntityFramework"},
    { icone: faChartPie, texte: "Power BI Service, Power BI Embedded, Azure AD"},
    { icone: faDatabase, texte: "SQL Server"},
    { icone: faSitemap, texte: "Principes SOLID, Pattern CQRS, Mediator et Repository"},
    { icone: faGears, texte: "AutoMapper, MediatR, FluentValidation et Swagger"}
  ],
  collabs : [
    { icone: faUser, texte: "Régis GEROMEGNACE, Product Owner et Product Manager"},
    { icone: faUser, texte: "Olivier ANGELE, Gestion client avant-vente"}
  ]
}


export const OdooDocker: IMission = {
  nom : "Odoo Docker",
  contexte : "Conteneurisation d’une Application ERP",
  taches : [
    { icone: faCode, texte: "Création d'un conteneur Odoo pour éviter l'utilisation de machines virtuelles"},
    { icone: faCode, texte: "Développement du conteneur pour faciliter l'accès aux futurs développeurs de l'entreprise"},
    { icone: faCode, texte: "Prise en charge des versions officielles d'Odoo et adaptation aux anciennes versions"},
    { icone: faCode, texte: "Permet de lancer les instances pour tous les clients en production simplement en important leurs données"},
    { icone: faCode, texte: "Projet lié à AutoSauvegarde :", soustaches : [
      { icone: faCode, texte: "Module Odoo créé pour faire des Backup des instances clientes en cas d’incident. "}]},
    { icone: faCode, texte: "Le conteneur pouvait donc, en chargeant n’importe quelle sauvegarde en production, permettre du développement, test ou réparation très rapidement sur une instance de développement."}
  ],
  techs : [
    { icone: faDocker, texte: "Docker, Dockerfile, Docker Compose"},
    { icone: faCode, texte: "Python, Venv"},
    { icone: faDatabase, texte: "Postgresql"}
  ],
  collabs : [
    { icone: faUser, texte: "Régis GEROMEGNACE, Product Owner et Product Manager"}
  ]
}