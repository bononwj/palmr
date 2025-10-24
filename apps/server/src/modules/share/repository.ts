import type { Share, ShareSecurity } from "@prisma/client";

import { prisma } from "../../shared/prisma";
import type { CreateShareInput } from "./dto";

export interface IShareRepository {
  createShare(data: CreateShareInput & { securityId: string; creatorId: string }): Promise<Share>;
  findShareById(id: string): Promise<
    | (Share & {
        security: ShareSecurity;
        files: any[];
        folders: any[];
        recipients: { email: string }[];
        alias: any | null;
      })
    | null
  >;
  findShareBySecurityId(securityId: string): Promise<
    | (Share & {
        security: ShareSecurity;
        files: any[];
        folders: any[];
        recipients: { email: string }[];
        alias: any | null;
      })
    | null
  >;
  updateShare(id: string, data: Partial<Share>): Promise<Share>;
  updateShareSecurity(id: string, data: Partial<ShareSecurity>): Promise<ShareSecurity>;
  deleteShare(id: string): Promise<Share>;
  incrementViews(id: string): Promise<Share>;
  addFilesToShare(shareId: string, fileIds: string[]): Promise<void>;
  removeFilesFromShare(shareId: string, fileIds: string[]): Promise<void>;
  addFoldersToShare(shareId: string, folderIds: string[]): Promise<void>;
  removeFoldersFromShare(shareId: string, folderIds: string[]): Promise<void>;
  findFilesByIds(fileIds: string[]): Promise<any[]>;
  findFoldersByIds(folderIds: string[]): Promise<any[]>;
  addRecipients(shareId: string, emails: string[]): Promise<void>;
  removeRecipients(shareId: string, emails: string[]): Promise<void>;
  findSharesByUserId(
    userId: string
  ): Promise<
    (Share & { security: ShareSecurity; files: any[]; folders: any[]; recipients: any[]; alias: any | null })[]
  >;
}

export class PrismaShareRepository implements IShareRepository {
  async createShare(
    data: Omit<CreateShareInput, "password" | "maxViews"> & { securityId: string; creatorId: string }
  ): Promise<Share> {
    const { files, folders, recipients, expiration, ...shareData } = data;

    const validFiles = (files ?? []).filter((id) => id && id.trim().length > 0);
    const validFolders = (folders ?? []).filter((id) => id && id.trim().length > 0);
    const validRecipients = (recipients ?? []).filter((email) => email && email.trim().length > 0);

    const created = await prisma.share.create({
      data: {
        ...shareData,
        expiration: expiration ? new Date(expiration) : null,
      },
    });

    if (validFiles.length > 0) {
      await prisma.shareFile.createMany({
        data: validFiles.map((fileId) => ({ shareId: created.id, fileId })),
        skipDuplicates: true,
      });
    }

    if (validFolders.length > 0) {
      await prisma.shareFolder.createMany({
        data: validFolders.map((folderId) => ({ shareId: created.id, folderId })),
        skipDuplicates: true,
      });
    }

    if (validRecipients.length > 0) {
      await prisma.shareRecipient.createMany({
        data: validRecipients.map((email) => ({ shareId: created.id, email: email.trim().toLowerCase() })),
        skipDuplicates: true,
      });
    }

    return created;
  }

  async findShareById(id: string) {
    const share = await prisma.share.findUnique({
      where: { id },
      include: { alias: true, security: true },
    });
    if (!share) return null;

    const [shareFiles, shareFolders, recipients] = await Promise.all([
      prisma.shareFile.findMany({ where: { shareId: id } }),
      prisma.shareFolder.findMany({ where: { shareId: id } }),
      prisma.shareRecipient.findMany({ where: { shareId: id } }),
    ]);

    const [files, folders] = await Promise.all([
      shareFiles.length
        ? prisma.file.findMany({ where: { id: { in: shareFiles.map((sf) => sf.fileId) } } })
        : Promise.resolve([]),
      shareFolders.length
        ? prisma.folder.findMany({ where: { id: { in: shareFolders.map((sf) => sf.folderId) } } })
        : Promise.resolve([]),
    ]);

    return {
      ...share,
      files,
      folders,
      recipients,
    } as any;
  }

