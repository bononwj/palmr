# Palmr 构建和部署指南

## 配置说明

- **镜像仓库**: 阿里云容器镜像服务（杭州）
- **镜像地址**: `cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com/yipai/palmr`
- **当前版本**: 0.0.1
- **支持平台**: linux/amd64, linux/arm64

## 构建流程

### 1. 登录阿里云容器镜像服务

```bash
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
```

输入你的阿里云账号和密码。

### 2. 构建和推送镜像

使用 make 命令一键构建：

```bash
make build
```

这个命令会：

1. 读取 `package.json` 中的版本号（当前：0.0.1）
2. 询问是否使用默认版本号作为 tag（按 Enter 使用默认）
3. 同时构建 AMD64 和 ARM64 两个平台的镜像
4. 自动推送到阿里云容器镜像仓库

### 3. 更新版本号

如果需要更新版本号（例如从 0.0.1 到 0.0.2）：

```bash
make update-version
# 输入新版本：0.0.2
```

这会自动更新所有 package.json 文件中的版本号。

## 部署流程

### 在目标机器上部署

1. **登录阿里云镜像仓库**（如果是私有仓库）

```bash
docker login cn-hz-acr-registry.cn-hangzhou.cr.aliyuncs.com
```

2. **下载 docker-compose.yaml**

将 `docker-compose.yaml` 文件复制到目标机器。

3. **启动服务**

```bash
docker-compose up -d
```

4. **查看状态**

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

5. **访问应用**

- Web 界面: http://localhost:5487
- API 接口: http://localhost:3333

## 管理命令

```bash
# 启动服务
make start
# 或
docker-compose up -d

# 停止服务
make stop
# 或
docker-compose down

# 查看日志
make logs
# 或
docker-compose logs -f

# 重启服务
make restart
# 或
docker-compose restart

# 清理容器和镜像
make clean
```

## 故障排查

### 问题 1：架构不兼容

如果看到错误：

```
The requested image's platform (linux/arm64/v8) does not match the detected host platform (linux/amd64/v4)
```

**原因**: 镜像架构与主机不匹配  
**解决**: 重新构建多平台镜像（使用 `make build`）

### 问题 2：容器一直重启

```bash
# 查看日志找出原因
docker logs palmr

# 检查容器状态
docker ps -a
```

### 问题 3：无法连接服务

```bash
# 检查端口是否在监听
netstat -tlnp | grep -E ":(5487|3333)"

# 进入容器检查
docker exec -it palmr sh
ps aux | grep node
```

## 版本历史

- **0.0.1** - 初始版本

## 注意事项

1. 构建多平台镜像需要时间（约 10-30 分钟），请耐心等待
2. 确保 Docker 引擎版本 >= 19.03，支持 buildx
3. 首次构建会下载依赖，需要良好的网络连接
4. 数据持久化在 `palmr_data` 卷中，删除卷会丢失数据
