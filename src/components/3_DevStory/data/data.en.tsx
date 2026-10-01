// Version anglaise du parcours. Chaque mission reprend la structure de la
// version française (icônes, ordre, liens) et n'en remplace que les textes :
// si une tâche est ajoutée ou retirée en français sans être traduite ici,
// le build échoue (contrôle des longueurs dans `traduire`).
import { ICompany, IMission, ITache } from "./interfaces";
import * as fr from "./data";

type TacheTxt = string | [string, string[]];
type Traduction = {
  nom: string;
  periode?: string;
  chiffreCle?: string;
  contexte: string;
  taches: TacheTxt[];
  resultats?: string[];
  techs?: string[];
  collabs?: string[];
  imageAlt?: string;
};

const verifier = (nom: string, champ: string, a: number, b: number) => {
  if (a !== b) throw new Error(`Traduction EN incomplète pour « ${nom} » (${champ} : ${a} en français, ${b} en anglais)`);
};

const traduireTaches = (nom: string, taches: ITache[], txt: TacheTxt[]): ITache[] => {
  verifier(nom, "tâches", taches.length, txt.length);
  return taches.map((t, i) => {
    const x = txt[i];
    if (typeof x === "string") return { ...t, texte: x };
    verifier(nom, "sous-tâches", t.soustaches?.length ?? 0, x[1].length);
    return { ...t, texte: x[0], soustaches: t.soustaches!.map((s, j) => ({ ...s, texte: x[1][j] })) };
  });
};

const traduire = (m: IMission, t: Traduction): IMission => {
  const r: IMission = {
    ...m,
    nom: t.nom,
    periode: t.periode ?? m.periode,
    chiffreCle: t.chiffreCle ?? m.chiffreCle,
    contexte: t.contexte,
    taches: traduireTaches(t.nom, m.taches, t.taches),
  };
  if (m.resultats) {
    verifier(t.nom, "résultats", m.resultats.length, t.resultats?.length ?? 0);
    r.resultats = m.resultats.map((x, i) => ({ ...x, texte: t.resultats![i] }));
  }
  if (t.techs) {
    verifier(t.nom, "technos", m.techs.length, t.techs.length);
    r.techs = m.techs.map((x, i) => ({ ...x, texte: t.techs![i] }));
  }
  if (m.collabs) {
    verifier(t.nom, "collaborateurs", m.collabs.length, t.collabs?.length ?? 0);
    r.collabs = m.collabs.map((x, i) => ({ ...x, texte: t.collabs![i] }));
  }
  if (m.image && t.imageAlt) r.image = { ...m.image, alt: t.imageAlt };
  return r;
};

/// DREVIO .............

const hellboy = traduire(fr.hellboy, {
  nom: "DREVIO Phase 2 - HellBoy, training dataset platform",
  periode: "09/2026 - present",
  contexte:
    "To train a future model that recognises bodywork damage and estimates repair costs, DREVIO needs photos tied to the price actually invoiced. HellBoy produces this raw material: every validated case (photos, located damage, invoiced price) becomes a training sample.",
  taches: [
    "Import of the archives sent by body shops (ZIP: photos and repair estimate as PDF): reading of the vehicle, hourly rates, parts and operations, with a check that the rebuilt total matches the printed pre-tax total to the cent",
    "Closed vocabulary (32 body zones, 13 damage types, 3 severities) in a domain package shared by the API and the dashboard, enforced in the database through foreign keys",
    "Photo and annotation workshop: damage entered directly on the photo, bounding boxes normalised in the file's coordinate system, zones that can be moved and resized",
    "Review workflow (draft, to review, validated or rejected), frozen validated cases, role-based permissions (admin, reviewer, annotator, viewer) enforced by the API",
    "Read-only import of DREVIO cases whose human assessment is validated: only the human costing is taken, so the model does not learn to imitate the current AI",
    "Versioned dataset export (validated cases only, amounts in integer cents, price context)",
    "Docker deployment on DREVIO's VPS behind Traefik, with its own database and subdomain",
  ],
  techs: [
    "TypeScript, Node.js, Fastify (npm workspaces monorepo)",
    "React 19, Vite, TanStack Query, Zustand",
    "PostgreSQL",
    "Docker, Traefik, GitHub Actions",
  ],
});

