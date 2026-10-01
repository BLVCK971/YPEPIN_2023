import React, { ReactNode, useRef } from "react";

export const NavCard: React.FC<{
  children: ReactNode;
  title: string;
  video: string;
  href: string;
}> = ({children, title, video, href}) => {
  // La vidéo n'est téléchargée qu'au premier survol (preload="none"),
  // et seulement sur les appareils qui ont un vrai survol (pas sur mobile).
  const videoRef = useRef<HTMLVideoElement>(null);
  const play = () => {
    videoRef.current?.play().catch(() => {});
  };
  const pause = () => videoRef.current?.pause();

  return (
    <a
      href={href}
      onMouseEnter={play}
      onMouseLeave={pause}
      className="group  relative box inline-block rounded-lg border border-transparent  transition-colors  hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden z-10"
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="video hidden group-hover:block -z-10 absolute object-cover w-full h-full brightness-50"
      >
        <source src={video} type="video/mp4" />
      </video>
      <div className=" px-5 py-4 justify-items-center">
        <div className={`mb-3 text-xl font-semibold`}>
        {title}{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          -&gt;
          </span>
        </div>
        <p className={`m-0 max-w-[30ch] text-sm`}>
        {children}
        </p>
      </div>
    </a>
  );
};

export default NavCard;
