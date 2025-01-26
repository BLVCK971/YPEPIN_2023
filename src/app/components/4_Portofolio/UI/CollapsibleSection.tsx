"use client";
import React, { useState } from "react";
import { ArrowIcon } from "../../3_DevStory/CustomIcons/ArrowIcon";

interface CollapsibleSectionProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  className = "",
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div>
      <div className={`flex items-center justify-between ${className} text-3xl md:text-5xl font-semibold pb-6 pt-8 lg:p-4 p-2 mb-5 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border bg-gray-200`}>
        <h1>{title}</h1>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-white/20 rounded-lg shadow-lg hover:shadow-xl"
          aria-label={isCollapsed ? "Déplier la section" : "Replier la section"}
        >
          <span className="hidden sm:inline whitespace-nowrap">
            {isCollapsed ? "Voir les projets" : "Masquer les projets"}
          </span>
          <div 
            className="transition-transform duration-300" 
            style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
          >
            <ArrowIcon />
          </div>
        </button>
      </div>
      <div 
        className={`transition-all duration-300 origin-top ${
          isCollapsed 
            ? 'grid-rows-[0fr] opacity-0 scale-y-0' 
            : 'grid-rows-[1fr] opacity-100 scale-y-100'
        }`}
        style={{ display: 'grid' }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
