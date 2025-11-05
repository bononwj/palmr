FROM node:20-alpine

# 安装 PM2
RUN npm install -g pm2

# 设置工作目录
WORKDIR /app

# 暴露端口（Next.js 默认 3000，但可以根据需要调整）
EXPOSE 3000

# 默认命令（会在 docker-compose 或运行时覆盖）
CMD ["pm2-runtime", "--version"]