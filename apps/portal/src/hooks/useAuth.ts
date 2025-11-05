import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  userAtom,
  isAuthenticatedAtom,
  isAdminAtom,
  isLoadingAuthAtom,
  isLoggedInAtom,
  logoutAtom,
  setAuthDataAtom,
} from "@/stores/auth";

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [isAdmin, setIsAdmin] = useAtom(isAdminAtom);
  const isLoadingAuth = useAtomValue(isLoadingAuthAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const logout = useSetAtom(logoutAtom);
  const setAuthData = useSetAtom(setAuthDataAtom);

  return {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isAdmin,
    setIsAdmin,
    isLoadingAuth,
    isLoggedIn,
    logout,
    setAuthData,
  };
}
