import apiClient from "../client";

export interface AppInfo {
  name: string;
  version: string;
  logo?: string;
  primaryColor?: string;
  firstUserAccess?: boolean;
}

export interface DiskSpace {
  diskAvailableGB: number;
  diskSizeGB: number;
  diskUsedGB: number;
  uploadAllowed: boolean;
}

export interface StorageConfig {
  maxFileSize: number;
  allowedExtensions: string[];
}

// App API endpoints
export const appApi = {
  getAppInfo: () => apiClient.get<AppInfo>("/app/info"),

  getDiskSpace: () => apiClient.get<DiskSpace>("/storage/disk-space"),

  getStorageConfig: () => apiClient.get<StorageConfig>("/config/storage"),
};
