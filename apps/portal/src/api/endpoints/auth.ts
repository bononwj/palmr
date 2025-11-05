import apiClient from "../client";

export interface LoginBody {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  user?: {
    id: string;
    username: string;
    email?: string;
    isAdmin: boolean;
  };
  requiresTwoFactor?: boolean;
  userId?: string;
  token?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
}

export interface GetCurrentUserResult {
  user: User & { isAdmin: boolean };
}

export interface AuthProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export interface OIDCConfigResult {
  clientId: string;
  authorizationEndpoint: string;
  scopes?: string[];
}

// Auth API endpoints
export const authApi = {
  login: (body: LoginBody) =>
    apiClient.post<LoginResponse>("/auth/login", body),

  logout: () => apiClient.post("/auth/logout"),

  getCurrentUser: () => apiClient.get<GetCurrentUserResult>("/auth/me"),

  getAuthConfig: () => apiClient.get("/auth/config"),

  getEnabledProviders: () =>
    apiClient.get<{ providers: AuthProvider[] }>("/auth/providers/enabled"),

  getOIDCConfig: (providerId: string) =>
    apiClient.get<OIDCConfigResult>(`/auth/oidc/${providerId}/config`),

  verifyTwoFactor: (userId: string, code: string) =>
    apiClient.post("/auth/two-factor/verify", { userId, code }),
};
