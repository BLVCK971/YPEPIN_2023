import Company from "./components/Company";
import Mission from "./components/Mission";
import { companies } from "./data/data";
import "./components/Company.css";

export default function Parcours() {
  return (
    <div className="md:p-24 p-2 w-full max-w-7xl">
      {companies.map((company) => (
        <Company key={company.id} company={company}>
          {company.missions.map((mission) => (
            <Mission key={mission.nom} mission={mission} />
          ))}
        </Company>
      ))}
    </div>
  );
}
