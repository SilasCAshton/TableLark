import LocationControls from "./LocationControls.jsx";
function TopActionBar() {
  return (
    <header className="top-action-bar">
      <div className="topbar-brand" aria-label="TableLark home">
        <span className="topbar-logo" aria-hidden="true">
          TL
        </span>

        <span className="topbar-name">TableLark</span>
      </div>

      <LocationControls />
    </header>
  );
}

export default TopActionBar;
