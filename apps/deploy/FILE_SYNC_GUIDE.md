# 双服务器文件同步指南

## 概述

基于智能 DNS + Nginx 反向代理实现双城市服务器部署，自动同步文件。

**架构：方案 C - 智能 DNS + 统一上传到成都**

```
全国用户 → download.yipai360.com (智能DNS)
    ↓ 西南用户                    ↓ 华东用户
成都服务器                       上海服务器
Next.js(3000)                   Next.js(3000)
    ↓ API_BASE_URL=localhost        ↓ API_BASE_URL=https://域名/api-internal
Server(3333本地) ← 上传          Nginx /api-internal/ → 成都Server
    ↓ rsync同步                      ↓ 下载
上海Server(3333)                Server(3333本地)
```

**关键特性：**

1. ✅ **智能 DNS**：全国用户就近访问（西南 → 成都，华东 → 上海）
2. ✅ **统一上传**：所有上传都通过成都服务器处理
3. ✅ **就近下载**：下载从本地服务器读取，速度快
4. ✅ **安全代理**：上海 → 成都通过 Nginx 反向代理（HTTPS + IP 白名单）
5. ✅ **自动同步**：rsync over SSH 实时同步文件到上海

**配置文件：**

- `ecosystem.config.cd.js` - 成都服务器配置
- `ecosystem.config.sh.js` - 上海服务器配置
- `nginx/conf.d/download.yipai360.com.conf` - Nginx 配置（两台服务器相同）

## 前置条件

### 安装 rsync

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install rsync
```

**CentOS/RHEL:**

```bash
sudo yum install rsync
```

- 服务器 A 可通过 SSH 访问服务器 B

## 配置步骤

### 1. SSH 免密登录

在服务器 A 上执行：

```bash
# 生成密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/palmr_sync_rsa -N ""

# 复制公钥到服务器 B
ssh-copy-id -i ~/.ssh/palmr_sync_rsa.pub user@server-b-ip

# 测试连接
ssh -i ~/.ssh/palmr_sync_rsa user@server-b-ip
```

### 2. 配置 PM2

#### 成都服务器（`ecosystem.config.cd.js`）

```javascript
module.exports = {
  apps: [
    {
      name: "next-app",
      script: "apps/web/.next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        API_BASE_URL: "http://localhost:3333", // 本地调用
      },
      // ... 其他配置
    },
    {
      name: "server-app",
      script: "apps/server/dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
        DATABASE_URL: process.env.DATABASE_URL,
        // 文件同步配置 - 启用
        SYNC_ENABLED: "true",
        SYNC_REMOTE_HOST: "139.224.82.205", // 上海服务器IP
        SYNC_REMOTE_USER: "root",
        SYNC_REMOTE_PATH: "/data/wwwroot/download.yipai360.com/uploads",
        SYNC_SSH_KEY_PATH: "/root/.ssh/palmr_sync_rsa",
        SYNC_RETRY_TIMES: "3",
        SYNC_RETRY_DELAY: "5000",
        SYNC_MAX_CONCURRENT: "3",
      },
      // ... 其他配置
    },
  ],
};
```

#### 上海服务器（`ecosystem.config.sh.js`）

```javascript
module.exports = {
  apps: [
    {
      name: "next-app",
      script: "apps/web/.next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // 关键：通过Nginx反向代理访问成都服务器（安全）
        API_BASE_URL: "https://download.yipai360.com/api-internal",
      },
      // ... 其他配置
    },
    {
      name: "server-app",
      script: "apps/server/dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
        DATABASE_URL: process.env.DATABASE_URL,
        // 文件同步配置 - 不启用
        SYNC_ENABLED: "false",
      },
      // ... 其他配置
    },
  ],
};
```

### 3. 配置 Nginx

**两台服务器使用相同的 Nginx 配置**：`apps/deploy/nginx/conf.d/download.yipai360.com.conf`

关键配置已包含：

```nginx
# 代理本地 Next.js
upstream next_web {
    server localhost:3000;
}

