# 照片改名先后悔药

这些文件在 `sandbox/`，内容是指定的短文字，只是名字以 `.jpg` 结尾。`rename_tool.py` 只解析本脚本所在目录下的 `sandbox`，来源名里出现 `..` 或斜线就拒绝。日期无效时不改用今天。

已经跑过的一轮留在 `plan.json`（冲突，未应用）、`plan-fixes.json`（修复后的计划）、`undo.json`（红/蓝那一次成功改名的撤销记录）和 `log.json`。`index.html` 只展示这些记录，不能从网页再去改文件。当前 `sandbox/` 已按要求恢复成最初三个文件。

若要重做，先把上述记录复制走。然后在本目录执行：

```
python3 rename_tool.py init
python3 rename_tool.py plan --set conflict
python3 rename_tool.py apply --set conflict
python3 rename_tool.py plan --set fixes
python3 rename_tool.py apply --set fixes
python3 rename_tool.py undo
python3 rename_tool.py page
```

已知限制：空格会改成下划线，大小写保持输入。这不是照片库，也不会碰本目录以外的文件。
