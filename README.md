# AI-TASKS-TAXONOMY（问笺馆）

问笺馆：中文多模型作品任务静态陈列馆。主馆收录 **48 道**需要交付可运行文件的作品任务（覆盖动画、三维场景、游戏、应用、着色器、数据与排版六大门类），同时保留 **88 道**短题在「短题热身」板块供人热身。

当前已收录 **Gemini（`gemini-2.5-pro`）** 全量 48 题首次实测与 **Grok（`grok-4.7-high-fast` / Cursor 辅助执行）** 39 题实测，共 **92 次**带真实产物与 SHA-256 摘要的运行记录，其中 39 道任务支持同屏并排对比。引用的题面链回公开页面，不转载他人模型答案；没有原始产物的运行不记成功或失败。

## 本地开发与构建

```bash
npm ci
npm test
npm run dev
npm run build
```

- `npm test`：运行 `scripts/validate.mjs`，核对作品任务结构、运行记录必填字段与状态合法性、短题编号唯一性、类型数量及客观题重算答案。
- `npm run build`：先执行校验，再使用 Vite 将站点构建到 `dist/`（热身短题自动拆分为独立按需加载 chunk，资源采用相对路径以兼容 GitHub Pages 仓库子路径）。

## 目录与数据规范

- `data/tasks.json`：48 道作品任务定义（20 道 `quoted` 引用公开题面 + 28 道 `original` 原创任务）。
- `data/results.json`：`runs` 数组记录每一次真实执行（含 `taskId`、`provider`、`model`、`status`、`checks`、`promptSha256`、`artifact`、`artifactSha256`、`rawOutput`）；`records` 保持空数组，不填无原始输出的短题成绩。
- `data/previews.json`：首页展框预览配置（支持静态截图、文本数据预览与视口懒挂载实时预览）。
- `public/runs/<日期-执行器>/<taskId>/`：按批次保存每道任务的 `prompt.txt` 与首次产物文件（如 `v1.html` / `index.html` / `v1.json`），首次产物原样保留，不因后续修复覆盖。
- `data/questions/`：88 道热身短题按类型分文件存放；客观题 `spec.kind` 需可由校验脚本重算，开放题使用 `spec.kind = "rubric"` 且至少 3 条 `rubric`。

## 发布

GitHub Pages 通过 `.github/workflows/pages.yml` 自动部署。推送到 `main` 分支后，工作流会自动执行 `npm test` 与 `npm run build`，并将 `dist/` 发布到 GitHub Pages。
