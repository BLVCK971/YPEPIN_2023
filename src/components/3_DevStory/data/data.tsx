import { faAngular, faAws, faDocker, faMicrosoft, faPython, faReact } from "@fortawesome/free-brands-svg-icons";
import { ICompany, IMission } from "./interfaces";
import {
  faArrowsRotate,
  faBolt,
  faBrain,
  faBook,
  faBug,
  faChalkboardUser,
  faChartColumn,
  faChartLine,
  faChartPie,
  faCheck,
  faCheckDouble,
  faClipboardList,
  faCloud,
  faCode,
  faCodeBranch,
  faCodeCompare,
  faCookieBite,
  faCubes,
  faDatabase,
  faDiagramNext,
  faDroplet,
  faEnvelopeOpenText,
  faFolderTree,
  faFileExcel,
  faGaugeHigh,
  faGears,
  faGlobe,
  faHandshake,
  faIndustry,
  faKey,
  faLanguage,
  faLayerGroup,
  faLock,
  faMagnifyingGlass,
  faMapLocationDot,
  faMicrochip,
  faMoneyBillTrendUp,
  faNetworkWired,
  faPenToSquare,
  faPeopleArrows,
  faPeopleGroup,
  faPuzzlePiece,
  faRobot,
  faRocket,
  faRoute,
  faServer,
  faShareFromSquare,
  faShieldHalved,
  faSitemap,
  faTrophy,
  faUser,
  faUserGroup,
  faUsersGear,
  faVault,
  faVial,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

/// DREVIO .............

export const drevio: IMission = {
  nom: "DREVIO - Plateforme SaaS d'évaluation des dommages automobiles",
  contexte:
    "Conception de DREVIO, une plateforme SaaS destinée à digitaliser et automatiser l'évaluation des dommages automobiles : création d'un dossier à partir d'un véhicule et de photographies, analyse des dommages par intelligence artificielle, puis génération d'une première estimation exploitable par les professionnels de la carrosserie.",
  taches: [
    { icone: faSitemap, texte: "Architecture distribuée : application mobile React Native/Expo, dashboard React, API .NET 10 et worker asynchrone d'analyse" },
    { icone: faLayerGroup, texte: "API en Vertical Slice : authentification, véhicules, dossiers, médias, dommages, estimations, paiements et historique des événements" },
    { icone: faWandMagicSparkles, texte: "Chaîne d'analyse multimodale combinant photographies, données du véhicule, modèles OpenAI et validation structurée des résultats" },
    { icone: faShieldHalved, texte: "Conception de la base PostgreSQL et sécurisation avec Supabase Auth, JWT, Row Level Security et stockage privé des photographies" },
    { icone: faHandshake, texte: "Étude et préparation d'une intégration API avec Lacour/IRIS pour l'obtention de données de chiffrage reconnues par les professionnels automobiles" },
    { icone: faDocker, texte: "Dockerisation et déploiement sur VPS avec Traefik, GitHub Actions et GitHub Container Registry" },
    { icone: faClipboardList, texte: "Définition du périmètre MVP, du backlog et de l'architecture technique ; coordination du développement au sein d'une équipe de deux personnes" },
  ],
  techs: [
    { icone: faCode, texte: "C#, .NET 10, ASP.NET Core, Entity Framework Core" },
    { icone: faReact, texte: "React, React Native, Expo, TypeScript, TanStack Query" },
    { icone: faDatabase, texte: "PostgreSQL, Supabase" },
    { icone: faWandMagicSparkles, texte: "OpenAI API" },
    { icone: faDocker, texte: "Docker, Traefik, GitHub Actions, Linux" },
  ],
  collabs: [
    { icone: faUser, texte: "Théo, Développeur" },
    { icone: faUser, texte: "Bruno, Commercial" },
  ],
};

/// FREELANCE .............

export const aivocat: IMission = {
  nom: "Aivocat - LLM d'étude de dossiers légaux hors réseau",
  periode: "07/2026 - 08/2026",
  contexte:
    "LLM basé sur Qwen, spécialisé dans l'étude de dossiers légaux et fonctionnant entièrement hors réseau, sans aucune possibilité de fuite d'information.",
  taches: [
    { icone: faBrain, texte: "Spécialisation d'un modèle Qwen pour l'étude de dossiers légaux" },
    { icone: faShieldHalved, texte: "Fonctionnement 100 % hors réseau : aucune donnée des dossiers ne peut sortir de l'infrastructure" },
  ],
  techs: [
    { icone: faBrain, texte: "Qwen (LLM)" },
    { icone: faLock, texte: "Déploiement hors réseau (air-gapped)" },
  ],
};

export const valado: IMission = {
  nom: "Valado - Migration SAGE Batigest",
  periode: "08/2026",
  contexte: "Migration du logiciel de gestion SAGE Batigest pour l'entreprise Valado.",
  taches: [
    { icone: faCodeCompare, texte: "Migration des données et du paramétrage SAGE Batigest" },
  ],
  techs: [
    { icone: faDatabase, texte: "SAGE Batigest" },
  ],
};

export const sesam: IMission = {
  nom: "SESAM - Migration de la base documentaire Synology",
  contexte: "Migration de la base documentaire Synology de l'entreprise SESAM.",
  taches: [
    { icone: faFolderTree, texte: "Scripts Python de migration de la base documentaire Synology" },
  ],
  techs: [
    { icone: faPython, texte: "Python" },
    { icone: faServer, texte: "Synology" },
  ],
};

/// PROELAN / SCHNEIDER .............

export const topologyManager: IMission = {
  nom: "Topology Manager - IDE Desktop (C# / WPF)",
  contexte:
    "Topology Manager est un IDE en C# / WPF permettant la programmation collaborative en temps réel des automates PLC (API en .NET 8, client lourd en WPF).",
  taches: [
    { icone: faCode, texte: "Développement FullStack sur Topology Manager (API .NET 8, client lourd WPF)" },
    { icone: faCodeCompare, texte: "Migration et enrichissement du catalogue de fonctionnalités depuis l'application legacy Control Expert Classic (C++) vers la nouvelle architecture client-serveur" },
    { icone: faGears, texte: "Défis techniques relevés :", soustaches: [
      { icone: faPuzzlePiece, texte: "Intégration d'un codebase legacy : interopérabilité et adaptation des fonctionnalités C++ de Control Expert Classic dans l'écosystème .NET moderne" },
      { icone: faGaugeHigh, texte: "Résolution de problèmes de performance : investigation et correction des causes de ralentissements sur une application mature (10+ ans)" },
      { icone: faVial, texte: "Garantie de la qualité : tests unitaires et fonctionnels pour chaque nouvelle fonctionnalité" },
    ]},
  ],
  techs: [
    { icone: faCode, texte: "C#, WPF, .NET 8, Fody" },
    { icone: faVial, texte: "Tests unitaires" },
    { icone: faMicrochip, texte: "C++ (legacy)" },
  ],
};

export const set: IMission = {
  nom: "SET - Schneider Electric Toolkit (Web)",
  contexte:
    "Plateforme web unifiée visant à regrouper l'accès à tous les produits Schneider (Control Expert, Machine Expert, Automation Expert).",
  taches: [
    { icone: faPuzzlePiece, texte: "Développement front-end pour l'intégration de Control Expert Classic en tant que Micro-Frontend dans l'interface SET" },
    { icone: faCodeBranch, texte: "Nouvelles fonctionnalités front-end, comme l'intégration d'un client Git avec Angular et WebKit" },
    { icone: faPeopleArrows, texte: "Collaboration avec les équipes back-end sur l'API existante (partagée avec Topology Manager) pour définir les besoins front-end" },
  ],
  resultats: [
    { icone: faArrowsRotate, texte: "Adaptabilité : du WPF desktop (.NET 8) au front-end web moderne (Angular / TypeScript)" },
    { icone: faMagnifyingGlass, texte: "Systèmes legacy complexes : comprendre et faire évoluer une base de code ancienne et critique" },
    { icone: faLanguage, texte: "Collaboration internationale : formation initiale par l'équipe espagnole, puis travail avec des développeurs roumains" },
  ],
  techs: [
    { icone: faAngular, texte: "Angular, TypeScript, WebKit" },
    { icone: faPuzzlePiece, texte: "Micro-Frontends" },
    { icone: faServer, texte: "API REST .NET" },
  ],
};

/// AYMING .............

export const roboatmp: IMission = {
  nom: "ATMP (Scraping NET ENTREPRISE)",
  contexte:
    "Automatiser la récupération des taux AT/MP, feuilles de calcul et attestations pour environ 5000 comptes clients via NET ENTREPRISE.",
  taches: [
    { icone: faCookieBite, texte: "Identification des cookies nécessaires pour maintenir une session active et effectuer les requêtes serveur" },
    { icone: faBug, texte: "Gestion fine des erreurs spécifiques (CGU à valider, mot de passe expiré) avec mise à jour automatique de l'état du compte dans DynamoDB et notification par mailing automatisé" },
    { icone: faCubes, texte: "Modèle asynchrone sur AWS ECS : chaque tâche s'exécute indépendamment et déclenche une pipeline SnapLogic dédiée pour stocker les données et logger les résultats" },
    { icone: faRocket, texte: "Scaling horizontal avec auto-scaling ECS basé sur la charge" },
  ],
  resultats: [
    { icone: faMoneyBillTrendUp, texte: "Transition réussie de Java vers une architecture Python moderne et économique, plus flexible et plus fiable" },
    { icone: faTrophy, texte: "Bénéfice estimé entre 1 et 2 millions d'euros par mois grâce à l'amélioration du scraping" },
  ],
  techs: [
    { icone: faPython, texte: "Python, Requests, Pandas" },
    { icone: faAws, texte: "AWS ECS, DynamoDB, S3, XRay" },
    { icone: faGears, texte: "SnapLogic, Docker" },
  ],
  collabs: [
    { icone: faUser, texte: "Xavier , Project Manager"},
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Bassem, Expert SnapLogic"},
    { icone: faUser, texte: "Pierre Marie MARTIN, Createur ATMP V1"},
    { icone: faUser, texte: "Marc, Representant Client ATMP"}
  ],
};

export const robosylae: IMission = {
  nom: "SYLAE (Robot Scraping)",
  contexte:
    "Automatiser la récupération des montants et détails des aides financières pour les alternants via la plateforme SYLAE.",
  taches: [
    { icone: faBolt, texte: "Transition de Playwright à Requests après analyse des requêtes client-serveur, réduisant le temps d'exécution du scraping" },
    { icone: faDatabase, texte: "Extraction des réponses JSON et stockage structuré dans DynamoDB" },
    { icone: faFileExcel, texte: "Génération de fichiers Excel avec Pandas pour le client final, chaque ligne référençant les PDF téléchargés" },
    { icone: faChartLine, texte: "Intégration d'AWS XRay pour des logs précis et des alertes en cas de problème" },
  ],
  resultats: [
    { icone: faTrophy, texte: "Automatisation complète d'un processus manuel qui mobilisait un employé plusieurs semaines par mois, avec une réduction drastique des erreurs humaines" },
  ],
  techs: [
    { icone: faPython, texte: "Python, Playwright, Requests, Pandas" },
    { icone: faAws, texte: "AWS DynamoDB, S3, XRay" },
  ],
  collabs: [
    { icone: faUser, texte: "Xavier , Project Manager"},
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Bassem, Expert SnapLogic"},
    { icone: faUser, texte: "Christele,  Representante Client Sylae"},
    { icone: faUser, texte: "Goran, Representant Client Sylae en chef"}
  ],
};

export const robocred: IMission = {
  nom: "RobotCredentials (Gestion des Identifiants)",
  contexte:
    "Fournir une solution sécurisée pour la gestion et l'accès aux identifiants nécessaires aux processus de scraping.",
  taches: [
    { icone: faVault, texte: "Base RDS stockant les comptes clients avec mots de passe chiffrés en AES-256" },
    { icone: faSitemap, texte: "API ASP.NET en Clean Architecture permettant à SnapLogic et aux scrapers d'accéder aux identifiants en toute sécurité" },
    { icone: faKey, texte: "Système de chiffrement / déchiffrement garantissant la confidentialité des données sensibles" },
    { icone: faBook, texte: "Documentation technique en Markdown sur Azure DevOps et schémas d'architecture (RDS, DynamoDB, S3, SnapLogic)" },
  ],
  resultats: [
    { icone: faCheckDouble, texte: "Confidentialité des identifiants garantie tout en facilitant leur accès par SnapLogic et les scrapers" },
  ],
  techs: [
    { icone: faCode, texte: "C#, ASP.NET, Clean Architecture" },
    { icone: faDatabase, texte: "AWS RDS (PostgreSQL)" },
    { icone: faLock, texte: "AES-256" },
    { icone: faGears, texte: "SnapLogic, CI/CD Pipelines" },
  ],
  collabs: [
    { icone: faUser, texte: "Said ALT TAIB, Project Owner"},
    { icone: faUser, texte: "Bastien, Chef de projet"},
    { icone: faUser, texte: "Rafik, Gestion AWS et DevOps"},
    { icone: faUser, texte: "Ahmed, Reviewer de code .NET Core"}
  ],
};

/// AVISTO / SCHNEIDER .............

export const ESME: IMission = {
  nom: "EcoStruxure Machine Expert - Team Device Integration",
  contexte:
    "Développement d'un IDE en C# WinForms basé sur CoDeSys pour programmer les automates industriels Schneider Electric, et travail sur EdgeIO, produit visant à gérer des modules industriels variés avec différents protocoles de communication (Ethernet, ModBus, Sercos).",
  taches: [
    { icone: faCode, texte: "Ingénieur Logiciel (.NET / Python) :", soustaches: [
      { icone: faRocket, texte: "En 6 mois, avec deux collègues également nouveaux, réalisation d'un travail équivalent à celui de l'équipe précédente en deux ans" },
      { icone: faPuzzlePiece, texte: "Intégration d'une application Angular dans Machine Expert (WinForms .NET), adaptée pour gérer plusieurs types de modules et de protocoles (Ethernet, ModBus, Sercos)" },
      { icone: faNetworkWired, texte: "Vérification et correction des communications avec le matériel via OPCUA et ModbusTCP" },
      { icone: faRobot, texte: "Développement de la logique générale de gestion des PLCs sur Machine Expert" },
      { icone: faGears, texte: "Automatisation via des scripts TypeScript et Python pour générer des fichiers de paramétrage" },
      { icone: faVial, texte: "Tests fonctionnels approfondis et livraison des nouvelles versions" },
    ]},
    { icone: faPeopleGroup, texte: "Scrum Master (SAFe certifié) d'une équipe de 8 personnes :", soustaches: [
      { icone: faChalkboardUser, texte: "Animation des cérémonies Agile : System Demo, PI Planning, Daily Scrum, Scrum of Scrums" },
      { icone: faPeopleArrows, texte: "Coordination avec les équipes externes à l'ART (Firmware, Software)" },
      { icone: faCheck, texte: "Gestion proactive des obstacles et suivi rigoureux des tickets Jira" },
    ]},
  ],
  techs: [
    { icone: faCode, texte: "C#, Python, TypeScript" },
    { icone: faIndustry, texte: "WinForms, Angular, CoDeSys" },
    { icone: faNetworkWired, texte: "OPCUA, ModbusTCP, Sercos" },
    { icone: faCodeBranch, texte: "Jira, GitHub Enterprise, iObeya" },
    { icone: faSitemap, texte: "SAFe, Scrum" },
  ],
  collabs: [
    { icone: faUser, texte: "Stéphane ORSSAUD, Product Owner"},
    { icone: faUser, texte: "Guillaume LANDRU, Product Owner"},
    { icone: faUser, texte: "William POITEVIN, Ingénieur C#"},
    { icone: faUser, texte: "Romain GARNIER, Ingénieur C#"},
    { icone: faUser, texte: "Romain CANOVAS, Ingénieur Typescript", linkedin: "https://www.linkedin.com/in/romain-canovas/"},
    { icone: faUser, texte: "Ljiljana Angeleski, Test Engineer", linkedin : "https://www.linkedin.com/in/ljiljana-angeleski-a9389123/"}
  ],
};

/// DIGITOM .............

export const BZ: IMission = {
  nom : "Business Zone",
  periode: "09/2020 - 05/2023",
  contexte : "Une application Web ASP.NET MVC en C# en Clean Architecture permettant le partage contrôlé de rapports Power BI pour les clients de DIGITOM dans leur service.",
  taches : [
    { icone: faCheck, texte: "TechLead sur l'ensemble du projet, chapeauté par Régis GEROMEGNACE"},
    { icone: faPenToSquare, texte: "Conception de l'idée et du Cahier des Charges, conception UML, présentation du POC à la Direction, lancement du produit"},
    { icone: faChartColumn, texte: "DataAnalyst SQL/Python : recueil des besoins clients (SIGs, Commissions, KPIs), création des ETLs et conception des rapports"},
    { icone: faSitemap, texte: "Clean Architecture permettant une application modulaire, maintenable et évolutive."},
    { icone: faGears, texte: "Fonctionnalités :", soustaches :
    [
      { icone: faUsersGear, texte: "Authentification, administration et système d'autorisations"},
      { icone: faChartPie, texte: "Intégration de Power BI"},
      { icone: faUserGroup, texte: "Gestion des rôles"},
      { icone: faVault, texte: "Sécurité des données (comptabilité, salaires, CA)"},
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
  periode: "2 mois",
  contexte : "Conteneurisation d'une Application ERP",
  taches : [
    { icone: faCode, texte: "Création d'un conteneur Odoo pour éviter l'utilisation de machines virtuelles"},
    { icone: faCode, texte: "Développement du conteneur pour faciliter l'accès aux futurs développeurs de l'entreprise"},
    { icone: faCode, texte: "Prise en charge des versions officielles d'Odoo et adaptation aux anciennes versions"},
    { icone: faCode, texte: "Permet de lancer les instances pour tous les clients en production simplement en important leurs données"},
    { icone: faCode, texte: "Projet lié à AutoSauvegarde :", soustaches : [
      { icone: faCode, texte: "Module Odoo créé pour faire des Backup des instances clientes en cas d'incident. "}]},
    { icone: faCode, texte: "Le conteneur pouvait donc, en chargeant n'importe quelle sauvegarde en production, permettre du développement, test ou réparation très rapidement sur une instance de développement."},
    { icone: faBook, texte: "Documentation pour les nouveaux arrivants"}
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

export const powerBiOdoo: IMission = {
  nom: "Power BI on Odoo",
  periode: "2 mois",
  contexte:
    "Rapports Power BI standards sur les bases PostgreSQL d'Odoo pour l'analyse de performance, en complément du module Dashboard d'Odoo (DIGITOM, Karukera / SUEZ, Pk Trading, Groupe Barboteau). Le projet a ensuite alimenté de nombreux rapports intégrés à Business Zone.",
  taches: [
    { icone: faMagnifyingGlass, texte: "Recueil des principaux besoins clients (SIGs, Commissions, KPIs) et création des ETLs nécessaires" },
    { icone: faChartColumn, texte: "Indicateurs de performance :", soustaches: [
      { icone: faChartLine, texte: "Chiffre d'affaires par service, période et client ; Soldes Intermédiaires de Gestion" },
      { icone: faDroplet, texte: "Distribution d'eau et réparation de fuites" },
      { icone: faMoneyBillTrendUp, texte: "Commissions par vendeur, période, client et catégorie d'article ; ticket moyen" },
    ]},
    { icone: faPenToSquare, texte: "Élaboration et design des rapports" },
  ],
  techs: [
    { icone: faChartPie, texte: "Power BI" },
    { icone: faPython, texte: "Python, Odoo" },
    { icone: faDatabase, texte: "PostgreSQL, Docker Desktop" },
  ],
};

export const powerBiCoaching: IMission = {
  nom: "Power BI Coaching - Formation des cadres du groupe Barboteau",
  periode: "10/2020 - 12/2020",
  contexte:
    "Formation des cadres d'un grand groupe de distribution à Power BI : le groupe avait une forte demande d'ETL et de collecte de données, avec de nombreuses entreprises aux logiciels de gestion différents.",
  taches: [
    { icone: faChalkboardUser, texte: "Formateur sur 5 jours : bases, élaboration de rapports puis travail sur les demandes spécifiques des participants" },
    { icone: faGears, texte: "Fonctionnalités de base (transformation des données, relations, visuels) et avancées (PowerQuery, DAX, partages)" },
    { icone: faChartColumn, texte: "Conception assistée de 2 rapports sur leurs données (loi de Pareto, grande distribution)" },
  ],
  techs: [
    { icone: faChartPie, texte: "Power BI Desktop, DAX, PowerQuery" },
    { icone: faFileExcel, texte: "ETL, Excel" },
  ],
};

export const powerBiSupport: IMission = {
  nom: "Power BI Support - Automatisation des mises à jour de rapports",
  periode: "01/2021 - 06/2021",
  contexte:
    "Mise à jour automatique de plusieurs rapports Power BI à la réception d'un fichier CSV à une adresse e-mail dédiée, pour absorber la hausse du nombre de clients et de la charge manuelle du support (Autotask).",
  taches: [
    { icone: faEnvelopeOpenText, texte: "Pipeline : réception du CSV, sauvegarde sur Azure Blob puis chargement en base Azure SQL pour mettre à jour tous les rapports clients" },
    { icone: faGears, texte: "Conception et présentation de la solution, gestion Power Automate" },
    { icone: faChartPie, texte: "Adaptation du rapport de base et génération des rapports Power BI Service centrés client final" },
  ],
  techs: [
    { icone: faChartPie, texte: "Power BI Service, Power Automate" },
    { icone: faMicrosoft, texte: "Azure Blob Storage, Azure SQL Database" },
    { icone: faGears, texte: "Autotask" },
  ],
};

export const gestrav: IMission = {
  nom: "Gestrav - Coordination de la réparation des fuites d'eau",
  periode: "06/2020 - 10/2020",
  contexte:
    "Projet régional de coordination des acteurs de la réparation des fuites d'eau. Gestrav est devenue l'application officielle de détection et de suivi des réparations des fuites du SMGEAG.",
  taches: [
    { icone: faChartPie, texte: "POC Power BI de la géolocalisation des fuites" },
    { icone: faMapLocationDot, texte: "Intégration d'OpenStreetMap dans l'application .NET, dans les locaux d'Eau d'Excellence" },
    { icone: faRoute, texte: "Fonctionnalités de la carte : itinéraires optimisés, affichage des points et des données associées" },
  ],
  techs: [
    { icone: faCode, texte: "C#, ASP.NET, JavaScript" },
    { icone: faGlobe, texte: "OpenStreetMap" },
    { icone: faChartPie, texte: "Power BI, Excel" },
  ],
};

/// PARCOURS .............

const schneiderLogo = { src: "/logos/SCHNEIDER.png" };

export const companies: ICompany[] = [
  {
    id: "Freelance",
    nom: "Freelance",
    dates: "Depuis 07/2026",
    postes: [
      { icone: faCode, texte: "Ingénieur logiciel FullStack indépendant" },
    ],
    logos: [],
    missions: [aivocat, valado, sesam],
  },
  {
    id: "Drevio",
    nom: "DREVIO",
    dates: "05/2026 - 07/2026",
    postes: [
      { icone: faCode, texte: "Lead Developer" },
      { icone: faSitemap, texte: "Architecte logiciel Full Stack" },
    ],
    logos: [{ src: "/logos/DREVIO.png" }],
    missions: [drevio],
  },
  {
    id: "Proelan",
    nom: "PROELAN / Schneider Electric",
    dates: "03/2025 - 03/2026",
    contexte:
      "Intégré à l'Agile Release Train « CEART » de plus de 90 personnes, au sein de l'équipe « Topology Manager » (5 personnes) suivant la méthodologie SAFe.",
    postes: [{ icone: faCode, texte: "Ingénieur Logiciel FullStack .NET / WPF" }],
    logos: [schneiderLogo],
    missions: [topologyManager, set],
  },
  {
    id: "Ayming",
    nom: "Ayming",
    dates: "06/2024 - 02/2025",
    contexte:
      "Société internationale de conseil spécialisée dans l'amélioration de la performance opérationnelle et financière des entreprises. Contribution à plusieurs projets stratégiques d'automatisation des processus métier et de gestion sécurisée des données sensibles.",
    postes: [
      { icone: faPython, texte: "Ingénieur Python" },
      { icone: faCloud, texte: "Architecte Cloud" },
    ],
    logos: [{ src: "/logos/AYMING.png" }],
    missions: [roboatmp, robosylae, robocred],
  },
  {
    id: "Avisto",
    nom: "AViSTO / Schneider Electric",
    dates: "06/2023 - 05/2024",
    contexte:
      "Agile Release Train international de 90 personnes réparties entre la France, l'Allemagne, la Serbie, l'Inde et Singapour, avec une collaboration quotidienne en anglais.",
    postes: [
      { icone: faCode, texte: "Ingénieur Logiciel C#" },
      { icone: faPeopleGroup, texte: "Scrum Master SAFe certifié" },
    ],
    logos: [{ src: "/logos/avisto.png", surFondClair: true }, schneiderLogo],
    missions: [ESME],
  },
  {
    id: "Digitom",
    nom: "DIGITOM",
    dates: "10/2019 - 06/2023",
    contexte:
      "Membre du pôle ERP (2 à 3 personnes) : intégration de l'ERP Odoo ou développement d'applications sur mesure, en collaboration avec le pôle BI et les services du groupe.",
    postes: [
      { icone: faCode, texte: "Ingénieur FullStack C# & Python" },
      { icone: faChartPie, texte: "Analyste & Formateur BI" },
      { icone: faCodeBranch, texte: "Intégrateur Odoo" },
      { icone: faDocker, texte: "Ingénieur DevOps" },
    ],
    logos: [{ src: "/logos/DIGITOM.png" }],
    missions: [BZ, OdooDocker, powerBiOdoo, powerBiSupport, powerBiCoaching, gestrav],
  },
];
