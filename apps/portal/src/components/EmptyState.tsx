import { Empty, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 80 }}
        description={
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
              <p className="text-gray-500 text-sm max-w-md">{description}</p>
            )}
          </div>
        }
      >
        {actionText && onAction && (
          <Button
            type="primary"
            size="large"
            icon={<UploadOutlined />}
            onClick={onAction}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
