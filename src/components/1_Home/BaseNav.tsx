
import NavCard from "./BaseNavCards/NavCard";

export default function BaseNav() {
  return (
    <nav aria-label="Sections du site" className=" grid lg:max-w-5xl lg:w-full lg:mb-0 grid-cols-2 lg:grid-cols-4 ">
      <NavCard title={"Profil"} video={"/videos/Data.mp4"} href={"#Profil"}>
           Résumé, Stack .NET, Python, Cloud
      </NavCard>
      <NavCard title={"Parcours"} video={"/videos/Dev.mp4"} href={"#Parcours"}>
           Expériences, Missions, Réalisations
      </NavCard>
      <NavCard title={"Formation"} video={"/videos/Design.mp4"} href={"#Formation"}>
           Diplômes, Certifications, Concours
      </NavCard>
      <NavCard title={"Portfolio"} video={"/videos/Fct.mp4"} href={"#Portfolio"}>
          Python, JavaScript, UI/UX
      </NavCard>
    </nav>
  );
}
