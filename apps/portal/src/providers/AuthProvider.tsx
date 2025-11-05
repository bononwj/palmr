import { useEffect, ReactNode } from "react";
import { useSetAtom } from "jotai";
import { authApi } from "@/api/endpoints/auth";
import { appApi } from "@/api/endpoints/app";
import {
  setAuthDataAtom,
  userAtom,
  isAuthenticatedAtom,
  isAdminAtom,
  isLoadingAuthAtom,
} from "@/stores/auth";
import { setAppInfoAtom } from "@/stores/app-info";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setAuthData = useSetAtom(setAuthDataAtom);
  const setUser = useSetAtom(userAtom);
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom);
  const setIsAdmin = useSetAtom(isAdminAtom);
  const setIsLoadingAuth = useSetAtom(isLoadingAuthAtom);
  const setAppInfo = useSetAtom(setAppInfoAtom);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Fetch app info first
        const appInfoResponse = await appApi.getAppInfo();
        if (isMounted && appInfoResponse.data) {
          setAppInfo(appInfoResponse.data);

          // If first user access, don't check auth
          if (appInfoResponse.data.firstUserAccess) {
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsLoadingAuth(false);
            return;
          }
        }

        // Check if user is authenticated
        const userResponse = await authApi.getCurrentUser();

        if (!isMounted) return;

        if (userResponse?.data?.user) {
          const { isAdmin, ...userData } = userResponse.data.user;
          setAuthData({ user: userData, isAdmin });
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Auth check failed:", err);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [
    setAuthData,
    setUser,
    setIsAuthenticated,
    setIsAdmin,
    setIsLoadingAuth,
    setAppInfo,
  ]);

  return <>{children}</>;
}
