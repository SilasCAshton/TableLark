"use client";

import { useState } from "react";

import NearbyRestaurantSearch from "./NearbyRestaurantSearch";

function RestaurantDiscoveryPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("search");

  return (
    <aside
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
