import { useState } from "react";
import { Table, Button, Space, message, Modal, Breadcrumb } from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FolderOutlined,
  FolderFilled,
  HomeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MainLayout,
  FileIcon,
  EmptyState,
  CreateFolderModal,
} from "@/components";
import { FileUploadModal } from "@/components/FileUploadModal";
import { filesApi } from "@/api/endpoints/files";
import { foldersApi, type Folder } from "@/api/endpoints/folders";
import { formatFileSize, formatDate } from "@/utils/format";
import { downloadFile } from "@/utils/upload";
import type { File } from "@/api/endpoints/files";

// Combined type for files and folders display
type FileSystemItem = (File | Folder) & {
  type: "file" | "folder";
};

export default function FilesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [createFolderModalVisible, setCreateFolderModalVisible] =
    useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set(),
  );

  // Fetch files in current folder
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["files", currentFolderId],
    queryFn: () => {
      // Use recursive=true for root to get all files, then filter
      // Use recursive=false for subfolders to get only direct children
      const recursive = currentFolderId === null;
      return filesApi.listFiles(currentFolderId, recursive);
    },
  });

  // Fetch folders in current folder
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", currentFolderId],
    queryFn: () => {
      // Use recursive=true for root to get all folders, then filter
      // Use recursive=false for subfolders to get only direct children
      const recursive = currentFolderId === null;
      return foldersApi.listFolders(currentFolderId, recursive);
    },
  });

  const isLoading = filesLoading || foldersLoading;

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => filesApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      message.success(t("files.deleteSuccess"));
      setSelectedRowKeys([]);
    },
    onError: () => {
      message.error(t("files.deleteFailed"));
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => foldersApi.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", currentFolderId] });
      message.success(t("folders.deleteSuccess"));
      setSelectedRowKeys([]);
    },
    onError: () => {
      message.error(t("folders.deleteFailed"));
    },
  });

  const handleDelete = (item: FileSystemItem) => {
    const isFolder = item.type === "folder";
    Modal.confirm({
      title: isFolder ? t("folders.deleteConfirm") : t("files.deleteConfirm"),
      onOk: () => {
        if (isFolder) {
          deleteFolderMutation.mutate(item.id);
        } else {
          deleteFileMutation.mutate(item.id);
        }
      },
    });
  };

  const handleDownload = async (file: File) => {
    setDownloadingFiles((prev) => new Set(prev).add(file.id));
    try {
      await downloadFile(file.objectName, file.name);
      message.success(`${file.name} downloaded successfully`);
    } catch (error) {
      console.error("Download failed:", error);
      message.error(`Failed to download ${file.name}`);
    } finally {
      setDownloadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
  };

  // Navigate into a folder
  const handleFolderClick = (folder: Folder) => {
    // Prevent navigating to the same folder we're already in
    if (currentFolderId === folder.id) {
      return;
    }

    // Check if this folder is already in the path (shouldn't happen, but safety check)
    const isAlreadyInPath = folderPath.some((f) => f.id === folder.id);
    if (isAlreadyInPath) {
      return;
    }

    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
  };

  // Navigate to a specific folder in breadcrumb
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to root
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      // Go to specific folder
      const targetFolder = folderPath[index];
      setCurrentFolderId(targetFolder.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };

  const columns = [
    {
      title: t("files.fileName"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: FileSystemItem) => {
        const isFolder = record.type === "folder";
        return (
          <Space
            className={isFolder ? "cursor-pointer hover:text-blue-500" : ""}
            onClick={() => isFolder && handleFolderClick(record as Folder)}
          >
            {isFolder ? (
              <FolderFilled style={{ fontSize: "18px", color: "#1890ff" }} />
            ) : (
              <FileIcon extension={(record as File).extension} />
            )}
            <span className={isFolder ? "font-medium" : ""}>{text}</span>
          </Space>
        );
      },
    },
    {
      title: t("files.fileSize"),
      dataIndex: "size",
      key: "size",
      render: (size: number | undefined, record: FileSystemItem) => {
        if (record.type === "folder") {
          const folder = record as Folder;
          return folder.totalSize
            ? formatFileSize(Number(folder.totalSize))
            : "-";
        }
        return size ? formatFileSize(size) : "-";
      },
    },
    {
      title: t("files.type"),
      dataIndex: "type",
      key: "type",
      render: (type: string) =>
        type === "folder" ? t("files.folder") : t("files.file"),
    },
    {
      title: t("files.dateCreated"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => formatDate(date),
    },
    {
      title: t("files.actions"),
      key: "actions",
      render: (_: any, record: FileSystemItem) => {
        const isFolder = record.type === "folder";
        return (
          <Space>
            {!isFolder && (
              <Button
                icon={<DownloadOutlined />}
                size="small"
                loading={downloadingFiles.has(record.id)}
                onClick={() => handleDownload(record as File)}
              >
                {t("common.download")}
              </Button>
            )}
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record)}
            >
              {t("common.delete")}
            </Button>
          </Space>
        );
      },
    },
  ];

  // Combine files and folders for display
  let files = filesData?.data.files || [];
  let folders = foldersData?.data.folders || [];

  // If we're in root and using recursive mode, filter to show only root items
  if (currentFolderId === null) {
    files = files.filter((f) => f.folderId === null);
    folders = folders.filter((f) => f.parentId === null);
  }

  const fileSystemItems: FileSystemItem[] = [
    ...folders.map((folder) => ({ ...folder, type: "folder" as const })),
    ...files.map((file) => ({ ...file, type: "file" as const })),
  ];

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t("files.title")}</h1>
            <p className="text-gray-500">{t("files.myFiles")}</p>
          </div>
          <Space>
            <Button
              icon={<FolderOutlined />}
              onClick={() => setCreateFolderModalVisible(true)}
            >
              {t("files.createFolder")}
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              {t("files.uploadFiles")}
            </Button>
          </Space>
        </div>

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <Breadcrumb.Item
            onClick={() => handleBreadcrumbClick(-1)}
            className="cursor-pointer hover:text-blue-500"
          >
            <HomeOutlined />
            <span className="ml-1">{t("files.root")}</span>
          </Breadcrumb.Item>
          {folderPath.map((folder, index) => (
            <Breadcrumb.Item
              key={folder.id}
              onClick={() => handleBreadcrumbClick(index)}
              className={
                index < folderPath.length - 1
                  ? "cursor-pointer hover:text-blue-500"
                  : ""
              }
            >
              {folder.name}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>

        {fileSystemItems.length === 0 && !isLoading ? (
          <div className="space-y-4">
            <EmptyState
              title={t("files.noFilesOrFolders")}
              description={t("files.emptyFolderDescription")}
              actionText={t("files.uploadFiles")}
              onAction={() => setUploadModalVisible(true)}
            />
            <div className="flex justify-center gap-2">
              <Button
                icon={<FolderOutlined />}
                onClick={() => setCreateFolderModalVisible(true)}
              >
                {t("files.createFolder")}
              </Button>
            </div>
          </div>
        ) : (
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            columns={columns}
            dataSource={fileSystemItems}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t("files.totalItems", { count: total }),
            }}
          />
        )}
      </Space>

      <FileUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
      />

      <CreateFolderModal
        visible={createFolderModalVisible}
        onClose={() => setCreateFolderModalVisible(false)}
        currentFolderId={currentFolderId}
      />
    </MainLayout>
  );
}
