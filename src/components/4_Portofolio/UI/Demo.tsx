import React from "react";
import { CardBody, CardContainer, CardItem } from "../../ui/3d-card";
import { useT } from "../../../i18n";

export type IDemo = {
  title: string;
  image: string;
  href: string;
  desc: string;
  technos: string[];
};

// Carte d'une démo avec effet 3D au survol
export const Demo: React.FC<IDemo> = ({ title, image, href, desc, technos }) => {
  const t = useT();
  return (
    <CardContainer containerClassName="py-4" className="w-full">
      <CardBody className="relative group/card w-full h-auto rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur-md transition-colors hover:border-white/25">
        <CardItem translateZ="60" className="w-full">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-40 w-full rounded-lg object-cover"
          />
        </CardItem>
        <CardItem translateZ="40" className="w-full px-1 pt-3">
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm text-neutral-400">{desc}</p>
        </CardItem>
        <CardItem translateZ="20" className="flex w-full items-center justify-between gap-2 px-1 pt-3">
          <ul className="flex flex-wrap gap-1.5">
            {technos.map((tech) => (
              <li key={tech} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-neutral-300">
                {tech}
              </li>
            ))}
          </ul>
          <a href={href} className="shrink-0 text-sm font-medium text-cyan-300 hover:text-cyan-200">
            {t("Démo", "Demo")} ↗
          </a>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

export default Demo;
