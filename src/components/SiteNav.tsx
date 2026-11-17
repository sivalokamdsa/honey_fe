import { NavLink } from "react-router-dom";
import "./SiteNav.css";

export type SectionLink = { id: string; label: string };

type Props = {
  sections?: SectionLink[];
};

function scrollToSection(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

export default function SiteNav({ sections = [] }: Props) {
  return (
    <nav className="site-nav" aria-label="Main">
      <div className="site-nav-inner">
        <NavLink to="/">హోమ్ · Home</NavLink>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} onClick={scrollToSection(s.id)}>
            {s.label}
          </a>
        ))}
        <NavLink to="/register" className="nav-register">
          నమోదు · Register
        </NavLink>
      </div>
    </nav>
  );
}
