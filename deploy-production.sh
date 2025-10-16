#!/bin/bash

# Palmr 生产环境部署脚本
# 用途：自动检测路径并部署服务

set -e  # 遇到错误立即退出

echo "🚀 Palmr 生产环境部署脚本"
echo "================================"
echo ""

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 项目目录: $SCRIPT_DIR"
echo ""

# 切换到项目目录
cd "$SCRIPT_DIR"

# ===== 部署前检查 =====
echo "🔍 执行部署前检查..."
echo ""

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi
echo "✅ Docker 已安装: $(docker --version)"

# 2. 检查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi
echo "✅ Docker Compose 已安装"

# 3. 检查配置文件
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo "❌ 错误: /etc/nginx/nginx.conf 文件不存在"
    exit 1
fi
echo "✅ Nginx 主配置文件存在"

if [ ! -f "/etc/nginx/conf.d/palmr.conf" ]; then
    echo "❌ 错误: /etc/nginx/conf.d/palmr.conf 文件不存在"
    exit 1
fi
echo "✅ Nginx 站点配置文件存在"

# 4. 检查 SSL 证书
if [ ! -f "/etc/nginx/cert/yipai360.com.pem" ]; then
    echo "⚠️  警告: SSL 证书文件不存在 (/etc/nginx/cert/yipai360.com.pem)"
    echo "   如果需要 HTTPS，请先配置证书"
fi

if [ ! -f "/etc/nginx/cert/yipai360.com.key" ]; then
    echo "⚠️  警告: SSL 私钥文件不存在 (/etc/nginx/cert/yipai360.com.key)"
    echo "   如果需要 HTTPS，请先配置证书"
fi

# 5. 检查 docker-compose 文件
if [ ! -f "docker-compose-nginx.yaml" ]; then
    echo "❌ 错误: docker-compose-nginx.yaml 文件不存在"
    exit 1
fi
echo "✅ Docker Compose 配置文件存在"

echo ""
echo "================================"
echo ""

# ===== 创建临时配置（使用绝对路径）=====
echo "📝 生成部署配置..."

# 创建临时的 docker-compose 文件，使用绝对路径
cat > docker-compose-nginx-deploy.yaml << EOF
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    container_name: palmr-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # 使用绝对路径挂载配置文件
      - ${SCRIPT_DIR}/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ${SCRIPT_DIR}/nginx/conf.d:/etc/nginx/conf.d:ro
      # 挂载服务器上的 SSL 证书目录
      - /etc/nginx/cert:/etc/nginx/cert:ro
      # 挂载日志目录
      - nginx_logs:/var/log/nginx
    networks:
      - palmr-network
    restart: unless-stopped
    depends_on:
      - palmr
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/nginx-health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  palmr:
    image: cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com/yipai/palmr:latest
    container_name: palmr
    environment:
      - NODE_ENV=production
      - SECURE_SITE=true
      - DEFAULT_LANGUAGE=zh-CN
    expose:
      - "5487"
      - "3333"
    volumes:
      - palmr_data:/app/server
    networks:
      - palmr-network
    restart: unless-stopped

networks:
  palmr-network:
    driver: bridge

volumes:
  palmr_data:
  nginx_logs:
EOF

echo "✅ 配置文件已生成: docker-compose-nginx-deploy.yaml"
echo ""

# ===== 询问用户操作 =====
echo "请选择操作:"
echo "  1) 启动服务"
echo "  2) 停止服务"
echo "  3) 重启服务"
echo "  4) 查看日志"
echo "  5) 查看状态"
echo "  6) 退出"
echo ""
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动服务..."
        docker compose -f docker-compose-nginx-deploy.yaml up -d
        echo ""
        echo "✅ 服务启动成功！"
        echo ""
        echo "查看状态："
        docker compose -f docker-compose-nginx-deploy.yaml ps
        echo ""
        echo "访问地址："
        echo "  https://download.yipai360.com"
        ;;
    2)
        echo ""
        echo "🛑 停止服务..."
        docker compose -f docker-compose-nginx-deploy.yaml down
        echo "✅ 服务已停止"
        ;;
    3)
        echo ""
        echo "🔄 重启服务..."
        docker compose -f docker-compose-nginx-deploy.yaml restart
        echo "✅ 服务已重启"
        ;;
    4)
        echo ""
        echo "📋 查看日志 (按 Ctrl+C 退出)..."
        docker compose -f docker-compose-nginx-deploy.yaml logs -f
        ;;
    5)
        echo ""
        echo "📊 服务状态："
        docker compose -f docker-compose-nginx-deploy.yaml ps
        echo ""
        echo "容器详情："
        docker ps --filter "name=palmr"
        ;;
    6)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo "部署脚本执行完成"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose -f docker-compose-nginx-deploy.yaml logs -f"
echo "  重启服务: docker-compose -f docker-compose-nginx-deploy.yaml restart"
echo "  停止服务: docker-compose -f docker-compose-nginx-deploy.yaml down"
echo ""

