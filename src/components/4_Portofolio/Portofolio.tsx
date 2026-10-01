import Demo, { IDemo } from "./UI/Demo";

// Anciennes démos (UI et jeux Python), rangées dans une rubrique repliée.
const DEMOS: IDemo[] = [
  { title: "Tictactoe vs IA", image: "/portofolio/ttt.webp", href: "/py/aittt/index.html", desc: "Contre une IA basée sur l'algorithme MinMax", technos: ["Python", "MinMax", "Pygame"] },
  { title: "Dino Google", image: "/portofolio/Dino.webp", href: "/py/dino/index.html", desc: "Réplique du mini-jeu Dinosaure de Google", technos: ["Python", "Pygame"] },
  { title: "HackDiv", image: "/portofolio/hackdiv.webp", href: "/Web/HackDiv/index.html", desc: "Effet Hacking plein écran", technos: ["CSS", "JS"] },
  { title: "Animation Prix CSS", image: "/portofolio/pricing.webp", href: "/Web/PricingPureCSS/index.html", desc: "Carte de prix avec effet 3D", technos: ["CSS"] },
  { title: "Duo", image: "/portofolio/Duo.webp", href: "/Web/Duo/index.html", desc: "Effet visuel d'un élément Three.js", technos: ["CSS", "JS"] },
  { title: "Glassmorphism Login Form", image: "/portofolio/glassmorphism.webp", href: "/Web/Glassmorphism Login Form/index.html", desc: "Effet glassmorphisme avec blocs volants", technos: ["CSS"] },
  { title: "Split 3D Carousel", image: "/portofolio/split.webp", href: "/Web/Split3D Carousel/index.html", desc: "Carrousel 3D dont les images se coupent", technos: ["CSS", "JS"] },
  { title: "Universe", image: "/portofolio/Universe.webp", href: "/Web/Universe/index.html", desc: "Effet 3D d'étoiles et d'accélération", technos: ["JS", "Three.js"] },
  { title: "Gravity Points", image: "/portofolio/gravity.webp", href: "/Web/Gravity Points/index.html", desc: "Interaction avec des points de gravité", technos: ["JS", "dat.gui"] },
  { title: "Paw Clap Button", image: "/portofolio/paw.webp", href: "/Web/PawClapButton/index.html", desc: "Animation de bouton « j'aime »", technos: ["JS", "Sass"] },
  { title: "3ImgTransition", image: "/portofolio/transition.webp", href: "/Web/3ImgTransition/index.html", desc: "Transition 3D contrôlable entre 2 images", technos: ["JS", "Three.js"] },
];

export default function Experimentations() {
  return (
    <details className="group w-full">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/15">
        <span className="group-open:hidden">Voir les expérimentations UI & jeux ({DEMOS.length})</span>
        <span className="hidden group-open:inline">Masquer les expérimentations</span>
        <span className="inline-block transition-transform duration-300 group-open:rotate-90">›</span>
      </summary>
      <div className="mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMOS.map((d) => (
          <Demo key={d.title} {...d} />
        ))}
      </div>
    </details>
  );
}
