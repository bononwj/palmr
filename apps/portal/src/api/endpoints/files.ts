import apiClient from "../client";

export interface File {
  id: string;
  name: string;
  description?: string;
  extension: string;
  size: number;
  objectName: string;
  userId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  files: File[];
}

export interface CreateFileBody {
  name: string;
  objectName: string;
  size: number;
  extension: string;
  folderId?: string | null;
  description?: string;
}

export interface UpdateFileBody {
  name?: string;
  description?: string;
  folderId?: string | null;
}

export interface PresignedUrlResponse {
  url: string;
  objectName: string;
}

export interface DownloadUrlResponse {
  url: string;
}

export interface CheckFileBody {
  name: string;
  objectName: string;
  size: number;
  extension: string;
  folderId?: string | null;
}

// File API endpoints
export const filesApi = {
  listFiles: (folderId?: string | null, recursive: boolean = false) => {
    const params: any = { recursive: recursive ? "true" : "false" };
    // Always include folderId, even if null (for root directory)
    if (folderId !== undefined) {
      params.folderId = folderId || ""; // Empty string represents root
    }
    return apiClient.get<FileListResponse>("/files", { params });
  },

  getFile: (fileId: string) =>
    apiClient.get<{ file: File }>(`/files/${fileId}`),

  createFile: (body: CreateFileBody) =>
    apiClient.post<{ file: File }>("/files", body),

  updateFile: (fileId: string, body: UpdateFileBody) =>
    apiClient.put<{ file: File }>(`/files/${fileId}`, body),

  deleteFile: (fileId: string) => apiClient.delete(`/files/${fileId}`),

  moveFile: (fileId: string, folderId: string | null) =>
    apiClient.put(`/files/${fileId}`, { folderId }),

  checkFile: (body: CheckFileBody) => apiClient.post("/files/check", body),

  getPresignedUrl: (filename: string, extension: string) =>
    apiClient.get<PresignedUrlResponse>("/files/presigned-url", {
      params: {
        filename,
        extension,
      },
    }),

  registerFile: (body: CreateFileBody) =>
    apiClient.post<{ file: File }>("/files", body),

  getDownloadUrl: (objectName: string, password?: string) => {
    const params = password ? { password } : {};
    return apiClient.get<DownloadUrlResponse>(
      `/files/${encodeURIComponent(objectName)}/download`,
      { params },
    );
  },

  searchFiles: (query: string) =>
    apiClient.get<FileListResponse>("/files/search", { params: { query } }),
};
