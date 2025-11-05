import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '@/api/endpoints/folders';

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
      // Generate objectName based on timestamp and folder name
      const timestamp = Date.now();
      const safeName = values.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const objectName = `folder_${timestamp}_${safeName}`;

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

      console.log('Creating folder with body:', requestBody);
      return foldersApi.createFolder(requestBody);
    },
    onSuccess: (response) => {
      message.success(response.data.message || t('folders.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      console.error('Create folder failed:', error);
      const errorMsg = error.response?.data?.error || t('folders.createFailed');
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
      title={t('folders.createFolder')}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={createMutation.isPending}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={t('folders.folderName')}
          rules={[
            { required: true, message: t('folders.folderNameRequired') },
            { max: 255, message: t('folders.folderNameTooLong') },
          ]}
        >
          <Input placeholder={t('folders.folderNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('folders.description')}
        >
          <Input.TextArea
            rows={3}
            placeholder={t('folders.descriptionPlaceholder')}
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

