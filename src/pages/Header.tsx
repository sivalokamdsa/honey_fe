import "./Header.css";

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <header className="hero" id="top">
        <div className="hero-inner">
          {/* <div id="logo">
            <img src="../../logo.png" alt="" />
          </div> */}
          <h1>తేనె</h1>
          {children}
        </div>
      </header>
    </>
  );
}
