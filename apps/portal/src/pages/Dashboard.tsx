import { Card, Row, Col, Statistic, Space } from "antd";
import {
  FileOutlined,
  ShareAltOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components";
import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/api/endpoints/app";
import { filesApi } from "@/api/endpoints/files";
import { sharesApi } from "@/api/endpoints/shares";
import { formatFileSize } from "@/utils/format";

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: diskSpace } = useQuery({
    queryKey: ["diskSpace"],
    queryFn: () => appApi.getDiskSpace(),
  });

  const { data: filesData } = useQuery({
    queryKey: ["files"],
    queryFn: () => filesApi.listFiles(),
  });

  const { data: sharesData } = useQuery({
    queryKey: ["shares"],
    queryFn: () => sharesApi.listShares(),
  });

  const fileCount = filesData?.data.files?.length || 0;
  const shareCount = sharesData?.data.shares?.length || 0;
  const usedSpace = diskSpace?.data.diskUsedGB || 0;

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-gray-500">{t("dashboard.welcome")}</p>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Files"
                value={fileCount}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Shares"
                value={shareCount}
                prefix={<ShareAltOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Storage Used"
                value={usedSpace + " GB"}
                prefix={<CloudOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title={t("dashboard.recentFiles")}>
              <p>Recent files will be displayed here</p>
            </Card>
          </Col>
          <Col span={12}>
            <Card title={t("dashboard.recentShares")}>
              <p>Recent shares will be displayed here</p>
            </Card>
          </Col>
        </Row>
      </Space>
    </MainLayout>
  );
}
