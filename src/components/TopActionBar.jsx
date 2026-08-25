import Link from "next/link";
import Image from "next/image";
import LocationControls from "./LocationControls";
function TopActionBar() {
  return (
    <header className="top-action-bar">
      <Link className="topbar-brand" href="/" aria-label="TableLark home">
        <Image
          className="topbar-logo"
          src="/tablelark-logo-classic.png"
          alt=""
          width={48}
          height={48}
          priority
        />

        <span className="topbar-name">TableLark</span>
      </Link>

      <LocationControls />
    </header>
  );
}

export default TopActionBar;
