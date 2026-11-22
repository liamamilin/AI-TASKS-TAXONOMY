import resultBook from "../data/results.json" with { type: "json" }
import { kindEntries, kindLabel, runModelKey, runModelShort, runsForTask, taskChecklist, taskList } from "./task-render.js"

export const RECORD_TEMPLATE = `问笺馆单题记录
题号：
标题：
模型：
日期：
界面（网页 / 应用 / 其他）：
可调参数（不知道就写默认）：
提示词是否逐字使用：是
提示词全文：
（从题目的「复制提示」粘贴，不要改写）
原始输出：
（原样粘贴，失败也贴上）
客观题：符合 / 不符合
开放题：对照评分要点逐条写，不打总分
备注：`

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))
}

function modelCell(runs, key) {
  const matched = runs.filter((r) => runModelKey(r) === key)
  if (!matched.length) return `<span class="quiet">待补测</span>`
  const ok = matched.some((r) => r.status === "success")
  const fail = matched.some((r) => r.status === "failure")
  const partial = matched.some((r) => r.status === "partial")
  const revs = matched.map((r) => r.revision || "v1").join("/")
  let text = `失败 (${revs})`
  let cls = "pill-fail"
  if (ok && fail) { text = `修复通过 (${revs})`; cls = "pill-ok" }
  else if (ok) { text = `通过 (${revs})`; cls = "pill-ok" }
  else if (partial) { text = `部分验证 (${revs})`; cls = "pill-partial" }
  return `<span class="pill ${key === "gemini" ? "pill-gemini" : "pill-grok"} ${cls}">${escapeHtml(text)}</span>`
}

