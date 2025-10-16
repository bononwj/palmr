# Palmr 生产环境部署检查清单

## 部署前检查 ☑️

### 1. 服务器环境

- [ ] Docker 已安装 (版本 >= 19.03)
- [ ] Docker Compose 已安装
- [ ] 服务器有足够的磁盘空间（建议 >= 100GB）
- [ ] 服务器内存充足（建议 >= 4GB）

### 2. SSL 证书

- [ ] 证书文件存在：`/etc/nginx/cert/yipai360.com.pem`
- [ ] 私钥文件存在：`/etc/nginx/cert/yipai360.com.key`
- [ ] 证书权限正确：`chmod 644 *.pem && chmod 600 *.key`
- [ ] 证书有效期检查（建议 > 30 天）
- [ ] 证书与私钥匹配验证

验证命令：

```bash
ls -lh /etc/nginx/cert/
openssl x509 -in /etc/nginx/cert/yipai360.com.pem -noout -dates
```

### 3. 域名和网络

- [ ] 域名已解析：`download.yipai360.com` → 服务器 IP
- [ ] 防火墙已开放 80 端口
- [ ] 防火墙已开放 443 端口
- [ ] DNS 解析生效确认

验证命令：

```bash
nslookup download.yipai360.com
netstat -tlnp | grep -E ":(80|443)"
```

### 4. 镜像仓库访问

- [ ] 阿里云镜像仓库登录成功
- [ ] 能够拉取最新镜像

验证命令：

```bash
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
docker pull cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com/yipai/palmr:latest
```

### 5. 项目文件

- [ ] `docker-compose-nginx.yaml` 配置正确
- [ ] `nginx/nginx.conf` 存在
- [ ] `nginx/conf.d/palmr.conf` 配置正确
- [ ] 域名配置：`download.yipai360.com`
- [ ] SSL 证书路径配置：`/etc/nginx/cert/`

## 部署执行 🚀

### 步骤 1: 启动服务

```bash
make start-nginx
```

- [ ] 命令执行成功
- [ ] 无错误输出

### 步骤 2: 检查容器状态

```bash
docker ps
```

- [ ] `palmr-nginx` 容器运行中
- [ ] `palmr` 容器运行中
- [ ] 两个容器状态都是 `Up`

### 步骤 3: 检查日志

```bash
docker-compose -f docker-compose-nginx.yaml logs
```

- [ ] Nginx 启动成功
- [ ] Palmr 启动成功
- [ ] 无严重错误信息

## 功能验证 ✅

### 1. HTTP 重定向测试

```bash
curl -I http://download.yipai360.com
```

- [ ] 返回 `301 Moved Permanently`
- [ ] Location 头指向 `https://download.yipai360.com`

### 2. HTTPS 访问测试

```bash
curl -I https://download.yipai360.com
```

- [ ] 返回 `200 OK`
- [ ] SSL 证书验证通过
- [ ] 响应头包含 `Strict-Transport-Security`

### 3. 浏览器访问测试

访问：https://download.yipai360.com

- [ ] 页面正常加载
- [ ] SSL 证书显示有效（绿色锁图标）
- [ ] 无证书警告
- [ ] 页面功能正常

### 4. 健康检查

```bash
curl https://download.yipai360.com/nginx-health
```

- [ ] 返回 `healthy`

### 5. API 测试

```bash
curl https://download.yipai360.com/api/
```

- [ ] API 响应正常
- [ ] 无错误信息

### 6. 文件上传测试

- [ ] 小文件上传成功 (< 100MB)
- [ ] 大文件上传成功 (> 1GB)
- [ ] 上传进度正常显示

### 7. 文件下载测试

- [ ] 文件下载正常
- [ ] 下载速度正常
- [ ] 断点续传功能正常

## 安全检查 🔒

### 1. SSL/TLS 配置

```bash
# 使用 SSL Labs 测试（可选）
# 访问：https://www.ssllabs.com/ssltest/
```

- [ ] TLS 1.2 和 1.3 启用
- [ ] 不安全的 SSL 3.0 和 TLS 1.0/1.1 禁用
- [ ] HSTS 头已配置
- [ ] HTTP/2 已启用

### 2. 安全头检查

```bash
curl -I https://download.yipai360.com
```

检查响应头：

