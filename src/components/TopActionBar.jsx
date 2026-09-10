"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LocationControls from "./LocationControls";
import PollMenu from "./polls/PollMenu";

function TopActionBar() {
  const [openMenu, setOpenMenu] = useState(null);
  const actionBarRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      const actionBar = actionBarRef.current;

      if (
        actionBar &&
        event.target instanceof Node &&
        !actionBar.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function toggleMenu(menuName) {
    setOpenMenu((currentMenu) =>
      currentMenu === menuName ? null : menuName,
    );
  }

  function handleBlur(event) {
    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement instanceof Node &&
      !event.currentTarget.contains(nextFocusedElement)
    ) {
      setOpenMenu(null);
    }
  }

  function handleKeyDown(event) {
    if (event.key !== "Escape" || !openMenu) {
      return;
    }

    const menuToFocus = openMenu;

    setOpenMenu(null);
    actionBarRef.current
      ?.querySelector(`[data-menu-trigger="${menuToFocus}"]`)
      ?.focus();
  }

  return (
    <header
      ref={actionBarRef}
      className={`top-action-bar${openMenu === "poll" ? " top-action-bar--poll-open" : ""}`}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
        <button
          type="button"
          className="poll-menu-backdrop"
          aria-label="Close Group Favorite menu"
          aria-hidden={openMenu !== "poll"}
          tabIndex={-1}
          onClick={() => {
            setOpenMenu(null);
            actionBarRef.current?.querySelector('[data-menu-trigger="poll"]')?.focus();
          }}
        />
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

      <div className="topbar-actions">
        <LocationControls
          isOpen={openMenu === "location"}
          onToggle={() => toggleMenu("location")}
          onRequestClose={() => setOpenMenu(null)}
        />
        <PollMenu
          isOpen={openMenu === "poll"}
          onToggle={() => toggleMenu("poll")}
        />
      </div>
    </header>
  );
}

export default TopActionBar;
