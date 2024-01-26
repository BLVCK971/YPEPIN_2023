import React, { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export const Li: React.FC<{ icon: IconProp; children: ReactNode }> = ({
  icon,
  children,
}) => {
  return (
    <li className="py-1">
      <span className="fa-li">
        <FontAwesomeIcon icon={icon} />
      </span>
      {children}
    </li>
  );
};

export default Li;
