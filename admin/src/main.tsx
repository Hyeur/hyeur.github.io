import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth, db } from "./firebase";
import { emptyEntry, Entry, EntryType, listEntries, removeEntry, saveEntry, setEntryStatus } from "./content";
import { canDeleteEntry, deleteHelpText } from "./entry-actions.js";
import "./styles.css";

const actionsUrl = "https://github.com/Hyeur/hyeur.github.io/actions/workflows/publish-content.yml";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [owner, setOwner] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    try { setOwner(Boolean(nextUser && (await nextUser.getIdTokenResult(true)).claims.admin === true)); }
    catch { setOwner(false); }
    finally { setReady(true); }
  }), []);

  if (!ready) return <p>Loading…</p>;
  return <Routes>
    <Route path="/login" element={!owner ? <Login /> : <Navigate to="/entries" />} />
    <Route path="*" element={owner ? <Shell user={user!} /> : user
      ? <main><p>Access denied. This account is not the site owner.</p><button onClick={() => signOut(auth)}>Sign out</button></main>
      : <Navigate to="/login" />} />
  </Routes>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return <main className="login"><h1>Portfolio editor</h1><form onSubmit={async (event) => {
    event.preventDefault(); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (cause) { setError((cause as Error).message); }
  }}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    <button>Sign in</button>{error && <p role="alert">{error}</p>}</form></main>;
}

function Shell({ user }: { user: User }) {
  return <main><header><h1>Portfolio editor</h1><span>{user.email}</span><button onClick={() => signOut(auth)}>Sign out</button></header>
    <Routes><Route path="/" element={<Navigate to="/entries" />} /><Route path="/entries" element={<Listing />} />
      <Route path="/entries/new" element={<Editor />} /><Route path="/entries/:id" element={<Editor />} /></Routes></main>;
}

