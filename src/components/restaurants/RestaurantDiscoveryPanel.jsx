"use client";

import { useRef, useState } from "react";

import { useAnimatedHeight } from "@/hooks/useAnimatedHeight";
import NearbyRestaurantSearch from "./NearbyRestaurantSearch";

function RestaurantDiscoveryPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("search");
  const sidebarRef = useRef(null);
  useAnimatedHeight(sidebarRef);

  return (
    <aside
      ref={sidebarRef}
      className={`restaurant-sidebar ${
        isCollapsed ? "restaurant-sidebar--collapsed" : ""
      } ${
        activeMobileTab === "search"
          ? "restaurant-sidebar--search-tab"
          : ""
      }`}
      aria-label="Restaurant search and results"
    >
      <NearbyRestaurantSearch
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((isOpen) => !isOpen)}
        activeMobileTab={activeMobileTab}
        onMobileTabChange={setActiveMobileTab}
      />
    </aside>
  );
}

export default RestaurantDiscoveryPanel;
