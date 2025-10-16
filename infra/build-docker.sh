#!/bin/bash

# 阿里云容器镜像服务配置
REGISTRY="cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com/yipai"
IMAGE_NAME="palmr"

# 从根目录 package.json 读取版本号
VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
    echo "❌ Error: Cannot read version from package.json"
    exit 1
fi

echo "🏷️  Current version: $VERSION"
echo "🏷️  Please enter a tag for the build (press Enter to use version $VERSION, or enter custom tag):"
read -p "Tag (default: $VERSION): " TAG

# 如果用户没有输入，使用版本号作为 tag
if [ -z "$TAG" ]; then
    TAG=$VERSION
fi

echo ""
echo "🚀 Building Palmr Unified Image for AMD64 and ARM..."
echo "📦 Registry: $REGISTRY"
echo "📦 Image: $IMAGE_NAME"
echo "📦 Building tags: latest and $TAG"
echo ""

# 创建或使用现有的 buildx builder
docker buildx create --name palmr-builder --use 2>/dev/null || docker buildx use palmr-builder

# 构建多平台镜像并推送
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --no-cache \
    -t ${REGISTRY}/${IMAGE_NAME}:latest \
    -t ${REGISTRY}/${IMAGE_NAME}:${TAG} \
    --push \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Multi-platform build completed successfully!"
    echo ""
    echo "Built for platforms: linux/amd64, linux/arm64"
    echo "Built images:"
    echo "  - ${REGISTRY}/${IMAGE_NAME}:latest"
    echo "  - ${REGISTRY}/${IMAGE_NAME}:${TAG}"
    echo ""
    echo "To pull the image on target machine:"
    echo "  docker pull ${REGISTRY}/${IMAGE_NAME}:latest"
    echo ""
    echo "Access points:"
    echo "  - API: http://localhost:3333"
    echo "  - Web App: http://localhost:5487"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi 