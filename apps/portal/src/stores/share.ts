import { atom } from "jotai";

export interface ShareFile {
  id: string;
  name: string;
  extension: string;
  size: number;
  objectName: string;
}

export interface ShareFolder {
  id: string;
  name: string;
  objectName: string;
}

export interface Share {
  id: string;
  alias: string;
  name?: string;
  description?: string;
  expiresAt?: string;
  maxDownloads?: number;
  currentDownloads: number;
  password?: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  files?: ShareFile[];
  folders?: ShareFolder[];
}

// Share state atoms
export const currentShareAtom = atom<Share | null>(null);
export const sharePasswordAtom = atom<string>("");
export const isShareLoadingAtom = atom<boolean>(false);

// Clear share data
export const clearShareAtom = atom(null, (_get, set) => {
  set(currentShareAtom, null);
  set(sharePasswordAtom, "");
  set(isShareLoadingAtom, false);
});
