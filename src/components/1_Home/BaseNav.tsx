
import NavCard from "./BaseNavCards/NavCard";

export default function BaseNav() {
  return (
    <div className=" grid lg:max-w-5xl lg:w-full lg:mb-0 grid-cols-2 lg:grid-cols-2 ">
      <NavCard title={"Parcours"} video={"/videos/Dev.mp4"} href={"#Parcours"}>
           Curriculum Vitae, Certifications, Etudes
      </NavCard>
      <NavCard title={"Portofolio"} video={"/videos/Fct.mp4"} href={"#Portofolio"}>
          C# , Python, JavaScript, UI/UX
      </NavCard>
    </div>
  );
}
