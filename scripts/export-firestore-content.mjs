import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRY_TYPES, frontMatterValue, toDate, validateEntry } from "./content-schema.mjs";
import { createReleaseManifest, selectPublishedEntries } from "./release-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const managedRoot = path.join(root, "content");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "sounddesignportfolio";
if (process.env.FIRESTORE_EMULATOR_HOST) initializeApp({ projectId });
else initializeApp({ credential: applicationDefault(), projectId });
const snapshot = await getFirestore().collection("entries").get();
const allEntries = snapshot.docs.map((doc) => {
  return { ...validateEntry(doc.data(), doc.id), id: doc.id };
});
const entries = selectPublishedEntries(allEntries);
const exportedSlugs = new Set();
for (const entry of entries) {
  const key = `${entry.type}/${entry.slug}`;
  if (exportedSlugs.has(key)) throw new Error(`Duplicate published entry slug: ${key}`);
  exportedSlugs.add(key);
  const section = ENTRY_TYPES[entry.type];
  try {
    if ((await readdir(path.join(managedRoot, section))).includes(entry.slug)) throw new Error(`Published entry ${key} collides with an existing Hugo content bundle.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
function page(entry, lang, section) {
  const values = { title: entry[lang].title, description: entry[lang].summary || "", date: entry.date ? new Date(entry.date).toISOString() : toDate(entry.updatedAt).toISOString(), lastmod: toDate(entry.updatedAt).toISOString(), url: lang === "en" ? `/${section}/${entry.slug}/` : `/vi/${section}/${entry.slug}/`, slug: entry.slug, type: section, draft: false, tags: entry.tags || [], weight: entry.sortOrder, featureimage: entry.featureimage, externalUrl: entry.externalUrl, medium: entry.medium, year: entry.year, role: entry.role, category: entry.category, youtubeUrl: entry.youtubeUrl, soundcloudUrl: entry.soundcloudUrl };
  const lines = ["---"];
  for (const [key, value] of Object.entries(values)) { const serialized = frontMatterValue(value); if (serialized !== undefined) lines.push(`${key}: ${serialized}`); }
  const body = [entry[lang].body];
  if (entry.youtubeUrl) body.push(`{{< youtube src=${JSON.stringify(entry.youtubeUrl)} title=${JSON.stringify(entry[lang].title)} >}}`);
  if (entry.soundcloudUrl) body.push(`{{< soundcloud src=${JSON.stringify(entry.soundcloudUrl)} title=${JSON.stringify(entry[lang].title)} >}}`);
  return [...lines, "---", "", ...body, ""].join("\n");
}
const outputs = [];
for (const entry of entries) for (const lang of ["en", "vi"]) {
  const section = ENTRY_TYPES[entry.type];
  outputs.push({ folder: path.join(managedRoot, section, "cms"), filename: `${entry.slug}.${lang}.md`, data: page(entry, lang, section) });
}
// Only write within exporter-owned folders, after validating the complete Firestore snapshot.
const folders = new Set(Object.values(ENTRY_TYPES).map((section) => path.join(managedRoot, section, "cms")));
for (const folder of folders) await mkdir(folder, { recursive: true });
for (const folder of folders) {
  const desired = new Set(outputs.filter((item) => item.folder === folder).map((item) => item.filename));
  for (const filename of await readdir(folder)) if (/^[a-z0-9-]+\.(en|vi)\.md$/.test(filename) && !desired.has(filename)) await rm(path.join(folder, filename));
}
for (const item of outputs) await writeFile(path.join(item.folder, item.filename), item.data, "utf8");
const manifestPath = process.env.PUBLISH_MANIFEST_PATH || path.join(root, ".publish-manifest.json");
const manifest = createReleaseManifest({
  commitSha: process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  entries,
  files: outputs.map((item) => ({ path: path.relative(root, path.join(item.folder, item.filename)), content: item.data })),
});
await mkdir(path.dirname(path.resolve(manifestPath)), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Exported ${entries.length} published entries (${outputs.length} language pages) from ${projectId}.`);
