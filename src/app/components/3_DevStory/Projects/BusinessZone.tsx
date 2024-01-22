import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function BusinessZone() {
  return (
    <div className="text-lg col-span-4 p-24">
      <div className="text-5xl font-semibold">
        Business Zone
      </div>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck} /> <span /> Contexte :
      </div>
      <div className="text-2xl my-10">
      Une application Web ASP.NET MVC en C# en Clean Architecture permettant le partage contrôlé de rapports Power BI pour les clients de DIGITOM dans leur service.,
      <ul className="fa-ul">
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          TechLead sur l&apos;ensemble du projet, chapeauté par Régis GEROMEGNACE
        </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Application de la méthodologie Scrum en méthode agile SAFe d&apos;une
          équipe de 8 au sein d&apos;un train de 90 personnes
          <br />
          (basé en France, Allemagne, Inde et Singapour) </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Développement C# d&apos;un IDE avec WinForms afin de programmer des
          automates d&apos;usines.
        </li>
      </ul>
      
        Besoin perçu sur plusieurs projets et  sur de futures problématiques  : Conception de l&apos;idée, du Cahier des Charges, Présentation à la Direction du POC, Conception UML, Développement, Lancement de produit
        CleanArchitecture en place permettant une application modulaire, maintenable et évolutive.
        
        Fonctionnalités : 
                       - Authentification, administration et système d&apos;autorisations
                       - Intégration de Power BI
                       - Gestion des rôles
                       - Sécurité des données
                       - Partage contrôlé de rapport Power BI 
        Fonctionnalités prévues :
                       - Multi Tenant : Accès sur la même instance de plusieurs instance AzureAD/PowerBIService
                       - Pré-Filtre : Pour un rapport Power BI partagé, Filtrage dynamique selon l&apos;identification sur BZ
                       - Multi BDD : Elaboration de rapports pouvant s&apos;adapter à la majorité des BDD des ERP du marché.
                       - Multi Service : Standardisation des rapports pour répondre aux besoins principaux de n&apos;importe quelle entreprise. Amélioration continue des rapports de clients ayant déjà souscrit à BZ
                       - Multi BI : Prise en charge de BusinessObject, Tableau voire Framework de visualisation (JS, Python, R ou autres) pour éviter une limitation de la solution à Power BI Embedded.
      </div>

      <div className="text-3xl my-10">
        <FontAwesomeIcon icon={faCheck} /> <span /> Tâches :
      </div>

      <ul className="fa-ul">
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Conception de l&apos;idée, du Cahier des Charges, Présentation à la Direction du POC, Conception UML, Développement, Lancement de produit
        </li>
        <li className="py-1">
          <span className="fa-li">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          Application de la méthodologie Scrum en méthode agile SAFe d&apos;une
          équipe de 8 au sein d&apos;un train de 90 personnes
          <br />
          (basé en France, Allemagne, Inde et Singapour) </li>
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
