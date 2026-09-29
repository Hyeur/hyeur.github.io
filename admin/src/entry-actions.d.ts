import type { Entry } from "./content";

export function canDeleteEntry(entry: Pick<Entry, "status" | "publishRequest">): boolean;