function Listing() {
  const [items, setItems] = useState<Entry[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => { listEntries(type, status).then(setItems).catch((error) => alert(error.message)); }, [type, status]);
  return <><nav><select value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option>
    {["blog", "portfolio", "project", "credit"].map((item) => <option key={item}>{item}</option>)}</select>
    <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All states</option><option>draft</option><option>published</option></select>
    <Link className="button" to="/entries/new">New entry</Link></nav>
    <ul className="entries">{items.map((item) => <li key={item.id}><Link to={`/entries/${item.id}`}><strong>{item.en.title || item.slug}</strong><span>{item.type} · {item.status}</span></Link></li>)}</ul></>;
}

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry>(emptyEntry());
  const [message, setMessage] = useState("");
  const loaded = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (!id) return;
    loaded.current = false;
    return onSnapshot(doc(db, "entries", id), (snapshot) => {
      if (!snapshot.exists()) { setMessage("Entry not found."); return; }
      const next = { id: snapshot.id, ...snapshot.data() } as Entry;
      if (!loaded.current || !dirty.current) { setEntry(next); loaded.current = true; }
      else setEntry((current) => ({ ...current, status: next.status, revision: next.revision, updatedAt: next.updatedAt }));
    }, (error) => setMessage(error.message));
  }, [id]);

  const update = (key: keyof Entry, value: unknown) => {
    dirty.current = true;
    setEntry((current) => ({ ...current, [key]: value }));
  };
  const updateLocalized = (lang: "en" | "vi", key: "title" | "summary" | "body", value: string) => {
    dirty.current = true;
    setEntry((current) => ({ ...current, [lang]: { ...current[lang], [key]: value } }));
  };

  async function save() {
    try {
      await saveEntry(entry); dirty.current = false; setMessage("Saved.");
      if (!id) navigate("/entries");
    } catch (error) { setMessage((error as Error).message); }
  }

  async function changePublication() {
    if (!id) return;
    try {
      if (dirty.current) { await saveEntry(entry); dirty.current = false; }
      const status = entry.status === "published" ? "draft" : "published";
      await setEntryStatus(id, status);
      setEntry((current) => ({ ...current, status, revision: Number(current.revision || 0) + 1 }));
      setMessage(`Saved as ${status}. GitHub Actions will sync the site within about 10 minutes.`);
    } catch (error) { setMessage((error as Error).message); }
  }

  async function deleteCurrentEntry() {
    if (!id) return;
    try { await removeEntry(id); navigate("/entries"); }
    catch (error) {
      const cause = error as { code?: string; message: string };
      setMessage(cause.code === "permission-denied"
        ? "This entry is still in the last deployed site. Wait for a successful GitHub Actions sync, then delete it."
        : cause.message);
    }
  }

  return <section><nav><Link to="/entries">← Entries</Link><span role="status">{message}</span></nav>
    <div className="grid"><label>Type<select value={entry.type} onChange={(event) => update("type", event.target.value as EntryType)}>
      {["blog", "portfolio", "project", "credit"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Status<span>{entry.status}</span></label><label>Slug<input value={entry.slug} onChange={(event) => update("slug", event.target.value)} /></label>
      <label>Year<input type="number" value={entry.year ?? ""} onChange={(event) => update("year", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
      <label>Role<input value={entry.role || ""} onChange={(event) => update("role", event.target.value)} /></label>
      <label>Category<input value={entry.category || ""} onChange={(event) => update("category", event.target.value)} /></label>
      <label>Publication date<input type="date" value={entry.date || ""} onChange={(event) => update("date", event.target.value)} /></label>
      <label>Sort order<input type="number" value={entry.sortOrder ?? ""} onChange={(event) => update("sortOrder", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
      <label>Featured image<input value={entry.featureimage || ""} onChange={(event) => update("featureimage", event.target.value)} /></label>
      <label>External link<input value={entry.externalUrl || ""} onChange={(event) => update("externalUrl", event.target.value)} /></label>
      <label>Medium<input value={entry.medium || ""} onChange={(event) => update("medium", event.target.value)} /></label></div>
    {(["en", "vi"] as const).map((lang) => <fieldset key={lang}><legend>{lang.toUpperCase()}</legend>
      <label>Title<input value={entry[lang].title} onChange={(event) => updateLocalized(lang, "title", event.target.value)} /></label>
      <label>Summary<input value={entry[lang].summary} onChange={(event) => updateLocalized(lang, "summary", event.target.value)} /></label>
      <label>Markdown body<textarea rows={10} value={entry[lang].body} onChange={(event) => updateLocalized(lang, "body", event.target.value)} /></label>
      <article className="preview"><h3>{entry[lang].title || "Preview"}</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{entry[lang].body}</ReactMarkdown></article>
    </fieldset>)}
    <div className="grid"><label>YouTube URL<input value={entry.youtubeUrl || ""} onChange={(event) => update("youtubeUrl", event.target.value)} /></label>
      <label>SoundCloud URL<input value={entry.soundcloudUrl || ""} onChange={(event) => update("soundcloudUrl", event.target.value)} /></label>
      <label>Tags (comma-separated)<input value={(entry.tags || []).join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label></div>
    <footer><button disabled={!dirty.current} onClick={save}>Save</button>{id && <>
      <button onClick={changePublication}>{entry.status === "published" ? "Unpublish" : "Publish"}</button>
      <button className="danger" disabled={!canDeleteEntry(entry)} title={deleteHelpText(entry)} onClick={() => {
        if (confirm("Delete this entry? If it was recently unpublished, wait for the next successful site sync.")) void deleteCurrentEntry();
      }}>Delete</button></>}</footer>
    {id && <p>Publishing changes updates the content status in Firestore. GitHub Actions publishes the site on its next scheduled run.
      {" "}<a href={actionsUrl} target="_blank" rel="noreferrer">View publishing workflow</a></p>}
  </section>;
}

createRoot(document.getElementById("root")!).render(<BrowserRouter basename="/admin"><App /></BrowserRouter>);
