# Palmr 生产环境部署指南

## 环境信息

- **域名**: download.yipai360.com
- **SSL 证书路径**:
  - 证书文件: `/etc/nginx/cert/yipai360.com.pem`
  - 私钥文件: `/etc/nginx/cert/yipai360.com.key`
- **镜像仓库**: cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com/yipai/palmr
- **访问协议**: HTTPS (自动从 HTTP 重定向)

## 部署前准备

### 1. 确认 SSL 证书

```bash
# 检查证书文件是否存在
ls -lh /etc/nginx/cert/yipai360.com.pem
ls -lh /etc/nginx/cert/yipai360.com.key

# 检查证书有效期
openssl x509 -in /etc/nginx/cert/yipai360.com.pem -noout -dates

# 验证证书和密钥是否匹配
openssl x509 -noout -modulus -in /etc/nginx/cert/yipai360.com.pem | openssl md5
openssl rsa -noout -modulus -in /etc/nginx/cert/yipai360.com.key | openssl md5
# 两个 MD5 值应该相同
```

### 2. 确认证书权限

```bash
# 确保证书文件权限正确
sudo chmod 644 /etc/nginx/cert/yipai360.com.pem
sudo chmod 600 /etc/nginx/cert/yipai360.com.key
```

### 3. 确认域名解析

```bash
# 检查域名是否解析到当前服务器
nslookup download.yipai360.com

# 或使用 dig
dig download.yipai360.com +short
```

### 4. 登录镜像仓库

```bash
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
```

## 快速部署

### 一键启动

```bash
# 1. 进入项目目录
cd /path/to/Palmr

# 2. 启动服务（Nginx + Palmr）
make start-nginx

# 3. 查看状态
docker-compose -f docker-compose-nginx.yaml ps

# 4. 查看日志
make logs-nginx
```

### 验证部署

```bash
# 1. 检查 HTTP 重定向（应该返回 301）
curl -I http://download.yipai360.com

# 2. 检查 HTTPS 访问（应该返回 200）
curl -I https://download.yipai360.com

# 3. 测试健康检查
curl https://download.yipai360.com/nginx-health
```

## 详细部署步骤

### 步骤 1: 准备项目文件

```bash
# 克隆或上传项目到服务器
# 确保以下文件存在：
# - docker-compose-nginx.yaml
# - nginx/nginx.conf
# - nginx/conf.d/palmr.conf
```

### 步骤 2: 确认配置

查看 `docker-compose-nginx.yaml` 确保配置正确：

```yaml
services:
  nginx:
    volumes:
      - /etc/nginx/cert:/etc/nginx/cert:ro # ✅ 证书路径
    ports:
      - "80:80" # ✅ HTTP 端口
      - "443:443" # ✅ HTTPS 端口

  palmr:
    environment:
      - SECURE_SITE=true # ✅ 启用 HTTPS 模式
```

查看 `nginx/conf.d/palmr.conf` 确保配置正确：

```nginx
server {
    listen 80;
    server_name download.yipai360.com;  # ✅ 域名
    return 301 https://$server_name$request_uri;  # ✅ HTTPS 重定向
}

server {
    listen 443 ssl http2;
    server_name download.yipai360.com;  # ✅ 域名

    ssl_certificate /etc/nginx/cert/yipai360.com.pem;      # ✅ 证书
    ssl_certificate_key /etc/nginx/cert/yipai360.com.key;  # ✅ 私钥
}
```

### 步骤 3: 启动服务

```bash
# 使用 docker-compose 启动
docker-compose -f docker-compose-nginx.yaml up -d

# 或使用 make 命令
make start-nginx
```

### 步骤 4: 验证服务

```bash
# 检查容器状态
docker ps

# 应该看到两个容器：
# - palmr-nginx
# - palmr

# 查看日志
docker-compose -f docker-compose-nginx.yaml logs -f
```

### 步骤 5: 测试访问

1. **浏览器测试**

   - 访问: https://download.yipai360.com
   - 检查证书是否有效
   - 检查页面是否正常加载

2. **命令行测试**

   ```bash
   # HTTP 自动重定向到 HTTPS
   curl -L http://download.yipai360.com

   # HTTPS 访问
   curl https://download.yipai360.com

   # 测试 API
   curl https://download.yipai360.com/api/health
   ```

## 配置说明

### SSL/TLS 配置

当前配置的安全特性：

- ✅ **TLS 1.2 和 1.3** - 现代加密协议
- ✅ **HTTP/2** - 提升性能
- ✅ **HSTS** - 强制 HTTPS 访问
- ✅ **现代加密套件** - 安全的加密算法
- ✅ **会话复用** - 提升 SSL 握手性能

### 上传大小限制

当前配置支持：

- **最大上传**: 100GB
- **连接超时**: 600 秒
- **读写超时**: 600 秒

如需修改，编辑 `nginx/conf.d/palmr.conf`：

```nginx
client_max_body_size 500G;  # 修改上传限制
proxy_read_timeout 1200;    # 修改超时时间
```

## 管理命令

### 服务管理

```bash
# 启动服务
make start-nginx

# 停止服务
make stop-nginx

# 重启服务
make restart-nginx

# 查看状态
docker-compose -f docker-compose-nginx.yaml ps
```

### Nginx 配置管理

```bash
# 测试配置
make test-nginx

# 重载配置（修改后不停机）
make reload-nginx

# 查看日志
make logs-nginx

# 进入 Nginx 容器
make shell-nginx
```

### 更新应用

