import Image from "next/image";
import Link from "next/link";
import React, { ReactNode } from "react";

export const PYDemo: React.FC<{
  children: ReactNode;
  title: string;
  image: string;
  href: string;
  desc: string;
}> = ({ children, title, image, href, desc }) => {
  return (
    <div className="PYBox grid grid-rows-3  border-neutral-800 w-auto rounded-xl border   m-5 max-w-sm  overflow-hidden shadow-lg  ">
      <Link href={href} className="row-span-3">
        <Image
          unoptimized
          src={image}
          width={800}
          height={200}
          alt="hackdiv Image"
          className="col-span-1 w-full h-48 object-cover"
        />
      </Link>

      <div className="row-span-3 px-6 py-4 ">
        <h1 className="text-xl font-bold mb-2 ">{title}</h1>
        <div className="text-base font-semibold">{desc}</div>
      </div>

      <Link href={href} className="flex justify-center">
        <button className="bg-gradient-to-tr w-44 from-pink-500 to-yellow-500 text-white shadow-lg rounded-full ">
          Accéder à la Démo
        </button>
      </Link>

      <div className="px-6 pt-4 pb-2 flex justify-center">{children}</div>
    </div>
  );
};

export default PYDemo;
