import Company from "./components/Company";
import Mission from "./components/Mission";
import { companies } from "./data/data";
import Reveal from "../ui/Reveal";

export default function Parcours() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 px-4">
      {companies.map((company) => (
        <Reveal key={company.id}>
          <Company company={company}>
            {company.missions.map((mission) => (
              <Mission key={mission.nom} mission={mission} />
            ))}
          </Company>
        </Reveal>
      ))}
    </div>
  );
}
