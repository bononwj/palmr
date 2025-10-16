# Palmr + Nginx 独立部署指南

## 架构说明

采用**双容器架构**：

```
用户请求 → Nginx 容器 (80/443) → Palmr 容器 (5487/3333)
```

**优势**：

- ✅ Nginx 配置独立，可快速修改重载
- ✅ 不影响主应用，零停机更新配置
- ✅ 支持 SSL、负载均衡、限流等高级功能
- ✅ 统一入口，易于管理和监控

## 文件结构

```
Palmr/
├── docker-compose.yaml              # 主应用配置（可独立运行）
├── docker-compose-nginx.yaml        # Nginx + 主应用配置（推荐生产环境）
├── nginx/
│   ├── nginx.conf                   # Nginx 主配置
│   ├── conf.d/
│   │   └── palmr.conf              # Palmr 反向代理配置
│   └── ssl/                         # SSL 证书目录（可选）
│       ├── cert.pem
│       └── key.pem
└── NGINX_DEPLOYMENT.md              # 本文档
```

## 快速开始

### 方案一：使用 Nginx 反向代理（推荐）

```bash
# 1. 登录阿里云镜像仓库
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com

# 2. 启动 Nginx + Palmr
docker-compose -f docker-compose-nginx.yaml up -d

# 3. 查看状态
docker-compose -f docker-compose-nginx.yaml ps

# 4. 查看日志
docker-compose -f docker-compose-nginx.yaml logs -f
```

**访问地址**：

- Web 应用：http://localhost
- API 接口：http://localhost/api/

### 方案二：独立运行（不使用 Nginx）

```bash
# 1. 登录阿里云镜像仓库
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com

# 2. 启动 Palmr
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

**访问地址**：

- Web 应用：http://localhost:5487
- API 接口：http://localhost:3333

## 配置管理

### 修改 Nginx 配置

1. **编辑配置文件**

```bash
# 编辑主配置
vim nginx/nginx.conf

# 编辑站点配置
vim nginx/conf.d/palmr.conf
```

2. **测试配置**

```bash
# 测试配置文件语法
docker exec palmr-nginx nginx -t
```

3. **重载配置（不停机）**

```bash
# 重新加载配置
docker exec palmr-nginx nginx -s reload

# 或使用 docker-compose
docker-compose -f docker-compose-nginx.yaml exec nginx nginx -s reload
```

4. **重启 Nginx（如果重载失败）**

```bash
docker-compose -f docker-compose-nginx.yaml restart nginx
```

### 自定义域名

编辑 `nginx/conf.d/palmr.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改这里

    # ... 其他配置
}
```

重载配置：

```bash
docker exec palmr-nginx nginx -s reload
```

### 启用 HTTPS

1. **准备 SSL 证书**

```bash
# 将证书文件放到 nginx/ssl/ 目录
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

2. **修改配置文件**

编辑 `nginx/conf.d/palmr.conf`，取消 HTTPS 相关配置的注释：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... 其他配置
}

# HTTP 跳转 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

3. **重载配置**

```bash
docker exec palmr-nginx nginx -s reload
```

## 管理命令

### 启动服务

```bash
# 使用 Nginx
docker-compose -f docker-compose-nginx.yaml up -d

# 不使用 Nginx
docker-compose up -d
```

### 停止服务

```bash
# 使用 Nginx
docker-compose -f docker-compose-nginx.yaml down

# 不使用 Nginx
docker-compose down
```

### 查看日志

```bash
# Nginx 日志
docker-compose -f docker-compose-nginx.yaml logs -f nginx

# Palmr 日志
docker-compose -f docker-compose-nginx.yaml logs -f palmr

# 查看所有日志
docker-compose -f docker-compose-nginx.yaml logs -f
```

### 重启服务

```bash
# 只重启 Nginx
docker-compose -f docker-compose-nginx.yaml restart nginx

# 只重启 Palmr
docker-compose -f docker-compose-nginx.yaml restart palmr

# 重启所有
docker-compose -f docker-compose-nginx.yaml restart
```

### 更新镜像

```bash
# 拉取最新镜像
docker-compose -f docker-compose-nginx.yaml pull

# 重新启动（使用新镜像）
docker-compose -f docker-compose-nginx.yaml up -d
```

### 进入容器

```bash
# 进入 Nginx 容器
docker exec -it palmr-nginx sh

# 进入 Palmr 容器
docker exec -it palmr sh
```

## 常见配置场景

### 1. 限制上传文件大小

编辑 `nginx/conf.d/palmr.conf`：

```nginx
server {
    client_max_body_size 500G;  # 修改这里
    # ...
}
```

