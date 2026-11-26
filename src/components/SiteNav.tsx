import { useState, type MouseEvent } from "react";
import { NavLink } from "react-router-dom";
import "./SiteNav.css";

export type SectionLink = { id: string; label: string };

type Props = {
  sections?: SectionLink[];
};

function scrollToSection(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

export default function SiteNav({ sections = [] }: Props) {
  // Phones only: the links sit in a panel behind the ☰ button.
  const [open, setOpen] = useState(false);

  // Close the phone panel once a link is chosen.
  function closeOnLinkClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <nav className="site-nav" aria-label="Main">
      <div className="site-nav-inner">
        <NavLink to="/">హోమ్ · Home</NavLink>
        <NavLink to="/intro">Index</NavLink>
        <NavLink to="/checkout">Checkout</NavLink>
        <NavLink to="/register">నమోదు · Register</NavLink>
        <NavLink to="/login">లాగిన్ · Login</NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          ☰ మెనూ · Menu
        </button>

        <div
          id="site-nav-links"
          className={`nav-links${open ? " is-open" : ""}`}
          onClick={closeOnLinkClick}
        >
          {/* Opens on hover (CSS :hover) and on keyboard focus (:focus-within). */}
          {sections.length > 0 && (
            <div className="nav-menu">
              <button type="button" className="nav-menu-trigger">
                విషయసూచిక · Contents ▾
              </button>
              <div className="nav-submenu">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={scrollToSection(s.id)}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="nav-menu">
            <button type="button" className="nav-menu-trigger">
              తేనెటీగల పెంపకం ▾
            </button>
            <div className="nav-submenu">
              <NavLink to="/beekeeping">తేనెటీగల పెంపకం1</NavLink>
              <NavLink to="/beekeeping2">తేనెటీగల పెంపకం2</NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