const drevioMobile = traduire(fr.drevioMobile, {
  chiffreCle: "140+ PRs reviewed · 60+ deliverable work packages",
  nom: "DREVIO Mobile - Tech Lead of the iOS / Android app",
  periode: "06/2026 - present",
  contexte:
    "Mobile app that estimates vehicle damage from AI-analysed photos: it produces an assessment report, computes a quote for each partner garage and handles online payment.",
  taches: [
    "Project setup: app initialisation, development and production environments, choice of the stack and of a feature-based architecture (auth, scan, vehicle, payment, notifications)",
    "Leading a developer: breaking the product down into 60+ deliverable work packages, writing and prioritising tasks, tracking their delivery",
    "Quality and code review: 140+ pull requests reviewed, post-review hardening, TypeScript and lint checks",
    "Business logic: design of the per-garage pricing, applying each garage's own rates and pricing model",
    "Upgrade of the app from Expo SDK 54 to SDK 57",
    ["Features delivered under my lead:", [
      "Guided camera scan with photo quality checks and real-time tracking of the AI analysis",
      "AI report with damage location, re-run of the analysis and request for a human assessment",
      "Garage search by geolocation, with sorting and filters",
      "Stripe payment (deposit, balance, refund) through Supabase Edge Functions",
      "Insurance and claim flow, management of leased vehicles (LLD / LOA)",
      "Push notifications (Firebase), Google OAuth sign-in and OTA updates",
    ]],
  ],
  collabs: ["Théo, Developer"],
});

const drevio = traduire(fr.drevio, {
  nom: "DREVIO Phase 1 - SaaS platform for vehicle damage assessment",
  contexte:
    "Design of DREVIO, a SaaS platform that digitises and automates vehicle damage assessment: a case is created from a vehicle and photos, damage is analysed by artificial intelligence, then a first estimate usable by body-shop professionals is generated.",
  taches: [
    "Distributed architecture: React Native/Expo mobile app, React dashboard, .NET 10 API and asynchronous analysis worker",
    "Vertical Slice API: authentication, vehicles, cases, media, damage, estimates, payments and event history",
    "Multimodal analysis pipeline combining photos, vehicle data, OpenAI models and structured validation of the results",
    "PostgreSQL database design, secured with Supabase Auth, JWT, Row Level Security and private photo storage",
    "Study and preparation of an API integration with Lacour/IRIS to obtain repair-costing data recognised by automotive professionals",
    "Dockerisation and deployment on a VPS with Traefik, GitHub Actions and GitHub Container Registry",
    "Definition of the MVP scope, the backlog and the technical architecture; coordination of development within a two-person team",
  ],
  collabs: ["Théo, Developer", "Bruno, Sales"],
});

/// FREELANCE .............

const aivocat = traduire(fr.aivocat, {
  chiffreCle: "~650 tests · 100% offline",
  nom: "Aivocat - 100% local legal AI assistant (sovereign RAG)",
  contexte:
    "Freelance assignment for a law firm: lawyers cannot send their clients' documents to ChatGPT. Designed and delivered, single-handedly, an AI assistant running entirely on one of the firm's PCs (an RTX 3060 is enough), with no internet connection: no data ever leaves the machine (legal privilege).",
  taches: [
    "Complete RAG pipeline: multi-format ingestion (PDF, Word, Excel, emails) with OCR, chunking, embeddings, hybrid search (BM25 and vectors) with cross-encoder reranking",
    "Answers quoting the exact passages they rely on, or declining to answer when nothing supports them (abstention thresholds calibrated on real measurements)",
    "Integration of legal texts (French Civil Code, 1989 Act…) from the official LEGI/DILA open data, split article by article and queried alongside the case documents",
    "Business features: case summary sheet, chat, legal analysis, SWOT and lines of attack or rebuttal",
    "Case files read from a USB drive in read-only mode, assistant memory kept on a separate drive",
    "VRAM management on 12 GB: embeddings, reranker and 9B LLM take turns on the GPU",
    "Industrialisation: fully offline installation package (14 GB) with SHA-256 checksum verification, compiled code (Nuitka), Ed25519-signed licence bound to the machine, diagnostic and backup scripts",
  ],
  resultats: [
    "About 650 automated tests for about 15,000 lines of Python",
    "Automated evaluation “jury” scoring citation accuracy and the rate of correct answers on test cases, including a fictitious tax case generated for the purpose",
  ],
  techs: [
    "Python 3.12, FastAPI, SQLite, HTML/JS",
    "Ollama, Qwen 3.5 9B, bge-m3, bge-reranker-v2-m3",
    "Qdrant (vector database)",
    "RapidOCR",
    "Nuitka, PowerShell",
  ],
});

