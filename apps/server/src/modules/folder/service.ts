import { isS3Enabled } from "../../config/storage.config";
import { FilesystemStorageProvider } from "../../providers/filesystem-storage.provider";
import { S3StorageProvider } from "../../providers/s3-storage.provider";
import { prisma } from "../../shared/prisma";
import { StorageProvider } from "../../types/storage";

export class FolderService {
  private storageProvider: StorageProvider;

  constructor() {
    if (isS3Enabled) {
      this.storageProvider = new S3StorageProvider();
    } else {
      this.storageProvider = FilesystemStorageProvider.getInstance();
    }
  }

  async getPresignedPutUrl(objectName: string, expires: number): Promise<string> {
    try {
      return await this.storageProvider.getPresignedPutUrl(objectName, expires);
    } catch (err) {
      console.error("Erro no presignedPutObject:", err);
      throw err;
    }
  }

  async getPresignedGetUrl(objectName: string, expires: number, folderName?: string): Promise<string> {
    try {
      return await this.storageProvider.getPresignedGetUrl(objectName, expires, folderName);
    } catch (err) {
      console.error("Erro no presignedGetObject:", err);
      throw err;
    }
  }

  async deleteObject(objectName: string): Promise<void> {
    try {
      await this.storageProvider.deleteObject(objectName);
    } catch (err) {
      console.error("Erro no removeObject:", err);
      throw err;
    }
  }

  isFilesystemMode(): boolean {
    return !isS3Enabled;
  }

  async getAllFilesInFolder(folderId: string, userId: string, basePath: string = ""): Promise<any[]> {
    const files = await prisma.file.findMany({
      where: { folderId, userId },
    });

    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId, userId },
      select: { id: true, name: true },
    });

    let allFiles = files.map((file: any) => ({
      ...file,
      relativePath: basePath + file.name,
    }));

    for (const subfolder of subfolders) {
      const subfolderPath = basePath + subfolder.name + "/";
      const subfolderFiles = await this.getAllFilesInFolder(subfolder.id, userId, subfolderPath);
      allFiles = [...allFiles, ...subfolderFiles];
    }

    return allFiles;
  }

  async calculateFolderSize(folderId: string, userId: string): Promise<bigint> {
    const files = await prisma.file.findMany({
      where: { folderId, userId },
      select: { size: true },
    });

    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId, userId },
      select: { id: true },
    });

    let totalSize = files.reduce((sum, file) => sum + file.size, BigInt(0));

    for (const subfolder of subfolders) {
      const subfolderSize = await this.calculateFolderSize(subfolder.id, userId);
      totalSize += subfolderSize;
    }

    return totalSize;
  }

  /**
   * Get the full path of a folder from root to the specified folder
   * Returns path like: "folder1/folder2/folder3"
   */
  async getFolderPath(folderId: string, userId: string): Promise<string> {
    const pathParts: string[] = [];
    let currentFolderId: string | null = folderId;

    while (currentFolderId) {
      const folder: any = await prisma.folder.findFirst({
        where: { id: currentFolderId, userId },
        select: { name: true, parentId: true },
      });

      if (!folder) {
        throw new Error(`Folder not found or access denied: ${currentFolderId}`);
      }

      pathParts.unshift(folder.name);
      currentFolderId = folder.parentId;
    }

    return pathParts.join("/");
  }

  async deleteFolderRecursively(
    folderId: string,
    userId: string
  ): Promise<{ deletedFiles: number; deletedFolders: number }> {
    // Ensure the folder exists and belongs to the user
    const targetFolder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!targetFolder) {
      throw new Error("Folder not found or access denied");
    }

    // 1) Collect all descendant folder ids, including the target
    const folderIdsToDelete: string[] = [];
    const stack: string[] = [folderId];

    while (stack.length > 0) {
      const currentId = stack.pop() as string;
      folderIdsToDelete.push(currentId);

      const children = await prisma.folder.findMany({
        where: { parentId: currentId, userId },
        select: { id: true },
      });
      for (const child of children) {
        stack.push(child.id);
      }
    }

    // 2) Load files in these folders
    const filesToDelete = await prisma.file.findMany({
      where: { userId, folderId: { in: folderIdsToDelete } },
      select: { id: true, objectName: true },
    });

    // 3) Load folder object names for storage cleanup
    const foldersInfo = await prisma.folder.findMany({
      where: { id: { in: folderIdsToDelete } },
      select: { id: true, objectName: true },
    });

    // 4) Delete storage objects for files (best-effort)
    await Promise.all(
      filesToDelete.map(async (f) => {
        try {
          await this.storageProvider.deleteObject(f.objectName);
        } catch (err) {
          console.warn("Failed to delete file object:", f.objectName, err);
        }
      })
    );

    // 5) Delete storage objects for folder markers (best-effort)
    await Promise.all(
      foldersInfo.map(async (fld) => {
        try {
          await this.storageProvider.deleteObject(fld.objectName);
        } catch (err) {
          // Some backends may not have a concrete object for folders – ignore
        }
      })
    );

    // 6) Delete DB records within a single interactive transaction
    await prisma.$transaction(async (tx) => {
      const fileIds = filesToDelete.map((f) => f.id);

      if (fileIds.length > 0) {
        await tx.shareFile.deleteMany({ where: { fileId: { in: fileIds } } });
      }

      await tx.shareFolder.deleteMany({ where: { folderId: { in: folderIdsToDelete } } });

      if (fileIds.length > 0) {
        await tx.file.deleteMany({ where: { id: { in: fileIds } } });
      }

      // Delete child folders before parents
      const reversedFolderIds = [...folderIdsToDelete].reverse();
      for (const id of reversedFolderIds) {
        await tx.folder.delete({ where: { id } });
      }
    });

    return { deletedFiles: filesToDelete.length, deletedFolders: folderIdsToDelete.length };
  }
}
