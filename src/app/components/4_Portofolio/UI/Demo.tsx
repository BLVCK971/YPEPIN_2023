import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import React, { ReactNode } from "react";
import { CardBody, CardContainer, CardItem } from "../../ui/3d-card";

const technosColor = {
  css: "bg-blue-400",
  js: "bg-yellow-400",
  threejs: "bg-orange-400",
  "dat.gui": "bg-orange-400",
  sass: "bg-rose-400",
  pygame: "bg-yellow-400",
  minmax: "bg-red-400",
};

export const Demo: React.FC<{
  title: string;
  image: StaticImageData;
  href: string;
  desc: string;
  classe : string;
  technos: string[];
}> = ({ title, image, href, desc, classe , technos}) => {
  return (
    <CardContainer className="inter-var   border-neutral-800 w-auto rounded-xl border mx-5 max-w-sm  overflow-hidden shadow-lg">
      <CardBody className={` bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-2 border ${classe}`}>
        <CardItem translateZ="200" className="w-full">
          <Image
            unoptimized
            src={image}
            alt="hackdiv Image"
            height="20"
            width="20"
            className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
          />
        </CardItem>
        <div className="flex flex-col justify-between items-center">
          <CardItem
            translateZ="200"
            className="text-xl font-bold text-neutral-600 dark:text-white px-6 pt-2"
          >
            <h1 className="text-lg font-bold mb-1 ">{title}</h1>
            <div className="text-sm font-semibold">{desc}</div>
          </CardItem>

          <CardItem
            translateZ={20}
            className=" text-xl font-bold px-4 py-2 rounded-xl dark:text-white"
          >
            <Link href={href}>
              <button  className="bg-gradient-to-tr w-44 from-pink-500 to-yellow-500 text-white shadow-lg rounded-full ">
                Accéder à la Démo
              </button>
            </Link>
          </CardItem>

          <CardItem
            translateZ="50"
            className="flex justify-center items-center w-full"
          >
             {technos.map((tech) => {
          return (
            <span
              key={tech}
              className={`inline-block ${technosColor[tech]} rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2`}
            >
              #{tech}
            </span>
          );
        })}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
};

export default Demo;
