import React from "react";
import { Modal, Form, Input, message } from "antd";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { foldersApi } from "@/api/endpoints/folders";

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
}

interface CreateFolderFormValues {
  name: string;
  description?: string;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onClose,
  currentFolderId = null,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateFolderFormValues>();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (values: CreateFolderFormValues) => {
      // Use folder name as objectName (will be combined with parent path on backend)
      const objectName = values.name;

      // Build request body, only include optional fields if they have values
      const requestBody: any = {
        name: values.name,
        objectName,
      };

      // Only include description if it's not empty
      if (values.description && values.description.trim()) {
        requestBody.description = values.description.trim();
      }

      // Only include parentId if it's not null
      if (currentFolderId) {
        requestBody.parentId = currentFolderId;
      }

      return foldersApi.createFolder(requestBody);
    },
    onSuccess: (response) => {
      message.success(response.data.message || t("folders.createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      console.error("Create folder failed:", error);
      const errorMsg = error.response?.data?.error || t("folders.createFailed");
      message.error(errorMsg);
    },
  });

  const handleOk = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t("folders.createFolder")}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={createMutation.isPending}
      okText={t("common.create")}
      cancelText={t("common.cancel")}
    >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label={t("folders.folderName")}
            rules={[
              { required: true, message: t("folders.folderNameRequired") },
              { max: 255, message: t("folders.folderNameTooLong") },
              {
                pattern: /^[^<>:"/\\|?*\x00-\x1F]+$/,
                message: t("folders.folderNameInvalidChars"),
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (value !== value.trim()) {
                    return Promise.reject(new Error(t("folders.folderNameNoSpaces")));
                  }
                  if (value.endsWith('.')) {
                    return Promise.reject(new Error(t("folders.folderNameNoPeriod")));
                  }
                  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
                  if (reserved.includes(value.toUpperCase())) {
                    return Promise.reject(new Error(t("folders.folderNameReserved")));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={t("folders.folderNamePlaceholder")} />
          </Form.Item>

        <Form.Item name="description" label={t("folders.description")}>
          <Input.TextArea
            rows={3}
            placeholder={t("folders.descriptionPlaceholder")}
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
