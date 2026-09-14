import Link from "next/link";
import "./styles.css";

export default function PollsLayout({ children }) {
  return (
    <div className="poll-route">
      {children}
      <nav className="poll-finder-navigation" aria-label="Finder navigation">
        <Link href="/finder" className="poll-finder-navigation__button">
          Return to Search
        </Link>
      </nav>
    </div>
  );
}
