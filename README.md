# AI-TASKS-TAXONOMY

问笺馆：中文静态站。主馆是作品任务，模型要交出能打开的文件。88 道短题留在「短题」里，只供人热身。引用的题面链回公开页面，不转载别人的模型答案。没有带原始响应的运行，就不写成功或失败。

## 本地

```bash
npm ci
npm test
npm run dev
```

`npm test` 会核对编号唯一、类型数量、客观题答案能否由题目数据重算。`npm run build` 会先跑校验，再把站点生成到 `dist/`。资源使用相对路径，以便放在 GitHub Pages 的仓库子路径下。

## 题目放在哪里

`data/questions/` 里按类型分了 JSON 文件。新增题目时沿用现有字段：`id`、`title`、`type`、`difficulty`、`minutes`、`hook`、`prompt`、`answerMode`、`answer`、`explanation`、`spec`。客观题的 `spec.kind` 必须是校验脚本已经会重算的一种。开放题使用 `spec.kind = "rubric"`，并写至少三条 `rubric`。

`data/results.json` 的 `records` 现在是空数组。没有原始输出，就不要往里面填。

## 发布

GitHub Pages 使用 Actions 部署，工作流在 `.github/workflows/pages.yml`。推送到 `main` 后，工作流会校验、构建，并把 `dist/` 发到 Pages。不要改回从分支直接发布。
