# Palmr 快速部署指南

## 两种部署方式

### 🎯 方式一：Palmr + Nginx（推荐生产环境）

**特点**：独立的 Nginx 容器，便于管理配置

```bash
# 1. 启动服务
make start-nginx

# 2. 访问应用
# Web: http://localhost
# API: http://localhost/api/
```

### 🎯 方式二：Palmr 独立运行（开发/测试）

**特点**：单容器运行，快速启动

```bash
# 1. 启动服务
make start

# 2. 访问应用
# Web: http://localhost:5487
# API: http://localhost:3333
```

## 完整部署流程

### 1️⃣ 准备工作

```bash
# 登录阿里云镜像仓库
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
```

### 2️⃣ 选择部署方式

#### 使用 Nginx（推荐）

```bash
# 启动
make start-nginx

# 查看状态
docker ps

# 查看日志
make logs-nginx
```

#### 独立运行

```bash
# 启动
make start

# 查看状态
docker ps

# 查看日志
make logs
```

### 3️⃣ 验证部署

```bash
# 检查服务健康
curl http://localhost/nginx-health  # Nginx 方式
# 或
curl http://localhost:5487           # 独立方式
```

## 常用命令速查

### 服务管理

```bash
# 启动（Nginx 方式）
make start-nginx

# 启动（独立方式）
make start

# 停止
make stop-nginx     # Nginx 方式
make stop           # 独立方式

# 重启
make restart-nginx  # Nginx 方式
make restart        # 独立方式
```

### Nginx 管理

```bash
# 修改配置后重载
make reload-nginx

# 测试配置
make test-nginx

# 查看日志
make logs-nginx

# 进入容器
make shell-nginx
```

### 日志查看

```bash
# Nginx 日志（交互式）
make logs-nginx

# Palmr 日志
make logs

# 或直接使用 docker-compose
docker-compose -f docker-compose-nginx.yaml logs -f
```

### 进入容器

```bash
# 进入 Palmr 容器
make shell

# 进入 Nginx 容器
make shell-nginx
```

## 配置修改

### 修改 Nginx 配置

```bash
# 1. 编辑配置文件
vim nginx/conf.d/palmr.conf

# 2. 测试配置
make test-nginx

# 3. 重载配置（不停机）
make reload-nginx
```

### 常见配置项

#### 修改上传大小限制

编辑 `nginx/conf.d/palmr.conf`：

```nginx
client_max_body_size 500G;  # 修改这个值
```

#### 配置域名

```nginx
server_name your-domain.com;  # 修改域名
```

#### 启用 HTTPS

1. 将证书放到 `nginx/ssl/` 目录
2. 取消 `nginx/conf.d/palmr.conf` 中 HTTPS 相关注释
3. 重载配置：`make reload-nginx`

## 更新应用

```bash
# 1. 拉取最新镜像
docker-compose -f docker-compose-nginx.yaml pull

# 2. 重新启动
make restart-nginx

# 或一步到位
docker-compose -f docker-compose-nginx.yaml up -d --force-recreate
```

## 故障排查

### 查看容器状态

```bash
docker ps -a
docker-compose -f docker-compose-nginx.yaml ps
```

### 查看日志

```bash
# 所有日志
docker-compose -f docker-compose-nginx.yaml logs

# Nginx 日志
docker logs palmr-nginx

# Palmr 日志
docker logs palmr
```

### 测试网络连接

```bash
# 从 Nginx 容器测试到 Palmr
docker exec palmr-nginx wget -O- http://palmr:5487

# 检查端口
docker exec palmr netstat -tlnp
```

### 重置服务

```bash
# 完全停止并清理
make stop-nginx
docker system prune -f

# 重新启动
make start-nginx
```

## 目录结构

```
Palmr/
├── docker-compose.yaml              # 独立部署配置
├── docker-compose-nginx.yaml        # Nginx + Palmr 配置
├── Makefile                         # 管理命令
├── nginx/
│   ├── nginx.conf                   # Nginx 主配置
│   ├── conf.d/
│   │   └── palmr.conf              # 反向代理配置
│   └── ssl/                         # SSL 证书（可选）
├── nginx-reload.sh                  # 重载脚本
├── nginx-logs.sh                    # 日志查看脚本
├── QUICK_START.md                   # 本文档
└── NGINX_DEPLOYMENT.md              # 详细部署文档
```

## 端口说明

| 部署方式   | Web 端口 | API 端口 | 访问地址              |
| ---------- | -------- | -------- | --------------------- |
| Nginx 方式 | 80       | 80/api   | http://localhost      |
| 独立方式   | 5487     | 3333     | http://localhost:5487 |

## 生产环境建议

1. ✅ 使用 **Nginx 方式**部署
2. ✅ 配置 **HTTPS** 证书
3. ✅ 设置 **域名**访问
4. ✅ 定期**备份数据**
5. ✅ 配置**日志轮转**
6. ✅ 监控**容器健康**

## 帮助命令

```bash
# 查看所有可用命令
make help
```

## 生产环境

**域名**: https://download.yipai360.com

生产环境已配置：

- ✅ HTTPS (TLS 1.2/1.3)
- ✅ HTTP/2
- ✅ 自动 HTTP 到 HTTPS 重定向
- ✅ HSTS 安全头
- ✅ 100GB 文件上传支持

详见：[生产环境部署指南](PRODUCTION_DEPLOYMENT.md)

## 相关文档

- [生产环境部署](PRODUCTION_DEPLOYMENT.md) - 完整的生产环境配置
- [详细部署文档](NGINX_DEPLOYMENT.md) - Nginx 详细配置说明
- [构建指南](BUILD_DEPLOY_GUIDE.md) - Docker 镜像构建
- [pnpm 更新指南](UPDATE_PNPM.md) - 依赖管理
