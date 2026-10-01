// Jeu de données de la démo Aivocat : trois dossiers FICTIFS (bail d'habitation,
// licenciement, contrôle fiscal), leurs pièces, la fiche de chaque dossier et
// des réponses préparées dans le style du produit. Aucune pièce réelle : les
// textes des pièces PDF vivent dans pieces.json (qui sert aussi à générer les
// PDF avec pieces.py), et chaque extrait cité y est vérifié mot pour mot au
// chargement, comme le vrai produit tire ses sources de SQLite et non du modèle.
// Seuls les articles de loi (textes publics) sont repris de la réalité.
import piecesJson from "./pieces.json";

// --- Pièces ---------------------------------------------------------------------

type PiecesJson = Record<string, Record<string, { scan?: boolean; pages: string[][] }>>;
const PIECES = piecesJson as PiecesJson;

export type JeuCle = "bail" | "licenciement" | "tva" | "durand" | "generique";

/** Une pièce du dossier, avec ce que l'analyse en tirera (pages, passages, OCR). */
export interface PieceMeta {
  rel_path: string;
  size_bytes: number;
  page_count: number | null;
  ocr_pages: number;
  chunk_count: number;
  status: "ok" | "warning" | "error";
  message: string | null;
  /** Durée simulée de lecture/découpage/OCR, en ms. */
  ms: number;
  /** PDF d'exemple réellement servi (chemin sous /demos/aivocat/pieces/). */
  pdf?: string;
  /** Fichier que l'application ne lit pas (archive, exécutable...). */
  unsupported?: string;
}

function piece(rel_path: string, size_bytes: number, pages: number | null, chunks: number, opts: Partial<PieceMeta> = {}): PieceMeta {
  const ocr = opts.ocr_pages ?? 0;
  return {
    rel_path,
    size_bytes,
    page_count: pages,
    ocr_pages: ocr,
    chunk_count: chunks,
    status: "ok",
    message: null,
    // Écourté par rapport au vrai poste (l'OCR y prend plusieurs secondes par page) :
    // une visite de démo ne doit pas attendre une minute.
    ms: Math.min(6000, 400 + (pages ?? 1) * 220 + ocr * 420),
    ...opts,
  };
}

