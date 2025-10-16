# 🎯 部署问题解决方案总结

## 问题描述

在服务器 `/root/nginx-config/` 目录下部署时，遇到路径映射错误：

```
error mounting "/root/nginx-config/nginx/nginx.conf" to rootfs at "/etc/nginx/nginx.conf"
```

## 根本原因

`docker-compose-nginx.yaml` 使用相对路径 `./nginx/`，Docker Compose 会基于**执行命令的当前目录**解析相对路径，必须在项目根目录执行。

## ✅ 解决方案（3 种方式）

### 方案 1：使用部署脚本（最推荐）⭐

```bash
# 在任意目录执行都可以
./deploy-production.sh
```

**优势**：

- ✅ 自动检测项目路径
- ✅ 自动生成正确配置
- ✅ 提供交互式菜单
- ✅ 包含完整的健康检查

**适用场景**：生产环境首选

---

### 方案 2：在正确目录执行

```bash
# 1. 切换到项目根目录
cd /root/nginx-config

# 2. 确认目录结构
ls nginx/  # 应该看到 nginx.conf 和 conf.d/

# 3. 执行部署
docker-compose -f docker-compose-nginx.yaml up -d
```

**优势**：

- ✅ 不需要修改配置文件
- ✅ 简单直接

**注意事项**：

- ⚠️ 必须在包含 `nginx/` 目录的根目录执行
- ⚠️ 相对路径会基于当前目录解析

**适用场景**：手动部署、开发环境

---

### 方案 3：使用 make 命令

```bash
# 在项目目录执行
make deploy-prod
```

**优势**：

- ✅ 命令简洁
- ✅ 调用部署脚本
- ✅ 自动处理路径

**适用场景**：熟悉 Makefile 的用户

---

## 📋 完整部署流程

### 步骤 1：准备环境

```bash
# 1. 进入项目目录
cd /root/nginx-config

# 2. 确认文件结构
tree -L 2
# 或
ls -la

# 应该看到：
# nginx/
# docker-compose-nginx.yaml
# deploy-production.sh
```

### 步骤 2：登录镜像仓库

```bash
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
```

### 步骤 3：执行部署（选择一种方式）

**方式 A：使用脚本（推荐）**

```bash
chmod +x deploy-production.sh
./deploy-production.sh
# 选择 1 - 启动服务
```

**方式 B：手动部署**

```bash
cd /root/nginx-config
docker-compose -f docker-compose-nginx.yaml up -d
```

**方式 C：使用 make**

```bash
make deploy-prod
```

### 步骤 4：验证部署

```bash
# 检查容器状态
docker ps

# 测试访问
curl -I https://download.yipai360.com

# 查看日志
docker logs -f palmr-nginx
docker logs -f palmr
```

---

## 🔧 常用操作

### 查看状态

```bash
docker ps
docker-compose -f docker-compose-nginx.yaml ps
```

### 查看日志

```bash
# 实时日志
docker logs -f palmr-nginx
docker logs -f palmr

# 或使用 compose
docker-compose -f docker-compose-nginx.yaml logs -f
```

### 重启服务

```bash
# 重启所有
docker-compose -f docker-compose-nginx.yaml restart

# 只重启 Nginx
docker restart palmr-nginx

# 只重启 Palmr
docker restart palmr
```

### 停止服务

```bash
docker-compose -f docker-compose-nginx.yaml down
```

### 修改 Nginx 配置

```bash
# 1. 编辑配置
vim nginx/conf.d/palmr.conf

# 2. 测试配置
docker exec palmr-nginx nginx -t

# 3. 重载配置（不停机）
docker exec palmr-nginx nginx -s reload
```

---

## 🐛 故障排查

### 问题：路径映射错误

**症状**：

```
error mounting "xxx/nginx.conf" to rootfs
```

**解决**：

```bash
# 检查当前目录
pwd

# 应该在项目根目录
cd /root/nginx-config

# 重新部署
./deploy-production.sh
```

### 问题：容器无法启动

```bash
# 1. 查看详细日志
docker-compose -f docker-compose-nginx.yaml logs

# 2. 检查容器状态
docker ps -a

# 3. 检查端口占用
netstat -tlnp | grep -E ":(80|443)"
```

### 问题：SSL 证书错误

```bash
# 检查证书文件
ls -lh /etc/nginx/cert/

# 验证证书
openssl x509 -in /etc/nginx/cert/yipai360.com.pem -noout -dates

# 检查权限
sudo chmod 644 /etc/nginx/cert/yipai360.com.pem
sudo chmod 600 /etc/nginx/cert/yipai360.com.key
```

### 问题：无法访问服务

```bash
# 1. 检查容器运行状态
docker ps | grep palmr

# 2. 检查网络连通性
docker exec palmr-nginx ping palmr

# 3. 检查端口
docker exec palmr netstat -tlnp | grep -E ":(5487|3333)"

# 4. 检查防火墙
sudo firewall-cmd --list-ports
sudo ufw status
```

---

## 📚 相关文档

- **[快速部署指南](PRODUCTION_QUICK_DEPLOY.md)** - 解决路径问题的详细说明
- **[生产环境部署](PRODUCTION_DEPLOYMENT.md)** - 完整部署文档
- **[部署检查清单](DEPLOYMENT_CHECKLIST.md)** - 逐项检查指南
- **[快速开始](QUICK_START.md)** - 基础入门
- **[Nginx 配置](NGINX_DEPLOYMENT.md)** - 配置详解

---

## 🎯 推荐部署方式

| 场景                 | 推荐方式   | 命令                                                  |
| -------------------- | ---------- | ----------------------------------------------------- |
| **生产环境首次部署** | 部署脚本   | `./deploy-production.sh`                              |
| **生产环境日常维护** | 手动命令   | `docker-compose -f docker-compose-nginx.yaml restart` |
| **配置修改重载**     | Nginx 重载 | `docker exec palmr-nginx nginx -s reload`             |
| **快速测试**         | Make 命令  | `make deploy-prod`                                    |

---

## ✅ 核心要点

1. **路径问题的本质**：Docker Compose 的相对路径基于执行命令的当前目录
2. **最佳解决方案**：使用 `deploy-production.sh` 脚本，自动处理路径
3. **手动部署要点**：必须在项目根目录（包含 `nginx/` 的目录）执行
4. **配置修改**：编辑 `nginx/conf.d/palmr.conf` 后执行 `nginx -s reload`
5. **独立容器**：Nginx 和 Palmr 是完全独立的两个容器，可以单独操作

---

## 🚀 快速命令参考

```bash
# 部署
./deploy-production.sh           # 使用脚本（推荐）
make deploy-prod                 # 使用 make

# 状态
docker ps                        # 查看容器
docker logs -f palmr-nginx       # Nginx 日志
docker logs -f palmr             # Palmr 日志

# 重启
docker restart palmr-nginx       # 重启 Nginx
docker restart palmr             # 重启 Palmr

# Nginx 管理
vim nginx/conf.d/palmr.conf      # 编辑配置
docker exec palmr-nginx nginx -t # 测试配置
docker exec palmr-nginx nginx -s reload  # 重载配置
```

---

**生产环境地址**: https://download.yipai360.com

**部署位置**: `/root/nginx-config/`