const wondo = traduire(fr.wondo, {
  nom: "WONDO - Mobile app for martial arts clubs",
  periode: "08/2026 - present",
  contexte:
    "iOS / Android app for martial arts clubs in Guadeloupe: members find their schedule, progress and membership in it, and staff run the club from their phone or from a web back office. First club on board: Song Long.",
  taches: [
    "Expo / React Native app with three areas (student, instructor, admin) behind role guards, plus a view and club switcher for the platform administrator",
    "Student: schedule and bookings, membership and plans, progress per discipline (levels, techniques), club news",
    "Instructor: attendance sheet with four statuses (week, day, then class), student search and full student profile",
    "Admin: members and roles, recurring classes (editing a series only changes upcoming sessions), payments recorded from the phone, statistics",
    "Online registration modelled on the club's paper form (photo from camera or file, summary email, Excel export); approval emails the student their access and activates their membership",
    "Generic web back office: tables and forms generated from a resource registry declared in the API, data partitioned per club",
    "FastAPI / PostgreSQL API: memberships aligned with the school year, Guadeloupe time zone, account and personal data deletion from the app",
    "Release: EAS builds (TestFlight, APK and Google Play), OTA updates, App Store listing under submission; Docker / Traefik deployment through GitHub Actions",
  ],
  techs: [
    "React Native 0.81, Expo SDK 54 (Expo Router, EAS Build, EAS Update)",
    "TypeScript, TanStack Query, Zustand, React Hook Form + Zod; React, Vite, Tailwind back office",
    "FastAPI, SQLAlchemy, Alembic",
    "PostgreSQL",
    "Docker, Traefik, GitHub Actions",
  ],
  collabs: ["JP (GPLK), Sponsor"],
});

const valado = traduire(fr.valado, {
  nom: "Valado - Migration and hardening of a Sage Batigest infrastructure",
  contexte:
    "Migration and upgrade of a Sage Batigest infrastructure running on SQL Server, moved to a new Windows server with multi-workstation access restored.",
  taches: [
    "Migration of Sage Batigest and its SQL Server Express database to a new Windows server, multi-workstation access restored",
    "Configuration of SQL Server, network services and the firewall rules required by Batigest",
    "Secure remote administration through Tailscale (WireGuard) and RDP, without exposing RDP to the Internet, with a dedicated admin account and access management",
    "RustDesk deployed with unattended access for remote maintenance and user support",
    "Server reliability: automatic service startup, power management, network access and service continuity",
  ],
  techs: [
    "Windows Server, system administration, PowerShell",
    "Sage Batigest, SQL Server Express",
    "Tailscale (WireGuard), RDP, SMB, TCP/IP, Windows firewall",
    "RustDesk",
  ],
});

