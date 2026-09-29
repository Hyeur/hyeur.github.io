function restoreStatusAfterFailure(request, resultStatus = "failed") {
  if (resultStatus !== "failed") return undefined;
  return ["draft", "published"].includes(request?.previousStatus) ? request.previousStatus : undefined;
}

function entryForExport(entry, activeRequestId) {
  if (entry.status !== "published") return undefined;
  const request = entry.publishRequest;
  if (request?.status === "queued" && request.action === "publish" && request.revision === entry.revision) {
    return request.requestId === activeRequestId ? entry : entry.publishedContent;
  }
  return entry.publishedContent || entry;
}

function publishedSnapshot(entry) {
  const { publishRequest, publishedContent, ...content } = entry;
  return { ...content, status: "published" };
}

module.exports = { entryForExport, publishedSnapshot, restoreStatusAfterFailure };
