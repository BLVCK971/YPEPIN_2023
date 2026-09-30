import React, { ReactNode } from "react";

export const Ul: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <ul className="fa-ul">{children}</ul>;
};

export default Ul;
