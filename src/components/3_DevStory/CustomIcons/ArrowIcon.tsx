import React from "react";

export const ArrowIcon: React.FC<{
  fill?: string;
  size?: number;
  height?: number;
  width?: number;
}> = ({ fill = 'black', size = 24, height = 24, width = 24 }) => {
  return (
    <svg
      width={size || width || 24}
      height={size || height || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300 hover:scale-110"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
};

export default ArrowIcon;