const pageTexte = (blocs: string[]) => blocs.map((b) => b.replace(/^#[A-Z] /, "")).join("\n");

/** Empreinte courte et stable, façon chunk_uid. */
export function empreinte(s: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 + s.charCodeAt(i), 2246822519);
  }
  return ((h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0")).slice(0, 16);
}

// --- Sources --------------------------------------------------------------------

/** Un passage citable, tel que la base du dossier le restituerait. */
export interface SourceDef {
  kind: "piece" | "reference";
  rel_path: string;
  filename: string;
  page_start: number | null;
  heading_path: string | null;
  citation: string;
  text: string;
  char_start: number;
  char_end: number;
  chunk_uid: string;
  pack: string | null;
}

/** Passage d'une pièce PDF : l'extrait doit figurer tel quel à la page indiquée. */
function pdf(jeu: JeuCle, fichier: string, page: number, extrait: string): SourceDef {
  const pages = PIECES[jeu]?.[fichier]?.pages;
  if (!pages || !pages[page - 1]) throw new Error(`[démo aivocat] pièce ou page inconnue : ${fichier} p.${page}`);
  const avant = pages.slice(0, page - 1).map(pageTexte).join("\n\n");
  const texte = pageTexte(pages[page - 1]);
  const pos = texte.indexOf(extrait);
  if (pos < 0) throw new Error(`[démo aivocat] extrait introuvable dans ${fichier} p.${page} : « ${extrait.slice(0, 60)}… »`);
  const start = (avant ? avant.length + 2 : 0) + pos;
  return {
    kind: "piece",
    rel_path: fichier,
    filename: fichier,
    page_start: page,
    heading_path: null,
    citation: `${fichier}, page ${page}`,
    text: extrait,
    char_start: start,
    char_end: start + extrait.length,
    chunk_uid: empreinte(`${fichier}:${start}`),
    pack: null,
  };
}

/** Passage d'une pièce sans pages (Word, courriel, tableur) : cité par sa section. */
function sec(fichier: string, section: string, extrait: string, debut = 0): SourceDef {
  return {
    kind: "piece",
    rel_path: fichier,
    filename: fichier,
    page_start: null,
    heading_path: section,
    citation: `${fichier}, section "${section}"`,
    text: extrait,
    char_start: debut,
    char_end: debut + extrait.length,
    chunk_uid: empreinte(`${fichier}:${section}`),
    pack: null,
  };
}

/** Article d'un recueil de textes officiels (paquet LEGI de la bibliothèque). */
function loi(pack: string, titreCourt: string, legitext: string, chemin: string, article: string, texte: string): SourceDef {
  return {
    kind: "reference",
    rel_path: `${legitext}.xml`,
    filename: titreCourt,
    page_start: null,
    heading_path: `${titreCourt} > ${chemin} > Article ${article}`,
    citation: `${titreCourt}, art. ${article}`,
    text: texte,
    char_start: 0,
    char_end: texte.length,
    chunk_uid: empreinte(`${pack}:${article}:${texte.length}`),
    pack,
  };
}

// --- Réponses préparées ---------------------------------------------------------

export interface Reponse {
  /** Question telle que proposée dans la démo. */
  q: string;
  /** Mots-clés (sans accents) pour reconnaître une question libre ; « mot:3 » = poids 3. */
  mots: string[];
  texte: string;
  sources: SourceDef[];
  flags?: string[];
  /** Abstention préparée : le fait n'est dans aucune pièce. */
  abstention?: string;
}

export const ABSTENTION =
  "Je ne trouve pas suffisamment d'éléments dans les pièces de ce dossier pour répondre avec certitude.";

export interface Fiche {
  texte: string;
  sources: SourceDef[];
}

export interface JeuDonnees {
  pieces: PieceMeta[];
  fiche: Fiche;
  /** Réponse à « Résumer le dossier » et aux questions d'ensemble. */
  apercu: Reponse;
  reponses: Reponse[];
  /** Questions proposées sous la zone de saisie. */
  suggestions: string[];
}

// =============================================================================
//  Dossier 1 — Lemoine c/ SCI Les Glycines (bail d'habitation)
// =============================================================================

const BAIL = "01_Bail_habitation_2021.pdf";
const EDLE = "02_EDL_entree_2021-09-01_scan.pdf";
const EDLS = "03_EDL_sortie_2026-06-30.pdf";
const COUR = "04_Courrier_SCI_retenues_2026-08-28.pdf";
const DEVIS = "05_Devis_Atelier_Morel_peinture.docx";
const MAILS = "06_Courriels_restitution_depot.eml";

const b = {
  parties: pdf("bail", BAIL, 1, "Le bailleur : SCI Les Glycines, société civile immobilière au capital de 10 000 euros, dont le siège est 3 place des Célestins, 69002 Lyon, représentée par son gérant, M. Henri Vasseur.\nLe locataire : Mme Claire Lemoine, née le 14 mars 1990 à Grenoble, demeurant actuellement 27 rue Duguesclin, 69006 Lyon."),
  objet: pdf("bail", BAIL, 1, "Le présent contrat a pour objet la location d'un logement situé 12 rue des Tanneurs, 69007 Lyon, au 3e étage gauche : appartement de type T3 d'une surface habitable de 64 m², comprenant un séjour, deux chambres, une cuisine, une salle d'eau et un WC."),
  duree: pdf("bail", BAIL, 2, "Le contrat prend effet le 1er septembre 2021 pour une durée de trois ans. À défaut de congé donné dans les conditions légales, il est reconduit tacitement pour la même durée."),
  loyer: pdf("bail", BAIL, 2, "Le loyer mensuel est fixé à 850,00 euros hors charges. Les charges récupérables donnent lieu au versement d'une provision mensuelle de 90,00 euros, régularisée chaque année au vu des dépenses réelles."),
  travaux: pdf("bail", BAIL, 2, "Aucuns travaux n'ont été réalisés dans le logement depuis la fin du précédent contrat de location, en 2019."),
  depot: pdf("bail", BAIL, 2, "Le locataire verse ce jour au bailleur la somme de 850,00 euros à titre de dépôt de garantie, correspondant à un mois de loyer hors charges. Ce dépôt ne porte pas intérêt."),
  edleSejour: pdf("bail", EDLE, 1, "Murs et plafond : peinture blanche, état d'usage, petites traces au-dessus du radiateur.\nSol : parquet chêne vitrifié, bon état, rayures légères devant la fenêtre."),
  edlsSejour: pdf("bail", EDLS, 1, "Murs et plafond : peinture défraîchie, traces de meubles et six trous de chevilles sur le mur côté fenêtre.\nSol : parquet, usure normale correspondant à la durée d'occupation."),
  edlsCuisine: pdf("bail", EDLS, 1, "Plaques et four propres. Joint de l'évier noirci ; hotte grasse, filtre à remplacer.\nSalle d'eau et WC\nDépôts de calcaire sur la paroi de douche. WC : bon état."),
  edlsCles: pdf("bail", EDLS, 2, "Les clés (3 jeux, 1 badge d'accès, 1 clé de cave) ont été remises ce jour, 30 juin 2026, au bailleur, qui le reconnaît."),
  edlsObsLoc: pdf("bail", EDLS, 2, "La peinture du séjour n'a pas été refaite depuis l'entrée dans les lieux, en 2021 : il s'agit d'usure normale."),
  courrierCles: pdf("bail", COUR, 1, "Vous nous avez restitué les clés du logement le 15 juillet 2026. Conformément à l'article 22 de la loi du 6 juillet 1989, nous vous adressons le décompte de restitution de votre dépôt de garantie, d'un montant de 850,00 euros."),
  courrierRetenues: pdf("bail", COUR, 1, "Au vu de l'état des lieux de sortie, nous retenons les sommes suivantes : remise en peinture du séjour, selon le devis de l'Atelier Morel du 20 juillet 2026 : 480,00 euros ; nettoyage de la cuisine et de la salle d'eau : 160,00 euros. Total des retenues : 640,00 euros.\nLe solde, soit 210,00 euros, vous sera versé par virement dans les prochains jours."),
  devis: sec(DEVIS, "Désignation des travaux", "Devis n° 2026-117 du 20 juillet 2026. Remise en peinture du séjour : lessivage, rebouchage des trous, deux couches d'acrylique blanc mat sur murs et plafond (38 m²). Total : 400,00 € HT, TVA 20 % : 80,00 €, soit 480,00 € TTC.", 212),
  mailLemoine: sec(MAILS, "Claire Lemoine, 9 septembre 2026", "J'ai reçu ce jour votre virement de 210 euros. Je conteste les retenues : la peinture du séjour n'avait pas été refaite depuis mon entrée et l'état des lieux de sortie parle d'usure normale. Je vous rappelle enfin que les clés vous ont été remises le 30 juin, lors de l'état des lieux, et non le 15 juillet.", 388),
  mailVasseur: sec(MAILS, "Henri Vasseur, 11 septembre 2026", "Nous maintenons les retenues, justifiées par le devis joint à notre courrier du 28 août. La date du 15 juillet est celle à laquelle le dernier jeu de clés nous a été déposé.", 1024),
  quittances: sec("07_Quittances_loyers_2026.xlsx", "Feuille « 2026 »", "Janvier à juin 2026 : loyer de 850,00 € et provision de 90,00 € réglés chaque mois avant le 5 ; aucun impayé."),
  art22Delais: loi("habitation", "Loi 89-462", "LEGITEXT000006069108", "Titre Ier", "22",
    "Il est restitué dans un délai maximal de deux mois à compter de la remise en main propre, ou par lettre recommandée avec demande d'avis de réception, des clés au bailleur ou à son mandataire, déduction faite, le cas échéant, des sommes restant dues au bailleur et des sommes dont celui-ci pourrait être tenu, aux lieu et place du locataire, sous réserve qu'elles soient dûment justifiées. A cette fin, le locataire indique au bailleur ou à son mandataire, lors de la remise des clés, l'adresse de son nouveau domicile.\nIl est restitué dans un délai maximal d'un mois à compter de la remise des clés par le locataire lorsque l'état des lieux de sortie est conforme à l'état des lieux d'entrée, déduction faite, le cas échéant, des sommes restant dues au bailleur et des sommes dont celui-ci pourrait être tenu, en lieu et place du locataire, sous réserve qu'elles soient dûment justifiées."),
  art22Majoration: loi("habitation", "Loi 89-462", "LEGITEXT000006069108", "Titre Ier", "22",
    "A défaut de restitution dans les délais prévus, le dépôt de garantie restant dû au locataire est majoré d'une somme égale à 10 % du loyer mensuel en principal, pour chaque période mensuelle commencée en retard. Cette majoration n'est pas due lorsque l'origine du défaut de restitution dans les délais résulte de l'absence de transmission par le locataire de l'adresse de son nouveau domicile."),
  art7: loi("habitation", "Loi 89-462", "LEGITEXT000006069108", "Titre Ier", "7",
    "c) De répondre des dégradations et pertes qui surviennent pendant la durée du contrat dans les locaux dont il a la jouissance exclusive, à moins qu'il ne prouve qu'elles ont eu lieu par cas de force majeure, par la faute du bailleur ou par le fait d'un tiers qu'il n'a pas introduit dans le logement ;\nd) De prendre à sa charge l'entretien courant du logement, des équipements mentionnés au contrat et les menues réparations ainsi que l'ensemble des réparations locatives définies par décret en Conseil d'Etat, sauf si elles sont occasionnées par vétusté, malfaçon, vice de construction, cas fortuit ou force majeure ;"),
};

const JEU_BAIL: JeuDonnees = {
  pieces: [
    piece(BAIL, 214_330, 3, 9, { pdf: `bail/${BAIL}` }),
    piece(EDLE, 1_842_116, 2, 5, { ocr_pages: 2, status: "warning", message: "page 2 : texte reconnu avec une confiance moyenne (OCR)", pdf: `bail/${EDLE}` }),
    piece(EDLS, 186_040, 2, 6, { pdf: `bail/${EDLS}` }),
    piece(COUR, 96_512, 1, 3, { pdf: `bail/${COUR}` }),
    piece(DEVIS, 38_912, null, 2),
    piece(MAILS, 24_310, null, 3),
    piece("07_Quittances_loyers_2026.xlsx", 18_744, null, 2),
    piece("08_Photos_sejour_sortie.jpg", 2_406_118, 1, 0, { ocr_pages: 1, status: "warning", message: "aucun texte exploitable extrait" }),
  ],
  fiche: {
    texte: [
      "Parties : Mme Claire Lemoine, locataire ; SCI Les Glycines, bailleresse, représentée par son gérant M. Henri Vasseur [S1].",
      "Objet : restitution du dépôt de garantie à la fin du bail d'un T3 situé 12 rue des Tanneurs, 69007 Lyon [S2].",
      "Montants : dépôt de garantie de 850,00 euros [S3] ; retenues de 640,00 euros (peinture du séjour 480,00, nettoyage 160,00) et solde annoncé de 210,00 euros [S4].",
      "Dates clés :\n- 1er septembre 2021 : prise d'effet du bail [S5]\n- 30 juin 2026 : état des lieux de sortie et remise des clés selon l'état des lieux [S6]\n- 28 août 2026 : décompte du bailleur, qui date la remise des clés au 15 juillet [S7]\n- 9 septembre 2026 : réception du solde et contestation de la locataire [S8]",
      "Points en débat : la date de remise des clés, qui fait courir le délai de restitution, et la part de vétusté dans la peinture du séjour.",
    ].join("\n\n"),
    sources: [b.parties, b.objet, b.depot, b.courrierRetenues, b.duree, b.edlsCles, b.courrierCles, b.mailLemoine],
  },
  apercu: {
    q: "De quoi parle ce dossier ?",
    mots: [],
    texte: [
      "Litige de fin de bail d'habitation entre Mme Claire Lemoine, locataire, et la SCI Les Glycines, bailleresse [S1].",
      "Après la sortie des lieux, la SCI a retenu 640,00 euros sur un dépôt de garantie de 850,00 euros, pour la remise en peinture du séjour et le nettoyage de la cuisine et de la salle d'eau [S2][S3].",
      "La locataire conteste ces retenues en invoquant l'usure normale, et soutient que les clés ont été rendues le 30 juin 2026, date que confirme l'état des lieux de sortie [S4][S5] ; le bailleur retient le 15 juillet [S6].",
    ].join("\n\n"),
    sources: [b.parties, b.courrierRetenues, b.depot, b.mailLemoine, b.edlsCles, b.courrierCles],
    flags: ["chat_fallback"],
  },
  reponses: [
    {
      q: "Quel est le montant du dépôt de garantie ?",
      mots: ["depot:2", "garantie:2", "montant", "combien", "verse"],
      texte: "Le dépôt de garantie est de 850,00 euros, soit un mois de loyer hors charges [S1]. Le loyer mensuel est fixé à 850,00 euros, auquel s'ajoute une provision pour charges de 90,00 euros [S2].",
      sources: [b.depot, b.loyer],
    },
    {
      q: "Quelles retenues le bailleur a-t-il faites sur le dépôt de garantie ?",
      mots: ["retenu:4", "retient:4", "retenir:4", "deduit:3", "deduction:3", "decompte:3", "solde:2", "peinture", "nettoyage", "rendu"],
      texte: [
        "Le bailleur retient 640,00 euros sur les 850,00 euros du dépôt [S1] :",
        "- remise en peinture du séjour : 480,00 euros, selon le devis de l'Atelier Morel [S1][S2] ;\n- nettoyage de la cuisine et de la salle d'eau : 160,00 euros [S1].",
        "Le solde de 210,00 euros (850,00 - 640,00) a été versé par virement ; la locataire indique l'avoir reçu le 9 septembre 2026 et conteste les retenues [S3].",
      ].join("\n\n"),
      sources: [b.courrierRetenues, b.devis, b.mailLemoine],
    },
    {
      q: "À quelle date les clés ont-elles été restituées ?",
      mots: ["cle:4", "cles:4", "restitu:2", "remise:2", "rendu:2", "date", "quand"],
      texte: [
        "Les pièces se contredisent sur ce point.",
        "- L'état des lieux de sortie, signé par les deux parties, indique que les clés ont été remises le 30 juin 2026 au bailleur, « qui le reconnaît » [S1].\n- Le courrier de la SCI du 28 août 2026 affirme que les clés ont été restituées le 15 juillet 2026 [S2].",
        "Le gérant explique ensuite que le 15 juillet est la date de dépôt du « dernier jeu de clés » [S3], alors que l'état des lieux mentionne la remise des trois jeux le 30 juin [S1]. La locataire maintient la date du 30 juin [S4].",
        "La date retenue fait courir le délai de restitution du dépôt de garantie.",
      ].join("\n\n"),
      sources: [b.edlsCles, b.courrierCles, b.mailVasseur, b.mailLemoine],
    },
    {
      q: "Le bailleur a-t-il restitué le dépôt de garantie dans les délais ?",
      mots: ["delai:4", "delais:4", "retard:4", "temps", "majoration:3", "penalite:3", "restitu", "depot"],
      texte: [
        "En bref : probablement non, si l'on retient la date de l'état des lieux.",
        "Le dépôt doit être restitué dans les deux mois de la remise des clés, délai réduit à un mois lorsque l'état des lieux de sortie est conforme à celui d'entrée [S1]. Ici, l'état des lieux de sortie relève des différences (peinture du séjour, trous de chevilles) [S2] : le délai de deux mois s'applique.",
        "- Clés remises le 30 juin 2026 selon l'état des lieux [S3] : le solde devait être versé au plus tard le 30 août 2026.\n- Le virement de 210 euros n'a été reçu que le 9 septembre 2026 [S4] : une période mensuelle de retard est commencée.\n- Avec la date du 15 juillet avancée par le bailleur [S5], le délai courait jusqu'au 15 septembre et serait respecté.",
        "En cas de retard, le solde dû est majoré de 10 % du loyer mensuel en principal par mois commencé [S6], soit 85,00 euros ici (10 % de 850,00 euros) [S7].",
        "Point de vigilance : la date de remise des clés est le cœur du débat ; l'état des lieux signé par le gérant est la pièce la plus solide.",
      ].join("\n\n"),
      sources: [b.art22Delais, b.edlsSejour, b.edlsCles, b.mailLemoine, b.courrierCles, b.art22Majoration, b.loyer],
      flags: ["analysis"],
    },
    {
      q: "La locataire doit-elle payer la remise en peinture du séjour ?",
      mots: ["peinture:4", "vetuste:4", "usure:3", "sejour:2", "payer", "charge", "degradation:2", "doit"],
      texte: [
        "En bref : la retenue de 480,00 euros est contestable.",
        "Le locataire répond des dégradations survenues pendant la location, mais pas des réparations dues à la vétusté [S1]. Or :",
        "- à l'entrée, en 2021, la peinture du séjour était déjà en « état d'usage », avec des traces au-dessus du radiateur [S2] ;\n- le bail précise qu'aucuns travaux n'avaient été faits depuis 2019 [S3] ;\n- à la sortie, l'état des lieux parle d'une peinture « défraîchie » et de six trous de chevilles, et qualifie l'usure du parquet de normale [S4].",
        "Après près de cinq ans d'occupation, l'essentiel relève de l'usure normale. Seul le rebouchage des trous de chevilles pourrait rester à la charge de la locataire ; le devis ne le chiffre pas séparément [S5].",
        "Point de vigilance : le bailleur soutiendra que les trous de chevilles sont une dégradation ; demandez le détail du devis.",
      ].join("\n\n"),
      sources: [b.art7, b.edleSejour, b.travaux, b.edlsSejour, b.devis],
      flags: ["analysis"],
    },
    {
      q: "Qui sont les parties au bail ?",
      mots: ["partie:3", "parties:3", "gerant:3", "represent:3", "qui:2", "bailleur:2", "locataire:2", "sci", "proprietaire:2"],
      texte: "Le bailleur est la SCI Les Glycines, dont le siège est 3 place des Célestins à Lyon, représentée par son gérant, M. Henri Vasseur ; la locataire est Mme Claire Lemoine [S1]. Le logement loué est un T3 de 64 m² situé 12 rue des Tanneurs, 69007 Lyon [S2].",
      sources: [b.parties, b.objet],
    },
    {
      q: "Fais le SWOT de ce dossier",
      mots: ["swot:6", "forces:3", "faiblesses:3", "menaces:3", "opportunites:3"],
      texte: [
        "Forces\n- L'état des lieux de sortie, signé par le gérant, date la remise des clés au 30 juin 2026 [S1].\n- La peinture du séjour était déjà en état d'usage à l'entrée [S2], et l'usure du parquet est qualifiée de normale à la sortie [S3].",
        "Faiblesses\n- Six trous de chevilles sont relevés au séjour : le bailleur peut y voir une dégradation [S3].\n- Le nettoyage (160,00 euros) s'appuie sur des constats précis de l'état des lieux : joint noirci, hotte grasse, calcaire [S4].",
        "Opportunités\n- Si la date du 30 juin est retenue, le solde a été versé après le délai de deux mois : majoration de 10 % du loyer par mois commencé [S5].",
        "Menaces\n- Le bailleur soutient que le dernier jeu de clés n'a été déposé que le 15 juillet [S6] : le débat sur le délai devient un débat de preuve.",
        "Verdict : dossier favorable à la locataire sur le délai et sur la peinture ; plus discutable sur le nettoyage.",
      ].join("\n\n"),
      sources: [b.edlsCles, b.edleSejour, b.edlsSejour, b.edlsCuisine, b.art22Majoration, b.mailVasseur],
      flags: ["analysis", "swot"],
    },
    {
      q: "Y a-t-il eu une régularisation des charges en 2025 ?",
      mots: ["regularisation:5", "regularise:5", "charges:2", "2025:2"],
      texte: ABSTENTION,
      sources: [],
      abstention: "gate:rerank",
    },
  ],
  suggestions: [
    "À quelle date les clés ont-elles été restituées ?",
    "Le bailleur a-t-il restitué le dépôt de garantie dans les délais ?",
    "La locataire doit-elle payer la remise en peinture du séjour ?",
    "Fais le SWOT de ce dossier",
    "Y a-t-il eu une régularisation des charges en 2025 ?",
  ],
};

// =============================================================================
//  Dossier 2 — Martel c/ SAS Novaprint (licenciement pour faute grave)
// =============================================================================

const CONTRAT = "01_Contrat_travail_Martel_2019.pdf";
const CONVOC = "03_Convocation_entretien_prealable_2026-04-22.pdf";
const LETTRE = "04_Lettre_licenciement_2026-05-12.pdf";
const ATTEST = "07_Attestation_Ines_Roche_scan.pdf";

const l = {
  parties: pdf("licenciement", CONTRAT, 1, "La société Novaprint, SAS au capital de 200 000 euros, dont le siège est 41 rue de l'Industrie, 44800 Saint-Herblain, immatriculée au RCS de Nantes, représentée par Mme Sophie Garnier, directrice des ressources humaines, ci-après « l'employeur »,\nEt M. Julien Martel, né le 9 juin 1988 à Angers, demeurant 5 allée des Tilleuls, 44400 Rezé, ci-après « le salarié »."),
  engagement: pdf("licenciement", CONTRAT, 1, "Le salarié est engagé à compter du 3 janvier 2019, pour une durée indéterminée, en qualité de technicien de maintenance, niveau agent de maîtrise."),
  fonctions: pdf("licenciement", CONTRAT, 1, "Le salarié assure la maintenance préventive et curative du parc de machines du site de Saint-Herblain (rotatives, plieuses, massicots), dans le respect des consignes de sécurité, notamment des procédures de consignation électrique."),
  salaire: pdf("licenciement", CONTRAT, 2, "Le salarié perçoit un salaire brut mensuel de 2 450,00 euros, versé sur douze mois, auquel s'ajoute une prime d'équipe selon les accords en vigueur."),
  convocation: pdf("licenciement", CONVOC, 1, "Nous envisageons de prendre à votre égard une sanction disciplinaire pouvant aller jusqu'au licenciement. Nous vous convoquons à un entretien préalable qui se tiendra le jeudi 30 avril 2026 à 10 h, au bureau des ressources humaines du site de Saint-Herblain."),
  remise: pdf("licenciement", CONVOC, 1, "Remis en main propre le 22 avril 2026. Le salarié : J. Martel (signé)"),
  miseAPied: pdf("licenciement", CONVOC, 1, "Compte tenu de la gravité des faits, nous vous notifions par la présente une mise à pied conservatoire à effet immédiat, dans l'attente de la décision à intervenir."),
  enTete: pdf("licenciement", LETTRE, 1, "Saint-Herblain, le 12 mai 2026\n\nLettre recommandée avec accusé de réception\nObjet : notification de licenciement pour faute grave"),
  grief1: pdf("licenciement", LETTRE, 1, "Le 14 avril 2026, vous avez quitté votre poste à 15 h sans autorisation, laissant la rotative n° 3 à l'arrêt pendant le reste de l'après-midi et retardant la livraison de deux commandes."),
  grief2: pdf("licenciement", LETTRE, 1, "Le 16 avril 2026, vous avez refusé d'exécuter l'intervention de maintenance préventive planifiée sur la plieuse n° 2, malgré la demande répétée de votre chef d'équipe, M. Karim Benali."),
  rappelAvert: pdf("licenciement", LETTRE, 2, "Ces faits, qui s'ajoutent à l'avertissement qui vous a été notifié le 3 février 2025, rendent impossible votre maintien dans l'entreprise, y compris pendant la durée du préavis."),
  effet: pdf("licenciement", LETTRE, 2, "Votre licenciement prend effet immédiatement, à la date d'envoi de la présente lettre, sans indemnité de préavis ni de licenciement. La période de mise à pied conservatoire, du 22 avril 2026 à ce jour, ne sera pas rémunérée."),
  attestation: pdf("licenciement", ATTEST, 1, "J'atteste que le 16 avril 2026, vers 9 h, M. Benali a demandé à Julien Martel d'intervenir tout de suite sur la plieuse n° 2, alors que la machine n'avait pas été consignée.\nJulien a répondu qu'il interviendrait dès que la consignation électrique serait faite, comme le prévoit la procédure. Il ne s'agissait pas d'un refus de travailler.\nLa consignation a été faite vers 11 h et Julien est intervenu sur la plieuse dans la foulée."),
  avertissement: sec("02_Avertissement_retards_2025.docx", "Avertissement du 3 février 2025", "Nous avons constaté trois retards de prise de poste, les 8, 15 et 27 janvier 2025, de vingt à quarante minutes, sans justification. Nous vous notifions par la présente un avertissement, qui sera versé à votre dossier.", 164),
  compteRendu: sec("05_Compte_rendu_entretien_prealable.docx", "Compte rendu de M. Lucas Perrin", "M. Martel indique qu'il était en formation de recyclage d'habilitation électrique toute la journée du 14 avril 2026, à Rezé, et qu'il ne pouvait donc pas être à son poste. Mme Garnier répond qu'elle vérifiera ce point auprès du chef d'équipe.", 702),
  courriel: sec("06_Courriel_Benali_planning_avril.eml", "Karim Benali à RH Novaprint, 10 avril 2026", "Pour info, Julien sera en formation recyclage habilitation électrique toute la journée du mardi 14 avril, chez l'organisme de formation à Rezé. Je prends sa place sur la rotative 3 l'après-midi.", 96),
  bulletins: sec("08_Bulletins_salaire_2025-2026.xlsx", "Feuille « Synthèse »", "Salaire brut moyen des douze derniers mois (avril 2025 à mars 2026), primes d'équipe comprises : 2 612,40 €. Salaire brut moyen des trois derniers mois : 2 598,10 €."),
  l1232_2: loi("travail", "Code du travail", "LEGITEXT000006072050", "Partie législative > Livre II > Titre III > Chapitre II", "L1232-2",
    "L'employeur qui envisage de licencier un salarié le convoque, avant toute décision, à un entretien préalable.\nLa convocation est effectuée par lettre recommandée ou par lettre remise en main propre contre décharge. Cette lettre indique l'objet de la convocation.\nL'entretien préalable ne peut avoir lieu moins de cinq jours ouvrables après la présentation de la lettre recommandée ou la remise en main propre de la lettre de convocation."),
  l1232_6: loi("travail", "Code du travail", "LEGITEXT000006072050", "Partie législative > Livre II > Titre III > Chapitre II", "L1232-6",
    "Lorsque l'employeur décide de licencier un salarié, il lui notifie sa décision par lettre recommandée avec avis de réception.\nCette lettre comporte l'énoncé du ou des motifs invoqués par l'employeur.\nElle ne peut être expédiée moins de deux jours ouvrables après la date prévue de l'entretien préalable au licenciement auquel le salarié a été convoqué."),
};

const JEU_LICENCIEMENT: JeuDonnees = {
  pieces: [
    piece(CONTRAT, 342_118, 2, 6, { pdf: `licenciement/${CONTRAT}` }),
    piece("02_Avertissement_retards_2025.docx", 31_406, null, 2),
    piece(CONVOC, 118_902, 1, 3, { pdf: `licenciement/${CONVOC}` }),
    piece(LETTRE, 201_664, 2, 6, { pdf: `licenciement/${LETTRE}` }),
    piece("05_Compte_rendu_entretien_prealable.docx", 44_870, null, 4),
    piece("06_Courriel_Benali_planning_avril.eml", 12_288, null, 2),
    piece(ATTEST, 1_204_552, 1, 3, { ocr_pages: 1, pdf: `licenciement/${ATTEST}` }),
    piece("08_Bulletins_salaire_2025-2026.xlsx", 58_032, null, 5),
  ],
  fiche: {
    texte: [
      "Parties : M. Julien Martel, technicien de maintenance, et son ancien employeur, la SAS Novaprint, représentée par sa DRH, Mme Sophie Garnier [S1].",
      "Objet : contestation d'un licenciement pour faute grave notifié le 12 mai 2026 [S2].",
      "Montants : salaire contractuel de 2 450,00 euros brut [S3] ; moyenne des douze derniers mois de 2 612,40 euros [S4]. Ni préavis ni indemnité de licenciement, mise à pied non rémunérée [S5].",
      "Griefs :\n- 14 avril 2026 : départ du poste à 15 h sans autorisation [S6]\n- 16 avril 2026 : refus d'intervenir sur la plieuse n° 2 [S7]",
      "Dates clés :\n- 3 janvier 2019 : embauche [S8]\n- 22 avril 2026 : convocation remise en main propre, mise à pied conservatoire [S9]\n- 30 avril 2026 : entretien préalable [S10]\n- 12 mai 2026 : lettre de licenciement [S2]",
      "Point en débat : la réalité des griefs — le chef d'équipe annonçait M. Martel en formation le 14 avril [S11].",
    ].join("\n\n"),
    sources: [l.parties, l.enTete, l.salaire, l.bulletins, l.effet, l.grief1, l.grief2, l.engagement, l.remise, l.convocation, l.courriel],
  },
  apercu: {
    q: "De quoi parle ce dossier ?",
    mots: [],
    texte: [
      "Contestation du licenciement pour faute grave de M. Julien Martel, technicien de maintenance chez Novaprint depuis le 3 janvier 2019 [S1][S2].",
      "L'employeur lui reproche d'avoir quitté son poste le 14 avril 2026 et refusé une intervention le 16 avril [S3][S4]. Le salarié soutient qu'il était en formation le 14 avril, ce que confirme un courriel de son chef d'équipe [S5][S6], et une collègue atteste qu'il a seulement exigé la consignation de la machine le 16 avril [S7].",
    ].join("\n\n"),
    sources: [l.enTete, l.engagement, l.grief1, l.grief2, l.compteRendu, l.courriel, l.attestation],
    flags: ["chat_fallback"],
  },
  reponses: [
    {
      q: "Quels griefs sont reprochés à M. Martel ?",
      mots: ["grief:5", "reproch:5", "motif:4", "faute:2", "accus:3", "pourquoi:2", "licencie"],
      texte: [
        "La lettre du 12 mai 2026 retient deux griefs, qualifiés de faute grave :",
        "- le 14 avril 2026, un départ du poste à 15 h sans autorisation, la rotative n° 3 restant à l'arrêt l'après-midi [S1] ;\n- le 16 avril 2026, un refus d'exécuter la maintenance préventive de la plieuse n° 2 demandée par le chef d'équipe, M. Karim Benali [S2].",
        "L'employeur invoque aussi l'avertissement du 3 février 2025 [S3] et prive le salarié de préavis et d'indemnité de licenciement [S4].",
      ].join("\n\n"),
      sources: [l.grief1, l.grief2, l.rappelAvert, l.effet],
    },
    {
      q: "Quelle est l'ancienneté et le salaire de M. Martel ?",
      mots: ["anciennete:5", "salaire:4", "remuneration:4", "embauch:4", "brut:2", "gagne:3", "depuis:2"],
      texte: [
        "M. Martel a été engagé le 3 janvier 2019 comme technicien de maintenance [S1] ; à la date de la lettre de licenciement, le 12 mai 2026, son ancienneté est de 7 ans et 4 mois [S2].",
        "Son salaire contractuel est de 2 450,00 euros brut par mois [S3] ; la moyenne des douze derniers mois, primes d'équipe comprises, s'élève à 2 612,40 euros [S4].",
      ].join("\n\n"),
      sources: [l.engagement, l.enTete, l.salaire, l.bulletins],
    },
    {
      q: "Que s'est-il passé le 14 avril 2026 ?",
      mots: ["14:5", "formation:4", "rotative:3", "quitte:3", "abandon:3", "poste:2", "avril"],
      texte: [
        "Les pièces se contredisent sur la journée du 14 avril 2026.",
        "- La lettre de licenciement reproche à M. Martel d'avoir quitté son poste à 15 h sans autorisation, la rotative n° 3 restant à l'arrêt [S1].\n- Le 10 avril, le chef d'équipe, M. Benali, avait écrit aux ressources humaines que M. Martel serait en formation d'habilitation électrique toute la journée du 14 avril, à Rezé, et qu'il le remplacerait lui-même sur la rotative 3 l'après-midi [S2].",
        "M. Martel a soutenu la même version lors de l'entretien préalable ; la DRH devait vérifier ce point [S3]. Aucune pièce du dossier ne montre que cette vérification a eu lieu.",
      ].join("\n\n"),
      sources: [l.grief1, l.courriel, l.compteRendu],
    },
    {
      q: "La procédure de licenciement a-t-elle été respectée ?",
      mots: ["procedure:5", "convocation:3", "entretien:3", "prealable:3", "respect:2", "regulier:3", "irregul:3", "forme:2"],
      texte: [
        "En bref : les délais légaux paraissent respectés.",
        "- Convocation remise en main propre le 22 avril 2026 [S1], pour un entretien le jeudi 30 avril [S2]. L'entretien ne peut avoir lieu moins de cinq jours ouvrables après la remise de la convocation [S3] : du 23 au 28 avril (samedi compris, dimanche exclu), il pouvait se tenir dès le 29.\n- La lettre de licenciement est datée du 12 mai 2026 [S4], plus de deux jours ouvrables après l'entretien, comme l'exige la loi [S5].\n- La mise à pied conservatoire figure dans la convocation, à effet immédiat [S6].",
        "Point de vigilance : la régularité de la procédure n'empêche pas de discuter le fond — le grief du 14 avril est contredit par le courriel du chef d'équipe [S7].",
      ].join("\n\n"),
      sources: [l.remise, l.convocation, l.l1232_2, l.enTete, l.l1232_6, l.miseAPied, l.courriel],
      flags: ["analysis"],
    },
    {
      q: "M. Martel avait-il déjà été sanctionné ?",
      mots: ["sanction:5", "avertissement:5", "antecedent:4", "deja:3", "anterieur:3", "retard"],
      texte: "Oui : un avertissement lui a été notifié le 3 février 2025 pour trois retards de prise de poste, les 8, 15 et 27 janvier 2025, de vingt à quarante minutes [S1]. La lettre de licenciement s'y réfère [S2].",
      sources: [l.avertissement, l.rappelAvert],
    },
    {
      q: "Comment contester la faute grave ?",
      mots: ["contester:5", "attaque:5", "arguments:4", "defendre:4", "faute grave:2", "plaider:4", "strategie:3"],
      texte: [
        "Angles d'attaque\n- Grief du 14 avril : matériellement contredit. Le chef d'équipe annonçait lui-même M. Martel en formation à Rezé toute la journée [S1] ; demandez la feuille d'émargement de l'organisme de formation.\n- Grief du 16 avril : selon l'attestation de Mme Roche, M. Martel a seulement exigé la consignation électrique préalable, puis il est intervenu vers 11 h [S2]. Son contrat lui impose précisément le respect des procédures de consignation [S3].\n- Gravité : le seul antécédent est un avertissement pour retards, sans rapport avec les faits [S4] ; la faute grave, qui prive de préavis et d'indemnité [S5], paraît disproportionnée.",
        "Verdict : contestation sérieuse de la faute grave, voire de la cause réelle et sérieuse si le grief du 14 avril tombe.",
      ].join("\n\n"),
      sources: [l.courriel, l.attestation, l.fonctions, l.avertissement, l.effet],
      flags: ["analysis", "attack"],
    },
    {
      q: "M. Martel a-t-il saisi le conseil de prud'hommes ?",
      mots: ["prud:6", "saisi:4", "saisine:4", "conseil:2", "tribunal:3", "audience:3"],
      texte: ABSTENTION,
      sources: [],
      abstention: "gate:rerank",
    },
  ],
  suggestions: [
    "Que s'est-il passé le 14 avril 2026 ?",
    "La procédure de licenciement a-t-elle été respectée ?",
    "Comment contester la faute grave ?",
    "Quelle est l'ancienneté et le salaire de M. Martel ?",
    "M. Martel a-t-il saisi le conseil de prud'hommes ?",
  ],
};

// =============================================================================
//  Dossier 3 — SARL Atelier Rive Gauche (contrôle TVA), pièces sur clé USB
// =============================================================================

const PROP = "Proposition_rectification_2026-06-18.pdf";
const FACT = "Facture_rectificative_Bois_Placages_2026-07-03.pdf";
const OBS = "Observations_contribuable_2026-07-20.docx";

const t = {
  destinataire: pdf("tva", PROP, 1, "SARL Atelier Rive Gauche\nÀ l'attention de Mme Nadia Ferrand, gérante\n17 quai des Chartrons\n33000 Bordeaux\n\nBordeaux, le 18 juin 2026"),
  periode: pdf("tva", PROP, 1, "À la suite de la vérification de comptabilité de votre société, qui a porté en matière de taxe sur la valeur ajoutée sur la période du 1er janvier 2023 au 31 décembre 2024, je vous informe des rectifications que j'envisage d'apporter à vos déclarations."),
  motif1: pdf("tva", PROP, 2, "En 2023, votre société a déduit la TVA figurant sur quatorze factures de la société Bois & Placages Ouest, pour un montant total de 7 850 euros. Ces factures ne comportent ni le numéro individuel d'identification à la TVA du fournisseur, ni la désignation précise des marchandises livrées."),
  motif2: pdf("tva", PROP, 2, "En décembre 2024, votre société a encaissé des acomptes sur des travaux d'agencement pour un montant de 52 750 euros hors taxe, qu'elle n'a déclarés qu'en janvier 2025.\nPour les prestations de services, la TVA est exigible lors de l'encaissement des acomptes. La taxe correspondante, soit 10 550 euros, est rappelée au titre du mois de décembre 2024."),
  droits: pdf("tva", PROP, 3, "Droits rappelés : 7 850 euros au titre de 2023 et 10 550 euros au titre de 2024, soit un total de 18 400 euros."),
  interets: pdf("tva", PROP, 3, "Intérêts de retard, décomptés jusqu'au 30 juin 2026 : 1 288 euros."),
  total: pdf("tva", PROP, 3, "Montant total : 19 688 euros. Aucune majoration n'est appliquée."),
  delai: pdf("tva", PROP, 3, "Vous disposez d'un délai de trente jours à compter de la réception de la présente proposition pour faire parvenir vos observations ou votre acceptation. Ce délai peut être prorogé de trente jours sur demande formulée avant son expiration."),
  rectif: pdf("tva", FACT, 1, "Les quatorze factures émises en 2023 au nom de la SARL Atelier Rive Gauche sont rectifiées pour y faire figurer notre numéro individuel d'identification à la TVA et la désignation précise des marchandises livrées. Les montants, taux et dates de livraison sont inchangés."),
  rectifMontant: pdf("tva", FACT, 1, "Montant total hors taxe : 39 250,00 euros. TVA au taux de 20 % : 7 850,00 euros. Montant TTC : 47 100,00 euros."),
  obsEnTete: sec(OBS, "En-tête", "Bordeaux, le 20 juillet 2026. Observations de la SARL Atelier Rive Gauche sur la proposition de rectification du 18 juin 2026, adressées par lettre recommandée."),
  obsMotif1: sec(OBS, "Sur le premier motif", "La société a obtenu de son fournisseur une facture rectificative du 3 juillet 2026, qui comporte les mentions manquantes. Elle demande en conséquence l'abandon du rappel de 7 850 euros.", 486),
  obsMotif2: sec(OBS, "Sur le second motif", "Les acomptes de décembre 2024 ont été déclarés et la taxe acquittée dès janvier 2025 : le rappel ferait payer deux fois la même taxe. La société accepte seulement les intérêts de retard correspondant au décalage d'un mois.", 1170),
  courriel: sec("Courriel_expert_comptable_2026-06-23.eml", "Cabinet Mercier & Associés, 23 juin 2026", "La proposition de rectification a été réceptionnée hier, le 22 juin 2026 (accusé de réception signé par Mme Ferrand). Nous avons donc jusqu'au 22 juillet pour répondre, sauf demande de prorogation.", 140),
  releve: sec("Releve_TVA_2023-2024.xlsx", "Feuille « 2023 »", "TVA déductible sur achats de biens et services 2023 : 41 230 € ; dont factures Bois & Placages Ouest (14 factures) : 7 850 €."),
};

const JEU_TVA: JeuDonnees = {
  pieces: [
    piece(PROP, 402_816, 3, 9, { pdf: `tva/${PROP}` }),
    piece(FACT, 88_430, 1, 3, { pdf: `tva/${FACT}` }),
    piece("Factures_Bois_Placages_2023_scan.pdf", 6_912_004, 14, 21, { ocr_pages: 14, status: "warning", message: "2 page(s) peu lisibles : texte reconnu avec une confiance moyenne (OCR)" }),
    piece("Releve_TVA_2023-2024.xlsx", 76_544, null, 4),
    piece(OBS, 52_210, null, 5),
    piece("Courriel_expert_comptable_2026-06-23.eml", 9_874, null, 2),
  ],
  fiche: {
    texte: [
      "Parties : SARL Atelier Rive Gauche, représentée par sa gérante, Mme Nadia Ferrand, face à l'administration fiscale [S1].",
      "Objet : vérification de comptabilité en matière de TVA sur la période du 1er janvier 2023 au 31 décembre 2024 [S2].",
      "Montants : 18 400 euros de droits et 1 288 euros d'intérêts de retard, soit 19 688 euros, sans majoration [S3][S4][S5].",
      "Motifs :\n- TVA déduite sur quatorze factures incomplètes de Bois & Placages Ouest : 7 850 euros [S6]\n- TVA sur des acomptes de décembre 2024 déclarés en janvier 2025 : 10 550 euros [S7]",
      "Dates clés :\n- 18 juin 2026 : proposition de rectification [S1]\n- 22 juin 2026 : réception de la proposition [S8]\n- 3 juillet 2026 : facture rectificative du fournisseur [S9]\n- 20 juillet 2026 : observations de la société [S10]",
      "Points en débat : la portée de la facture rectificative, et le double paiement de la TVA sur acomptes.",
    ].join("\n\n"),
    sources: [t.destinataire, t.periode, t.droits, t.interets, t.total, t.motif1, t.motif2, t.courriel, t.rectif, t.obsEnTete],
  },
  apercu: {
    q: "De quoi parle ce dossier ?",
    mots: [],
    texte: [
      "Contrôle fiscal de la SARL Atelier Rive Gauche : une vérification de comptabilité portant sur la TVA de 2023 et 2024 [S1] aboutit à une proposition de rectification de 19 688 euros, intérêts compris [S2].",
      "Deux motifs : la TVA déduite sur des factures incomplètes d'un fournisseur [S3], et la TVA sur des acomptes déclarés avec un mois de retard [S4]. La société a répondu dans le délai, en produisant une facture rectificative [S5][S6].",
    ].join("\n\n"),
    sources: [t.periode, t.total, t.motif1, t.motif2, t.obsMotif1, t.rectif],
    flags: ["chat_fallback"],
  },
  reponses: [
    {
      q: "Quel est le montant total du redressement ?",
      mots: ["montant:3", "total:4", "redressement:2", "rappel:3", "combien:3", "reclame:3", "somme:2", "majoration:2", "interet:2"],
      texte: [
        "Le montant total réclamé est de 19 688 euros [S1] :",
        "- droits rappelés : 7 850 euros au titre de 2023 et 10 550 euros au titre de 2024, soit 18 400 euros [S2] ;\n- intérêts de retard, décomptés jusqu'au 30 juin 2026 : 1 288 euros [S3].",
        "Aucune majoration n'est appliquée [S1].",
      ].join("\n\n"),
      sources: [t.total, t.droits, t.interets],
    },
    {
      q: "Quels sont les motifs de la rectification ?",
      mots: ["motif:5", "pourquoi:3", "redressement:2", "reproch:4", "raison:3", "fondement:3", "rectification:2"],
      texte: [
        "La proposition repose sur deux motifs :",
        "- la TVA déduite en 2023 sur quatorze factures de Bois & Placages Ouest, qui ne portent ni le numéro de TVA du fournisseur ni la désignation précise des marchandises : 7 850 euros [S1] ;\n- la TVA sur des acomptes de travaux encaissés en décembre 2024 mais déclarés en janvier 2025 : 10 550 euros [S2].",
        "La période vérifiée va du 1er janvier 2023 au 31 décembre 2024 [S3].",
      ].join("\n\n"),
      sources: [t.motif1, t.motif2, t.periode],
    },
    {
      q: "Quel est le délai pour répondre à l'administration ?",
      mots: ["delai:5", "repondre:3", "reponse:3", "quand:2", "jours:2", "prorog:4", "observations:2"],
      texte: [
        "La société disposait de trente jours à compter de la réception de la proposition, délai prorogeable de trente jours sur demande [S1].",
        "La proposition a été reçue le 22 juin 2026 [S2] : le délai expirait le 22 juillet 2026. Les observations sont datées du 20 juillet 2026 [S3] ; elles ont donc été adressées dans le délai, sans qu'une prorogation soit nécessaire.",
      ].join("\n\n"),
      sources: [t.delai, t.courriel, t.obsEnTete],
    },
    {
      q: "La facture rectificative permet-elle de sauver la déduction de TVA ?",
      mots: ["rectificative:5", "facture:2", "sauver:3", "deduction:3", "recuperer:3", "regularis:4", "mentions:3"],
      texte: [
        "En bref : c'est l'argument principal contre le premier motif, à étayer.",
        "Le rappel de 7 850 euros repose uniquement sur l'absence de deux mentions sur les factures de 2023 [S1]. La facture rectificative du 3 juillet 2026 annule et remplace ces quatorze factures, ajoute le numéro de TVA du fournisseur et la désignation des marchandises, sans changer montants, taux ni dates [S2] ; elle porte exactement la TVA rappelée, 7 850,00 euros [S3]. Les observations du 20 juillet s'en prévalent [S4].",
        "Point de vigilance : aucun recueil de doctrine fiscale n'est chargé dans la bibliothèque ; la portée d'une facture rectificative produite en cours de procédure est à vérifier dans les textes et la jurisprudence avant de plaider.",
      ].join("\n\n"),
      sources: [t.motif1, t.rectif, t.rectifMontant, t.obsMotif1],
      flags: ["analysis"],
    },
    {
      q: "La société paie-t-elle deux fois la TVA sur les acomptes ?",
      mots: ["acompte:5", "deux fois:4", "double:4", "decembre:2", "janvier:2", "decalage:3"],
      texte: [
        "C'est ce que soutient la société.",
        "Le second motif rappelle 10 550 euros de TVA sur des acomptes encaissés en décembre 2024 et déclarés en janvier 2025 [S1]. La société répond que la taxe a été acquittée dès janvier 2025, et n'accepte que les intérêts de retard du décalage d'un mois [S2].",
        "Si la déclaration de janvier 2025 est confirmée, le préjudice du Trésor se limite à ce décalage, déjà couvert par les intérêts de retard [S3]. Le relevé de TVA de 2025 n'est pas au dossier : à demander à l'expert-comptable.",
      ].join("\n\n"),
      sources: [t.motif2, t.obsMotif2, t.interets],
      flags: ["analysis"],
    },
    {
      q: "Quel est le chiffre d'affaires 2025 de la société ?",
      mots: ["chiffre:5", "affaires:4", "2025:2", "ca:3", "bilan:3", "resultat:3"],
      texte: ABSTENTION,
      sources: [],
      abstention: "gate:rerank",
    },
  ],
  suggestions: [
    "Quel est le montant total du redressement ?",
    "Quel est le délai pour répondre à l'administration ?",
    "La facture rectificative permet-elle de sauver la déduction de TVA ?",
    "La société paie-t-elle deux fois la TVA sur les acomptes ?",
    "Quel est le chiffre d'affaires 2025 de la société ?",
  ],
};

// =============================================================================
//  Pièces sans réponses préparées : clé « CLIENT_DURAND », dossiers créés en visite
// =============================================================================

const JEU_VIDE = (pieces: PieceMeta[]): JeuDonnees => ({
  pieces,
  fiche: { texte: "", sources: [] },
  apercu: { q: "", mots: [], texte: "", sources: [] },
  reponses: [],
  suggestions: ["De quoi parle ce dossier ?", "Quelles sont les pièces du dossier ?"],
});

export const JEUX: Record<JeuCle, JeuDonnees> = {
  bail: JEU_BAIL,
  licenciement: JEU_LICENCIEMENT,
  tva: JEU_TVA,
  durand: JEU_VIDE([
    piece("Assignation_TJ_Nantes_2026-03-02.pdf", 512_400, 6, 14),
    piece("Conclusions_defendeur_2026-05-18.pdf", 884_210, 11, 27),
    piece("Contrat_prestation_2024.pdf", 301_772, 4, 10),
    piece("Factures_impayees_2025.xlsx", 41_210, null, 3),
    piece("Echanges_courriels_2025.eml", 66_048, null, 6),
    piece("PV_constat_commissaire_scan.pdf", 3_480_112, 3, 7, { ocr_pages: 3 }),
  ]),
  generique: JEU_VIDE([
    piece("Piece_01_Courrier_client.pdf", 120_300, 2, 4),
    piece("Piece_02_Contrat.pdf", 410_220, 5, 12),
    piece("Piece_03_Releve_comptes.xlsx", 36_100, null, 3),
    piece("Piece_04_Echanges.eml", 22_800, null, 3),
  ]),
};

/** Pièces déposées après coup dans le dossier Martel : visibles dans « À analyser ». */
export const MARTEL_EN_ATTENTE: PieceMeta[] = [
  piece("09_Attestation_France_Travail.pdf", 156_224, 2, 4),
  piece("Photos_atelier.zip", 18_402_311, null, 0, { unsupported: "extension non prise en charge (.zip)" }),
];

// --- Contrôle du jeu de données -------------------------------------------------
// Chaque marqueur [Sn] doit désigner une source fournie, et chaque source être
// citée : la même règle que le validateur de citations du vrai produit.
for (const [cle, jeu] of Object.entries(JEUX)) {
  for (const r of [jeu.apercu, ...jeu.reponses, { q: "fiche", texte: jeu.fiche.texte, sources: jeu.fiche.sources }]) {
    if (!r.texte) continue;
    const cites = new Set([...r.texte.matchAll(/\[S(\d+)\]/g)].map((m) => Number(m[1])));
    for (const n of cites) if (n < 1 || n > r.sources.length) throw new Error(`[démo aivocat] ${cle} « ${r.q} » : [S${n}] sans source`);
    if (cites.size !== r.sources.length) throw new Error(`[démo aivocat] ${cle} « ${r.q} » : ${r.sources.length - cites.size} source(s) non citée(s)`);
  }
}

// --- Bibliothèque, clés, environnement -------------------------------------------

export interface PackDef {
  slug: string;
  name: string;
  kind: "legi" | "library";
  description: string;
  version: string;
  source: string;
  built_at: string;
  texts: { id: string; title: string; short_title: string; articles: number }[];
  articles: number;
  passages: number;
  size_bytes: number;
  active: boolean;
}

export const LEGI_SOURCE = "DILA — open data LEGI (Licence Ouverte 2.0)";
export const EMPREINTE_EMBEDDINGS = "ollama:bge-m3:1024";

export const PACKS: PackDef[] = [
  {
    slug: "code-civil",
    name: "Code civil",
    kind: "legi",
    description: "Le Code civil en entier : personnes, biens, obligations et contrats, louage, responsabilité, prescription.",
    version: "2026-09-03",
    source: LEGI_SOURCE,
    built_at: "2026-09-05T00:23:18+00:00",
    texts: [{ id: "LEGITEXT000006070721", title: "Code civil", short_title: "Code civil", articles: 2896 }],
    articles: 2896,
    passages: 5209,
    size_bytes: 59_118_882,
    active: true,
  },
  {
    slug: "habitation",
    name: "Habitation",
    kind: "legi",
    description: "Bail d'habitation : loi du 6 juillet 1989 sur les rapports locatifs, Code de la construction et de l'habitation, réparations locatives (décret 87-712), logement décent (décret 2002-120).",
    version: "2026-09-03",
    source: LEGI_SOURCE,
    built_at: "2026-09-05T00:18:36+00:00",
    texts: [
      { id: "LEGITEXT000006069108", title: "Loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs", short_title: "Loi 89-462", articles: 77 },
      { id: "LEGITEXT000006074096", title: "Code de la construction et de l'habitation", short_title: "CCH", articles: 4046 },
      { id: "LEGITEXT000006066148", title: "Décret n° 87-712 du 26 août 1987 relatif aux réparations locatives", short_title: "Décret 87-712", articles: 4 },
      { id: "LEGITEXT000005752423", title: "Décret n° 2002-120 du 30 janvier 2002 relatif aux caractéristiques du logement décent", short_title: "Décret 2002-120", articles: 12 },
    ],
    articles: 4139,
    passages: 21_402,
    size_bytes: 242_944_614,
    active: true,
  },
  {
    slug: "travail",
    name: "Code du travail",
    kind: "legi",
    description: "Le Code du travail, parties législative et réglementaire : contrat de travail, rupture, durée du travail, santé et sécurité.",
    version: "2026-09-03",
    source: LEGI_SOURCE,
    built_at: "2026-09-05T01:02:41+00:00",
    texts: [{ id: "LEGITEXT000006072050", title: "Code du travail", short_title: "Code du travail", articles: 11_284 }],
    articles: 11_284,
    passages: 19_870,
    size_bytes: 171_406_330,
    active: true,
  },
  {
    slug: "notes-du-cabinet-baux",
    name: "Notes du cabinet - baux",
    kind: "library",
    description: "Documents du cabinet : 6 fichier(s) lus.",
    version: "2026-09-12",
    source: "Bibliothèque du cabinet",
    built_at: "2026-09-12T16:40:02+00:00",
    texts: [
      { id: "lib-1", title: "Grille de vétusté du cabinet.docx", short_title: "Grille de vétusté du cabinet.docx", articles: 9 },
      { id: "lib-2", title: "Modèle de mise en demeure - dépôt de garantie.docx", short_title: "Modèle de mise en demeure - dépôt de garantie.docx", articles: 4 },
    ],
    articles: 6,
    passages: 58,
    size_bytes: 2_806_112,
    active: true,
  },
];

export interface DossierBiblio {
  name: string;
  slug: string;
  files: number;
}

export const DOSSIERS_BIBLIO: DossierBiblio[] = [
  { name: "Jurisprudence prud'homale 2025", slug: "jurisprudence-prud-homale-2025", files: 14 },
  { name: "Notes du cabinet - baux", slug: "notes-du-cabinet-baux", files: 6 },
];

export const BIBLIO_DIR = "C:\\Aivocat\\bibliotheque";
export const CASES_DIR = "C:\\Aivocat\\data\\cases";

export interface Volume {
  root: string;
  label: string;
  serial: string;
  removable: boolean;
  read_only: boolean;
  free_bytes: number;
  total_bytes: number;
  filesystem: string;
  simulated: boolean;
}

export const VOLUMES: Volume[] = [
  { root: "E:\\", label: "CLIENT_RIVEGAUCHE", serial: "5A3C-91F2", removable: true, read_only: true, free_bytes: 14_210_000_000, total_bytes: 15_980_000_000, filesystem: "exFAT", simulated: false },
  { root: "F:\\", label: "MEMOIRE_CABINET", serial: "C07E-1D44", removable: true, read_only: false, free_bytes: 58_400_000_000, total_bytes: 63_900_000_000, filesystem: "NTFS", simulated: false },
  { root: "G:\\", label: "CLIENT_DURAND", serial: "9B12-6E0A", removable: true, read_only: true, free_bytes: 7_120_000_000, total_bytes: 7_990_000_000, filesystem: "FAT32", simulated: false },
];

/** Quelles pièces trouve-t-on à un emplacement donné (clé du client, dossier du PC) ? */
export function jeuPourEmplacement(racine: string): JeuCle {
  const r = racine.toUpperCase();
  if (r.startsWith("E:")) return "tva";
  if (r.startsWith("G:")) return "durand";
  return "generique";
}
