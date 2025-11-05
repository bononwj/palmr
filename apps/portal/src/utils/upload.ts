import axios from "axios";
import { filesApi } from "@/api/endpoints/files";

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface ChunkedUploadOptions {
  file: File;
  folderId?: string | null;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Determine if we should use chunked upload based on file size
export function shouldUseChunkedUpload(fileSize: number): boolean {
  const CHUNK_THRESHOLD = 50 * 1024 * 1024; // 50MB
  return fileSize > CHUNK_THRESHOLD;
}

// Calculate optimal chunk size based on file size
export function calculateChunkSize(fileSize: number): number {
  const MB = 1024 * 1024;
  if (fileSize < 100 * MB) return 5 * MB;
  if (fileSize < 500 * MB) return 10 * MB;
  if (fileSize < 1024 * MB) return 20 * MB;
  return 50 * MB;
}

// Upload a single file
export async function uploadFile(options: ChunkedUploadOptions): Promise<void> {
  const { file, folderId, onProgress, onSuccess, onError } = options;

  try {
    // Get file extension
    const extension = file.name.split(".").pop() || "";
    const filename = file.name.replace(`.${extension}`, "");

    // Step 1: Get presigned URL
    const presignedResponse = await filesApi.getPresignedUrl(
      filename,
      extension,
    );
    const { url, objectName } = presignedResponse.data;

    // Step 2: Upload file to presigned URL
    if (shouldUseChunkedUpload(file.size)) {
      await uploadChunked(file, url, objectName, onProgress);
    } else {
      await uploadDirect(file, url, onProgress);
    }

    // Step 3: Register file in database
    await filesApi.registerFile({
      name: file.name,
      objectName,
      size: file.size,
      extension,
      folderId: folderId || undefined,
    });

    onSuccess?.();
  } catch (error) {
    console.error("Upload failed:", error);
    onError?.(error as Error);
    throw error;
  }
}

// Direct upload for smaller files
async function uploadDirect(
  file: File,
  url: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<void> {
  console.log("url", url);
  // Use axios with baseURL config disabled for presigned URLs
  await axios.put(url, file, {
    baseURL: "/api-internal", // Override baseURL to use the presigned URL as-is
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100,
        );
        onProgress({
          percent,
          loaded: progressEvent.loaded,
          total: progressEvent.total,
        });
      }
    },
  });
}

// Chunked upload for larger files
async function uploadChunked(
  file: File,
  url: string,
  objectName: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<void> {
  const chunkSize = calculateChunkSize(file.size);
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  let uploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    await axios.put(url, chunk, {
      baseURL: "/api-internal", // Override baseURL to use the presigned URL as-is
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Chunk-Index": chunkIndex.toString(),
        "X-Total-Chunks": totalChunks.toString(),
        "X-File-Id": fileId,
        "X-File-Size": file.size.toString(),
        "X-Original-Name": file.name,
      },
    });

    uploadedBytes += chunk.size;

    if (onProgress) {
      const percent = Math.round((uploadedBytes / file.size) * 100);
      onProgress({
        percent,
        loaded: uploadedBytes,
        total: file.size,
      });
    }
  }
}

// Download file
export async function downloadFile(
  objectName: string,
  fileName: string,
): Promise<void> {
  try {
    const response = await filesApi.getDownloadUrl(objectName);
    const downloadUrl = response.data.url;

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}
