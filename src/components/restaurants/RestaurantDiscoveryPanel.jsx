"use client";

import { useState } from "react";

import NearbyRestaurantSearch from "./NearbyRestaurantSearch";

function RestaurantDiscoveryPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`restaurant-sidebar ${
        isCollapsed ? "restaurant-sidebar--collapsed" : ""
      }`}
      aria-label="Restaurant search and results"
    >
      <NearbyRestaurantSearch
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((isOpen) => !isOpen)}
      />
    </aside>
  );
}

export default RestaurantDiscoveryPanel;
