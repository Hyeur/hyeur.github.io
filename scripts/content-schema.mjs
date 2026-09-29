export const ENTRY_TYPES = Object.freeze({ blog: "blog", portfolio: "portfolio", project: "projects", credit: "credits" });
const hosts = { youtubeUrl: ["youtube.com", "www.youtube.com", "youtu.be"], soundcloudUrl: ["soundcloud.com", "www.soundcloud.com"] };
const isDateOnly = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function validateEntry(entry, id = "(unknown)") {
  const errors = [];
  const need = (ok, message) => { if (!ok) errors.push(message); };
  need(entry && typeof entry === "object" && !Array.isArray(entry), "must be an object");
  if (!entry || typeof entry !== "object") throw new Error(`Entry ${id}: ${errors.join(", ")}`);
  need(Object.hasOwn(ENTRY_TYPES, entry.type), "type must be blog, portfolio, project, or credit");
  need(["draft", "published"].includes(entry.status), "status must be draft or published");
  need(typeof entry.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), "slug must use lowercase letters, numbers, and hyphens");
  need(Number.isInteger(entry.revision) && entry.revision >= 1, "revision must be a positive integer");
  for (const lang of ["en", "vi"]) {
    need(entry[lang] && typeof entry[lang] === "object", `${lang} content is required`);
    need(typeof entry[lang]?.title === "string" && entry[lang].title.trim(), `${lang}.title is required`);
    need(typeof entry[lang]?.body === "string", `${lang}.body is required`);
  }
  for (const key of Object.keys(hosts)) {
    if (!entry[key]) continue;
    try { const url = new URL(entry[key]); need(url.protocol === "https:" && hosts[key].includes(url.hostname), `${key} must be HTTPS on a supported host`); }
    catch { errors.push(`${key} must be a valid URL`); }
  }
  if (entry.date !== undefined) {
    need(isDateOnly(entry.date), "date must be a valid YYYY-MM-DD date");
  } else if (entry.type === "blog") need(false, "date is required for blog entries");
  if (entry.sortOrder !== undefined) need(Number.isInteger(entry.sortOrder), "sortOrder must be an integer");
  if (entry.featureimage !== undefined) {
    const image = entry.featureimage;
    const localPath = typeof image === "string" && image.startsWith("/") && !image.startsWith("//") && !image.split("/").includes("..");
    let remoteUrl = false;
    try { remoteUrl = new URL(image).protocol === "https:"; } catch { /* local path or invalid */ }
    need(localPath || remoteUrl, "featureimage must be a local site path or HTTPS URL");
  }
  if (entry.externalUrl !== undefined) {
    try { need(new URL(entry.externalUrl).protocol === "https:", "externalUrl must use HTTPS"); }
    catch { errors.push("externalUrl must be a valid HTTPS URL"); }
  }
  if (entry.medium !== undefined) need(typeof entry.medium === "string", "medium must be text");
  for (const key of ["createdAt", "updatedAt"]) {
    try { if (!entry[key]) throw new Error("missing"); toDate(entry[key]); }
    catch { errors.push(`${key} must be a valid date or Firestore timestamp`); }
  }
  for (const lang of ["en", "vi"]) if (entry[lang] && typeof entry[lang] === "object") {
    if (entry[lang].summary !== undefined) need(typeof entry[lang].summary === "string", `${lang}.summary must be text`);
  }
  if (entry.tags !== undefined) need(Array.isArray(entry.tags) && entry.tags.every((tag) => typeof tag === "string"), "tags must be a list of text values");
  if (entry.type === "credit") need(typeof entry.role === "string" && entry.role.trim(), "role is required for credits");
  if (["portfolio", "project"].includes(entry.type)) need(Number.isInteger(entry.year), "year is required for portfolio and project entries");
  if (errors.length) throw new Error(`Entry ${id}: ${errors.join("; ")}`);
  return entry;
}

export function toDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid date");
  return date;
}

export function frontMatterValue(value) {
  if (value === undefined) return undefined;
  return JSON.stringify(value instanceof Date || value?.toDate ? toDate(value).toISOString() : value);
}
