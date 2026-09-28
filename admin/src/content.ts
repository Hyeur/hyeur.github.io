import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";

export type EntryType = "blog"|"portfolio"|"project"|"credit";
export type Entry = { id?:string; type:EntryType; status:"draft"|"published"; slug:string; year?:number; role?:string; category?:string; tags:string[]; youtubeUrl?:string; soundcloudUrl?:string; en:{title:string;summary:string;body:string}; vi:{title:string;summary:string;body:string}; updatedAt?:unknown; publishStatus?:string };
export const emptyEntry = ():Entry => ({ type:"portfolio",status:"draft",slug:"",tags:[],en:{title:"",summary:"",body:""},vi:{title:"",summary:"",body:""} });
export function validate(entry:Entry) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) throw Error("Use a lowercase, hyphenated slug.");
  for (const lang of ["en","vi"] as const) if (!entry[lang].title.trim() || !entry[lang].body.trim()) throw Error(`Add a ${lang.toUpperCase()} title and body.`);
  if (["portfolio","project"].includes(entry.type) && !Number.isInteger(entry.year)) throw Error("Enter a valid year.");
  if (entry.type === "credit" && !entry.role?.trim()) throw Error("Enter the credit role.");
  for (const [key, hosts] of [["youtubeUrl",["youtube.com","www.youtube.com","youtu.be"]],["soundcloudUrl",["soundcloud.com","www.soundcloud.com"]]] as const) {
    const value = entry[key]; if (!value) continue;
    try { const url = new URL(value); if (url.protocol !== "https:" || !hosts.includes(url.hostname as never)) throw Error(); } catch { throw Error(`Enter a valid HTTPS ${key === "youtubeUrl" ? "YouTube" : "SoundCloud"} URL.`); }
  }
}
export async function listEntries(type?:string,status?:string) { const result=await getDocs(query(collection(db,"entries"))); return result.docs.map(d=>({id:d.id,...d.data()} as Entry)).filter(entry=>(!type||entry.type===type)&&(!status||entry.status===status)).sort((a,b)=>((b.updatedAt as {seconds?:number}|undefined)?.seconds||0)-((a.updatedAt as {seconds?:number}|undefined)?.seconds||0)); }
export async function getEntry(id:string) { const snapshot=await getDoc(doc(db,"entries",id)); if(!snapshot.exists()) throw Error("Entry not found."); return {id:snapshot.id,...snapshot.data()} as Entry; }
export async function saveEntry(entry:Entry) { validate(entry); const {id,...data}=entry; const payload={...data,updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})}; if(id) await updateDoc(doc(db,"entries",id),payload); else await addDoc(collection(db,"entries"),payload); }
export async function removeEntry(id:string) { await deleteDoc(doc(db,"entries",id)); }
export async function requestPublish(entryId:string,action:"publish"|"unpublish") { return httpsCallable(functions,"requestPublish")({entryId,action}); }
