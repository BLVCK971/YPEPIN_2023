import Demo, { IDemo } from "./UI/Demo";
import { useLang, useT } from "../../i18n";

// Anciennes démos (UI et jeux Python), rangées dans une rubrique repliée.
// desc : [français, anglais]
const DEMOS: (Omit<IDemo, "desc"> & { desc: [string, string] })[] = [
  { title: "Tictactoe vs IA", image: "/portofolio/ttt.webp", href: "/py/aittt/index.html", desc: ["Contre une IA basée sur l'algorithme MinMax", "Against an AI based on the MinMax algorithm"], technos: ["Python", "MinMax", "Pygame"] },
  { title: "Dino Google", image: "/portofolio/Dino.webp", href: "/py/dino/index.html", desc: ["Réplique du mini-jeu Dinosaure de Google", "Replica of Google's Dinosaur mini-game"], technos: ["Python", "Pygame"] },
  { title: "HackDiv", image: "/portofolio/hackdiv.webp", href: "/Web/HackDiv/index.html", desc: ["Effet Hacking plein écran", "Full-screen hacking effect"], technos: ["CSS", "JS"] },
  { title: "Animation Prix CSS", image: "/portofolio/pricing.webp", href: "/Web/PricingPureCSS/index.html", desc: ["Carte de prix avec effet 3D", "Pricing card with a 3D effect"], technos: ["CSS"] },
  { title: "Duo", image: "/portofolio/Duo.webp", href: "/Web/Duo/index.html", desc: ["Effet visuel d'un élément Three.js", "Visual effect of a Three.js element"], technos: ["CSS", "JS"] },
  { title: "Glassmorphism Login Form", image: "/portofolio/glassmorphism.webp", href: "/Web/Glassmorphism Login Form/index.html", desc: ["Effet glassmorphisme avec blocs volants", "Glassmorphism effect with floating blocks"], technos: ["CSS"] },
  { title: "Split 3D Carousel", image: "/portofolio/split.webp", href: "/Web/Split3D Carousel/index.html", desc: ["Carrousel 3D dont les images se coupent", "3D carousel with split images"], technos: ["CSS", "JS"] },
  { title: "Universe", image: "/portofolio/Universe.webp", href: "/Web/Universe/index.html", desc: ["Effet 3D d'étoiles et d'accélération", "3D stars and acceleration effect"], technos: ["JS", "Three.js"] },
  { title: "Gravity Points", image: "/portofolio/gravity.webp", href: "/Web/Gravity Points/index.html", desc: ["Interaction avec des points de gravité", "Interaction with gravity points"], technos: ["JS", "dat.gui"] },
  { title: "Paw Clap Button", image: "/portofolio/paw.webp", href: "/Web/PawClapButton/index.html", desc: ["Animation de bouton « j'aime »", "Animated “like” button"], technos: ["JS", "Sass"] },
  { title: "3ImgTransition", image: "/portofolio/transition.webp", href: "/Web/3ImgTransition/index.html", desc: ["Transition 3D contrôlable entre 2 images", "Controllable 3D transition between 2 images"], technos: ["JS", "Three.js"] },
];

export default function Experimentations() {
  const lang = useLang();
  const t = useT();
  return (
    <details className="group w-full">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/15">
        <span className="group-open:hidden">{t("Voir les expérimentations UI & jeux", "View UI & game experiments")} ({DEMOS.length})</span>
        <span className="hidden group-open:inline">{t("Masquer les expérimentations", "Hide experiments")}</span>
        <span className="inline-block transition-transform duration-300 group-open:rotate-90">›</span>
      </summary>
      <div className="mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMOS.map((d) => (
          <Demo key={d.title} {...d} desc={d.desc[lang === "en" ? 1 : 0]} />
        ))}
      </div>
    </details>
  );
}
