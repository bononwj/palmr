import apiClient from '../client'

export interface Share {
  id: string
  alias: string
  name?: string
  description?: string
  expiresAt?: string
  maxDownloads?: number
  currentDownloads: number
  password?: string
  isActive: boolean
  userId: string
  createdAt: string
  updatedAt: string
  files?: any[]
  folders?: any[]
}

export interface ShareListResponse {
  shares: Share[]
}

export interface CreateShareBody {
  name?: string
  description?: string
  fileIds?: string[]
  folderIds?: string[]
  expiresAt?: string
  maxDownloads?: number
  password?: string
}

export interface UpdateShareBody {
  name?: string
  description?: string
  expiresAt?: string
  maxDownloads?: number
  password?: string
  isActive?: boolean
}

export interface PublicShareResponse {
  share: Share
  files: any[]
  folders: any[]
}

export interface ShareBrowseResponse {
  files: any[]
  folders: any[]
  currentFolder?: any
  path: any[]
}

// Share API endpoints
export const sharesApi = {
  listShares: () => 
    apiClient.get<ShareListResponse>('/shares'),

  getShare: (shareId: string) => 
    apiClient.get<{ share: Share }>(`/shares/${shareId}`),

  createShare: (body: CreateShareBody) => 
    apiClient.post<{ share: Share }>('/shares', body),

  updateShare: (shareId: string, body: UpdateShareBody) => 
    apiClient.put<{ share: Share }>(`/shares/${shareId}`, body),

  deleteShare: (shareId: string) => 
    apiClient.delete(`/shares/${shareId}`),

  // Public share endpoints (no auth required)
  getPublicShare: (alias: string, password?: string) => {
    const params = password ? { password } : {}
    return apiClient.get<PublicShareResponse>(`/shares/${alias}/public`, { params })
  },

  browsePublicShare: (alias: string, folderId?: string, password?: string) => {
    const params: any = {}
    if (folderId) params.folderId = folderId
    if (password) params.password = password
    return apiClient.get<ShareBrowseResponse>(`/shares/${alias}/browse`, { params })
  },

  downloadShareFile: (shareId: string, fileId: string, password?: string) => {
    const params = password ? { password } : {}
    return apiClient.get(`/shares/${shareId}/files/${fileId}/download`, { 
      params,
      responseType: 'blob'
    })
  },

  downloadShareFolder: (shareId: string, folderId: string, password?: string) => {
    const params = password ? { password } : {}
    return apiClient.get(`/shares/${shareId}/folders/${folderId}/download`, { 
      params,
      responseType: 'blob'
    })
  },

  addFilesToShare: (shareId: string, fileIds: string[]) => 
    apiClient.post(`/shares/${shareId}/files`, { fileIds }),

  removeFileFromShare: (shareId: string, fileId: string) => 
    apiClient.delete(`/shares/${shareId}/files/${fileId}`),
}

