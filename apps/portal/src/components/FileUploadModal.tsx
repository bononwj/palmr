import { useState } from "react";
import { Modal, Upload, Progress, message, Button } from "antd";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { useTranslation } from "react-i18next";
import { uploadFile, type UploadProgress } from "@/utils/upload";
import { formatFileSize } from "@/utils/format";

const { Dragger } = Upload;

interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentFolderId?: string | null;
}

interface FileWithProgress extends Omit<UploadFile, "status"> {
  progress?: number;
  status?: "uploading" | "done" | "error" | "pending";
}

export function FileUploadModal({
  visible,
  onClose,
  onSuccess,
  currentFolderId,
}: FileUploadModalProps) {
  const { t } = useTranslation();
  const [fileList, setFileList] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Please select files to upload");
      return;
    }

    setUploading(true);

    try {
      // Upload files one by one
      for (const fileItem of fileList) {
        if (!fileItem.originFileObj) continue;

        // Update status to uploading
        setFileList((prev) =>
          prev.map((f) =>
            f.uid === fileItem.uid
              ? { ...f, status: "uploading", progress: 0 }
              : f,
          ),
        );

        await uploadFile({
          file: fileItem.originFileObj,
          folderId: currentFolderId,
          onProgress: (progress: UploadProgress) => {
            setFileList((prev) =>
              prev.map((f) =>
                f.uid === fileItem.uid
                  ? { ...f, progress: progress.percent }
                  : f,
              ),
            );
          },
          onSuccess: () => {
            setFileList((prev) =>
              prev.map((f) =>
                f.uid === fileItem.uid
                  ? { ...f, status: "done", progress: 100 }
                  : f,
              ),
            );
          },
          onError: () => {
            setFileList((prev) =>
              prev.map((f) =>
                f.uid === fileItem.uid ? { ...f, status: "error" } : f,
              ),
            );
          },
        });
      }

      message.success(t("files.uploadSuccess"));
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      message.error(t("files.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFileList([]);
      onClose();
    }
  };

  const handleRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  return (
    <Modal
      title={t("files.uploadFiles")}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={uploading}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          {uploading ? t("files.uploading") : t("common.upload")}
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Dragger
          multiple
          fileList={fileList as UploadFile[]}
          beforeUpload={(file) => {
            setFileList((prev) => [
              ...prev,
              {
                uid: file.uid,
                name: file.name,
                size: file.size,
                type: file.type,
                originFileObj: file,
                status: "pending",
              } as FileWithProgress,
            ]);
            return false; // Prevent auto upload
          }}
          onRemove={handleRemove}
          disabled={uploading}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag files to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Strictly prohibit from uploading
            company data or other band files
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold">
              Files to upload ({fileList.length}):
            </div>
            {fileList.map((file) => (
              <div
                key={file.uid}
                className="border rounded p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file.size || 0)}
                  </div>
                  {file.status === "uploading" &&
                    file.progress !== undefined && (
                      <Progress percent={file.progress} size="small" />
                    )}
                  {file.status === "done" && (
                    <div className="text-green-500 text-sm">✓ Uploaded</div>
                  )}
                  {file.status === "error" && (
                    <div className="text-red-500 text-sm">✗ Failed</div>
                  )}
                </div>
                {!uploading && file.status !== "uploading" && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(file as UploadFile)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
