const STORAGE_KEY = "tablelark.search-location";
let currentLocation;

function isValidLocation(location) {
  return Number.isFinite(location?.lat) &&
    Number.isFinite(location?.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180;
}

export function saveSearchLocation(location) {
  if (!isValidLocation(location)) return;
  currentLocation = { lat: location.lat, lng: location.lng };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentLocation));
  } catch {
    // Keep navigation working when browser storage is unavailable.
  }
}

export function readSearchLocation() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    if (isValidLocation(stored)) {
      currentLocation = { lat: stored.lat, lng: stored.lng };
    }
  } catch {
    // Use the location held in memory if storage is unavailable.
  }
  return currentLocation;
}
