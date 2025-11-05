import { useState, useEffect } from 'react'
import { Card, Button, Input, Form, message, Spin, Table, Space } from 'antd'
import { DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { FileIcon } from '@/components'
import { sharesApi } from '@/api/endpoints/shares'
import { formatFileSize, formatDate } from '@/utils/format'

export default function PublicSharePage() {
  const { alias } = useParams<{ alias: string }>()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['publicShare', alias, password],
    queryFn: () => sharesApi.getPublicShare(alias!, password || undefined),
    enabled: !!alias && (!needsPassword || !!password),
    retry: false,
  })

  useEffect(() => {
    if (error) {
      const err = error as any
      if (err.response?.status === 401) {
        setNeedsPassword(true)
      } else if (err.response?.status === 404) {
        message.error(t('shares.shareNotFound'))
      } else if (err.response?.status === 410) {
        message.error(t('shares.shareExpired'))
      }
    }
  }, [error, t])

  const handlePasswordSubmit = (values: { password: string }) => {
    setPassword(values.password)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (needsPassword && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{t('shares.publicShare')}</h1>
            <p className="text-gray-500 mt-2">{t('shares.enterPassword')}</p>
          </div>

          <Form onFinish={handlePasswordSubmit} layout="vertical">
            <Form.Item
              name="password"
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('shares.password')}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                {t('common.confirm')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    )
  }

  const share = data?.data.share
  const files = data?.data.files || []

  const columns = [
    {
      title: t('files.fileName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <FileIcon extension={record.extension} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('files.fileSize'),
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: t('files.actions'),
      key: 'actions',
      render: () => (
        <Button icon={<DownloadOutlined />} size="small">
          {t('common.download')}
        </Button>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <h1 className="text-3xl font-bold">{share?.name || 'Shared Files'}</h1>
              {share?.description && (
                <p className="text-gray-500 mt-2">{share.description}</p>
              )}
              {share?.expiresAt && (
                <p className="text-sm text-gray-400 mt-2">
                  Expires: {formatDate(share.expiresAt)}
                </p>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={files}
              rowKey="id"
              pagination={false}
            />
          </Space>
        </Card>
      </div>
    </div>
  )
}

