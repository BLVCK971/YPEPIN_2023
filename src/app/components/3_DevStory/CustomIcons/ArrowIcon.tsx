import React from "react";

export const ArrowIcon: React.FC<{
  fill : string ;
  filled : string ;
  size : number;
  height : number;
  width : number;
  label : string;
  children: React.ReactNode
}> = ({fill = 'black', filled, size, height, width, label, children }) => {
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
