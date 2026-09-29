import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";

export type EntryType = "blog"|"portfolio"|"project"|"credit";
export type Entry = { id?:string; type:EntryType; status:"draft"|"published"; slug:string; revision?:number; date?:string; sortOrder?:number; featureimage?:string; externalUrl?:string; medium?:string; year?:number; role?:string; category?:string; tags:string[]; youtubeUrl?:string; soundcloudUrl?:string; en:{title:string;summary:string;body:string}; vi:{title:string;summary:string;body:string}; updatedAt?:unknown; publishedContent?:Record<string,unknown>; publishRequest?:{status:"queued"|"succeeded"|"failed";action?:"publish"|"unpublish";revision?:number;deployedRevision?:number;requestId?:string;requestedAt?:{toMillis?:()=>number};error?:string;runUrl?:string} };
const isDateOnly=(value?:string)=>{if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value);return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value};
export const emptyEntry = ():Entry => ({ type:"portfolio",status:"draft",slug:"",tags:[],en:{title:"",summary:"",body:""},vi:{title:"",summary:"",body:""} });
export function validate(entry:Entry) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) throw Error("Use a lowercase, hyphenated slug.");
  for (const lang of ["en","vi"] as const) if (!entry[lang].title.trim() || !entry[lang].body.trim()) throw Error(`Add a ${lang.toUpperCase()} title and body.`);
  if (["portfolio","project"].includes(entry.type) && !Number.isInteger(entry.year)) throw Error("Enter a valid year.");
  if (entry.type === "blog" && !isDateOnly(entry.date)) throw Error("Choose a valid publication date.");
  if (entry.sortOrder !== undefined && !Number.isInteger(entry.sortOrder)) throw Error("Sort order must be an integer.");
  if (entry.type === "credit" && !entry.role?.trim()) throw Error("Enter the credit role.");
  if (entry.featureimage) { const path=entry.featureimage; const local=path.startsWith("/")&&!path.startsWith("//")&&!path.split("/").includes(".."); let remote=false; try{remote=new URL(path).protocol==="https:"}catch{} if(!local&&!remote)throw Error("Featured image must be a local site path or HTTPS URL."); }
  if (entry.externalUrl) { try { if (new URL(entry.externalUrl).protocol !== "https:") throw Error(); } catch { throw Error("External link must be a valid HTTPS URL."); } }
  for (const [key, hosts] of [["youtubeUrl",["youtube.com","www.youtube.com","youtu.be"]],["soundcloudUrl",["soundcloud.com","www.soundcloud.com"]]] as const) {
    const value = entry[key]; if (!value) continue;
    try { const url = new URL(value); if (url.protocol !== "https:" || !hosts.includes(url.hostname as never)) throw Error(); } catch { throw Error(`Enter a valid HTTPS ${key === "youtubeUrl" ? "YouTube" : "SoundCloud"} URL.`); }
  }
}
export async function listEntries(type?:string,status?:string) { const result=await getDocs(query(collection(db,"entries"))); return result.docs.map(d=>({id:d.id,...d.data()} as Entry)).filter(entry=>(!type||entry.type===type)&&(!status||entry.status===status)).sort((a,b)=>((b.updatedAt as {seconds?:number}|undefined)?.seconds||0)-((a.updatedAt as {seconds?:number}|undefined)?.seconds||0)); }
export async function getEntry(id:string) { const snapshot=await getDoc(doc(db,"entries",id)); if(!snapshot.exists()) throw Error("Entry not found."); return {id:snapshot.id,...snapshot.data()} as Entry; }
export async function saveEntry(entry:Entry) { validate(entry); const {id,...data}=entry; const payload={...data,revision:id?increment(1):1,updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})}; for(const key of ["date","featureimage","externalUrl","medium","year","sortOrder","role","category","youtubeUrl","soundcloudUrl"] as const)if(payload[key]==="")delete payload[key]; if(id) await updateDoc(doc(db,"entries",id),payload); else await addDoc(collection(db,"entries"),payload); }
export async function removeEntry(id:string) { await deleteDoc(doc(db,"entries",id)); }
export async function requestPublish(entryId:string,action:"publish"|"unpublish") { return httpsCallable(functions,"requestPublish")({entryId,action}); }