export function modelsView() {
  const runs = resultBook.runs || []
  const counts = { success: 0, partial: 0, failure: 0 }
  for (const run of runs) counts[run.status] = (counts[run.status] || 0) + 1
  const grokRuns = runs.filter((r) => runModelKey(r) === "grok")
  const geminiRuns = runs.filter((r) => runModelKey(r) === "gemini")
  const grokTasks = new Set(grokRuns.map((r) => r.taskId))
  const geminiTasks = new Set(geminiRuns.map((r) => r.taskId))
  const bothCount = taskList.filter((t) => grokTasks.has(t.id) && geminiTasks.has(t.id)).length
  const geminiOnlyCount = taskList.filter((t) => geminiTasks.has(t.id) && !grokTasks.has(t.id)).length
  const partialTaskCount = taskList.filter((t) => runsForTask(t.id).some((r) => r.status === "partial")).length

  const modelCards = [
    {
      key: "gemini",
      title: "Gemini（gemini-2.5-pro）",
      provider: "Gemini Agent · 沙盒辅助执行",
      runs: geminiRuns,
      tasks: geminiTasks.size,
      desc: `已完成全馆全部 ${geminiTasks.size}/${taskList.length} 道作品任务首次实测（含 9 道新增原创题与 39 道已有经典题），均保留首次产物与 SHA-256。`,
    },
    {
      key: "grok",
      title: "Grok（grok-4.7-high-fast）",
      provider: "Cursor Cloud Agent · Cursor 辅助执行",
      runs: grokRuns,
      tasks: grokTasks.size,
      desc: `已完成 ${grokTasks.size}/${taskList.length} 道作品任务实测；其余 ${geminiOnlyCount} 道新加入原创题等待后续用 Grok 补测后形成全馆双模型对照。`,
    },
  ]

  const rows = taskList.map((task) => {
    const truns = runsForTask(task.id)
    const hasGem = truns.some((r) => runModelKey(r) === "gemini")
    const hasGrok = truns.some((r) => runModelKey(r) === "grok")
    const hasPartial = truns.some((r) => r.status === "partial")
    const tags = [
      hasGem && hasGrok ? "both" : "",
      hasGem && !hasGrok ? "gemini-only" : "",
      hasPartial ? "partial" : "",
    ].filter(Boolean).join(" ")
    const searchBlob = `${task.id} ${task.title} ${kindLabel(task.kind)}`.toLowerCase()
    return `<tr data-mtags="${tags}" data-mkind="${escapeHtml(task.kind)}" data-msearch="${escapeHtml(searchBlob)}">
      <td><a class="matrix-link" href="#/t/${task.id}">${escapeHtml(task.title)}</a><span class="matrix-id">${escapeHtml(task.id)}</span></td>
      <td>${escapeHtml(kindLabel(task.kind))}</td>
      <td>${modelCell(truns, "gemini")}</td>
      <td>${modelCell(truns, "grok")}</td>
      <td>${hasGem && hasGrok ? `<a class="btn btn-ghost btn-sm" href="#/t/${task.id}">并排对比</a>` : `<a class="btn btn-ghost btn-sm" href="#/t/${task.id}">查看产物</a>`}</td>
    </tr>`
  }).join("")

  return `<section class="prose prose-wide">
    <p class="kicker">模型实测档案 · 有运行，没有排名</p>
    <h1>模型与运行记录</h1>
    <p class="lede">这里只收录留有真实产物文件与验收证据的执行记录。成功、部分验证和失败按每一次运行分开计，不排模型名次。</p>
    <div class="stats">
      <p><b>${runs.length}</b><span>次已记录运行</span></p>
      <p><b>${counts.success}</b><span>次通过</span></p>
      <p><b>${counts.partial}</b><span>次部分验证</span></p>
      <p><b>${counts.failure}</b><span>次失败保留</span></p>
      <p><b>${bothCount}</b><span>道双模型对比</span></p>
    </div>

    <div class="model-grid">
      ${modelCards.map((m) => {
        const okCount = m.runs.filter((r) => r.status === "success").length
        const partCount = m.runs.filter((r) => r.status === "partial").length
        const failCount = m.runs.filter((r) => r.status === "failure").length
        return `<article class="model-card">
          <div class="model-card-head">
            <span class="pill ${m.key === "gemini" ? "pill-gemini" : "pill-grok"} pill-ok">${escapeHtml(m.key === "gemini" ? "Gemini" : "Grok")}</span>
            <span class="quiet">${m.tasks} / ${taskList.length} 题 · ${m.runs.length} 次运行</span>
          </div>
          <h2>${escapeHtml(m.title)}</h2>
          <p class="quiet">${escapeHtml(m.provider)}</p>
          <p>${escapeHtml(m.desc)}</p>
          <p class="meta">通过 ${okCount} 次${partCount ? ` · 部分验证 ${partCount} 次` : ""}${failCount ? ` · 首次失败保留 ${failCount} 次` : ""}</p>
          <div class="actions">
            <a class="btn btn-ghost btn-sm" href="#/tasks?model=${m.key}">筛选该模型任务</a>
          </div>
        </article>`
      }).join("")}
    </div>

    <div class="section-head" style="margin-top:36px;">
      <div>
        <h2>全馆 ${taskList.length} 题 × 模型对照矩阵</h2>
        <p class="quiet" id="matrix-count">当前显示 ${taskList.length} / ${taskList.length} 道任务</p>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-ghost btn-sm" data-copy="list">复制待测清单</button>
        <button type="button" class="btn btn-ghost btn-sm" data-copy="record">复制记录模板</button>
      </div>
    </div>
    <div class="filters-panel" style="margin:14px 0 16px;">
      <div class="filter-row filter-row-bottom" style="border-top:0;padding-top:0;">
        <div class="chips" role="toolbar" aria-label="矩阵状态筛选">
          <button type="button" class="chip on" data-matrix-filter="all">全部 <span class="chip-n">${taskList.length}</span></button>
          <button type="button" class="chip" data-matrix-filter="both">双模型对比 <span class="chip-n">${bothCount}</span></button>
          <button type="button" class="chip" data-matrix-filter="gemini-only">待补 Grok <span class="chip-n">${geminiOnlyCount}</span></button>
          <button type="button" class="chip" data-matrix-filter="partial">含部分验证 <span class="chip-n">${partialTaskCount}</span></button>
        </div>
        <div class="search-tools">
          <select id="matrix-kind" class="matrix-select" aria-label="按门类筛选">
            <option value="">全部门类</option>
            ${kindEntries.map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("")}
          </select>
          <input id="matrix-search" class="matrix-input" type="search" placeholder="搜索任务名或编号…" autocomplete="off">
        </div>
      </div>
    </div>
    <div class="matrix-wrap">
      <table class="matrix-table" id="matrix-table">
        <thead>
          <tr>
            <th>任务</th>
            <th>门类</th>
            <th>Gemini</th>
            <th>Grok（Cursor）</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <details class="run-meta-details" style="margin-top:28px;">
      <summary>查看单条运行记录 JSON 规范与纯文本清单</summary>
      <div class="run-meta-body">
        <pre class="prompt">{
  "taskId": "",
  "provider": "",
  "model": "",
  "modelVersion": "",
  "startedAt": "",
  "parameters": "",
  "promptSha256": "",
  "rawOutput": "",
  "status": "success",
  "checks": [],
  "repairs": []
}</pre>
        <pre class="prompt" id="pending-list">${escapeHtml(taskChecklist())}</pre>
      </div>
    </details>
  </section>`
}

