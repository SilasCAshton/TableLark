export const ACTIVE_POLL_STORAGE_KEY = "tablelark.active-poll";

function isPollSlug(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,32}$/.test(value);
}

// This is only a public-link bookmark. Organizer credentials stay in HTTP-only cookies.
export function readActivePoll(storage) {
  try {
    const slug = storage.getItem(ACTIVE_POLL_STORAGE_KEY);
    return isPollSlug(slug) ? slug : null;
  } catch {
    return null;
  }
}

export function rememberActivePoll(storage, slug) {
  if (!isPollSlug(slug)) {
    return false;
  }

  try {
    storage.setItem(ACTIVE_POLL_STORAGE_KEY, slug);
    return true;
  } catch {
    return false;
  }
}

export function pollSharePath(slug) {
  return `/polls/${encodeURIComponent(slug)}`;
}
