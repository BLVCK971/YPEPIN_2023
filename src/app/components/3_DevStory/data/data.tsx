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
  faLock,
  faCloud,
  faServer,
  faRocket,
  faCubes,
  faBoltLightning,
  faChartLine,
  faBook,
  faMagnifyingGlass,
  faChartSimple,
  faTrophy,
  faShieldHalved,
  faClipboardList,
  faShield,
  faCheckDouble,
  faPeopleGroup,
  faIndustry,
  faMicrochip,
  faRobot,
  faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";

/// Ayming .............

export const AymingPostes: IPoste[] = [
  { icone: faCode, texte: "Ingénieur Logiciel Python" },
  { icone: faCloud, texte: "Architecte Cloud" },
];

export const roboatmp: IMission = {
  nom: "ATMP (Scraping NET ENTREPRISE)",
  contexte: "Automatisation à grande échelle de la récupération des taux AT/MP pour 5000+ comptes clients via NET ENTREPRISE. Migration réussie d'une solution Java vers une architecture Python moderne, générant un bénéfice mensuel de 1-2M€ grâce à l'amélioration de la fiabilité et de la performance du scraping.",
  taches: [
    {
      icone: faRocket,
      texte: "Migration stratégique vers une architecture Python moderne, réduisant les coûts d'infrastructure de 70% et améliorant les performances de 60%"
    },
    {
      icone: faCubes,
      texte: "Architecture distribuée sur AWS ECS avec auto-scaling, permettant le traitement parallèle de milliers de requêtes"
    },
    {
      icone: faBoltLightning,
      texte: "Système de caching intelligent et gestion d'erreurs avancée avec classification automatique et mise à jour en temps réel"
    },
    {
      icone: faChartLine,
      texte: "Monitoring proactif via AWS XRay et système de notification intelligent pour la détection précoce des anomalies"
    },
    {
      icone: faBook,
      texte: "Documentation exhaustive incluant diagrammes d'architecture, guides de dépannage et procédures de déploiement"
    }
  ],
  techs: [
    { icone: faCode, texte: "Python, Requests, Pandas"},
    { icone: faCloud, texte: "AWS DynamoDB, S3, XRay"},
    { icone: faDatabase, texte: "Redis, PostgreSQL"},
    { icone: faSitemap, texte: "Architecture Distribuée, Event-Driven"},
    { icone: faGears, texte: "Docker, SnapLogic, CI/CD Pipelines"}
  ],
  collabs: [
    { icone: faUser, texte: "Xavier , Project Manager"},
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Bassem, Expert SnapLogic"},
    { icone: faUser, texte: "Pierre Marie MARTIN, Createur ATMP V1"},
    { icone: faUser, texte: "Marc, Representant Client ATMP"}
  ]
};

export const robosylae: IMission = {
  nom: "SYLAE (Robot Scraping)",
  contexte: "Refonte complète du système de récupération des aides financières pour alternants via SYLAE. Le projet a permis d'automatiser un processus manuel critique qui mobilisait un ETP pendant plusieurs semaines par mois, éliminant les erreurs humaines et réduisant le temps de traitement de 95%.",
  taches: [
    {
      icone: faMagnifyingGlass,
      texte: "Analyse approfondie du trafic réseau et conception d'une nouvelle architecture de scraping optimisée"
    },
    {
      icone: faDatabase,
      texte: "Conception d'un système de stockage intelligent dans DynamoDB avec références croisées vers S3"
    },
    {
      icone: faGears,
      texte: "Pipeline de traitement automatisé avec validation des données et contrôles de cohérence"
    },
    {
      icone: faChartSimple,
      texte: "Système de monitoring complet avec AWS XRay pour la détection précoce des anomalies"
    },
    {
      icone: faTrophy,
      texte: "Réduction du temps de traitement de 95% et élimination complète des erreurs humaines"
    }
  ],
  techs: [
    { icone: faCode, texte: "Python, Requests, Pandas"},
    { icone: faCloud, texte: "AWS DynamoDB, S3, XRay"},
    { icone: faDatabase, texte: "Redis, PostgreSQL"},
    { icone: faSitemap, texte: "Architecture Distribuée, Event-Driven"},
    { icone: faGears, texte: "Docker, SnapLogic, CI/CD Pipelines"}
  ],
  collabs: [
    { icone: faUser, texte: "Xavier , Project Manager"},
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Bassem, Expert SnapLogic"},
    { icone: faUser, texte: "Christele,  Representante Client Sylae"},
    { icone: faUser, texte: "Goran, Representant Client Sylae en chef"}
  ]
};