const arcgr = traduire(fr.arcgr, {
  nom: "ARC Gestion et Recouvrement - Website, CRM and client portal",
  contexte:
    "Complete platform for a debt-collection firm: public website (arc-gr.fr), internal mini-CRM to track collection cases, and a private client portal to follow recovered amounts.",
  taches: [
    "Public website with an unpaid-invoice impact calculator, SEO and legal pages",
    "Mini-CRM: clients, debt cases, kanban statuses, reminder history, due-date alerts and search / sorting",
    "Two-step email reminders, multi-client batch sending, double-send lock",
    "Excel / CSV import of client files: preview before import, column mapping remembered per client, reconciliation and full rollback of an import",
    "Client report in Word (.docx) with the share due on recovered amounts and an AI-generated comment (Claude API)",
    "Private client portal: role-based authentication (JWT), access granted from the CRM, view of outstanding and recovered amounts",
    "PostgreSQL on an internal Docker network, Alembic migrations run on every deployment, recycle bin (soft delete) and automatic backups",
    "Hardened VPS (key-only SSH, firewall, fail2ban) and shared Traefik reverse proxy with Let's Encrypt TLS",
  ],
  techs: [
    "React, TypeScript, Vite, Tailwind, React Hook Form, Zod",
    "FastAPI, SQLAlchemy, Alembic, python-docx",
    "PostgreSQL",
    "Claude API (Anthropic)",
    "Docker, Traefik, GitHub Actions, Linux VPS",
  ],
  collabs: ["Ariane Arçon, Client (ARC Gestion et Recouvrement)"],
});

const matheva = traduire(fr.matheva, {
  nom: "Matheva - Private maths tutoring platform",
  contexte:
    "Three-part platform for a maths teacher (public site, parent area, teacher area), built around a teaching loop: assess, identify needs, support, measure progress and keep parents informed.",
  taches: [
    "Public website with a contact form sent by email (SMTP)",
    "Public diagnostic test: question bank, server-side scoring, tiered feedback and lead capture (“Students waiting” page)",
    "Teacher area: students, calendar and session sheets, topic tracking per curriculum, lesson types and rates",
    "Payments module: a completed or cancelled lesson automatically generates its payment, expected-revenue KPI",
    "Read-only parent area: topics, sessions, homework and payments for each child, access through a personal password-less link",
    "Schedule export to Google Calendar (iCal feed)",
  ],
  collabs: ["Maeva, Client (maths teacher)"],
});

const sesam = traduire(fr.sesam, {
  chiffreCle: "~265,000 files audited",
  nom: "SESAM - Taking back control of a construction group's IT system (IT Consultant & Python Engineer)",
  periode: "09/2026 - present",
  contexte:
    "Assignment for a family-owned construction group of 6 companies in Guadeloupe, working for the Departmental Council. Their data sat on a Synology NAS installed by a previous provider, after an incomplete migration from the old Windows server: diverging servers, no file organisation and inconsistent access rights. The CEO expected concrete solutions, not an audit.",
  taches: [
    "Scoping and interviews with management, accounting and financial control; assignment refocused on the data chain actually in use (purchase order → quote → progress statements → Chorus invoicing)",
    "Audit kit on a USB drive in portable Python, run on workstations without installing anything and in read-only mode (proven with before / after fingerprints): inventory of ~265,000 files across 5 network shares and an old server (tree, Office metadata, duplicates, rights, per-company statistics)",
    "Migration analysis: transferred / modified / missed report between the old server and the NAS, which revealed writes still going to the old server (payroll, copier scans, invoicing software backups)",
    "Target folder structure design: 7 variants compared automatically on measured indicators, validated through user tests on a standalone HTML mock-up (simulated rights, predictions archived before the tests) and improved with the accountant's feedback",
    "Excel links migration tool (xlsx / xls / xlsm, binary format parsing): inventory, fixes on copies with rollback, 78 automated tests; it revealed that migrated workbooks were still silently reading the old server",
    "Security back under control: audit and fix of the NAS SMB / ACL permissions (role-based rights), previous provider's access closed, gradual freeze of the old server",
    "Step-by-step operating procedures and Word deliverables generated from a style guide (python-docx)",
    "AI-assisted design: an agent simulating a user was used to stress-test the folder structure before submitting it to real users",
  ],
  techs: [
    "Python 3.12 (portable), pypdf, olefile, python-docx",
    "Synology DSM (SMB, ACL, QuickConnect, Active Backup for Business), Windows Server",
    "Excel (external links)",
    "HTML / JavaScript, PowerShell",
    "Claude Code",
  ],
});

