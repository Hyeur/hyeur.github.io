/** @param {{ status: string, publishRequest?: { status?: string } }} entry */
export function canDeleteEntry(entry) {
  const pendingUnpublish = entry.publishRequest?.action === "unpublish" && entry.publishRequest.status !== "succeeded";
  return entry.status === "draft" && entry.publishRequest?.status !== "queued" && !pendingUnpublish;
}
