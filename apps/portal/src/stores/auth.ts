import { atom } from "jotai";
import Cookies from "js-cookie";

// User type (without isAdmin)
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: string | null;
}

// Auth state atoms
export const userAtom = atom<User | null>(null);
export const isAuthenticatedAtom = atom<boolean | null>(null);
export const isAdminAtom = atom<boolean | null>(null);
export const isLoadingAuthAtom = atom<boolean>(true);

// Derived atom for checking if user is logged in
export const isLoggedInAtom = atom((get) => get(isAuthenticatedAtom) === true);

// Logout action atom
export const logoutAtom = atom(null, (_get, set) => {
  set(userAtom, null);
  set(isAuthenticatedAtom, false);
  set(isAdminAtom, false);
  Cookies.remove("token");
});

// Login action atom
export const setAuthDataAtom = atom(
  null,
  (_get, set, { user, isAdmin }: { user: User; isAdmin: boolean }) => {
    set(userAtom, user);
    set(isAuthenticatedAtom, true);
    set(isAdminAtom, isAdmin);
    set(isLoadingAuthAtom, false);
  },
);
