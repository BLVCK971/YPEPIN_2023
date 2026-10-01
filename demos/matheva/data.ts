// Jeu de données fictif de la démo Matheva : seule la marque (Matheva, Maeva
// Lesi) est réelle. Élèves, parents, séances, paiements et leads sont inventés.
// Les dates sont calculées par rapport au jour d'ouverture de la démo.
import { ilYa, jourIlYa } from "../shared/runtime";

export type Niveau = "6e" | "5e" | "4e" | "3e" | "2nde" | "1ere" | "terminale" | "autre";
export type StatutNotion = "a_revoir" | "a_renforcer" | "en_cours" | "acquis";
export type StatutCours = "a_venir" | "realise" | "annule" | "reporte_a_reprogrammer" | "reporte_reprogramme";
export type StatutPaiement = "du" | "paye";

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: "parent" | "professeur";
  /** Jeton du lien d'accès personnel (parents uniquement). */
  access_token: string | null;
  /** Secret du flux iCal. */
  calendar_token: string;
  created_at: string;
}

export interface EleveRow {
  id: string;
  nom: string;
  prenom: string;
  niveau: Niveau;
  parent_id: string | null;
  tarif_horaire: number | null;
  notes: string | null;
  created_at: string;
}

export interface NotionRow {
  id: string;
  libelle: string;
  niveau: Niveau | null;
  /** Renseigné pour une notion privée à un élève. */
  eleve_id: string | null;
  created_at: string;
}

export interface SuiviRow {
  eleve_id: string;
  notion_id: string;
  statut: StatutNotion;
  commentaire: string | null;
  updated_at: string;
}

export interface TypeCoursRow {
  id: string;
  libelle: string;
  tarif_horaire: number;
  created_at: string;
}

