import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function HackDiv() {
  return (
    <div className="UIBox   grid grid-rows-3  border-neutral-800 w-auto rounded-xl border   m-5 max-w-sm  overflow-hidden shadow-lg  ">
      <Link href={"/Web/HackDiv/index.html"} className="row-span-3">
        <Image
          unoptimized
          src="/hackdiv.png"
          width={800}
          height={200}
          alt="hackdiv Image"
          className="col-span-1 w-full h-48 object-cover"
        />
      </Link>

      <div className="row-span-3 px-6 py-4 ">
        <h1 className="text-xl font-bold mb-2 ">HackDiv</h1>
        <div className="text-base font-semibold">
          Effet Hacking plein écran
        </div>
      </div>

      
      <Link href={"/Web/HackDiv/index.html"} className="flex justify-center">
      <button className="bg-gradient-to-tr w-44 from-pink-500 to-yellow-500 text-white shadow-lg rounded-full ">
        Accéder à la Démo
      </button></Link>

      <div className="px-6 pt-4 pb-2 flex justify-center">
        <span className="inline-block bg-blue-400 rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2">
          #css
        </span>
        <span className="inline-block bg-yellow-400 rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2">
          #js
        </span>
      </div>
    </div>
  );
}
