import { Children, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from '@fortawesome/fontawesome-svg-core'




export default function Ul(children: ReactNode) {
    return (

<ul className="fa-ul">
{children}
</ul>
  );
}


export function Li(icon : IconProp, children: ReactNode ) {
    return (
<li className="py-1">
  <span className="fa-li">
    <FontAwesomeIcon icon={icon as IconProp} />
  </span>
{children}
</li>
  );
}
