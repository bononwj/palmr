# 1. 在远程服务器上，进入项目目录

cd /data/wwwroot/download.yipai360.com

# 2. 构建镜像（镜像很小，只包含 Node.js 和 PM2）

docker build -f Dockerfile -t palmr-web:latest .

# 3. 使用 docker-compose 启动

docker compose -f docker-compose.yaml up -d

# 或者直接使用 docker run

docker run -d \
 --name palmr-web \
 --restart unless-stopped \
 -p 3000:3000 \
 -v /data/wwwroot/download.yipai360.com:/app \
 -v /var/log/next-app:/var/log/next-app \
 -w /app \
 -e NODE_ENV=production \
 palmr-web:latest \
 pm2-runtime /app/apps/web/ecosystem.config.js
