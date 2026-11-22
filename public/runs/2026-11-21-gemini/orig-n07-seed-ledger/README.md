# 种子图书馆小账本

- 启动方法：浏览器直接打开 `index.html`。
- 实际检查：演示四步依次执行后最终库存为豆星 1 / 月瓜 1，非法借出与非正整数均被拒绝且不写入事件；支持 localStorage 持久化、单步撤销与 `ledger.json` 导出。
- 已知限制：嵌入无 `allow-same-origin` 的隔离 iframe 时 localStorage 仅限当前会话内存，独立窗口打开可跨刷新持久保存。
