# Spic - 部署指南 (GitHub + jsDelivr 版)

## 前置准备

1. 一个 GitHub 账号
2. 一个 Cloudflare 账号
3. Node.js 和 npm 已安装
4. wrangler CLI 已安装

## 部署步骤

### 1. 创建 GitHub 仓库

- 在 GitHub 上创建一个新的公开仓库
- 仓库名可以是任意的，例如 `spic-images`
- 确保仓库是公开的（Public）

### 2. 创建 GitHub Token

- 访问 https://github.com/settings/tokens
- 点击 "Generate new token" -> "Generate new token (classic)"
- 勾选 `repo` 权限
- 生成并复制这个 token（只显示一次）

### 3. 安装依赖

```bash
npm install
```

### 4. 登录 Cloudflare

```bash
npx wrangler login
```

### 5. 修改 wrangler.toml（可选）

如果需要，可以在 `wrangler.toml` 中修改 Worker 名称。

### 6. 部署到 Cloudflare Workers

```bash
npm run deploy
```

### 7. 配置环境变量

部署成功后，需要在 Cloudflare Workers 控制台配置环境变量：

1. 访问 https://dash.cloudflare.com/
2. 进入 Workers & Pages -> 选择 `spic` -> 设置 -> 环境变量
3. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GITHUB_TOKEN` | 你的 GitHub Token | 第2步获取的 |
| `GITHUB_REPO` | `用户名/仓库名` | 例如：`yourname/spic-images` |
| `GITHUB_BRANCH` | `main` 或 `master` | 你的仓库默认分支 |

## 本地开发

```bash
npm run dev
```

注意：本地开发时也需要在 wrangler.toml 或 .dev.vars 中配置环境变量。

## 功能说明

- 支持 JPG、PNG、GIF、WebP、SVG 格式
- 最大文件大小 10MB
- 拖拽或点击上传
- 一键复制图片链接
- 使用 jsDelivr CDN 加速访问

## 项目结构

```
Spic/
├── package.json
├── wrangler.toml
├── .gitignore
├── DEPLOY.md
└── src/
    └── worker.js
```
