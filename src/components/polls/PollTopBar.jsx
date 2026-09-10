import Image from "next/image";
import Link from "next/link";

export default function PollTopBar({ onShare, copied }) {
  return (
    <header className="poll-topbar">
      <div className="poll-topbar__inner">
        <div className="poll-topbar__identity">
          <Link href="/" className="poll-page__home" aria-label="TableLark home">
            <Image className="poll-page__logo" src="/tablelark-logo-classic.png" alt="" width={48} height={48} priority />
            <span className="poll-page__name">TableLark</span>
          </Link>
          <span className="poll-topbar__section">Group Favorite</span>
        </div>
        <nav className="poll-topbar__actions" aria-label="Poll navigation">
          {onShare ? (
            <button type="button" onClick={onShare}>{copied ? "Link copied" : "Copy invite link"}</button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
