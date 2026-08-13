import chainRestaurantData from "./chain-restaurants.json" with { type: "json" };

function normalizeRestaurantName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const chainByAlias = new Map(
  chainRestaurantData.chains.flatMap((chain) =>
    chain.aliases.map((alias) => [
      normalizeRestaurantName(alias),
      chain,
    ]),
  ),
);

function getNameCandidates(name) {
  if (typeof name !== "string") {
    return [];
  }

  const candidates = new Set([name]);

  // Google display names sometimes append a branch label or store
  // number. Only strip explicit separators to avoid fuzzy matches
  // against similarly named independent restaurants.
  for (const separator of [" - ", " – ", " — ", " (", " #"]) {
    const separatorIndex = name.indexOf(separator);

    if (separatorIndex > 0) {
      candidates.add(name.slice(0, separatorIndex));
    }
  }

  candidates.add(name.replace(/\s+#?\d+\s*$/, ""));

  return [...candidates]
    .map(normalizeRestaurantName)
    .filter(Boolean);
}

export function findRestaurantChain(name) {
  for (const candidate of getNameCandidates(name)) {
    const chain = chainByAlias.get(candidate);

    if (chain) {
      return chain;
    }
  }

  return null;
}

export function isChainRestaurant(restaurant) {
  return Boolean(findRestaurantChain(restaurant?.name));
}