/// PROELAN / SCHNEIDER .............

const topologyManager = traduire(fr.topologyManager, {
  nom: "Topology Manager - Desktop IDE (C# / WPF)",
  contexte:
    "Topology Manager is a C# / WPF IDE for real-time collaborative programming of PLC controllers (.NET 8 API, WPF desktop client).",
  taches: [
    "FullStack development on Topology Manager (.NET 8 API, WPF desktop client)",
    "Migration and extension of the feature catalogue from the legacy Control Expert Classic application (C++) to the new client-server architecture",
    ["Technical challenges:", [
      "Legacy codebase integration: interoperability and adaptation of Control Expert Classic C++ features into the modern .NET ecosystem",
      "Performance issues: investigating and fixing the causes of slowdowns in a mature application (10+ years)",
      "Quality assurance: unit and functional tests for every new feature",
    ]],
  ],
  techs: ["C#, WPF, .NET 8, Fody", "Unit tests", "C++ (legacy)"],
});

const set = traduire(fr.set, {
  nom: "SET - Schneider Electric Toolkit (Web)",
  contexte:
    "Unified web platform giving access to all Schneider products (Control Expert, Machine Expert, Automation Expert).",
  taches: [
    "Front-end development to integrate Control Expert Classic as a Micro-Frontend in the SET interface",
    "New front-end features, such as a Git client built with Angular and WebKit",
    "Working with the back-end teams on the existing API (shared with Topology Manager) to define front-end needs",
  ],
  resultats: [
    "Adaptability: from WPF desktop (.NET 8) to modern web front-end (Angular / TypeScript)",
    "Complex legacy systems: understanding and evolving an old and critical codebase",
    "International collaboration: initial training by the Spanish team, then work with Romanian developers",
  ],
});

/// AYMING .............

const roboatmp = traduire(fr.roboatmp, {
  chiffreCle: "~5,000 accounts · ~€1.5M per week of delay (IT director)",
  nom: "ATMP (NET ENTREPRISE scraping)",
  contexte:
    "Automate the retrieval of AT/MP (workplace accident) rates, calculation sheets and certificates for about 5,000 client accounts through NET ENTREPRISE.",
  taches: [
    "Identifying the cookies required to keep a session alive and send the server requests",
    "Fine-grained handling of specific errors (terms to accept, expired password) with automatic update of the account status in DynamoDB and automated email notification",
    "Asynchronous model on AWS ECS: each task runs independently and triggers a dedicated SnapLogic pipeline to store the data and log the results",
    "Horizontal scaling with load-based ECS auto-scaling",
  ],
  resultats: [
    "Successful move from Java to a modern, cost-effective Python architecture, more flexible and more reliable",
    "Critical stakes: according to the IT director, each week of delay meant a loss of about €1.5 million",
  ],
  collabs: [
    "Xavier, Project Manager",
    "Said ALT TAIB, Project Owner",
    "Bastien, Project Lead",
    "Rafik, AWS and DevOps",
    "Bassem, SnapLogic expert",
    "Pierre Marie MARTIN, creator of ATMP V1",
    "Marc, ATMP client representative",
  ],
});

const robosylae = traduire(fr.robosylae, {
  chiffreCle: "Several weeks of manual work per month automated",
  nom: "SYLAE (scraping robot)",
  contexte:
    "Automate the retrieval of amounts and details of financial aid for apprentices through the SYLAE platform.",
  taches: [
    "Move from Playwright to Requests after analysing the client-server requests, cutting scraping time",
    "Extraction of the JSON responses and structured storage in DynamoDB",
    "Excel files generated with Pandas for the end client, each row referencing the downloaded PDFs",
    "AWS XRay integration for precise logs and alerts when something goes wrong",
  ],
  resultats: [
    "Full automation of a manual process that took an employee several weeks per month, with a drastic reduction in human errors",
  ],
  collabs: [
    "Xavier, Project Manager",
    "Said ALT TAIB, Project Owner",
    "Bastien, Project Lead",
    "Rafik, AWS and DevOps",
    "Bassem, SnapLogic expert",
    "Christele, SYLAE client representative",
    "Goran, lead SYLAE client representative",
  ],
});

