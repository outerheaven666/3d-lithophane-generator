# 照片光雕 3MF 生成器

一个运行在浏览器本地的照片光雕生成器。上传 JPG / PNG / WEBP 图片后，应用会把图片转换为可预览的光雕网格，并导出可被切片软件打开的 3MF 模型文件。

在线体验：https://outerheaven666.github.io/3d-lithophane-generator/

## 功能状态

- v0.1.0：支持图片上传、本地 3D 预览、尺寸与图像参数调整、3MF 导出、中英文界面。
- 当前部署方式：GitHub Pages + GitHub Actions。
- 生产构建输出目录：`dist/`。

## 隐私说明

图片仅在浏览器本地处理，不上传服务器。

应用使用浏览器的 `ImageBitmap`、`Canvas`、`Web Worker` 和 Blob 下载能力完成图像处理、网格生成和 3MF 导出。GitHub Pages 只托管静态网页资源，不接收、存储或转发用户上传的图片。

## 3MF 与 G-code 的区别

`3MF` 是 3D 模型文件，里面保存模型几何、单位和基础元数据。这个项目导出的就是 3MF，适合交给切片软件继续处理。

`G-code` 是打印机执行文件，里面包含喷头路径、温度、速度、风扇、挤出量等具体打印指令。G-code 需要由切片软件根据你的打印机、材料和打印参数生成。

简单说：本工具生成模型，切片软件生成打印指令。

## 推荐切片软件

以下软件都适合继续处理本项目导出的 3MF 文件：

- PrusaSlicer：https://www.prusa3d.com/page/prusaslicer_424/
- OrcaSlicer：https://github.com/SoftFever/OrcaSlicer
- Bambu Studio：https://bambulab.com/en/download/studio
- UltiMaker Cura：https://ultimaker.com/software/ultimaker-cura/

不同切片软件和打印机会有不同默认配置。导入 3MF 后，请先检查模型尺寸、方向、填充、层高和预估打印时间。

## 推荐打印参数

光雕打印效果和照片、灯光、材料、打印方向都有关系。下面是一组适合先试打的保守参数：

- 材料：白色、暖白色或自然色 PLA / PLA+。
- 喷嘴：0.4 mm。
- 层高：0.12 mm 到 0.16 mm。
- 填充：100%，或使用足够多的墙线让内部没有空洞。
- 速度：30 mm/s 到 45 mm/s，细节优先时用较慢速度。
- 打印方向：推荐竖立打印以获得更好的细节；首次测试也可以平放打印小尺寸样件。
- 附着：竖立打印时建议加 brim，并确认模型底边贴合平台。
- 支撑：普通平板光雕通常不需要支撑。
- 光源：使用均匀背光，例如 LED 灯板、窗光或柔光灯。

如果照片整体偏暗，可以在应用里调高对比度或切换反相；如果亮部糊在一起，可以降低最大厚度或调整 Gamma。

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

## GitHub Pages 部署

仓库推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动运行：

1. 安装依赖
2. 类型检查
3. 单元测试
4. 构建生产包
5. 发布 `dist/` 到 GitHub Pages

如果是首次使用 GitHub Pages，请在仓库 `Settings -> Pages` 中选择 `GitHub Actions` 作为发布来源。

本项目的 Vite `base` 使用相对路径，适配 GitHub Pages 的 `/3d-lithophane-generator/` 子路径部署。

## FAQ

### 上传图片会发到服务器吗？

不会。图片读取、灰度转换、预览网格生成和 3MF 打包都在浏览器本地完成。

### 为什么导出的是 3MF，不是 G-code？

G-code 必须匹配具体打印机、喷嘴、材料和切片参数。直接生成通用 G-code 风险很高，所以本工具只导出模型文件，再由切片软件生成 G-code。

### 预览或导出很慢怎么办？

降低“采样长边”可以明显减少网格数量。建议先用 300 px 到 500 px 试参数，确认效果后再提高采样。

### 模型导入切片软件后尺寸不对怎么办？

请检查切片软件是否按毫米读取模型。3MF 文件已经声明单位为 millimeter，正常情况下不需要缩放。

### 打印出来对比度不明显怎么办？

可以尝试增加最大厚度、降低最小厚度、提高对比度、调整 Gamma，或换成更均匀的背光。材料颜色越深，透光越弱。

### 应该平放打印还是竖立打印？

竖立打印通常能保留更多照片细节，但需要更好的平台附着。平放打印更容易成功，适合小样件和快速试参。

### 浏览器有什么要求？

推荐使用新版 Chrome、Edge、Firefox 或 Safari。应用依赖现代浏览器的 Web Worker、Canvas、Blob 下载和 3D 渲染能力。