- [ ] `Strict-Transport-Security` 存在
- [ ] 无敏感信息泄露（如版本号）

### 3. 访问控制

- [ ] 只允许必要的端口访问
- [ ] 不需要的服务已禁用
- [ ] 防火墙规则配置正确

## 监控设置 📊

### 1. 日志配置

- [ ] Nginx 访问日志正常记录
- [ ] Nginx 错误日志正常记录
- [ ] Palmr 应用日志正常输出
- [ ] 日志轮转配置（可选）

查看日志：

```bash
make logs-nginx
docker logs -f palmr
```

### 2. 健康监控

- [ ] 配置健康检查脚本（可选）
- [ ] 设置证书过期提醒（可选）
- [ ] 配置资源使用监控（可选）

### 3. 告警通知

- [ ] 配置故障告警（可选）
- [ ] 配置证书过期告警（可选）

## 性能验证 ⚡

### 1. 响应时间

```bash
time curl -I https://download.yipai360.com
```

- [ ] 首次访问 < 2 秒
- [ ] 后续访问 < 1 秒

### 2. 并发测试

```bash
# 使用 ab 或 wrk 进行压力测试（可选）
ab -n 1000 -c 10 https://download.yipai360.com/
```

- [ ] 系统稳定性良好
- [ ] 无明显性能瓶颈

### 3. 资源使用

```bash
docker stats palmr palmr-nginx
```

- [ ] CPU 使用率正常 (< 80%)
- [ ] 内存使用率正常 (< 80%)
- [ ] 无内存泄漏迹象

## 备份和恢复 💾

### 1. 配置备份

```bash
tar -czf palmr-config-backup-$(date +%Y%m%d).tar.gz \
  nginx/ docker-compose-nginx.yaml
```

- [ ] 配置文件已备份
- [ ] 备份文件已保存到安全位置

### 2. 数据备份

```bash
docker run --rm \
  -v palmr_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/palmr-data-$(date +%Y%m%d).tar.gz /data
```

- [ ] 应用数据已备份
- [ ] 备份策略已制定（建议每日备份）

### 3. 恢复测试

- [ ] 备份文件可以正常解压
- [ ] 恢复流程已文档化
- [ ] 恢复流程已测试（可选）

## 文档和交接 📝

### 1. 文档准备

- [ ] 部署文档已完成
- [ ] 运维手册已准备
- [ ] 故障排查指南已准备
- [ ] 联系方式已更新

### 2. 团队交接

- [ ] 相关人员已培训
- [ ] 访问权限已分配
- [ ] 紧急联系流程已建立

## 部署后检查 🔍

### 第 1 天

- [ ] 监控所有日志
- [ ] 检查是否有异常访问
- [ ] 验证所有功能正常
- [ ] 收集用户反馈

### 第 1 周

- [ ] 检查系统稳定性
- [ ] 分析访问日志
- [ ] 优化性能瓶颈
- [ ] 更新文档

### 第 1 月

- [ ] 检查磁盘使用情况
- [ ] 检查证书有效期
- [ ] 评估系统性能
- [ ] 制定维护计划

## 常用命令速查 📌

```bash
# 启动服务
make start-nginx

# 停止服务
make stop-nginx

# 重启服务
make restart-nginx

# 查看日志
make logs-nginx

# 重载 Nginx 配置
make reload-nginx

# 测试 Nginx 配置
make test-nginx

# 查看容器状态
docker ps

# 查看资源使用
docker stats

# 进入容器
make shell-nginx  # Nginx
make shell        # Palmr
```

## 问题联系 📞

如遇到问题，请按以下顺序排查：

1. **查看日志**：`make logs-nginx` 和 `docker logs palmr`
2. **检查配置**：`make test-nginx`
3. **验证网络**：检查端口和防火墙
4. **检查证书**：验证证书有效期和权限
5. **重启服务**：`make restart-nginx`

## 签署确认 ✍️

部署完成后，请填写以下信息：

- **部署日期**: **\*\***\_\_\_**\*\***
- **部署人员**: **\*\***\_\_\_**\*\***
- **验证人员**: **\*\***\_\_\_**\*\***
- **所有检查项已完成**: [ ] 是 / [ ] 否
- **备注**: **\*\***\_\_\_**\*\***

---

**提示**: 建议在部署前打印此清单，逐项检查并记录。
