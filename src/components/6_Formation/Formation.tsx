import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCertificate, faGraduationCap, faTrophy } from "@fortawesome/free-solid-svg-icons";

const diplomes = [
  { annee: "2022", titre: "Master MIAGE, spécialisation Data Science", lieu: "Université des Antilles (Guadeloupe)" },
  { annee: "2019", titre: "Licence MIAGE (Bachelor of Information Technology)", lieu: "Université des Antilles (Guadeloupe)" },
];

const certifications = [
  { annee: "2024", titre: "SAFe 6.0 Scrum Master", lieu: "Scaled Agile Framework Inc." },
  { annee: "2023", titre: "CS50x et CS50AI", lieu: "Harvard (Cambridge, Massachusetts)" },
];

const concours = [
  { annee: "2022", titre: "Hack my Flat : 1ère place", lieu: "Hackathon de l'entreprise IAD" },
  { annee: "2022", titre: "Google HashCode : 4728ème / 9031", lieu: "" },
  { annee: "2021", titre: "Google HashCode : 1545ème / 9004", lieu: "" },
  { annee: "2020", titre: "Google HashCode : 5830ème / 10724", lieu: "" },
];

const card =
  "rounded-xl border border-neutral-800 bg-neutral-500/20 backdrop-blur-lg p-4 md:p-6";

const blocs = [
  { titre: "Diplômes", icone: faGraduationCap, items: diplomes },
  { titre: "Certifications", icone: faCertificate, items: certifications },
  { titre: "Concours", icone: faTrophy, items: concours },
];

export default function Formation() {
  return (
    <div className="md:px-24 p-2 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
      {blocs.map((bloc) => (
        <div key={bloc.titre} className={card}>
          <h2 className="text-2xl font-semibold mb-4">
            <FontAwesomeIcon icon={bloc.icone} /> {bloc.titre}
          </h2>
          <ul className="space-y-4">
            {bloc.items.map((item) => (
              <li key={item.titre} className="flex gap-4">
                <span className="font-semibold opacity-70 tabular-nums shrink-0 w-12">{item.annee}</span>
                <div>
                  <div className="font-semibold">{item.titre}</div>
                  {item.lieu && <div className="text-sm opacity-70">{item.lieu}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
