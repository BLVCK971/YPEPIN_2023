import Company from "./components/Company";
import Image from "next/image";
import DeviceIntegration from "./Projects/DeviceIntegration";
import { DigitomPostes, SchneiderPostes } from "./data/data";
import BusinessZone from "./Projects/BusinessZone";
import "./components/Company.css";
export default function Parcours() {
  return (
    <div className="md:p-24 p-2">
      <Company
        Id="Schneider"
        nom={"Avisto / Schneider Electric"}
        dates={"06/2023 - Aujourd'hui"}
        companyPostes={SchneiderPostes}
        companyLogos={['logos/avisto.png','logos/SCHNEIDER.png']}
      >
        <DeviceIntegration />
      </Company>

      <Company
        Id="Digitom"
        nom={"Digitom"}
        dates={"10/2018 - 06/2023"}
        companyPostes={DigitomPostes}
        companyLogos={['logos/DIGITOM.png']}
      >
        <BusinessZone />
      </Company>
    </div>
  );
}