  async findShareBySecurityId(securityId: string) {
    const share = await prisma.share.findUnique({
      where: { securityId },
      include: { alias: true, security: true },
    });
    if (!share) return null;

    const [shareFiles, shareFolders, recipients] = await Promise.all([
      prisma.shareFile.findMany({ where: { shareId: share.id } }),
      prisma.shareFolder.findMany({ where: { shareId: share.id } }),
      prisma.shareRecipient.findMany({ where: { shareId: share.id } }),
    ]);

    const [files, folders] = await Promise.all([
      shareFiles.length
        ? prisma.file.findMany({ where: { id: { in: shareFiles.map((sf) => sf.fileId) } } })
        : Promise.resolve([]),
      shareFolders.length
        ? prisma.folder.findMany({ where: { id: { in: shareFolders.map((sf) => sf.folderId) } } })
        : Promise.resolve([]),
    ]);

    return {
      ...share,
      files,
      folders,
      recipients,
    } as any;
  }

  async updateShare(id: string, data: Partial<Share>): Promise<Share> {
    return prisma.share.update({
      where: { id },
      data,
    });
  }

  async updateShareSecurity(id: string, data: Partial<ShareSecurity>): Promise<ShareSecurity> {
    return prisma.shareSecurity.update({
      where: { id },
      data,
    });
  }

  async deleteShare(id: string): Promise<Share> {
    return prisma.share.delete({
      where: { id },
    });
  }

  async incrementViews(id: string): Promise<Share> {
    return prisma.share.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async addFilesToShare(shareId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;
    await prisma.shareFile.createMany({
      data: fileIds.map((fileId) => ({ shareId, fileId })),
      skipDuplicates: true,
    });
  }

  async addFoldersToShare(shareId: string, folderIds: string[]): Promise<void> {
    if (folderIds.length === 0) return;
    await prisma.shareFolder.createMany({
      data: folderIds.map((folderId) => ({ shareId, folderId })),
      skipDuplicates: true,
    });
  }

  async removeFilesFromShare(shareId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;
    await prisma.shareFile.deleteMany({
      where: { shareId, fileId: { in: fileIds } },
    });
  }

  async removeFoldersFromShare(shareId: string, folderIds: string[]): Promise<void> {
    if (folderIds.length === 0) return;
    await prisma.shareFolder.deleteMany({
      where: { shareId, folderId: { in: folderIds } },
    });
  }

  async findFilesByIds(fileIds: string[]): Promise<any[]> {
    return prisma.file.findMany({
      where: {
        id: {
          in: fileIds,
        },
      },
    });
  }

  async findFoldersByIds(folderIds: string[]): Promise<any[]> {
    return prisma.folder.findMany({
      where: {
        id: {
          in: folderIds,
        },
      },
    });
  }

  async addRecipients(shareId: string, emails: string[]): Promise<void> {
    if (emails.length === 0) return;
    await prisma.shareRecipient.createMany({
      data: emails.map((email) => ({ shareId, email })),
      skipDuplicates: true,
    });
  }

  async removeRecipients(shareId: string, emails: string[]): Promise<void> {
    if (emails.length === 0) return;
    await prisma.shareRecipient.deleteMany({
      where: { shareId, email: { in: emails } },
    });
  }

  async findSharesByUserId(userId: string) {
    const shares = await prisma.share.findMany({
      where: { creatorId: userId },
      include: { security: true, alias: true },
      orderBy: { createdAt: "desc" },
    });

    const results: any[] = [];
    for (const share of shares) {
      const [shareFiles, shareFolders, recipients] = await Promise.all([
        prisma.shareFile.findMany({ where: { shareId: share.id } }),
        prisma.shareFolder.findMany({ where: { shareId: share.id } }),
        prisma.shareRecipient.findMany({ where: { shareId: share.id } }),
      ]);

      const [files, folders] = await Promise.all([
        shareFiles.length
          ? prisma.file.findMany({ where: { id: { in: shareFiles.map((sf) => sf.fileId) } } })
          : Promise.resolve([]),
        shareFolders.length
          ? prisma.folder.findMany({ where: { id: { in: shareFolders.map((sf) => sf.folderId) } } })
          : Promise.resolve([]),
      ]);

      results.push({ ...share, files, folders, recipients } as any);
    }

    return results;
  }
}
