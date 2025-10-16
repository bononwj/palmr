# 生产环境快速部署指南

## 一键部署

### 方法一：使用部署脚本（推荐）

```bash
# 1. 进入项目目录
cd /path/to/Palmr

# 2. 添加执行权限
chmod +x deploy-production.sh

# 3. 运行部署脚本
./deploy-production.sh
```

脚本会自动：

- ✅ 检查环境（Docker、配置文件、证书）
- ✅ 生成正确的配置（自动处理路径问题）
- ✅ 提供交互式菜单（启动/停止/重启/查看日志）

### 方法二：手动部署

```bash
# 1. 进入项目目录
cd /root/nginx-config

# 2. 启动服务
docker-compose -f docker-compose-nginx.yaml up -d

# 3. 查看状态
docker ps
```

**注意**：必须在项目根目录（包含 `nginx/` 目录的地方）执行命令！

## 路径问题解决方案

### 问题说明

如果遇到错误：

```
error mounting "/root/nginx-config/nginx/nginx.conf" to rootfs at "/etc/nginx/nginx.conf"
```

**原因**：docker-compose.yaml 使用相对路径 `./nginx/`，必须在项目根目录执行。

### 解决方案

#### 方案 A：使用部署脚本（推荐）

```bash
./deploy-production.sh
```

脚本会自动处理路径问题。

#### 方案 B：在正确的目录执行

```bash
# 确保在这个目录
cd /root/nginx-config

# 然后执行
docker-compose -f docker-compose-nginx.yaml up -d
```

#### 方案 C：修改为绝对路径

编辑 `docker-compose-nginx.yaml`，将：

```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/conf.d:/etc/nginx/conf.d:ro
```

改为：

```yaml
volumes:
  - /root/nginx-config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - /root/nginx-config/nginx/conf.d:/etc/nginx/conf.d:ro
```

## 部署步骤详解

### 1. 准备阶段

```bash
# 登录镜像仓库
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com

# 确认项目结构
ls -la
# 应该看到：
# - nginx/
# - docker-compose-nginx.yaml
# - deploy-production.sh
```

### 2. 部署阶段

**使用脚本（推荐）**：

```bash
chmod +x deploy-production.sh
./deploy-production.sh
# 选择 1 - 启动服务
```

**手动部署**：

```bash
cd /root/nginx-config
docker-compose -f docker-compose-nginx.yaml up -d
```

### 3. 验证阶段

```bash
# 检查容器状态
docker ps

# 应该看到两个容器：
# - palmr-nginx (运行中)
# - palmr (运行中)

# 测试访问
curl -I https://download.yipai360.com

# 查看日志
docker logs -f palmr-nginx
docker logs -f palmr
```

## 常用操作

### 查看状态

```bash
docker ps
docker-compose -f docker-compose-nginx.yaml ps
```

### 查看日志

```bash
# 所有日志
docker-compose -f docker-compose-nginx.yaml logs -f

# Nginx 日志
docker logs -f palmr-nginx

# Palmr 日志
docker logs -f palmr
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

### 更新服务

```bash
# 拉取最新镜像
docker-compose -f docker-compose-nginx.yaml pull

# 重新启动
docker-compose -f docker-compose-nginx.yaml up -d
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

## 故障排查

### 问题 1：容器启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose-nginx.yaml logs

# 检查容器状态
docker ps -a
```

### 问题 2：路径映射错误

```bash
# 确认当前目录
pwd
# 应该显示：/root/nginx-config

# 确认文件存在
ls nginx/nginx.conf
ls nginx/conf.d/palmr.conf

# 如果目录不对，cd 到正确目录
cd /root/nginx-config
```

### 问题 3：SSL 证书问题

```bash
# 检查证书文件
ls -lh /etc/nginx/cert/

# 验证证书
openssl x509 -in /etc/nginx/cert/yipai360.com.pem -noout -dates

# 检查权限
sudo chmod 644 /etc/nginx/cert/yipai360.com.pem
sudo chmod 600 /etc/nginx/cert/yipai360.com.key
```

### 问题 4：端口被占用

```bash
# 检查端口
netstat -tlnp | grep -E ":(80|443)"

# 停止占用端口的进程
sudo kill <PID>
```

## 目录结构要求

```
/root/nginx-config/              ← 必须在这里执行命令
├── nginx/
│   ├── nginx.conf              ← 主配置
│   └── conf.d/
│       └── palmr.conf          ← 站点配置
├── docker-compose-nginx.yaml   ← 配置文件
└── deploy-production.sh        ← 部署脚本
```

## 快速命令参考

```bash
# 一键部署
./deploy-production.sh

# 启动
docker-compose -f docker-compose-nginx.yaml up -d

# 停止
docker-compose -f docker-compose-nginx.yaml down

# 重启
docker-compose -f docker-compose-nginx.yaml restart

# 日志
docker-compose -f docker-compose-nginx.yaml logs -f

# 状态
docker ps

# 重载 Nginx
docker exec palmr-nginx nginx -s reload
```

## 访问地址

- **生产环境**: https://download.yipai360.com
- **健康检查**: https://download.yipai360.com/nginx-health

## 获取帮助

如遇问题：

1. 使用部署脚本 `./deploy-production.sh`
2. 查看日志定位问题
3. 参考 [完整部署文档](PRODUCTION_DEPLOYMENT.md)
4. 查看 [检查清单](DEPLOYMENT_CHECKLIST.md)