export const robocred: IMission = {
  nom: "RobotCredentials (Gestion des Identifiants)",
  contexte: "Conception et implémentation d'une solution de gestion sécurisée des identifiants critiques pour les processus de scraping. Cette infrastructure centralisée assure la confidentialité des données sensibles tout en facilitant l'accès programmatique pour les systèmes autorisés.",
  taches: [
    {
      icone: faShieldHalved,
      texte: "Conception d'une architecture sécurisée pour la gestion centralisée des identifiants avec chiffrement AES-256"
    },
    {
      icone: faCode,
      texte: "Développement d'une API RESTful en Clean Architecture avec authentification JWT et rate limiting"
    },
    {
      icone: faClipboardList,
      texte: "Système de logs d'audit détaillé pour le suivi des opérations de chiffrement/déchiffrement"
    },
    {
      icone: faShield,
      texte: "Intégration des bonnes pratiques de sécurité : TLS 1.3, HSTS, validation des entrées"
    },
    {
      icone: faCheckDouble,
      texte: "Solution complète et sécurisée permettant l'accès programmatique aux identifiants pour les systèmes autorisés"
    }
  ],
  techs: [
    { icone: faCode, texte: "C#, ASP.NET Core, Entity Framework Core"},
    { icone: faDatabase, texte: "AWS RDS, PostgreSQL"},
    { icone: faSitemap, texte: "Clean Architecture, CQRS"},
    { icone: faGears, texte: "Docker, SnapLogic"},
    { icone: faLock, texte: "AES-256, JWT, OAuth 2.0"}
  ],
  collabs: [
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Ahmed, Reviewer de code .NET Core"}
  ]
};

/// SCHNEIDER .............

export const SchneiderPostes: IPoste[] = [
  { icone: faNetworkWired, texte: "Scrum Master" },
  { icone: faCode, texte: "Ingénieur Logiciel C#" },
];

export const ESME: IMission = {
  nom : "EcoStructure Machine Expert - Team Device Integration",
  contexte : "Développement et Maintenance de la communication entre les automates Schneider et l'application Machine Expert",
  taches : [
    { 
      icone: faPeopleGroup, 
      texte: "Application de la méthodologie Scrum en méthode agile SAFe d'une équipe de 8 au sein d'un train de 90 personnes<br />(basé en France, Allemagne, Inde et Singapour)"
    },
    { 
      icone: faIndustry, 
      texte: "Développement C# d'un IDE avec WinForms afin de programmer des automates d'usines."
    },
    { 
      icone: faMicrochip, 
      texte: "Implémentation des protocoles de communication industriels (OPCUA, Eip, ModbusTCP, Sercos) pour la connexion aux automates"
    },
    { 
      icone: faRobot, 
      texte: "Développement de fonctionnalités pour la configuration et le diagnostic des automates industriels"
    },
    { 
      icone: faGaugeHigh, 
      texte: "Optimisation des performances de communication et de la fiabilité des échanges de données en temps réel"
    }
  ],
  techs: [
    { icone: faCode, texte: ".NET, WinForms, IEC" },
    { icone: faNetworkWired, texte: "OPCUA, Eip, ModbusTCP, Sercos" },
    { icone: faCodeBranch, texte: "Jira, GitHub Enterprise, iObeya" },
    { icone: faSitemap, texte: "Architecture Distribuée, SAFe" },
    { icone: faGears, texte: "Tests Unitaires, CI/CD" }
  ],
  collabs: [
    { icone: faUser, texte: "Stéphane ORSSAUD, Product Owner"},
    { icone: faUser, texte: "Guillaume LANDRU, Product Owner"},
    { icone: faUser, texte: "William POITEVIN, Ingénieur C#"},
    { icone: faUser, texte: "Romain GARNIER, Ingénieur C#"},
    { icone: faUser, texte: "Romain CANOVAS, Ingénieur Typescript", linkedin: "https://www.linkedin.com/in/romain-canovas/"},
    { icone: faUser, texte: "Ljiljana Angeleski, Test Engineer", linkedin : "https://www.linkedin.com/in/ljiljana-angeleski-a9389123/"}
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
    { icone: faPenToSquare, texte: "Besoin perçu sur plusieurs projets et sur de futures problématiques : Conception de l'idée, du Cahier des Charges, Présentation à la Direction du POC, Conception UML, Développement, Lancement de produit"},
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
      { icone: faDiagramNext, texte: "Multi BDD : Elaboration de rapports pouvant s'adapter à la majorité des BDD des ERP du marché."},
      { icone: faDiagramNext, texte: "Multi Service : Standardisation des rapports pour répondre aux besoins principaux de n'importe quelle entreprise. Amélioration continue des rapports de clients ayant déjà souscrit à BZ"},
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
  techs: [
    { icone: faDocker, texte: "Docker, Dockerfile, Docker Compose" },
    { icone: faCode, texte: "Python, Venv" },
    { icone: faDatabase, texte: "Postgresql" },
  ],
  collabs: [
    {
      icone: faUser, texte: "Régis GEROMEGNACE, Product Owner et Product Manager",
    },
  ],
};