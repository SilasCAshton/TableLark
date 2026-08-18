import Link from "next/link";
import LocationControls from "./LocationControls";
function TopActionBar() {
  return (
    <header className="top-action-bar">
      <Link className="topbar-brand" href="/" aria-label="TableLark home">
        <span className="topbar-logo" aria-hidden="true">
          TL
        </span>

        <span className="topbar-name">TableLark</span>
      </Link>

      <LocationControls />
    </header>
  );
}

export default TopActionBar;
