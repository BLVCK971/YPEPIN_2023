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
import { useT } from "../i18n";

const section = "flex flex-col items-center py-20 md:py-28";

export default function Main() {
  const t = useT();
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
          aria-label={t("Découvrir le profil", "Discover the profile")}
        >
          ↓
        </a>
      </header>
      <main>
        <section id="Profil" className={section}>
          <SectionTitle etiquette={t("Profil", "Profile")} titre={t("Compétences & stack", "Skills & stack")} />
          <Profil />
        </section>
        <section id="Parcours" className={section}>
          <SectionTitle etiquette={t("Parcours", "Experience")} titre={t("Expériences professionnelles", "Professional experience")} />
          <Parcours />
          <CarteCollaborations />
        </section>
        <section id="Formation" className={section}>
          <SectionTitle etiquette={t("Formation", "Education")} titre={t("Diplômes, certifications & concours", "Degrees, certifications & competitions")} />
          <Formation />
        </section>
        <section id="Projets" className={section}>
          <SectionTitle etiquette={t("Projets", "Projects")} titre={t("Projets phares", "Featured projects")} />
          <Projets />
        </section>
        <section id="Services" className={section}>
          <SectionTitle etiquette="Services · ICEKERA" titre={t("Ce que je peux faire pour vous", "What I can do for you")} />
          <Services />
        </section>
      </main>
      <ContactSection />
    </>
  );
}
