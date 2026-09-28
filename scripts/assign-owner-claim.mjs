import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.env.OWNER_UID;
if (!uid) throw new Error("Set OWNER_UID to your Firebase Authentication user UID. No claim was changed.");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "sounddesignportfolio";
initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(`Granted admin claim to ${user.uid} (${user.email || "no email"}) in ${projectId}; sign out and back in to refresh the token.`);
