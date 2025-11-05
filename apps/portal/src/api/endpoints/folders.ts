import apiClient from "../client";

export interface Folder {
  id: string;
  name: string;
  description?: string;
  objectName: string;
  parentId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  totalSize?: string;
  _count?: {
    files: number;
    children: number;
  };
}

export interface FolderListResponse {
  folders: Folder[];
}

export interface CreateFolderBody {
  name: string;
  description?: string;
  objectName: string;
  parentId?: string | null;
}

export interface UpdateFolderBody {
  name?: string;
  description?: string;
  parentId?: string | null;
}

// Folder API endpoints
export const foldersApi = {
  listFolders: (parentId?: string | null, recursive: boolean = false) => {
    const params: any = { recursive: recursive ? "true" : "false" };
    // Always include parentId, even if null (for root directory)
    if (parentId !== undefined) {
      params.parentId = parentId || ""; // Empty string represents root
    }
    return apiClient.get<FolderListResponse>("/folders", { params });
  },

  getFolder: (folderId: string) =>
    apiClient.get<{ folder: Folder }>(`/folders/${folderId}`),

  createFolder: (body: CreateFolderBody) =>
    apiClient.post<{ folder: Folder; message: string }>("/folders", body),

  updateFolder: (folderId: string, body: UpdateFolderBody) =>
    apiClient.put<{ folder: Folder }>(`/folders/${folderId}`, body),

  deleteFolder: (folderId: string) => apiClient.delete(`/folders/${folderId}`),

  moveFolder: (folderId: string, parentId: string | null) =>
    apiClient.put(`/folders/${folderId}`, { parentId }),

  getFolderPath: (folderId: string) =>
    apiClient.get<{ path: Folder[] }>(`/folders/${folderId}/path`),

  downloadFolder: (folderId: string) =>
    apiClient.get(`/folders/${folderId}/download`, { responseType: "blob" }),
};
