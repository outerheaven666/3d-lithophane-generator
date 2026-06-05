# 照片光雕 3MF 生成器

浏览器本地运行的照片光雕生成器。上传 JPG / PNG / WEBP 后，应用会在 Web Worker 中生成可预览的光雕网格，并导出可被切片软件打开的 3MF 文件。

## 本地运行

```bash
npm install
npm run dev
```

## 上线检查

```bash
npm run typecheck
npm test
npm run build
```

生产构建输出在 `dist/`，可部署到任意静态站点托管服务。

## GitHub Pages 部署

仓库推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动运行：

1. 安装依赖
2. 类型检查
3. 单元测试
4. 构建生产包
5. 发布 `dist/` 到 GitHub Pages

如果是首次使用 GitHub Pages，请在仓库 `Settings -> Pages` 中选择 `GitHub Actions` 作为发布来源。