const robocred = traduire(fr.robocred, {
  nom: "RobotCredentials (credentials management)",
  contexte: "Provide a secure solution to manage and access the credentials needed by the scraping processes.",
  taches: [
    "RDS database storing client accounts with AES-256 encrypted passwords",
    "ASP.NET Clean Architecture API giving SnapLogic and the scrapers secure access to the credentials",
    "Encryption / decryption system ensuring the confidentiality of sensitive data",
    "Technical documentation in Markdown on Azure DevOps and architecture diagrams (RDS, DynamoDB, S3, SnapLogic)",
  ],
  resultats: ["Credentials kept confidential while remaining easy to access for SnapLogic and the scrapers"],
  collabs: ["Said ALT TAIB, Project Owner", "Bastien, Project Lead", "Rafik, AWS and DevOps", "Ahmed, .NET Core code reviewer"],
});

/// AVISTO / SCHNEIDER .............

const ESME = traduire(fr.ESME, {
  chiffreCle: "Two years of the previous team's work, in 6 months",
  nom: "EcoStruxure Machine Expert - Device Integration team",
  imageAlt: "Programming a PLC in Schneider Electric's EcoStruxure Machine Expert IDE",
  contexte:
    "Development of a C# WinForms IDE based on CoDeSys to program Schneider Electric industrial PLCs, and work on EdgeIO, a product managing a variety of industrial modules over different communication protocols (Ethernet, ModBus, Sercos).",
  taches: [
    ["Software Engineer (.NET / Python):", [
      "In 6 months, with two colleagues also new to the team, delivered the equivalent of two years of the previous team's work",
      "Integration of an Angular application into Machine Expert (WinForms .NET), adapted to handle several module types and protocols (Ethernet, ModBus, Sercos)",
      "Checking and fixing communications with the hardware over OPCUA and ModbusTCP",
      "Development of the overall PLC management logic in Machine Expert",
      "Automation with TypeScript and Python scripts to generate configuration files",
      "Thorough functional testing and delivery of new releases",
    ]],
    ["Scrum Master (SAFe certified) of an 8-person team:", [
      "Facilitating Agile ceremonies: System Demo, PI Planning, Daily Scrum, Scrum of Scrums",
      "Coordination with teams outside the ART (Firmware, Software)",
      "Proactive impediment management and rigorous Jira ticket tracking",
    ]],
  ],
  collabs: [
    "Stéphane ORSSAUD, Product Owner",
    "Guillaume LANDRU, Product Owner",
    "William POITEVIN, C# Engineer",
    "Romain GARNIER, C# Engineer",
    "Romain CANOVAS, TypeScript Engineer",
    "Ljiljana Angeleski, Test Engineer",
  ],
});

/// DIGITOM .............

const BZ = traduire(fr.BZ, {
  nom: "Business Zone",
  contexte:
    "A Clean Architecture ASP.NET MVC web application in C# for controlled sharing of Power BI reports with DIGITOM's clients.",
  taches: [
    "Tech Lead on the whole project, overseen by Régis GEROMEGNACE",
    "Idea and specifications, UML design, POC presented to management, product launch",
    "SQL/Python Data Analyst: gathering client needs (intermediate management balances, commissions, KPIs), building the ETLs and designing the reports",
    "Clean Architecture for a modular, maintainable and scalable application.",
    ["Features:", [
      "Authentication, administration and permission system",
      "Power BI integration",
      "Role management",
      "Data security (accounting, payroll, revenue)",
      "Controlled sharing of Power BI reports",
    ]],
    ["Planned features:", [
      "Multi-tenant: several Azure AD / Power BI Service tenants on the same instance",
      "Pre-filter: dynamic filtering of a shared Power BI report based on the BZ login",
      "Multi-database: reports adaptable to most ERP databases on the market",
      "Multi-service: standard reports covering any company's core needs, with continuous improvement of the reports of existing BZ clients",
      "Multi-BI: support for BusinessObjects, Tableau or visualisation frameworks (JS, Python, R…) so the solution is not limited to Power BI Embedded",
    ]],
  ],
  techs: [
    "C#, .NET MVC, Entity Framework",
    "Power BI Service, Power BI Embedded, Azure AD",
    "SQL Server",
    "SOLID principles, CQRS, Mediator and Repository patterns",
    "AutoMapper, MediatR, FluentValidation and Swagger",
  ],
  collabs: ["Régis GEROMEGNACE, Product Owner and Product Manager", "Olivier ANGELE, pre-sales client management"],
});