```bash
# 1. 拉取最新镜像
docker-compose -f docker-compose-nginx.yaml pull palmr

# 2. 重启 Palmr 容器（Nginx 不受影响）
docker-compose -f docker-compose-nginx.yaml up -d palmr

# 3. 查看日志确认启动成功
docker logs -f palmr
```

## 监控和维护

### 日志查看

```bash
# Nginx 访问日志
docker exec palmr-nginx tail -f /var/log/nginx/palmr_access.log

# Nginx 错误日志
docker exec palmr-nginx tail -f /var/log/nginx/palmr_error.log

# Palmr 应用日志
docker logs -f palmr

# 所有日志
docker-compose -f docker-compose-nginx.yaml logs -f
```

### 健康检查

```bash
# Nginx 健康检查
curl https://download.yipai360.com/nginx-health

# 检查容器状态
docker ps
docker-compose -f docker-compose-nginx.yaml ps

# 检查资源使用
docker stats palmr palmr-nginx
```

### SSL 证书监控

```bash
# 检查证书有效期
openssl s_client -connect download.yipai360.com:443 -servername download.yipai360.com 2>/dev/null | openssl x509 -noout -dates

# 创建监控脚本
cat > /usr/local/bin/check-ssl-expiry.sh << 'EOF'
#!/bin/bash
DAYS=$(openssl s_client -connect download.yipai360.com:443 -servername download.yipai360.com 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2 | xargs -I {} date -d "{}" +%s | xargs -I {} echo "({} - $(date +%s)) / 86400" | bc)
if [ $DAYS -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS days"
fi
EOF

chmod +x /usr/local/bin/check-ssl-expiry.sh
```

## 故障排查

### 问题 1: 无法访问 HTTPS

```bash
# 1. 检查端口是否开放
netstat -tlnp | grep -E ":(80|443)"

# 2. 检查防火墙
sudo firewall-cmd --list-ports  # CentOS/RHEL
sudo ufw status                  # Ubuntu

# 3. 开放端口（如果未开放）
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 或 Ubuntu
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 问题 2: SSL 证书错误

```bash
# 1. 检查证书文件
ls -lh /etc/nginx/cert/

# 2. 验证证书
openssl x509 -in /etc/nginx/cert/yipai360.com.pem -text -noout

# 3. 检查 Nginx 日志
docker logs palmr-nginx

# 4. 重启 Nginx
docker-compose -f docker-compose-nginx.yaml restart nginx
```

### 问题 3: HTTP 不重定向到 HTTPS

```bash
# 1. 检查 Nginx 配置
docker exec palmr-nginx cat /etc/nginx/conf.d/palmr.conf

# 2. 测试配置
docker exec palmr-nginx nginx -t

# 3. 重载配置
make reload-nginx
```

### 问题 4: 502 Bad Gateway

```bash
# 1. 检查 Palmr 容器是否运行
docker ps | grep palmr

# 2. 检查 Palmr 日志
docker logs palmr

# 3. 检查网络连接
docker exec palmr-nginx ping palmr

# 4. 重启 Palmr
docker-compose -f docker-compose-nginx.yaml restart palmr
```

## 备份和恢复

### 备份配置

```bash
# 备份 Nginx 配置
tar -czf palmr-nginx-config-$(date +%Y%m%d).tar.gz nginx/

# 备份应用数据
docker run --rm \
  -v palmr_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/palmr-data-$(date +%Y%m%d).tar.gz /data
```

### 恢复配置

```bash
# 恢复 Nginx 配置
tar -xzf palmr-nginx-config-20231016.tar.gz

# 重载 Nginx
make reload-nginx
```

## 安全建议

### 1. 定期更新证书

```bash
# 设置证书过期提醒（crontab）
0 0 * * * /usr/local/bin/check-ssl-expiry.sh
```

### 2. 定期更新镜像

```bash
# 每周检查更新
docker-compose -f docker-compose-nginx.yaml pull
docker-compose -f docker-compose-nginx.yaml up -d
```

### 3. 配置日志轮转

创建 `/etc/logrotate.d/palmr-nginx`：

```
/var/lib/docker/volumes/palmr_nginx_logs/_data/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    sharedscripts
    postrotate
        docker exec palmr-nginx nginx -s reopen
    endscript
}
```

### 4. 监控异常访问

```bash
# 查看失败的请求
docker exec palmr-nginx grep " 4[0-9][0-9] " /var/log/nginx/palmr_access.log | tail -50

# 查看服务器错误
docker exec palmr-nginx grep " 5[0-9][0-9] " /var/log/nginx/palmr_access.log | tail -50
```

## 性能优化

### 1. 启用缓存（如需要）

编辑 `nginx/nginx.conf`，在 `http` 块中添加：

```nginx
proxy_cache_path /var/cache/nginx
    levels=1:2
    keys_zone=palmr_cache:10m
    max_size=10g
    inactive=60m;
```

### 2. 调整工作进程

编辑 `nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_connections 2048;
```

### 3. 优化 SSL 性能

已配置的优化：

- ✅ SSL 会话缓存
- ✅ HTTP/2
- ✅ OCSP Stapling（可选添加）

## 访问地址

- **生产环境**: https://download.yipai360.com
- **HTTP** (自动重定向): http://download.yipai360.com

## 技术支持

如遇到问题，请检查：

1. 容器日志：`make logs-nginx`
2. Nginx 配置：`make test-nginx`
3. 证书状态：查看证书有效期
4. 网络连接：检查防火墙和端口

## 相关文档

- [快速开始](QUICK_START.md)
- [Nginx 详细配置](NGINX_DEPLOYMENT.md)
- [构建指南](BUILD_DEPLOY_GUIDE.md)
