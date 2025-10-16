# Nginx 配置文件说明

## 文件结构

```
nginx/
├── nginx.conf              # Nginx 主配置文件
├── conf.d/
│   └── palmr.conf         # Palmr 应用反向代理配置
├── ssl/                    # SSL 证书目录（可选）
│   ├── cert.pem           # SSL 证书文件
│   └── key.pem            # SSL 私钥文件
└── README.md              # 本文档
```

## 配置文件说明

### nginx.conf

主配置文件，包含：

- 工作进程配置
- 日志格式
- Gzip 压缩设置
- 全局性能参数

**一般不需要修改此文件**

### conf.d/palmr.conf

Palmr 应用的反向代理配置，包含：

- 上游服务器定义（palmr:5487 和 palmr:3333）
- HTTP 服务器配置
- 反向代理规则
- 文件上传大小限制
- HTTPS 配置示例（注释状态）

**修改此文件来调整应用配置**

## 常见配置任务

### 1. 修改上传文件大小限制

编辑 `conf.d/palmr.conf`，找到：

```nginx
client_max_body_size 100G;  # 修改这个值
```

### 2. 配置自定义域名

编辑 `conf.d/palmr.conf`，修改：

```nginx
server_name localhost;  # 改为你的域名，如：palmr.example.com
```

### 3. 启用 HTTPS

1. 准备 SSL 证书文件：

   ```bash
   # 将证书文件复制到 ssl 目录
   cp your-cert.pem ssl/cert.pem
   cp your-key.pem ssl/key.pem
   ```

2. 编辑 `conf.d/palmr.conf`，取消 HTTPS 相关配置的注释

3. 重载配置：
   ```bash
   make reload-nginx
   ```

### 4. 配置访问限流

在 `conf.d/palmr.conf` 中添加：

```nginx
# 在 server 块外定义
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # 在需要限流的 location 中应用
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ...
    }
}
```

### 5. IP 白名单

在 `server` 块中添加：

```nginx
server {
    # 只允许特定 IP 访问
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    # ...
}
```

## 配置修改流程

```bash
# 1. 编辑配置文件
vim nginx/conf.d/palmr.conf

# 2. 测试配置语法
make test-nginx

# 3. 重载配置（不停机）
make reload-nginx

# 4. 如果重载失败，查看日志
make logs-nginx
```

## 配置文件语法验证

```bash
# 测试配置
docker exec palmr-nginx nginx -t

# 查看配置详情
docker exec palmr-nginx nginx -T
```

## SSL 证书获取

### 使用 Let's Encrypt（免费）

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书（需要域名已解析）
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 复制证书到 nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 使用自签名证书（测试用）

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# 填写信息时，Common Name 填写域名或 IP
```

## 日志文件

- **访问日志**: `/var/log/nginx/palmr_access.log`
- **错误日志**: `/var/log/nginx/palmr_error.log`

查看日志：

```bash
# 实时查看访问日志
docker exec palmr-nginx tail -f /var/log/nginx/palmr_access.log

# 实时查看错误日志
docker exec palmr-nginx tail -f /var/log/nginx/palmr_error.log

# 使用脚本（交互式）
make logs-nginx
```

## 性能调优

### 调整工作进程数

编辑 `nginx.conf`：

```nginx
worker_processes auto;     # 自动匹配 CPU 核心数
worker_connections 2048;   # 每个进程的连接数
```

### 启用 HTTP/2

编辑 `conf.d/palmr.conf`：

```nginx
server {
    listen 443 ssl http2;  # 添加 http2
    # ...
}
```

### 配置缓存

在 `nginx.conf` 的 `http` 块中添加：

```nginx
proxy_cache_path /var/cache/nginx
    levels=1:2
    keys_zone=palmr_cache:10m
    max_size=1g
    inactive=60m
    use_temp_path=off;
```

在 `conf.d/palmr.conf` 中使用：

```nginx
location / {
    proxy_cache palmr_cache;
    proxy_cache_valid 200 10m;
    # ...
}
```

## 注意事项

1. ⚠️ 修改配置后务必先**测试**再**重载**
2. ⚠️ 备份配置文件再修改
3. ⚠️ SSL 证书文件权限应为 600 或 400
4. ⚠️ 大文件上传需要调整超时和缓冲设置

## 相关文档

- [快速开始](../QUICK_START.md)
- [详细部署文档](../NGINX_DEPLOYMENT.md)
