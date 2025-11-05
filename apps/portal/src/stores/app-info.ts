import { atom } from "jotai";

export interface AppInfo {
  name: string;
  version: string;
  logo?: string;
  primaryColor?: string;
  firstUserAccess?: boolean;
}

export const appInfoAtom = atom<AppInfo | null>(null);
export const isLoadingAppInfoAtom = atom<boolean>(true);

export const setAppInfoAtom = atom(null, (_get, set, appInfo: AppInfo) => {
  set(appInfoAtom, appInfo);
  set(isLoadingAppInfoAtom, false);
});