const OdooDocker = traduire(fr.OdooDocker, {
  nom: "Odoo Docker",
  periode: "2 months",
  contexte: "Containerisation of an ERP application",
  taches: [
    "Creation of an Odoo container to avoid using virtual machines",
    "Container developed to make onboarding easier for the company's future developers",
    "Support for official Odoo versions and adaptation to older ones",
    "Lets any client's production instance run locally simply by importing their data",
    ["Linked to the AutoBackup project:", ["Odoo module created to back up client instances in case of incident."]],
    "By loading any production backup, the container enabled very fast development, testing or repair on a development instance.",
    "Documentation for newcomers",
  ],
  collabs: ["Régis GEROMEGNACE, Product Owner and Product Manager"],
});

const powerBiOdoo = traduire(fr.powerBiOdoo, {
  nom: "Power BI on Odoo",
  periode: "2 months",
  contexte:
    "Standard Power BI reports on Odoo's PostgreSQL databases for performance analysis, complementing Odoo's Dashboard module (DIGITOM, Karukera / SUEZ, Pk Trading, Groupe Barboteau). The project then fed many of the reports included in Business Zone.",
  taches: [
    "Gathering the main client needs (intermediate management balances, commissions, KPIs) and building the required ETLs",
    ["Performance indicators:", [
      "Revenue by department, period and client; intermediate management balances",
      "Water distribution and leak repair",
      "Commissions by salesperson, period, client and product category; average basket",
    ]],
    "Report building and design",
  ],
});

const powerBiCoaching = traduire(fr.powerBiCoaching, {
  nom: "Power BI Coaching - Training for Groupe Barboteau managers",
  contexte:
    "Power BI training for the managers of a large retail group: the group had a strong need for ETL and data collection, with many companies using different management software.",
  taches: [
    "Trainer over 5 days: basics, report building, then work on the participants' specific requests",
    "Basic features (data transformation, relationships, visuals) and advanced ones (PowerQuery, DAX, sharing)",
    "Guided design of 2 reports on their own data (Pareto principle, retail)",
  ],
});

const powerBiSupport = traduire(fr.powerBiSupport, {
  nom: "Power BI Support - Automated report updates",
  contexte:
    "Automatic update of several Power BI reports when a CSV file reaches a dedicated email address, to absorb the growing number of clients and the support team's manual workload (Autotask).",
  taches: [
    "Pipeline: CSV received, saved to Azure Blob then loaded into Azure SQL to update all client reports",
    "Solution design and presentation, Power Automate management",
    "Adaptation of the base report and generation of end-client-focused Power BI Service reports",
  ],
});

const gestrav = traduire(fr.gestrav, {
  chiffreCle: "Official SMGEAG application",
  nom: "Gestrav - Guadeloupe Water Emergency mission 2020",
  contexte:
    "2020 “Urgence Eau Guadeloupe” mission: facing water shortages, the State ordered prefectoral requisitions entrusted to the Karukér'Ô / SUEZ consortium. Within a 3-person DIGITOM team, built a management tool coordinating leak detectors, repairers and the network operator (SIAEAG), plus the data published on the public website urgence-eau-guadeloupe.org. Gestrav became the SMGEAG's official application for detecting leaks and tracking repairs.",
  taches: [
    "Power BI data and reports for the mission's indicators (leaks detected and repaired), followed in real time by residents on urgence-eau-guadeloupe.org",
    "Power BI POC for leak geolocation",
    "Development of part of the Gestrav user interface",
    "Geolocation and OpenStreetMap integration into the .NET application, on Eau d'Excellence's premises",
    "Map features: optimised routes, display of points and their data",
  ],
});

