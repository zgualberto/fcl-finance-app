export interface EssentialLinkChild {
  title: string;
  routeName: string;
  icon?: string;
}

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  routeName?: string;
  icon?: string;
  children?: EssentialLinkChild[];
}
