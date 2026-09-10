import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function createPublicSlug() {
  return randomBytes(16).toString("base64url");
}

export function createPrivateToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatchesHash(token, expectedHash) {
  const actualHash = hashToken(token);

  if (!actualHash || typeof expectedHash !== "string") {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actualHash, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}

export function isValidPollSlug(slug) {
  return (
    typeof slug === "string" &&
    /^[A-Za-z0-9_-]{20,32}$/.test(slug)
  );
}