export function methodView() {
  return `<section class="prose">
    <p class="kicker">测试方法</p>
    <h1>固定提示，才好复现</h1>
    <p class="lede">主馆是作品任务：模型交一个能打开的文件。短题是给人热身的，点选和核对都不算模型已经交卷。</p>
    <h2>任务和短题</h2>
    <p>作品任务的「复制题面」只含交给模型的那段话。验收点留在页面上，给人打开产物之后逐条看。短题仍有默认收起的参考答案，那些答案不是模型输出。</p>
    <h2>提示词不要改</h2>
    <p>引用来的题面按原页文字复制。问笺馆原创任务也整段复制。不要把验收清单或别人的答案贴回提示里。</p>
    <h2>多模型辅助执行与记录规范</h2>
    <p>目前馆内同时收录 <strong>Cursor 辅助执行（Grok）</strong> 与 <strong>Gemini 辅助执行</strong> 两类带工具的真实运行记录。页面会明确标明执行环境、平台模型名、起止时间以及题面与产物的 SHA-256 摘要。未完全验收的运行会如实标为「部分验证」；首次产物单独保存，若后来修复则单列 v2 不覆盖第一版。</p>
    <h2>个例不是排名</h2>
    <p>做对一道，不能说明一个模型整体更强；做错一道，也不能给它排座次。同题并排对比是为了让不同模型在交互、物理、审美与代码完整度上的差异一眼可见。</p>
    <h2>这里拒绝做什么</h2>
    <ul>
      <li>没有原始响应和模型标识，就不写成功或失败。</li>
      <li>不把参考站上别人的模型答案算成问笺馆的运行。</li>
      <li>不把开发时画的示意图标成模型作品。</li>
      <li>密钥不进仓库，也不进这个静态页面。</li>
    </ul>
    <p><a href="#/models">看模型档案</a>，<a href="#/tasks">看作品任务</a>，或去 <a href="#/warmup">短题热身</a>。</p>
  </section>`
}

export function shell() {
  const runs = resultBook.runs || []
  const models = [...new Set(runs.map(runModelShort))]
  return `<button type="button" class="skip" data-scroll-to="content">跳到内容</button>
  <header class="top">
    <a class="brand" href="#/"><span class="seal" aria-hidden="true">笺</span>问笺馆</a>
    <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="打开菜单">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <nav id="site-nav" aria-label="馆内">
      <a href="#/tasks" data-nav="tasks">作品任务</a>
      <a href="#/tasks?model=both" data-nav="compare">双模型对比</a>
      <a href="#/models" data-nav="models">模型档案</a>
      <a href="#/warmup" data-nav="warmup">短题热身</a>
      <a href="#/method" data-nav="method">测试方法</a>
    </nav>
    <div class="theme-switch" role="group" aria-label="馆内光线">
      <button type="button" data-theme-set="day" aria-pressed="true" aria-label="日间纸色">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
      <button type="button" data-theme-set="night" aria-pressed="false" aria-label="夜间">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3a8 8 0 1 0 6 12A7 7 0 0 1 15 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </header>
  <main id="content" tabindex="-1"></main>
  <footer class="foot">
    <p>问笺馆主馆收录 ${taskList.length} 道作品任务与 ${runs.length} 次真实模型运行（${escapeHtml(models.join(" / ") || "待测")}）。</p>
    <p>一次运行只代表那一次。没有原始响应，就不写模型成绩。</p>
    <p class="quiet">按 / 键聚焦检索；详情页支持 ← / → 切换相邻展品，按 Esc 收起答案或返回上一页。</p>
  </footer>
  <div id="toast" role="status" aria-live="polite"></div>`
}