### 2. 配置访问限流

编辑 `nginx/conf.d/palmr.conf`：

```nginx
# 在 server 块外定义限流规则
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # 应用限流
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ... 其他配置
    }
}
```

### 3. 添加 IP 白名单

```nginx
server {
    # 只允许特定 IP 访问
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    # ... 其他配置
}
```

### 4. 配置跨域（CORS）

```nginx
location /api/ {
    # 跨域配置
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    proxy_pass http://palmr_api;
    # ... 其他配置
}
```

## 监控和维护

### 查看 Nginx 状态

```bash
# 查看 Nginx 进程
docker exec palmr-nginx ps aux | grep nginx

# 测试配置
docker exec palmr-nginx nginx -t

# 查看访问日志（实时）
docker exec palmr-nginx tail -f /var/log/nginx/palmr_access.log

# 查看错误日志
docker exec palmr-nginx tail -f /var/log/nginx/palmr_error.log
```

### 健康检查

```bash
# 检查 Nginx 健康状态
curl http://localhost/nginx-health

# 检查 Palmr 应用
curl http://localhost/
```

### 日志分析

```bash
# 访问最多的 IP
docker exec palmr-nginx awk '{print $1}' /var/log/nginx/palmr_access.log | sort | uniq -c | sort -rn | head -10

# 访问最多的 URL
docker exec palmr-nginx awk '{print $7}' /var/log/nginx/palmr_access.log | sort | uniq -c | sort -rn | head -10

# 统计响应状态码
docker exec palmr-nginx awk '{print $9}' /var/log/nginx/palmr_access.log | sort | uniq -c | sort -rn
```

## 故障排查

### 问题 1：Nginx 无法启动

```bash
# 查看日志
docker-compose -f docker-compose-nginx.yaml logs nginx

# 检查配置
docker exec palmr-nginx nginx -t

# 检查端口占用
netstat -tlnp | grep -E ":(80|443)"
```

### 问题 2：无法访问应用

```bash
# 检查容器状态
docker-compose -f docker-compose-nginx.yaml ps

# 检查网络连接
docker exec palmr-nginx ping palmr

# 查看 Nginx 错误日志
docker exec palmr-nginx tail -100 /var/log/nginx/error.log
```

### 问题 3：502 Bad Gateway

```bash
# 检查 Palmr 容器是否运行
docker ps | grep palmr

# 检查 Palmr 端口
docker exec palmr netstat -tlnp | grep -E ":(5487|3333)"

# 重启 Palmr
docker-compose -f docker-compose-nginx.yaml restart palmr
```

### 问题 4：文件上传失败

检查以下配置：

- `client_max_body_size` 是否足够大
- `proxy_request_buffering` 是否关闭
- 超时设置是否合理

## 备份和恢复

### 备份配置

```bash
# 备份 Nginx 配置
tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz nginx/

# 备份应用数据
docker run --rm -v palmr_data:/data -v $(pwd):/backup alpine tar czf /backup/palmr-data-backup-$(date +%Y%m%d).tar.gz /data
```

### 恢复配置

```bash
# 恢复 Nginx 配置
tar -xzf nginx-config-backup-20231016.tar.gz

# 重载配置
docker exec palmr-nginx nginx -s reload
```

## 性能优化

### 1. 启用 HTTP/2

```nginx
server {
    listen 443 ssl http2;  # 添加 http2
    # ...
}
```

### 2. 配置缓存

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=palmr_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    location / {
        proxy_cache palmr_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        # ...
    }
}
```

### 3. 调整工作进程

编辑 `nginx/nginx.conf`：

```nginx
worker_processes auto;  # 自动根据 CPU 核心数调整
worker_connections 2048;  # 增加连接数
```

## 安全建议

1. **定期更新镜像**

   ```bash
   docker-compose -f docker-compose-nginx.yaml pull
   docker-compose -f docker-compose-nginx.yaml up -d
   ```

2. **使用 HTTPS**

   - 获取 Let's Encrypt 免费证书
   - 配置 HTTPS 重定向

3. **限制访问**

   - 配置 IP 白名单
   - 添加访问限流
   - 启用 fail2ban

4. **监控日志**
   - 定期检查错误日志
   - 监控异常访问
   - 设置日志轮转

## 总结

- **开发环境**：使用 `docker-compose.yaml`（直接访问）
- **生产环境**：使用 `docker-compose-nginx.yaml`（通过 Nginx）
- **修改配置**：编辑 `nginx/conf.d/palmr.conf` 后执行 `nginx -s reload`
- **查看日志**：`docker-compose -f docker-compose-nginx.yaml logs -f`
