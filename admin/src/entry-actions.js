/** @param {{ status: string }} entry */
export function canDeleteEntry(entry) {
  return entry.status === "draft";
}

/** @param {{ status: string }} entry */
export function deleteHelpText(entry) {
  return entry.status === "published"
    ? "Unpublish this entry and wait for a successful GitHub Actions sync before deleting it."
    : "If this draft is still in the live site, wait for a successful GitHub Actions sync before deleting it.";
}
