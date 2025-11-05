# Palmr Portal Setup Guide

## 快速开始

### 1. 安装依赖

```bash
cd apps/portal
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置后端 API 地址：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
VITE_API_BASE_URL=http://localhost:3333
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3001

### 4. 构建生产版本

```bash
pnpm build
```

构建产物在 `dist/` 目录。

### 5. 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
apps/portal/
├── public/              # 静态资源
├── src/
│   ├── api/            # API 客户端和端点
│   │   ├── client.ts   # Axios 实例配置
│   │   └── endpoints/  # API 端点定义
│   │       ├── auth.ts
│   │       ├── files.ts
│   │       ├── folders.ts
│   │       ├── shares.ts
│   │       └── app.ts
│   │
│   ├── components/     # 可复用组件
│   │   ├── Layout/     # 布局组件
│   │   ├── FileIcon.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── hooks/          # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useAppInfo.ts
│   │   └── useTheme.ts
│   │
│   ├── i18n/           # 国际化
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── en-US.json
│   │       └── zh-CN.json
│   │
│   ├── pages/          # 页面组件
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Files.tsx
│   │   ├── Shares.tsx
│   │   ├── PublicShare.tsx
│   │   ├── AuthCallback.tsx
│   │   └── NotFound.tsx
│   │
│   ├── providers/      # Context Providers
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── router/         # 路由配置
│   │   ├── index.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── stores/         # Jotai 状态管理
│   │   ├── auth.ts
│   │   ├── app-info.ts
│   │   ├── share.ts
│   │   └── theme.ts
│   │
│   ├── utils/          # 工具函数
│   │   ├── cn.ts
│   │   └── format.ts
│   │
│   ├── main.tsx        # 应用入口
│   ├── index.css       # 全局样式
│   └── vite-env.d.ts   # 类型定义
│
├── index.html          # HTML 模板
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
├── tailwind.config.js  # Tailwind 配置
├── package.json        # 项目依赖
├── README.md           # 项目说明
├── MIGRATION.md        # 迁移文档
└── SETUP.md            # 本文件
```

## 技术栈

- **构建工具**: Vite 5
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **UI 库**: Ant Design 5
- **状态管理**: Jotai
- **数据获取**: TanStack Query (React Query)
- **HTTP 客户端**: Axios
- **国际化**: react-i18next
- **样式**: Tailwind CSS + Ant Design

## 主要功能

### 1. 用户认证
- 密码登录
- OIDC 单点登录
- 自动认证检查
- 会话管理

### 2. 文件管理
- 文件列表展示
- 文件上传（支持分块上传）
- 文件下载
- 文件移动、重命名、删除
- 文件夹管理

### 3. 分享管理
- 创建文件分享
- 分享链接生成
- 密码保护
- 下载次数限制
- 过期时间设置
- 公开分享访问

### 4. 仪表板
- 存储使用情况
- 文件统计
- 分享统计
- 快速访问

## 开发说明

### 添加新页面

1. 在 `src/pages/` 创建新页面组件
2. 在 `src/router/index.tsx` 添加路由配置
3. 如需认证保护，使用 `ProtectedRoute` 组件

### 添加新 API 端点

1. 在 `src/api/endpoints/` 对应文件中添加 API 函数
2. 定义请求/响应类型
3. 在页面中使用 TanStack Query 调用

### 添加新状态

1. 在 `src/stores/` 创建新的 atoms
2. 在 `src/hooks/` 创建对应的 hook
3. 在组件中使用 hook

### 国际化

1. 在 `src/i18n/locales/` 添加翻译键值
2. 使用 `useTranslation` hook 获取翻译
3. 使用 `t('key')` 函数获取翻译文本

## 部署

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name portal.example.com;
    
    root /var/www/portal/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 故障排除

### 1. 依赖安装失败

确保使用 pnpm 包管理器：

```bash
npm install -g pnpm
pnpm install
```

### 2. API 调用失败

检查 `.env` 文件中的 `VITE_API_BASE_URL` 是否正确。

开发环境中，确保后端服务运行在配置的地址。

### 3. CORS 错误

确保后端 API 配置了正确的 CORS 设置，允许前端域名访问。

### 4. 认证问题

检查 cookie 设置，确保后端返回的 token cookie 可以被前端读取。

开发环境中，可能需要配置 `withCredentials: true`。

## 下一步

查看以下文档了解更多：

- [MIGRATION.md](./MIGRATION.md) - 迁移详情
- [README.md](./README.md) - 项目概览

## 支持

如有问题，请查看：

1. 检查控制台错误信息
2. 查看网络请求是否成功
3. 确认环境变量配置
4. 检查后端 API 状态