export interface CoursRow {
  id: string;
  eleve_id: string;
  type_cours_id: string | null;
  date: string;
  heure: string;
  duree_minutes: number;
  statut: StatutCours;
  notions_travaillees: string | null;
  difficultes: string | null;
  travail_a_faire: string | null;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaiementRow {
  id: string;
  eleve_id: string;
  cours_id: string | null;
  montant: number;
  date: string;
  statut: StatutPaiement;
  note: string | null;
  created_at: string;
}

export interface LeadRow {
  id: string;
  niveau: Niveau;
  parent_nom: string;
  parent_email: string;
  parent_telephone: string | null;
  enfant_prenom: string | null;
  score_global: string;
  notions_maitrisees: string | null;
  notions_a_renforcer: string | null;
  eleve_id: string | null;
  annule_le: string | null;
  created_at: string;
}

export interface Db {
  users: UserRow[];
  eleves: EleveRow[];
  notions: NotionRow[];
  suivi: SuiviRow[];
  typesCours: TypeCoursRow[];
  cours: CoursRow[];
  paiements: PaiementRow[];
  leads: LeadRow[];
}

export const PROF_EMAIL = "maeva@matheva.demo";
export const PROF_PASSWORD = "demo";
export const PROF_ID = "u-maeva";
/** Parent proposé dans le bandeau de démo (deux enfants suivis). */
export const PARENT_DEMO_ID = "u-moreau";
export const PARENT_DEMO_LIEN = "lien-demo-moreau";

// --- Test diagnostique : banque de questions de 2nde ----------------------------
// Reprise de backend/app/seed_diagnostic.py (contenu pédagogique de Maeva) :
// [catégorie, énoncé, A, B, C, D, bonne réponse].

type QuestionSource = [string, string, string, string, string, string, "A" | "B" | "C" | "D"];

const QUESTIONS_2NDE: QuestionSource[] = [
  ["Nombres et calculs", "L'ensemble des réels x vérifiant |x − 3| ⩽ 2 est :", "[−2 ; 2]", "[1 ; 5]", "[−5 ; −1]", "]1 ; 5[", "B"],
  ["Nombres et calculs", "(3x − 2)² est égal à :", "9x² − 4", "9x² + 12x + 4", "9x² − 12x + 4", "9x² − 6x + 4", "C"],
  ["Nombres et calculs", "La fraction 12/18, écrite sous forme irréductible, est :", "4/6", "6/9", "3/4", "2/3", "D"],
  ["Nombres et calculs", "L'ensemble des solutions de l'inéquation 2x − 5 < 3x + 1 est :", "]−6 ; +∞[", "]−∞ ; −6[", "]6 ; +∞[", "]−∞ ; 6[", "A"],
  ["Géométrie", "Dans un repère, on donne A(1 ; 2) et B(4 ; 6). Les coordonnées du vecteur AB sont :", "(5 ; 8)", "(3 ; −4)", "(3 ; 4)", "(−3 ; −4)", "C"],
  ["Géométrie", "La norme du vecteur u (3 ; 4) est :", "5", "7", "√7", "25", "A"],
  ["Géométrie", "Le déterminant des vecteurs u (2 ; 3) et v (4 ; 6) est :", "12", "−12", "24", "0", "D"],
  ["Géométrie", "L'équation réduite de la droite passant par A(0 ; 1) et de pente 2 est :", "y = x + 2", "y = 2x + 1", "y = −2x + 1", "y = 2x − 1", "B"],
  ["Fonctions", "Soit f la fonction carré. L'image de −3 par f est :", "9", "−9", "6", "−6", "A"],
  ["Fonctions", "Sur ]0 ; +∞[, la fonction inverse est :", "croissante", "constante", "non définie", "décroissante", "D"],
  ["Fonctions", "La fonction racine carrée est définie sur :", "]−∞ ; 0]", "[0 ; +∞[", "ℝ", "]0 ; +∞[", "B"],
  ["Fonctions", "Soit f(x) = x² − 4. L'ensemble des solutions de f(x) = 0 est :", "{2}", "{−2}", "{−2 ; 2}", "{4}", "C"],
  ["Statistiques et probabilités", "Une quantité augmente de 20 % puis diminue de 20 %. Au global, elle a :", "retrouvé sa valeur initiale", "augmenté de 4 %", "diminué de 20 %", "diminué de 4 %", "D"],
  ["Statistiques et probabilités", "Une série statistique comporte 3 valeurs égales à 10 et 2 valeurs égales à 15. La moyenne pondérée est :", "12,5", "12", "13", "11", "B"],
  ["Statistiques et probabilités", "On lance un dé équilibré à 6 faces. La probabilité d'obtenir un nombre pair est :", "1/2", "1/3", "1/6", "2/3", "A"],
  ["Statistiques et probabilités", "On tire au hasard une carte dans un jeu de 32 cartes. La probabilité de tirer un as est :", "1/4", "1/32", "1/8", "1/2", "C"],
  ["Algorithmique et programmation", "En Python, quelle instruction affecte la valeur 5 à la variable x ?", "x == 5", "5 = x", "x = 5", "x := 5", "C"],
  ["Algorithmique et programmation", "Que renvoie l'exécution de : for i in range(3): print(i) ?", "0  1  2", "1  2  3", "0  1  2  3", "3", "A"],
  ["Algorithmique et programmation", "Une boucle « while » est dite :", "bornée", "non bornée", "obligatoirement infinie", "conditionnelle uniquement", "B"],
  ["Algorithmique et programmation", 'Pour stocker le texte "Bonjour" dans une variable Python, on utilise le type :', "entier", "booléen", "flottant", "chaîne de caractères", "D"],
  ["Vocabulaire ensembliste et logique", "Soit A = {1 ; 2 ; 3} et B = {2 ; 3 ; 4}. A ∩ B est égal à :", "{2 ; 3}", "{1 ; 2 ; 3 ; 4}", "{1 ; 4}", "{1}", "A"],
  ["Vocabulaire ensembliste et logique", "La négation de la proposition « x > 0 » est :", "x < 0", "x ⩾ 0", "x ≠ 0", "x ⩽ 0", "D"],
  ["Vocabulaire ensembliste et logique", "Le complémentaire d'un sous-ensemble A d'un ensemble E se note :", "A ∩ E", "A ∪ E", "Ā", "∅", "C"],
  ["Vocabulaire ensembliste et logique", "Une implication « P ⟹ Q » est fausse uniquement lorsque :", "P est fausse et Q est vraie", "P est vraie et Q est fausse", "P et Q sont vraies", "P et Q sont fausses", "B"],
];

export interface QuestionDiagnostique {
  id: string;
  niveau: Niveau;
  categorie: string;
  ordre: number;
  enonce: string;
  choix_a: string;
  choix_b: string;
  choix_c: string;
  choix_d: string;
  bonne_reponse: "A" | "B" | "C" | "D";
}

/** Banque fixe (hors db) : identifiants stables d'une session à l'autre. */
export const QUESTIONS: QuestionDiagnostique[] = QUESTIONS_2NDE.map(([categorie, enonce, a, b, c, d, bonne], i) => ({
  id: `q-2nde-${String(i + 1).padStart(2, "0")}`,
  niveau: "2nde",
  categorie,
  ordre: i + 1,
  enonce,
  choix_a: a,
  choix_b: b,
  choix_c: c,
  choix_d: d,
  bonne_reponse: bonne,
}));

// --- Programme de notions (reprise de backend/app/seed_notions.py) ------------

const NOTIONS_PROGRAMME: [string, Niveau][] = [
  ["Nombres entiers et décimaux", "6e"],
  ["Fractions", "6e"],
  ["Périmètre et aire", "6e"],
  ["Symétrie axiale", "6e"],
  ["Angles", "6e"],
  ["Proportionnalité (initiation)", "6e"],
  ["Solides : pavé droit et cube", "6e"],
  ["Nombres relatifs", "5e"],
  ["Fractions : opérations", "5e"],
  ["Puissances", "5e"],
  ["Symétrie centrale", "5e"],
  ["Parallélogramme", "5e"],
  ["Triangles : propriétés", "5e"],
  ["Géométrie dans l'espace", "5e"],
  ["Statistiques (initiation)", "5e"],
  ["Calcul littéral", "4e"],
  ["Proportionnalité", "4e"],
  ["Puissances : calculs", "4e"],
  ["Théorème de Pythagore", "4e"],
  ["Cosinus d'un angle aigu", "4e"],
  ["Translation", "4e"],
  ["Fonctions linéaires (initiation)", "4e"],
  ["Probabilités (initiation)", "4e"],
  ["Théorème de Thalès", "3e"],
  ["Équations et inéquations", "3e"],
  ["Fonctions", "3e"],
  ["Statistiques et probabilités", "3e"],
  ["Racines carrées", "3e"],
  ["Trigonométrie : sin, cos, tan", "3e"],
  ["Fonctions affines", "3e"],
  ["Systèmes d'équations", "3e"],
  ["Grandeurs composées", "3e"],
  ["Ensembles de nombres", "2nde"],
  ["Calcul littéral et identités remarquables", "2nde"],
  ["Équations et inéquations", "2nde"],
  ["Généralités sur les fonctions", "2nde"],
  ["Fonction carré et fonction inverse", "2nde"],
  ["Vecteurs", "2nde"],
  ["Géométrie repérée : droites", "2nde"],
  ["Statistiques descriptives", "2nde"],
  ["Probabilités", "2nde"],
  ["Suites numériques", "1ere"],
  ["Second degré", "1ere"],
  ["Dérivation : nombre dérivé et tangente", "1ere"],
  ["Étude de fonctions", "1ere"],
  ["Fonctions trigonométriques", "1ere"],
  ["Produit scalaire", "1ere"],
  ["Probabilités conditionnelles", "1ere"],
  ["Échantillonnage", "1ere"],
  ["Limites de suites et de fonctions", "terminale"],
  ["Continuité et théorème des valeurs intermédiaires", "terminale"],
  ["Dérivation et convexité", "terminale"],
  ["Fonction exponentielle", "terminale"],
  ["Fonction logarithme népérien", "terminale"],
  ["Suites : raisonnement par récurrence", "terminale"],
  ["Probabilités conditionnelles et indépendance", "terminale"],
  ["Loi binomiale", "terminale"],
  ["Géométrie dans l'espace : vecteurs, droites et plans", "terminale"],
  ["Primitives et calcul intégral", "terminale"],
  ["Combinatoire et dénombrement", "terminale"],
];

// --- Élèves et familles ---------------------------------------------------------

interface FicheSeance {
  notions: string;
  difficultes: string | null;
  travail: string;
  commentaire: string | null;
}

interface ProfilEleve {
  eleve: EleveRow;
  /** Créneau hebdomadaire : jour (0 = lundi), heure, durée, type de cours. */
  jour: number;
  heure: string;
  duree: number;
  type: string;
  /** Première semaine de cours (négatif = semaines passées). */
  depuis: number;
  fiches: FicheSeance[];
  /** Libellé de notion -> [statut, commentaire éventuel]. */
  suivi: Record<string, [StatutNotion, string?]>;
}

const fiche = (notions: string, difficultes: string | null, travail: string, commentaire: string | null = null): FicheSeance => ({
  notions,
  difficultes,
  travail,
  commentaire,
});

function profils(): ProfilEleve[] {
  return [
    {
      eleve: { id: "e-lea", nom: "Moreau", prenom: "Léa", niveau: "3e", parent_id: "u-moreau", tarif_horaire: null, notes: "Objectif : mention au brevet. Travaille mieux avec des sujets chronométrés.", created_at: ilYa(62) },
      jour: 2, heure: "14:00:00", duree: 90, type: "t-college", depuis: -6,
      fiches: [
        fiche("Théorème de Thalès : configurations triangle et papillon", "Confond encore les rapports dans la configuration papillon.", "Exercices 12 à 15 p. 148.", "Plus à l'aise qu'au début, à revoir avant le contrôle."),
        fiche("Équations du premier degré, mise en équation de problèmes", "Traduction de l'énoncé en équation.", "Fiche de 6 problèmes à mettre en équation."),
        fiche("Fonctions affines : lecture graphique, coefficient directeur", null, "Tracer les 3 fonctions de l'exercice 4 et donner leurs coefficients.", "Très bonne séance, Léa a pris confiance."),
        fiche("Racines carrées : simplification et calculs", "Erreurs de signe en développant.", "Exercices 31 à 34 p. 62."),
        fiche("Sujet de brevet blanc : partie géométrie", "Gestion du temps sur l'exercice de Pythagore.", "Terminer le sujet (exercices 4 et 5).", "Prévoir un sujet complet chronométré."),
      ],
      suivi: {
        "Théorème de Thalès": ["en_cours", "Configuration papillon à consolider."],
        "Équations et inéquations": ["acquis"],
        "Fonctions affines": ["acquis"],
        "Racines carrées": ["a_renforcer", "Erreurs de signe fréquentes."],
        Fonctions: ["en_cours"],
        "Statistiques et probabilités": ["acquis"],
      },
    },
    {
      eleve: { id: "e-hugo", nom: "Moreau", prenom: "Hugo", niveau: "6e", parent_id: "u-moreau", tarif_horaire: null, notes: "Petit frère de Léa. A besoin d'exemples concrets.", created_at: ilYa(62) },
      jour: 2, heure: "16:00:00", duree: 60, type: "t-college", depuis: -6,
      fiches: [
        fiche("Fractions : partage et fraction d'une quantité", "Confond numérateur et dénominateur.", "Fiche « fractions du quotidien » (8 questions).", "Hugo est attentif, il progresse vite avec du concret."),
        fiche("Nombres décimaux : comparaison et rangement", null, "Exercices 5, 6 et 9 p. 24."),
        fiche("Angles : utilisation du rapporteur", "Lit la mauvaise graduation du rapporteur.", "Mesurer les 6 angles de la fiche."),
        fiche("Périmètre et aire du rectangle et du carré", "Mélange encore périmètre et aire.", "Problème de la clôture du jardin.", "Bons progrès, à consolider."),
      ],
      suivi: {
        Fractions: ["en_cours"],
        "Nombres entiers et décimaux": ["acquis"],
        Angles: ["a_renforcer", "Lecture du rapporteur à reprendre."],
        "Périmètre et aire": ["en_cours"],
      },
    },
    {
      eleve: { id: "e-ines", nom: "Benali", prenom: "Inès", niveau: "2nde", parent_id: "u-benali", tarif_horaire: null, notes: "Arrivée via le test diagnostique (14/24). Calcul littéral à renforcer.", created_at: ilYa(38) },
      jour: 1, heure: "17:30:00", duree: 90, type: "t-lycee", depuis: -5,
      fiches: [
        fiche("Calcul littéral : identités remarquables", "Oubli du double produit dans (a − b)².", "Développer les 10 expressions de la fiche.", "Point faible repéré au test diagnostique."),
        fiche("Vecteurs : coordonnées et égalité de vecteurs", null, "Exercices 18 à 22 p. 210."),
        fiche("Fonction carré et fonction inverse : variations", "Résolution graphique d'inéquations.", "Exercice de synthèse sur f(x) = x².", "Inès participe beaucoup, très motivée."),
        fiche("Équations et inéquations : tableaux de signes", "Tableau de signes d'un produit.", "Exercices 40 à 43 p. 98."),
      ],
      suivi: {
        "Calcul littéral et identités remarquables": ["a_renforcer", "Double produit souvent oublié."],
        Vecteurs: ["acquis"],
        "Fonction carré et fonction inverse": ["en_cours"],
        "Équations et inéquations": ["en_cours"],
        "Ensembles de nombres": ["acquis"],
        "Généralités sur les fonctions": ["acquis"],
      },
    },
    {
      eleve: { id: "e-noah", nom: "Lefèvre", prenom: "Noah", niveau: "terminale", parent_id: "u-lefevre", tarif_horaire: 33, notes: "Spécialité maths, vise une prépa. Tarif famille négocié à 33 €/h.", created_at: ilYa(75) },
      jour: 0, heure: "18:00:00", duree: 120, type: "t-examens", depuis: -6,
      fiches: [
        fiche("Fonction exponentielle : propriétés algébriques, équations", null, "Exercices 25 à 30 p. 120.", "Niveau solide, objectif mention très bien."),
        fiche("Suites : raisonnement par récurrence", "Rédaction de l'hérédité.", "Rédiger 2 récurrences complètes (fiche)."),
        fiche("Limites de fonctions : formes indéterminées", "Factorisation par le terme dominant.", "Exercices 52 à 56 p. 88."),
        fiche("Convexité et point d'inflexion", null, "Sujet type bac, exercice 2.", "Très efficace en autonomie."),
        fiche("Logarithme népérien : introduction", "Passage de exp à ln dans les équations.", "Exercices 8 à 14 p. 160."),
      ],
      suivi: {
        "Fonction exponentielle": ["acquis"],
        "Suites : raisonnement par récurrence": ["en_cours", "La rédaction progresse."],
        "Limites de suites et de fonctions": ["en_cours"],
        "Dérivation et convexité": ["acquis"],
        "Fonction logarithme népérien": ["a_renforcer"],
        "Probabilités conditionnelles et indépendance": ["acquis"],
      },
    },
    {
      eleve: { id: "e-chloe", nom: "Martin", prenom: "Chloé", niveau: "4e", parent_id: "u-martin", tarif_horaire: null, notes: "Manque de confiance à l'écrit, comprend vite à l'oral.", created_at: ilYa(55) },
      jour: 3, heure: "17:00:00", duree: 60, type: "t-college", depuis: -6,
      fiches: [
        fiche("Théorème de Pythagore : calcul d'une longueur", "Identifier l'hypoténuse.", "Exercices 7 à 10 p. 180.", "Chloé doute d'elle mais comprend vite."),
        fiche("Calcul littéral : développer et réduire", "Règles des signes.", "Fiche de 12 expressions."),
        fiche("Puissances de 10 et écriture scientifique", null, "Exercices 21 à 24 p. 40."),
        fiche("Proportionnalité : quatrième proportionnelle, pourcentages", "Calcul d'un pourcentage d'évolution.", "Problèmes 1 à 4 de la fiche.", "Bonne dynamique, à encourager."),
      ],
      suivi: {
        "Théorème de Pythagore": ["acquis"],
        "Calcul littéral": ["en_cours"],
        "Puissances : calculs": ["acquis"],
        Proportionnalité: ["a_renforcer", "Pourcentages d'évolution."],
      },
    },
    {
      eleve: { id: "e-adam", nom: "Rousseau", prenom: "Adam", niveau: "1ere", parent_id: "u-rousseau", tarif_horaire: null, notes: null, created_at: ilYa(70) },
      jour: 5, heure: "10:00:00", duree: 90, type: "t-lycee", depuis: -6,
      fiches: [
        fiche("Second degré : forme canonique et discriminant", "Calcul de la forme canonique.", "Exercices 30 à 35 p. 52."),
        fiche("Suites arithmétiques et géométriques", "Distinguer les deux types de suites.", "Fiche de 8 suites à identifier.", "Adam travaille régulièrement, bon rythme."),
        fiche("Dérivation : nombre dérivé et équation de tangente", "Formule de la tangente.", "Exercices 12 à 16 p. 120."),
        fiche("Produit scalaire : définitions et calculs", null, "Exercices 5 à 9 p. 230."),
      ],
      suivi: {
        "Second degré": ["acquis"],
        "Suites numériques": ["en_cours"],
        "Dérivation : nombre dérivé et tangente": ["a_renforcer", "Équation de tangente à revoir."],
        "Produit scalaire": ["en_cours"],
      },
    },
    {
      eleve: { id: "e-manon", nom: "Girard", prenom: "Manon", niveau: "5e", parent_id: null, tarif_horaire: null, notes: "Arrivée à la rentrée, bilan de départ en cours.", created_at: ilYa(16) },
      jour: 5, heure: "14:00:00", duree: 60, type: "t-remise", depuis: -2,
      fiches: [
        fiche("Nombres relatifs : addition et soustraction", "Soustraction d'un nombre négatif.", "Exercices 3 à 8 p. 18.", "Premier cours : bilan de rentrée."),
        fiche("Fractions : comparaison et simplification", null, "Fiche de 10 fractions à simplifier."),
      ],
      suivi: {
        "Nombres relatifs": ["en_cours"],
        "Fractions : opérations": ["a_revoir", "Bases de 6e à reprendre d'abord."],
      },
    },
  ];
}

/** Exceptions au déroulé normal (clé : identifiant d'élève + semaine). */
const EXCEPTIONS: Record<string, { statut: StatutCours; commentaire: string; decalage?: [jour: number, heure: string] }> = {
  "e-lea:-3": { statut: "annule", commentaire: "Annulé la veille par la famille : facturé (créneau bloqué)." },
  "e-chloe:-1": { statut: "reporte_a_reprogrammer", commentaire: "Report demandé : sortie scolaire." },
  "e-adam:1": { statut: "reporte_reprogramme", commentaire: "Déplacé au vendredi soir (tournoi le samedi).", decalage: [4, "18:00:00"] },
};

/** Paiements laissés dus malgré leur ancienneté (relance à faire). */
const IMPAYES_ANCIENS = new Set(["e-adam:-4"]);

export function seed(): Db {
  const users: UserRow[] = [
    { id: PROF_ID, email: PROF_EMAIL, full_name: "Maeva Lesi", role: "professeur", access_token: null, calendar_token: "cal-maeva-demo", created_at: ilYa(120) },
    { id: "u-moreau", email: "claire.moreau@example.com", full_name: "Claire Moreau", role: "parent", access_token: PARENT_DEMO_LIEN, calendar_token: "cal-moreau-demo", created_at: ilYa(62) },
    { id: "u-benali", email: "karim.benali@example.com", full_name: "Karim Benali", role: "parent", access_token: "lien-demo-benali", calendar_token: "cal-benali-demo", created_at: ilYa(38) },
    { id: "u-lefevre", email: "sophie.lefevre@example.com", full_name: "Sophie Lefèvre", role: "parent", access_token: "lien-demo-lefevre", calendar_token: "cal-lefevre-demo", created_at: ilYa(75) },
    { id: "u-martin", email: "julien.martin@example.com", full_name: "Julien Martin", role: "parent", access_token: "lien-demo-martin", calendar_token: "cal-martin-demo", created_at: ilYa(55) },
    { id: "u-rousseau", email: "nadia.rousseau@example.com", full_name: "Nadia Rousseau", role: "parent", access_token: "lien-demo-rousseau", calendar_token: "cal-rousseau-demo", created_at: ilYa(70) },
  ];

  const typesCours: TypeCoursRow[] = [
    { id: "t-college", libelle: "Cours collège", tarif_horaire: 28, created_at: ilYa(120) },
    { id: "t-lycee", libelle: "Cours lycée", tarif_horaire: 32, created_at: ilYa(120) },
    { id: "t-examens", libelle: "Préparation aux examens", tarif_horaire: 35, created_at: ilYa(120) },
    { id: "t-remise", libelle: "Remise à niveau", tarif_horaire: 30, created_at: ilYa(110) },
  ];

  const notions: NotionRow[] = NOTIONS_PROGRAMME.map(([libelle, niveau], i) => ({
    id: `n-${String(i + 1).padStart(2, "0")}`,
    libelle,
    niveau,
    eleve_id: null,
    created_at: ilYa(120),
  }));
  // Notion privée : révision de collège pour une élève de 2nde.
  notions.push({ id: "n-ines-fractions", libelle: "Fractions : révision collège", niveau: "2nde", eleve_id: "e-ines", created_at: ilYa(35) });

  const notionId = (libelle: string, niveau: Niveau) =>
    notions.find((n) => n.libelle === libelle && n.niveau === niveau && n.eleve_id === null)?.id;

  const eleves: EleveRow[] = [];
  const suivi: SuiviRow[] = [];
  const cours: CoursRow[] = [];
  const paiements: PaiementRow[] = [];

  // Jour de la semaine courante (0 = lundi), pour caler les créneaux hebdomadaires.
  const aujourdhui = (new Date().getDay() + 6) % 7;

  for (const p of profils()) {
    eleves.push(p.eleve);
    let k = 0;
    for (const [libelle, [statut, commentaire]] of Object.entries(p.suivi)) {
      const id = notionId(libelle, p.eleve.niveau);
      if (!id) throw new Error(`[démo] notion inconnue : ${libelle}`);
      suivi.push({ eleve_id: p.eleve.id, notion_id: id, statut, commentaire: commentaire ?? null, updated_at: ilYa(3 + 4 * k++, 19) });
    }

    // Fiches attribuées de sorte que la séance réalisée la plus récente reçoive la
    // dernière fiche de la liste (progression cohérente côté parent).
    const nbRealises = Array.from({ length: 4 - p.depuis }, (_, i) => p.depuis + i).filter(
      (s) => !EXCEPTIONS[`${p.eleve.id}:${s}`] && aujourdhui - p.jour - 7 * s > 0,
    ).length;
    let numeroFiche = 0;
    for (let semaine = p.depuis; semaine <= 3; semaine++) {
      const exception = EXCEPTIONS[`${p.eleve.id}:${semaine}`];
      const [jour, heure] = exception?.decalage ?? [p.jour, p.heure];
      const joursAgo = aujourdhui - jour - 7 * semaine;
      const passe = joursAgo > 0;
      const statut: StatutCours = exception?.statut ?? (passe ? "realise" : "a_venir");
      const f = statut === "realise" ? p.fiches[p.fiches.length - 1 - ((nbRealises - 1 - numeroFiche++) % p.fiches.length)] : null;
      const id = `c-${p.eleve.id.slice(2)}-${semaine + 10}`;
      const tarif = p.eleve.tarif_horaire ?? typesCours.find((t) => t.id === p.type)!.tarif_horaire;
      cours.push({
        id,
        eleve_id: p.eleve.id,
        type_cours_id: p.type,
        date: jourIlYa(joursAgo),
        heure,
        duree_minutes: p.duree,
        statut,
        notions_travaillees: f?.notions ?? null,
        difficultes: f?.difficultes ?? null,
        travail_a_faire: f?.travail ?? null,
        commentaire: exception?.commentaire ?? f?.commentaire ?? null,
        created_at: ilYa(Math.max(joursAgo, 0) + 12),
        updated_at: passe ? ilYa(joursAgo, 20) : ilYa(12),
      });
      // Paiement généré à la réalisation (ou à l'annulation) du cours, comme le backend.
      if (statut === "realise" || statut === "annule") {
        const paye = joursAgo >= 7 && !IMPAYES_ANCIENS.has(`${p.eleve.id}:${semaine}`);
        paiements.push({
          id: `p-${id.slice(2)}`,
          eleve_id: p.eleve.id,
          cours_id: id,
          montant: Math.round(tarif * p.duree / 60 * 100) / 100,
          date: jourIlYa(joursAgo),
          statut: paye ? "paye" : "du",
          note: IMPAYES_ANCIENS.has(`${p.eleve.id}:${semaine}`) ? "Relance envoyée par SMS." : null,
          created_at: ilYa(joursAgo, 20),
        });
      }
    }
  }

  // Paiement libre, sans cours associé.
  paiements.push({
    id: "p-stage-adam",
    eleve_id: "e-adam",
    cours_id: null,
    montant: 120,
    date: jourIlYa(48),
    statut: "paye",
    note: "Stage de révisions de fin d'été (4 × 1h).",
    created_at: ilYa(48),
  });

  const leads: LeadRow[] = [
    {
      id: "l-fontaine", niveau: "2nde", parent_nom: "Isabelle Fontaine", parent_email: "isabelle.fontaine@example.com", parent_telephone: "06 01 02 03 04", enfant_prenom: "Tom",
      score_global: "11/24", notions_maitrisees: "Fonctions, Statistiques et probabilités", notions_a_renforcer: "Algorithmique et programmation, Géométrie, Nombres et calculs, Vocabulaire ensembliste et logique",
      eleve_id: null, annule_le: null, created_at: ilYa(2, 21),
    },
    {
      id: "l-dubois", niveau: "2nde", parent_nom: "Marc Dubois", parent_email: "marc.dubois@example.com", parent_telephone: null, enfant_prenom: "Jade",
      score_global: "18/24", notions_maitrisees: "Algorithmique et programmation, Fonctions, Géométrie, Nombres et calculs, Statistiques et probabilités", notions_a_renforcer: "Vocabulaire ensembliste et logique",
      eleve_id: null, annule_le: null, created_at: ilYa(5, 18),
    },
    {
      id: "l-petit", niveau: "2nde", parent_nom: "Aurélie Petit", parent_email: "aurelie.petit@example.com", parent_telephone: "06 11 22 33 44", enfant_prenom: null,
      score_global: "7/24", notions_maitrisees: "Statistiques et probabilités", notions_a_renforcer: "Algorithmique et programmation, Fonctions, Géométrie, Nombres et calculs, Vocabulaire ensembliste et logique",
      eleve_id: null, annule_le: null, created_at: ilYa(9, 12),
    },
    {
      id: "l-benali", niveau: "2nde", parent_nom: "Karim Benali", parent_email: "karim.benali@example.com", parent_telephone: "06 55 44 33 22", enfant_prenom: "Inès",
      score_global: "14/24", notions_maitrisees: "Algorithmique et programmation, Fonctions, Géométrie, Statistiques et probabilités", notions_a_renforcer: "Nombres et calculs, Vocabulaire ensembliste et logique",
      eleve_id: "e-ines", annule_le: null, created_at: ilYa(41, 20),
    },
    {
      id: "l-garnier", niveau: "2nde", parent_nom: "Pierre Garnier", parent_email: "pierre.garnier@example.com", parent_telephone: null, enfant_prenom: "Lucas",
      score_global: "20/24", notions_maitrisees: "Algorithmique et programmation, Fonctions, Géométrie, Nombres et calculs, Statistiques et probabilités, Vocabulaire ensembliste et logique", notions_a_renforcer: null,
      eleve_id: null, annule_le: ilYa(12, 9), created_at: ilYa(20, 17),
    },
  ];

  return { users, eleves, notions, suivi, typesCours, cours, paiements, leads };
}
