# 更新 pnpm 到 10.6.0

## 方法一：使用 corepack（推荐）

Corepack 是 Node.js 自带的包管理器版本管理工具，最适合管理 pnpm 版本。

```bash
# 1. 启用 corepack（Node.js 16.9+ 自带）
corepack enable

# 2. 准备并激活 pnpm 10.6.0
corepack prepare pnpm@10.6.0 --activate

# 3. 验证版本
pnpm --version
```

## 方法二：使用 npm 全局安装

```bash
# 卸载旧版本
npm uninstall -g pnpm

# 安装 pnpm 10.6.0
npm install -g pnpm@10.6.0

# 验证版本
pnpm --version
```

## 方法三：使用 pnpm 自我更新

```bash
# 更新到最新版本
pnpm add -g pnpm@10.6.0

# 验证版本
pnpm --version
```

## 更新后的操作

更新 pnpm 版本后，需要重新生成锁文件：

```bash
# 运行更新脚本
./update-lockfiles.sh

# 或者手动更新每个项目
cd apps/server && rm pnpm-lock.yaml && pnpm install && cd ../..
cd apps/web && rm pnpm-lock.yaml && pnpm install && cd ../..
cd apps/docs && rm pnpm-lock.yaml && pnpm install && cd ../..
```

## 注意事项

- 项目根目录的 `package.json` 指定了 `"packageManager": "pnpm@10.6.0"`
- 更新后所有团队成员都应该使用相同版本以保持一致性
- 新的锁文件会使用 lockfileVersion 9.0（适配 pnpm 10.x）
