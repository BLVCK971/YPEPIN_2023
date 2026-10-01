import Contact from "./1_Home/Contact";
import Title from "./1_Home/Title";
import Poste from "./1_Home/Poste";
import BaseNav from "./1_Home/BaseNav";
import CvButtons from "./1_Home/CvButtons";
import Parcours from "./3_DevStory/Parcours";
import Portfolio from "./4_Portofolio/Portofolio";
import Profil from "./5_Profil/Profil";
import Formation from "./6_Formation/Formation";
import ContactSection from "./7_Contact/ContactSection";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

const sectionTitle = "text-5xl md:text-8xl font-semibold z-50 text-center";

export default function Main() {
  return (
    <>
      <BackgroundGradientAnimation />
      <header className="relative flex min-h-screen flex-col items-center justify-between pt-24 p-2 md:p-24">
        <Contact />
        <Title />
        <Poste />
        <CvButtons />
        <BaseNav />
      </header>
      <main>
        <section
          id="Profil"
          className="flex flex-col items-center gap-8 py-16"
        >
          <h2 className={sectionTitle}>Profil & Compétences</h2>
          <Profil />
        </section>
        <section
          id="Parcours"
          className="flex min-h-screen flex-col items-center justify-between "
        >
          <h2 className={sectionTitle}>Parcours Professionnel</h2>
          <Parcours />
        </section>
        <section
          id="Formation"
          className="flex flex-col items-center gap-8 py-16"
        >
          <h2 className={sectionTitle}>Formation</h2>
          <Formation />
        </section>
        <section
          id="Portfolio"
          className="flex min-h-screen flex-col items-center "
        >
          <h2 className="mb-3 text-5xl md:text-9xl font-semibold">Portfolio</h2>
          <Portfolio />
        </section>
      </main>
      <ContactSection />
    </>
  );
}
