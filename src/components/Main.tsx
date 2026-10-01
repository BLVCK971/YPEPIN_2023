import NavBar from "./0_Nav/NavBar";
import Title from "./1_Home/Title";
import Poste from "./1_Home/Poste";
import CvButtons from "./1_Home/CvButtons";
import ChiffresCles from "./1_Home/ChiffresCles";
import Parcours from "./3_DevStory/Parcours";
import CarteCollaborations from "./3_DevStory/CarteCollaborations";
import Profil from "./5_Profil/Profil";
import Formation from "./6_Formation/Formation";
import ContactSection from "./7_Contact/ContactSection";
import Projets from "./8_Projets/Projets";
import Services from "./9_Services/Services";
import SectionTitle from "./ui/SectionTitle";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

const section = "flex flex-col items-center py-20 md:py-28";

export default function Main() {
  return (
    <>
      <BackgroundGradientAnimation />
      <NavBar />
      <header id="top" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16">
        <Title />
        <Poste />
        <CvButtons />
        <ChiffresCles />
        <a
          href="#Profil"
          className="mt-12 text-neutral-500 hover:text-white transition-colors motion-safe:animate-bounce"
          aria-label="Découvrir le profil"
        >
          ↓
        </a>
      </header>
      <main>
        <section id="Profil" className={section}>
          <SectionTitle etiquette="Profil" titre="Compétences & stack" />
          <Profil />
        </section>
        <section id="Parcours" className={section}>
          <SectionTitle etiquette="Parcours" titre="Expériences professionnelles" />
          <Parcours />
          <CarteCollaborations />
        </section>
        <section id="Formation" className={section}>
          <SectionTitle etiquette="Formation" titre="Diplômes, certifications & concours" />
          <Formation />
        </section>
        <section id="Projets" className={section}>
          <SectionTitle etiquette="Projets" titre="Projets phares" />
          <Projets />
        </section>
        <section id="Services" className={section}>
          <SectionTitle etiquette="Services · ICEKERA" titre="Ce que je peux faire pour vous" />
          <Services />
        </section>
      </main>
      <ContactSection />
    </>
  );
}
