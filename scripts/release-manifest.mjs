import { createHash } from "node:crypto";

export function selectPublishedEntries(entries) {
  return entries.filter((entry) => entry?.status === "published");
}

function normalizePath(value) {
  const normalized = String(value).replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`Invalid release file path: ${value}`);
  }
  return normalized;
}

export function createReleaseManifest({ commitSha, entries, files }) {
  const orderedFiles = files.map(({ path, content }) => ({ path: normalizePath(path), content: String(content) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const publishedEntryRevisions = Object.fromEntries(selectPublishedEntries(entries)
    .map((entry) => [entry.id, Number(entry.revision ?? 0)])
    .sort(([a], [b]) => a.localeCompare(b)));
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ commitSha: String(commitSha), files: orderedFiles }), "utf8")
    .digest("hex");
  return { fingerprint, publishedEntryRevisions };
}

export function releaseChanged(manifest, previousFingerprint) {
  return manifest.fingerprint !== previousFingerprint;
}
