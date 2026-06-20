import Link from "next/link";

const heroStaticCells = Array.from({ length: 5200 }, (_, index) => index);

const letterPatterns: Record<string, string[]> = {
  c: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  h: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  a: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  o: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  t: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  e: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
};

const footerWordPattern = Array.from({ length: 7 }, (_, row) =>
  "chayote"
    .split("")
    .flatMap((letter, letterIndex) => [
      ...letterPatterns[letter][row],
      ...(letterIndex === 6 ? [] : ["0"]),
    ]),
);

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="brand-mark" href="/" aria-label="Chayote home">
          Chayote
        </Link>
        <Link className="nav-demo-link" href="/book-demo">
          Book Demo
        </Link>
      </nav>

      <section className="hero-section">
        <div className="hero-static-grid" aria-hidden="true">
          {heroStaticCells.map((cell) => (
            <span className="grid-cell" key={cell} />
          ))}
        </div>

        <div className="hero-content">
          <p className="hero-kicker">Technical assessment infrastructure</p>
          <h1>Structured signal for engineering judgment.</h1>
          <p className="hero-copy">
            Chayote helps teams evaluate debugging, architecture, code
            comprehension, and technical communication through focused,
            voice-led assessments.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/book-demo">
              Book Demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-word-grid" aria-label="chayote">
          {footerWordPattern.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) => (
              <span
                className={
                  cell === "1"
                    ? "footer-word-cell is-filled"
                    : "footer-word-cell"
                }
                key={`${rowIndex}-${cellIndex}`}
              />
            )),
          )}
        </div>
      </footer>
    </main>
  );
}
