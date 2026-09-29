import type { Entry } from "./content";

export function canDeleteEntry(entry: Pick<Entry, "status">): boolean;
export function deleteHelpText(entry: Pick<Entry, "status">): string;
