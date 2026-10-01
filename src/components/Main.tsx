import Contact from "./1_Home/Contact";
import Title from "./1_Home/Title";
import Poste from "./1_Home/Poste";
import BaseNav from "./1_Home/BaseNav";
import Parcours from "./3_DevStory/Parcours";
import Portofolio from "./4_Portofolio/Portofolio";
import Profil from "./5_Profil/Profil";
import Formation from "./6_Formation/Formation";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

export default function Main() {
  return (
    <main>
      <BackgroundGradientAnimation
        className="bg-black flex min-h-screen flex-col items-center justify-between pt-24 p-2 md:p-24 "
        gradientBackgroundStart="rgb(0, 0, 0)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="rgb(9, 38, 53)"
        secondColor="rgb(3, 6, 55)"
        thirdColor="rgb(60, 7, 83)"
        fourthColor="rgb(114, 4, 85)"
        fifthColor="rgb(145, 10, 103)"
      >
        <Contact />
        <Title />
        <Poste />
        {/* <NavOpt/> */}
        <BaseNav />
      </BackgroundGradientAnimation>
      <section
        id="Profil"
        className="bg-gradient-to-b from-black flex flex-col items-center gap-8 py-16"
      >
        <h1 className="text-5xl md:text-8xl font-semibold z-50 text-center">
          Profil & Compétences
        </h1>
        <Profil />
      </section>
      <section
        id="Parcours"
        className="flex min-h-screen flex-col items-center justify-between "
      >
        <h1 className=" text-5xl md:text-8xl font-semibold z-50 text-center">
          Parcours Professionnel
        </h1>
        <Parcours />
      </section>
      <section
        id="Formation"
        className="flex flex-col items-center gap-8 py-16"
      >
        <h1 className="text-5xl md:text-8xl font-semibold z-50 text-center">
          Formation
        </h1>
        <Formation />
      </section>
      <section
        id="Portofolio"
        className="flex min-h-screen flex-col items-center "
      >
        <h1 className="mb-3 text-5xl md:text-9xl font-semibold">Portofolio</h1>
        <Portofolio />
      </section>
    </main>
  );
}
