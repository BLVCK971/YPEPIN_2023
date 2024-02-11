import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faBuilding,
  faPenToSquare,
  faShareFromSquare,
  faVault,
  faUserGroup,
  faUsersGear,
  faPeopleArrows,
  faDatabase,
  faCode,
  faChartPie,
  faUser,
  faGears,
  faSitemap,
  faLaptopCode,
  faDiagramNext,
} from "@fortawesome/free-solid-svg-icons";
import Ul from "../components/Ul";
import Li from "../components/Li";

export default function BusinessZone() {
  return (
    <div className="text-base col-span-4 grid grid-cols-4 p-4 mt-6">
      <div className=" col-span-4 text-xl font-semibold mb-5">Business Zone</div>

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faBuilding} /> <span /> Contexte :
        </div>
        <div className="text-base mb-10">
          Une application Web ASP.NET MVC en C# en Clean Architecture permettant
          le partage contrôlé de rapports Power BI pour les clients de DIGITOM
          dans leur service.
        </div>
      </div>

      <div className="col-span-4">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPenToSquare} /> <span /> Tâches :
        </div>
        <div className="text-base mb-10">
        <Ul>
          <Li icon={faCheck}>
            TechLead sur l&apos;ensemble du projet, chapeauté par Régis
            GEROMEGNACE
          </Li>
          <Li icon={faPenToSquare}>
            Besoin perçu sur plusieurs projets et sur de futures problématiques
            : Conception de l&apos;idée, du Cahier des Charges, Présentation à
            la Direction du POC, Conception UML, Développement, Lancement de
            produit
          </Li>
          <Li icon={faSitemap}>
            CleanArchitecture en place permettant une application modulaire,
            maintenable et évolutive.
          </Li>
          <Li icon={faGears}>Fonctionnalités : </Li>
          <Ul>
            <Li icon={faUsersGear}>
              Authentification, administration et système d&apos;autorisations
            </Li>
            <Li icon={faChartPie}>Intégration de Power BI</Li>
            <Li icon={faUserGroup}>Gestion des rôles</Li>
            <Li icon={faVault}>Sécurité des données</Li>
            <Li icon={faShareFromSquare}>
              Partage contrôlé de rapport Power BI{" "}
            </Li>
          </Ul>
          <Li icon={faGears}>Fonctionnalités prévues :</Li>
          <Ul>
            <Li icon={faDiagramNext}>
              Multi Tenant : Accès sur la même instance de plusieurs instance
              AzureAD/PowerBIService
            </Li>
            <Li icon={faDiagramNext}>
              Pré-Filtre : Pour un rapport Power BI partagé, Filtrage dynamique
              selon l&apos;identification sur BZ
            </Li>
            <Li icon={faDiagramNext}>
              Multi BDD : Elaboration de rapports pouvant s&apos;adapter à la
              majorité des BDD des ERP du marché.
            </Li>
            <Li icon={faDiagramNext}>
              Multi Service : Standardisation des rapports pour répondre aux
              besoins principaux de n&apos;importe quelle entreprise.
              Amélioration continue des rapports de clients ayant déjà souscrit
              à BZ
            </Li>
            <Li icon={faDiagramNext}>
              Multi BI : Prise en charge de BusinessObject, Tableau voire
              Framework de visualisation (JS, Python, R ou autres) pour éviter
              une limitation de la solution à Power BI Embedded.
            </Li>
          </Ul>
        </Ul></div>
      </div>

      <div className="col-span-2">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faLaptopCode} /> <span /> Environnement
          Technique :
        </div>
        <div className="text-base">
        <Ul>
          <Li icon={faCode}>C#, .NET MVC, EntityFramework</Li>
          <Li icon={faChartPie}>
            Power BI Service, Power BI Embedded, Azure AD
          </Li>
          <Li icon={faDatabase}>SQL Server</Li>
          <Li icon={faSitemap}>
            Principes SOLID, Pattern CQRS, Mediator et Repository
          </Li>
          <Li icon={faGears}>
            AutoMapper, MediatR, FluentValidation et Swagger
          </Li>
        </Ul>
      </div>
      </div>
      <div className="col-span-2">
        <div className="text-lg mb-2">
          <FontAwesomeIcon icon={faPeopleArrows} /> <span /> Collaborateurs &
          Roles :
        </div>
        <div className="text-base">
        <Ul>
          <Li icon={faUser}>
            Régis GEROMEGNACE, Product Owner et Product Manager
          </Li>
          <Li icon={faUser}>Olivier ANGELE, Gestion client avant-vente</Li>
        </Ul></div>
      </div>
    </div>
  );
}