# 代理本地 Server API
upstream server_api {
    server localhost:3333;
}

server {
    listen 443 ssl;
    server_name download.yipai360.com;

    # 所有Web请求代理到本地Next.js
    location / {
        proxy_pass http://next_web;
        # ... 其他配置
    }

    # API内部代理 - 仅供上海服务器访问（用于跨城市上传）
    # 该配置在成都服务器生效，上海服务器配置了也无妨
    location /api-internal/ {
        # 只允许上海服务器访问
        allow 139.224.82.205;  # 上海服务器IP
        deny all;

        # 代理到本地Server API
        proxy_pass http://localhost:3333/;
        proxy_http_version 1.1;

        # 超时设置（大文件上传）
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;

        # 禁用缓冲（大文件上传）
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

**工作原理：**

1. **成都服务器**：

   - 用户请求 → Nginx → 本地 Next.js → 本地 Server(3333)
   - `/api-internal/` 路径接受上海服务器的跨城市 API 请求

2. **上海服务器**：
   - 用户请求 → Nginx → 本地 Next.js → 成都 Server(`https://域名/api-internal`)
   - 下载使用本地 Server(3333)，速度快

**部署配置：**

```bash
# 两台服务器都执行
sudo nginx -t && sudo nginx -s reload
```

### 4. 重启服务

```bash
pm2 restart server-app
```

## 验证

### 查看同步状态

```bash
# 查看启动日志
pm2 logs server-app | grep "File sync service initialized"

# 查看同步状态 API
curl http://localhost:3333/api/sync/status

# 查看同步历史
curl http://localhost:3333/api/sync/history
```

### 测试文件同步

1. 上传一个测试文件
2. 检查服务器 A 的日志：`pm2 logs server-app | grep SYNC`
3. 确认服务器 B 上有该文件：`ls /data/wwwroot/download.yipai360.com/uploads/`

## 环境变量说明

| 变量                  | 默认值          | 说明                      |
| --------------------- | --------------- | ------------------------- |
| `SYNC_ENABLED`        | `false`         | 是否启用同步              |
| `SYNC_REMOTE_HOST`    | -               | 远程服务器 IP             |
| `SYNC_REMOTE_USER`    | -               | SSH 用户名                |
| `SYNC_REMOTE_PATH`    | -               | 远程 uploads 目录绝对路径 |
| `SYNC_SSH_KEY_PATH`   | `~/.ssh/id_rsa` | SSH 私钥路径              |
| `SYNC_RETRY_TIMES`    | `3`             | 失败重试次数              |
| `SYNC_RETRY_DELAY`    | `5000`          | 重试延迟(毫秒)            |
| `SYNC_MAX_CONCURRENT` | `3`             | 最大并发数                |

## 故障排查

### SSH 连接失败

```bash
# 测试连接
ssh -i ~/.ssh/palmr_sync_rsa -v user@server-b-ip

# 检查密钥权限
chmod 600 ~/.ssh/palmr_sync_rsa
```

### 权限被拒绝

```bash
# 在服务器 B 上设置权限
sudo chown -R 用户名:用户名 /data/wwwroot/download.yipai360.com/uploads
sudo chmod -R 755 /data/wwwroot/download.yipai360.com/uploads
```

### 查看详细错误

```bash
# 查看错误日志
pm2 logs server-app --err

# 查看同步历史（包含失败信息）
curl http://localhost:3333/api/sync/history | jq '.history[] | select(.status=="failed")'
```

## 同步 API

### 查看状态

```bash
GET /api/sync/status
```

### 查看历史

```bash
GET /api/sync/history?limit=50
```

### 重试失败任务

```bash
POST /api/sync/retry/{taskId}
```

## 安全性说明

### Nginx 反向代理 + IP 白名单

本方案使用 Nginx 反向代理替代直接暴露 3333 端口，具有以下优势：

1. **HTTPS 加密**：跨城市 API 通信使用 HTTPS，数据加密传输
2. **IP 白名单**：只允许上海服务器 IP 访问 `/api-internal/` 路径
3. **无需开放防火墙**：成都服务器的 3333 端口无需对外开放
4. **统一入口**：所有外部访问通过 443 端口，便于管理

### 安全验证

```bash
# 在成都服务器测试（应该成功）
curl -k https://download.yipai360.com/api-internal/api/health

# 从其他IP测试（应该返回403 Forbidden）
curl https://download.yipai360.com/api-internal/api/health
```

## 注意事项

1. ✅ **两台服务器 Nginx 配置相同**：简化维护，无需区分配置
2. ✅ **智能 DNS 必须配置**：确保用户就近访问（阿里云 DNS/腾讯云 DNS）
3. ⚠️ **上海服务器不启用同步**：避免循环同步（`SYNC_ENABLED: "false"`）
4. ⚠️ **共享数据库**：两台服务器使用同一个外部数据库
5. ⚠️ **环境变量由 PM2 管理**：不需要 .env 文件，直接修改 `ecosystem.config.*.js`
6. 💡 **首次全量同步**：如果成都服务器已有文件，建议手动同步一次：
   ```bash
   # 在成都服务器执行
   rsync -avz --progress \
     -e "ssh -i /root/.ssh/palmr_sync_rsa" \
     /data/wwwroot/download.yipai360.com/uploads/ \
     root@139.224.82.205:/data/wwwroot/download.yipai360.com/uploads/
   ```

## 快速部署清单

### 成都服务器（主服务器）

- [ ] 1. 生成 SSH 密钥并复制到上海服务器

  ```bash
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/palmr_sync_rsa -N ""
  ssh-copy-id -i ~/.ssh/palmr_sync_rsa.pub root@139.224.82.205
  ssh -i ~/.ssh/palmr_sync_rsa root@139.224.82.205  # 测试连接
  ```

- [ ] 2. 使用 `ecosystem.config.cd.js` 配置 PM2

  ```bash
  pm2 delete all
  pm2 start apps/deploy/ecosystem.config.cd.js
  pm2 save
  ```

- [ ] 3. 部署 Nginx 配置

  ```bash
  sudo cp apps/deploy/nginx/conf.d/download.yipai360.com.conf /etc/nginx/conf.d/
  sudo nginx -t
  sudo nginx -s reload
  ```

- [ ] 4. 验证同步服务启动
  ```bash
  pm2 logs server-app | grep "File sync service initialized"
  curl http://localhost:3333/api/sync/status
  ```

### 上海服务器（从服务器）

- [ ] 1. 确保 `uploads` 目录存在并有权限

  ```bash
  mkdir -p /data/wwwroot/download.yipai360.com/uploads
  chmod 755 /data/wwwroot/download.yipai360.com/uploads
  ```

- [ ] 2. 使用 `ecosystem.config.sh.js` 配置 PM2

  ```bash
  pm2 delete all
  pm2 start apps/deploy/ecosystem.config.sh.js
  pm2 save
  ```

- [ ] 3. 部署 Nginx 配置（与成都相同）

  ```bash
  sudo cp apps/deploy/nginx/conf.d/download.yipai360.com.conf /etc/nginx/conf.d/
  sudo nginx -t
  sudo nginx -s reload
  ```

- [ ] 4. 验证可以访问成都服务器 API
  ```bash
  curl -k https://download.yipai360.com/api-internal/api/health
  ```

### 智能 DNS 配置

- [ ] 配置阿里云/腾讯云智能 DNS
  - A 记录（西南地区）→ 成都服务器 IP
  - A 记录（华东地区）→ 上海服务器 IP

### 首次同步（如果成都已有文件）

- [ ] 从成都手动全量同步到上海
  ```bash
  rsync -avz --progress \
    -e "ssh -i /root/.ssh/palmr_sync_rsa" \
    /data/wwwroot/download.yipai360.com/uploads/ \
    root@139.224.82.205:/data/wwwroot/download.yipai360.com/uploads/
  ```

---

**文档版本**: v2.0.0  
**最后更新**: 2025-10-29  
**架构方案**: 方案 C - 智能 DNS + Nginx 反向代理
