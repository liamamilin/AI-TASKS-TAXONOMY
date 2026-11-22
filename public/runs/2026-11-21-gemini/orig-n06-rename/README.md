# 照片改名先后悔药

- 启动方法：在当前目录运行 `python3 rename_tool.py`，浏览器打开 `index.html` 查看只读前后对照。
- 实际检查：已实跑冲突拦阻（3 文件哈希不变）→ 按 fixes 应用 → undo 恢复初态且 SHA-256 一致 → 拒绝 `../outside.jpg` 越界路径；生成 `plan.json`、`undo.json`、`log.json`。
- 已知限制：`sandbox/` 内为合成文本占位文件，并非真实图片。
