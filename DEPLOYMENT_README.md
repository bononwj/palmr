# Palmr 部署文档总览

## 📚 文档导航

### 快速开始

- **[快速开始指南](QUICK_START.md)** - 最快 5 分钟部署
  - 两种部署方式对比
  - 常用命令速查
  - 故障快速排查

### 生产环境

- **[生产环境部署](PRODUCTION_DEPLOYMENT.md)** ⭐ **推荐首读**

  - 完整的生产环境配置
  - HTTPS + SSL 证书配置
  - download.yipai360.com 专用配置
  - 监控和维护指南

- **[部署检查清单](DEPLOYMENT_CHECKLIST.md)** ✅ **部署必读**
  - 部署前检查项
  - 功能验证清单
  - 安全检查项
  - 性能验证指南

### 详细配置

- **[Nginx 详细配置](NGINX_DEPLOYMENT.md)**

  - Nginx 架构说明
  - 配置文件详解
  - 高级功能配置
  - 性能优化建议

- **[构建指南](BUILD_DEPLOY_GUIDE.md)**
  - Docker 镜像构建
  - 多平台支持
  - 版本管理
  - 阿里云镜像仓库

## 🚀 部署方式选择

### 开发/测试环境

使用**独立部署**（docker-compose.yaml）

```bash
make start
```

访问：

- Web: http://localhost:5487
- API: http://localhost:3333

### 生产环境

使用 **Nginx + Palmr**（docker-compose-nginx.yaml）

```bash
make start-nginx
```

访问：

- 域名: https://download.yipai360.com
- 自动 HTTPS 加密
- HTTP 自动重定向

## 📋 部署步骤概览

### 1. 准备阶段

1. 确认服务器环境（Docker、Docker Compose）
2. 确认 SSL 证书位置：`/etc/nginx/cert/`
3. 确认域名解析：`download.yipai360.com`
4. 登录镜像仓库

### 2. 部署阶段

```bash
# 一键启动
make start-nginx

# 查看状态
docker ps

# 查看日志
make logs-nginx
```

### 3. 验证阶段

```bash
# HTTP 重定向测试
curl -I http://download.yipai360.com

# HTTPS 访问测试
curl -I https://download.yipai360.com

# 健康检查
curl https://download.yipai360.com/nginx-health
```

详见：[部署检查清单](DEPLOYMENT_CHECKLIST.md)

## 🔧 配置文件说明

```
Palmr/
├── docker-compose.yaml              # 独立部署配置
├── docker-compose-nginx.yaml        # Nginx + Palmr 配置 ⭐
├── nginx/
│   ├── nginx.conf                   # Nginx 主配置
│   ├── conf.d/
│   │   └── palmr.conf              # 反向代理配置 ⭐
│   └── ssl/                         # 证书目录（挂载服务器证书）
├── Makefile                         # 管理命令
└── 文档/
    ├── PRODUCTION_DEPLOYMENT.md     # 生产环境部署 ⭐
    ├── DEPLOYMENT_CHECKLIST.md      # 部署检查清单 ✅
    ├── QUICK_START.md               # 快速开始
    ├── NGINX_DEPLOYMENT.md          # Nginx 详细配置
    └── BUILD_DEPLOY_GUIDE.md        # 构建指南
```

## 🎯 生产环境配置要点

### SSL/HTTPS

- ✅ 证书路径：`/etc/nginx/cert/yipai360.com.{pem,key}`
- ✅ TLS 1.2 和 1.3
- ✅ HTTP/2 启用
- ✅ HSTS 安全头
- ✅ 自动 HTTP → HTTPS 重定向

### 域名

- ✅ 主域名：`download.yipai360.com`
- ✅ 访问协议：`https://`

### 上传限制

- ✅ 最大上传：100GB
- ✅ 超时时间：600 秒
- ✅ 支持断点续传

### 环境变量

```yaml
environment:
  - NODE_ENV=production
  - SECURE_SITE=true # 启用 HTTPS 模式
  - DEFAULT_LANGUAGE=zh-CN # 默认中文
```

## 📖 常用命令

### 服务管理

```bash
make start-nginx    # 启动服务
make stop-nginx     # 停止服务
make restart-nginx  # 重启服务
make logs-nginx     # 查看日志
```

### Nginx 管理

```bash
make test-nginx     # 测试配置
make reload-nginx   # 重载配置（不停机）
make shell-nginx    # 进入容器
```

### 监控维护

```bash
docker ps           # 查看容器状态
docker stats        # 查看资源使用
docker logs -f palmr        # 查看应用日志
docker logs -f palmr-nginx  # 查看 Nginx 日志
```

## 🔍 故障排查

### 快速诊断

```bash
# 1. 检查容器状态
docker ps -a

# 2. 查看日志
make logs-nginx

# 3. 测试配置
make test-nginx

# 4. 检查网络
curl -I https://download.yipai360.com
```

### 常见问题

1. **无法访问 HTTPS** → 检查端口和防火墙
2. **证书错误** → 验证证书路径和权限
3. **502 错误** → 检查 Palmr 容器状态
4. **上传失败** → 检查上传大小限制

详见各文档的"故障排查"章节。

## 📊 监控要点

### 日常检查

- [ ] 容器运行状态
- [ ] 磁盘使用情况
- [ ] 日志是否有异常
- [ ] 证书有效期（建议 > 30 天）

### 性能监控

- [ ] CPU 使用率 (< 80%)
- [ ] 内存使用率 (< 80%)
- [ ] 响应时间 (< 2 秒)
- [ ] 错误率 (< 1%)

## 🔐 安全建议

1. **定期更新**

   - 每周检查并拉取最新镜像
   - 定期更新 SSL 证书

2. **日志监控**

   - 检查异常访问
   - 监控失败请求
   - 设置告警通知

3. **备份策略**

   - 每日备份应用数据
   - 备份 Nginx 配置
   - 定期测试恢复流程

4. **访问控制**
   - 只开放必要端口（80, 443）
   - 配置防火墙规则
   - 考虑添加 IP 白名单（如需要）

## 📞 获取帮助

### 文档顺序建议

**首次部署**：

1. [生产环境部署](PRODUCTION_DEPLOYMENT.md) - 了解整体流程
2. [部署检查清单](DEPLOYMENT_CHECKLIST.md) - 逐项检查
3. [快速开始](QUICK_START.md) - 执行部署

**日常运维**：

1. [快速开始](QUICK_START.md) - 常用命令
2. [Nginx 详细配置](NGINX_DEPLOYMENT.md) - 配置修改

**问题排查**：

1. 查看对应文档的"故障排查"章节
2. 检查日志输出
3. 使用检查清单验证配置

### 技术支持流程

1. **查看日志** → `make logs-nginx`
2. **检查配置** → `make test-nginx`
3. **验证网络** → 检查端口和防火墙
4. **参考文档** → 相应章节的故障排查
5. **联系团队** → 提供日志和错误信息

## 🎉 部署成功标志

完成部署后，应该能够：

✅ 访问 https://download.yipai360.com  
✅ 看到 HTTPS 绿色锁图标  
✅ HTTP 自动重定向到 HTTPS  
✅ 文件上传下载功能正常  
✅ 所有容器运行稳定  
✅ 日志无错误信息

恭喜！你已成功部署 Palmr！

---

**最后更新**: 2024  
**维护团队**: Yipai Tech  
**生产环境**: download.yipai360.com
