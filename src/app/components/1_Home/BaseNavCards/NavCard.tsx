import Link from "next/link";
import React, { ReactNode } from "react";

export const NavCard: React.FC<{
  children: ReactNode;
  title: string;
  video: string;
  href: string;
}> = ({children, title, video, href}) => {
  return (
    <Link
      href={href}
      className="group  relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden"
      rel="noopener noreferrer"
    >
      <video
        autoPlay
        muted
        loop
        className="video hidden group-hover:block -z-10 absolute object-cover w-full h-full brightness-50"
      >
        <source src={video} type="video/mp4" />
      </video>
      <div className=" px-5 py-4 justify-items-center">
        <h2 className={`mb-3 text-xl font-semibold`}>
        {title}{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          -&gt;
          </span>
        </h2>
        <p className={`m-0 max-w-[30ch] text-sm`}>
        {children}
        </p>
      </div>
    </Link>
  );
};

export default NavCard;
