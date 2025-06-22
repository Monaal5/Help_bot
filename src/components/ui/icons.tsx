import { Github, Twitter } from "lucide-react";
import React from "react";

type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  gitHub: (props: IconProps) => <Github {...props} />,
  twitter: (props: IconProps) => <Twitter {...props} />,
}; 