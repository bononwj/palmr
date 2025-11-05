import { useState } from 'react'
import { Table, Button, Space, message, Modal, Tag } from 'antd'
import { 
  PlusOutlined, 
  LinkOutlined, 
  DeleteOutlined 
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout, EmptyState } from '@/components'
import { sharesApi } from '@/api/endpoints/shares'
import { formatDate } from '@/utils/format'
import type { Share } from '@/api/endpoints/shares'

export default function SharesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['shares'],
    queryFn: () => sharesApi.listShares(),
  })

  const deleteMutation = useMutation({
    mutationFn: (shareId: string) => sharesApi.deleteShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] })
      message.success(t('shares.deleteSuccess'))
    },
    onError: () => {
      message.error(t('shares.deleteFailed'))
    },
  })

  const handleCopyLink = (alias: string) => {
    const url = `${window.location.origin}/s/${alias}`
    navigator.clipboard.writeText(url)
    message.success(t('shares.linkCopied'))
  }

  const handleDelete = (shareId: string) => {
    Modal.confirm({
      title: t('shares.deleteConfirm'),
      onOk: () => deleteMutation.mutate(shareId),
    })
  }

  const columns = [
    {
      title: t('shares.shareName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => text || 'Untitled Share',
    },
    {
      title: t('shares.shareLink'),
      dataIndex: 'alias',
      key: 'alias',
      render: (alias: string) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          onClick={() => handleCopyLink(alias)}
        >
          /s/{alias}
        </Button>
      ),
    },
    {
      title: t('shares.currentDownloads'),
      dataIndex: 'currentDownloads',
      key: 'currentDownloads',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: t('shares.expiresAt'),
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => date ? formatDate(date) : 'Never',
    },
    {
      title: t('files.actions'),
      key: 'actions',
      render: (_: any, record: Share) => (
        <Space>
          <Button
            icon={<LinkOutlined />}
            size="small"
            onClick={() => handleCopyLink(record.alias)}
          >
            {t('shares.copyLink')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  const shares = data?.data.shares || []

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('shares.title')}</h1>
            <p className="text-gray-500">{t('shares.myShares')}</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            {t('shares.createShare')}
          </Button>
        </div>

        {shares.length === 0 && !isLoading ? (
          <EmptyState
            title={t('shares.noShares')}
            description="Create your first share to start sharing files"
            actionText={t('shares.createShare')}
            onAction={() => {}}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={shares}
            rowKey="id"
            loading={isLoading}
          />
        )}
      </Space>
    </MainLayout>
  )
}