/// PARCOURS .............

type TradSociete = { nom?: string; dates: string; contexte?: string; postes: string[] };

const missionsEn = new Map<IMission, IMission>([
  [fr.hellboy, hellboy],
  [fr.drevioMobile, drevioMobile],
  [fr.drevio, drevio],
  [fr.aivocat, aivocat],
  [fr.wondo, wondo],
  [fr.valado, valado],
  [fr.arcgr, arcgr],
  [fr.matheva, matheva],
  [fr.sesam, sesam],
  [fr.topologyManager, topologyManager],
  [fr.set, set],
  [fr.roboatmp, roboatmp],
  [fr.robosylae, robosylae],
  [fr.robocred, robocred],
  [fr.ESME, ESME],
  [fr.BZ, BZ],
  [fr.OdooDocker, OdooDocker],
  [fr.powerBiOdoo, powerBiOdoo],
  [fr.powerBiCoaching, powerBiCoaching],
  [fr.powerBiSupport, powerBiSupport],
  [fr.gestrav, gestrav],
]);

const SOCIETES: Record<string, TradSociete> = {
  Freelance: {
    nom: "ICEKERA - Freelance (EI Yoel PEPIN)",
    dates: "Since 07/2026",
    postes: ["Independent FullStack software engineer", "IT Consultant"],
  },
  Drevio: {
    dates: "Since 05/2026",
    contexte:
      "Phase 1 completed in August 2026, mobile app in progress. Phase 2 started in September 2026 with HellBoy (training dataset), full launch in November 2026.",
    postes: ["Tech Lead", "Lead Developer", "Full Stack software architect"],
  },
  Proelan: {
    dates: "03/2025 - 03/2026",
    contexte:
      "Part of the “CEART” Agile Release Train of 90+ people, in the “Topology Manager” team (5 people) following the SAFe methodology.",
    postes: ["FullStack Software Engineer .NET / WPF"],
  },
  Ayming: {
    dates: "06/2024 - 02/2025",
    contexte:
      "International consulting firm specialised in improving companies' operational and financial performance. Contributed to several strategic projects automating business processes and securely managing sensitive data.",
    postes: ["Python Engineer", "Cloud Architect"],
  },
  Avisto: {
    dates: "06/2023 - 05/2024",
    contexte:
      "International Agile Release Train of 90 people across France, Germany, Serbia, India and Singapore, with daily collaboration in English.",
    postes: ["C# Software Engineer", "Certified SAFe Scrum Master"],
  },
  Digitom: {
    dates: "10/2019 - 06/2023",
    contexte:
      "Member of the ERP unit (2 to 3 people): Odoo ERP integration or custom application development, working with the BI unit and the group's departments.",
    postes: ["FullStack Engineer C# & Python", "BI Analyst & Trainer", "Odoo Integrator", "DevOps Engineer"],
  },
};

export const companies: ICompany[] = fr.companies.map((c) => {
  const t = SOCIETES[c.id];
  if (!t) throw new Error(`Traduction EN manquante pour l'entreprise « ${c.id} »`);
  verifier(c.nom, "postes", c.postes.length, t.postes.length);
  return {
    ...c,
    nom: t.nom ?? c.nom,
    dates: t.dates,
    contexte: c.contexte ? t.contexte : undefined,
    postes: c.postes.map((p, i) => ({ ...p, texte: t.postes[i] })),
    missions: c.missions.map((m) => {
      const en = missionsEn.get(m);
      if (!en) throw new Error(`Traduction EN manquante pour la mission « ${m.nom} »`);
      return en;
    }),
  };
});
