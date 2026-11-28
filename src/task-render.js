import tasks from "../data/tasks.json" with { type: "json" }
import previews from "../data/previews.json" with { type: "json" }
import resultBook from "../data/results.json" with { type: "json" }

export const taskList = tasks

const KINDS = {
  animation: "动画",
  scene3d: "三维场景",
  game: "游戏",
  app: "应用",
  shader: "着色器",
  data: "数据与排版",
}

export function kindLabel(kind) {
  return KINDS[kind] || kind
}

export const kindEntries = Object.entries(KINDS)

const MODEL_NAMES = { gemini: "Gemini", grok: "Grok", luna: "GPT-6 Luna" }

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))
}

export function checkWord(item) {
  if (item.pass) return "通过"
  const evidence = String(item.evidence || "")
  if (evidence.startsWith("未验证")) return "未验证"
  if (evidence.startsWith("部分")) return "部分"
  return "未通过"
}

export function statusWord(status) {
  if (status === "failure") return "失败"
  if (status === "partial") return "部分验证"
  return "通过"
}

export function runModelKey(run) {
  const blob = `${run.provider || ""} ${run.model || ""} ${run.executionClass || ""}`.toLowerCase()
  if (blob.includes("gemini")) return "gemini"
  if (blob.includes("grok") || blob.includes("cursor")) return "grok"
  if (run.model === "gpt-6-luna") return "luna"
  return (run.model || run.provider || "other").toLowerCase()
}

export function runModelShort(run) {
  const key = runModelKey(run)
  return Object.hasOwn(MODEL_NAMES, key) ? MODEL_NAMES[key] : run.model || run.provider || "模型"
}

export function modelPillClass(key) {
  return Object.hasOwn(MODEL_NAMES, key) ? `pill-${key}` : ""
}

export function runsForTask(taskId) {
  return (resultBook.runs || []).filter((run) => run.taskId === taskId)
}

function groupRunsByModel(runs) {
  const map = new Map()
  for (const run of runs) {
    const key = runModelKey(run)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(run)
  }
  for (const list of map.values()) {
    list.sort((a, b) => String(a.revision || "v1").localeCompare(String(b.revision || "v1")))
  }
  const order = Object.keys(MODEL_NAMES)
  return [...map.entries()].sort(([a], [b]) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export function filterTasks(params) {
  const kind = params.get("kind") || ""
  const coverage = params.get("src") || ""
  const model = params.get("model") || ""
  const word = (params.get("s") || "").trim().toLowerCase()
  return taskList.filter((task) => {
    if (kind && task.kind !== kind) return false
    if (coverage && task.coverage !== coverage) return false
    if (model) {
      const runs = runsForTask(task.id)
      const keys = new Set(runs.map(runModelKey))
      if (model === "both" && !(keys.has("gemini") && keys.has("grok"))) return false
      if (model === "multi" && keys.size < 2) return false
      if (model === "gemini-only" && !(keys.has("gemini") && !keys.has("grok"))) return false
      if (Object.hasOwn(MODEL_NAMES, model) && !keys.has(model)) return false
      if (model === "partial" && !runs.some((r) => r.status === "partial")) return false
    }
    if (!word) return true
    const blob = `${task.id} ${task.title} ${task.summary} ${task.prompt} ${kindLabel(task.kind)}`.toLowerCase()
    return blob.includes(word)
  })
}

function href(path, params) {
  const text = params.toString()
  return `#${path}${text ? `?${text}` : ""}`
}

function toggle(params, key, value) {
  const next = new URLSearchParams(params)
  if (!value || next.get(key) === value) next.delete(key)
  else next.set(key, value)
  return href("/tasks", next)
}

function previewArt(task, eager) {
  const preview = previews[task.id]
  if (!preview) {
    return `<div class="art art-untested"><span class="untested-kind">${esc(kindLabel(task.kind))}</span><strong>待测</strong><p>等待首次真实产物</p></div>`
  }
  const tag = `<span class="preview-tag">${esc(preview.label)} · ${esc(statusWord(preview.status))}</span>`
  if (preview.text) {
    return `<div class="art art-text"><pre>${esc(preview.text)}</pre>${tag}</div>`
  }
  if (preview.live && preview.artifact) {
    return `<div class="art art-live" data-live-src="${esc(preview.artifact)}" data-live-title="${esc(task.title)} 实时预览">
      <div class="live-placeholder"><span class="untested-kind">${esc(kindLabel(task.kind))}</span><strong>实时作品</strong><p>进入视口自动加载</p></div>
      ${tag}
    </div>`
  }
  const loading = eager ? "eager" : "lazy"
  const priority = eager ? ` fetchpriority="high"` : ""
  return `<div class="art art-preview"><img src="${esc(preview.image)}" alt="${esc(task.title)}，${esc(preview.label)} 的产物截图" width="960" height="540" loading="${loading}" decoding="async"${priority}>${tag}</div>`
}

function previewLine(task) {
  const preview = previews[task.id]
  if (!preview) return ""
  return `<p class="quiet">首页展框默认展示 ${esc(preview.label)}（${esc(preview.artifact)}）。${esc(preview.note || "")}</p>`
}

function modelPills(task) {
  const runs = runsForTask(task.id)
  if (!runs.length) return `<span class="pill pill-untested">待测</span>`
  return groupRunsByModel(runs).map(([key, list]) => {
    const label = runModelShort(list[0])
    const hasOk = list.some((r) => r.status === "success")
    const hasFail = list.some((r) => r.status === "failure")
    const hasPartial = list.some((r) => r.status === "partial")
    let state = "失败"
    let statusCls = "pill-fail"
    if (hasOk && hasFail) { state = "修复通过"; statusCls = "pill-ok" }
    else if (hasOk) { state = "通过"; statusCls = "pill-ok" }
    else if (hasPartial) { state = "部分验证"; statusCls = "pill-partial" }
    return `<span class="pill ${modelPillClass(key)} ${statusCls}">${esc(label)} · ${state}</span>`
  }).join("")
}

function statusText(task) {
  const runs = runsForTask(task.id)
  if (!runs.length) return "待测"
  const groups = groupRunsByModel(runs)
  const names = groups.map(([, list]) => runModelShort(list[0]))
  const ranks = new Set(runs.map((run) => run.status))
  if (names.length >= 2) return `${names.join(" × ")} 可对比`
  if (ranks.has("success") && ranks.has("failure")) return `${names[0]} 修复后通过`
  if (ranks.has("success")) return `${names[0]} 通过`
  if (ranks.has("partial")) return `${names[0]} 部分验证`
  return `${names[0]} 失败`
}

function difficultyDots(level) {
  const n = Math.max(1, Math.min(3, Number(level) || 1))
  return `<span class="diff" title="难度 ${n}/3">${"●".repeat(n)}${"○".repeat(3 - n)}</span>`
}

export function taskHome(params, featuredId) {
  const featured = taskList.find((task) => task.id === featuredId) || taskList[0]
  const featPos = Math.max(0, featuredTaskIds.indexOf(featured.id)) + 1
  const shown = filterTasks(params)
  const kind = params.get("kind") || ""
  const coverage = params.get("src") || ""
  const model = params.get("model") || ""
  const searchVal = params.get("s") || ""
  const hasFilter = Boolean(kind || coverage || model || searchVal.trim())

  const allRuns = resultBook.runs || []
  const kindCounts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, taskList.filter((t) => t.kind === k).length]))
  const compareCount = taskList.filter((t) => new Set(runsForTask(t.id).map(runModelKey)).size >= 2).length
  const geminiOnlyCount = taskList.filter((t) => {
    const keys = new Set(runsForTask(t.id).map(runModelKey))
    return keys.has("gemini") && !keys.has("grok")
  }).length
  const partialCount = taskList.filter((t) => runsForTask(t.id).some((r) => r.status === "partial")).length
  const modelCounts = Object.entries(MODEL_NAMES).map(([id, label]) => ({
    id, label, count: new Set(allRuns.filter((run) => runModelKey(run) === id).map((run) => run.taskId)).size,
  }))

  return `<section class="hero">
    <div>
      <p class="kicker">让模型交作品 · 多模型实测陈列馆</p>
      <h1>问笺馆</h1>
      <p class="lede">主馆收录 <strong>${taskList.length} 道</strong>需要交付可运行文件的作品任务，覆盖动画、三维场景、游戏、应用、着色器与数据排版六大门类。其中 <strong>${compareCount} 道</strong>支持并排查看不同模型的产物。</p>
      <div class="actions">
        <a class="btn btn-primary" href="#/tasks?model=multi">多模型对比（${compareCount}）</a>
        <a class="btn btn-ghost" href="#/models">模型档案与矩阵</a>
        <a class="btn btn-ghost" href="#/warmup">短题热身</a>
      </div>
      <div class="stats">
        <p><b>${taskList.length}</b><span>道作品任务</span></p>
        <p><b>${compareCount}</b><span>道多模型对比</span></p>
        <p><b>${allRuns.length}</b><span>次真实运行</span></p>
        <p><b>6</b><span>大产物门类</span></p>
      </div>
    </div>
    <div class="hero-exhibit">
      <a class="exhibit-link" href="#/t/${featured.id}">
        <div class="frame frame-hero">
          <div class="mat mat-task">${previewArt(featured, true)}</div>
          <div class="plaque">
            <p class="exhibit-no">${featured.coverage === "quoted" ? "引用公开题面" : "问笺馆原创"} · ${esc(statusText(featured))}</p>
            <h2>${esc(featured.title)}</h2>
            <p>${esc(featured.summary)}</p>
          </div>
        </div>
      </a>
      <div class="feature-nav">
        <button type="button" class="btn btn-ghost btn-sm" data-task-feature="-1">← 上一件</button>
        <span class="quiet feat-counter">精选 ${featPos} / ${featuredTaskIds.length}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-task-feature="1">下一件 →</button>
        <a class="btn btn-ghost btn-sm" href="#/t/${featured.id}" style="margin-left:auto;">进入展品</a>
      </div>
    </div>
  </section>
  <section class="collection" id="collection">
    <div class="section-head">
      <div>
        <h2>作品任务馆藏</h2>
        <p>每张卡片都是一次真实制作。打开可复制纯净题面、对照验收要点，并实时预览或并排对比不同模型的产物。</p>
      </div>
      <p class="count" id="shown">显示 ${shown.length} / ${taskList.length} 件</p>
    </div>
    <div class="filters-panel">
      <div class="filter-row">
        <span class="filter-label">门类</span>
        <div class="chips" role="toolbar" aria-label="按产物">
          <a class="chip ${kind ? "" : "on"}" href="${toggle(params, "kind", "")}">全部 <span class="chip-n">${taskList.length}</span></a>
          ${Object.entries(KINDS).map(([id, label]) => `<a class="chip ${kind === id ? "on" : ""}" href="${toggle(params, "kind", id)}">${label} <span class="chip-n">${kindCounts[id] || 0}</span></a>`).join("")}
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">评测</span>
        <div class="chips" role="toolbar" aria-label="按模型与评测状态">
          <a class="chip ${model ? "" : "on"}" href="${toggle(params, "model", "")}">全部状态</a>
          <a class="chip ${model === "multi" ? "on" : ""}" href="${toggle(params, "model", "multi")}">多模型对比 <span class="chip-n">${compareCount}</span></a>
          <a class="chip ${model === "gemini-only" ? "on" : ""}" href="${toggle(params, "model", "gemini-only")}">待补 Grok <span class="chip-n">${geminiOnlyCount}</span></a>
          ${modelCounts.map(({ id, label, count }) => `<a class="chip ${model === id ? "on" : ""}" href="${toggle(params, "model", id)}">${label} <span class="chip-n">${count}</span></a>`).join("")}
          <a class="chip ${model === "partial" ? "on" : ""}" href="${toggle(params, "model", "partial")}">部分验证 <span class="chip-n">${partialCount}</span></a>
        </div>
      </div>
      <div class="filter-row filter-row-bottom">
        <div class="chips" role="toolbar" aria-label="按来源">
          <a class="chip ${coverage ? "" : "on"}" href="${toggle(params, "src", "")}">全部来源</a>
          <a class="chip ${coverage === "quoted" ? "on" : ""}" href="${toggle(params, "src", "quoted")}">引用公开题面</a>
          <a class="chip ${coverage === "original" ? "on" : ""}" href="${toggle(params, "src", "original")}">问笺馆原创</a>
          ${hasFilter ? `<a class="chip chip-clear" href="#/tasks">清空筛选</a>` : ""}
        </div>
        <div class="search-tools">
          <label class="search">
            <span class="sr-only">检索任务</span>
            <input id="qsearch" data-search-base="/tasks" type="search" value="${esc(searchVal)}" placeholder="按标题、编号或关键词检索（/）" autocomplete="off">
          </label>
          <button type="button" class="btn btn-primary btn-sm" data-random="tasks">随便看一件</button>
        </div>
      </div>
    </div>
    <div class="cards" id="cards">
      ${shown.length ? shown.map((task, index) => taskCard(task, params, index < 6)).join("") : `<p class="empty">没有符合当前筛选条件的任务。<a href="#/tasks">点此重置全部筛选</a>。</p>`}
    </div>
  </section>`
}

export function taskCardsHtml(params) {
  const shown = filterTasks(params)
  return {
    count: `显示 ${shown.length} / ${taskList.length} 件`,
    html: shown.length ? shown.map((task, index) => taskCard(task, params, index < 6)).join("") : `<p class="empty">没有符合当前筛选条件的任务。<a href="#/tasks">点此重置全部筛选</a>。</p>`,
  }
}

function taskCard(task, params, eager) {
  return `<a class="card" href="${href(`/t/${task.id}`, params)}">
    <div class="frame frame-thumb"><div class="mat mat-task">${previewArt(task, eager)}</div></div>
    <div class="card-body">
      <p class="exhibit-no">${esc(kindLabel(task.kind))} · ${task.coverage === "quoted" ? "引用" : "原创"} · ${difficultyDots(task.difficulty)}</p>
      <h3>${esc(task.title)}</h3>
      <p class="hook">${esc(task.summary)}</p>
      <div class="pill-row">${modelPills(task)}</div>
      <p class="meta">约 ${task.minutes} 分钟制作</p>
    </div>
  </a>`
}

export function taskDetail(id, params) {
  const task = taskList.find((item) => item.id === id)
  if (!task) return `<section class="missing"><h1>没有这件任务</h1><p><a href="#/tasks">回到任务</a></p></section>`
  const pool = filterTasks(params)
  const list = pool.some((item) => item.id === id) ? pool : taskList
  const index = list.findIndex((item) => item.id === id)
  const prev = list[index - 1]
  const next = list[index + 1]
  const runs = runsForTask(task.id)
  const grouped = groupRunsByModel(runs)
  const canCompare = grouped.length >= 2

  return `<article class="detail">
    <p class="crumb"><a href="${href("/tasks", params)}">作品任务</a> / ${esc(task.id)}</p>
    <p class="kicker">${esc(kindLabel(task.kind))} · ${task.coverage === "quoted" ? "引用公开题面" : "问笺馆原创"} · 约 ${task.minutes} 分钟 · ${difficultyDots(task.difficulty)}</p>
    <h1>${esc(task.title)}</h1>
    <p class="hook">${esc(task.summary)}</p>
    <div class="detail-badges">
      <div class="pill-row">${modelPills(task)}</div>
      ${runs.length ? `<button type="button" class="btn btn-primary btn-sm" data-scroll-to="runs-section">${canCompare ? "直达模型并排对比 ↓" : `查看实测产物（${runs.length}）↓`}</button>` : ""}
    </div>
    ${previewLine(task)}
    <div class="spec-grid">
      <section class="spec-card"><h2>要交的产物</h2><p>${esc(task.artifact)}</p></section>
      <section class="spec-card"><h2>怎么打开</h2><p>${esc(task.run)}</p></section>
    </div>
    <div class="spec-grid">
      <section class="spec-card">
        <h2>约束</h2>
        <ul>${task.constraints.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </section>
      <section class="spec-card">
        <h2>验收要点</h2>
        <ul>${task.checks.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </section>
    </div>
    <section class="prompt-block">
      <div class="section-head">
        <h2>给模型的题面</h2>
        <div class="actions">
          <button type="button" class="btn btn-primary btn-sm" data-copy="task">复制题面</button>
          <button type="button" class="btn btn-ghost btn-sm" data-copy="task-link">复制链接</button>
        </div>
      </div>
      <pre class="prompt" id="prompt-text">${esc(task.prompt)}</pre>
      <p class="quiet">复制出去的就是上面这一段，不含验收清单，也不含任何模型回答。</p>
    </section>
    ${sourceBlock(task)}
    <section id="runs-section" class="runs-section" tabindex="-1">
      <div class="section-head">
        <div>
          <h2>本馆运行与产物</h2>
          <p class="quiet">${runs.length ? `共收录 ${grouped.length} 个模型的 ${runs.length} 次真实运行。` : "等待首次真实运行。"}</p>
        </div>
        ${canCompare ? `<div class="actions">
          <button type="button" class="btn btn-ghost btn-sm" data-reload-all>同步重载产物</button>
          <button type="button" class="btn btn-ghost btn-sm" data-wide-compare>宽幅沉浸对比</button>
          <div class="chips" role="tablist" aria-label="视图模式">
            <button type="button" class="chip on" data-compare-mode="side">并排对比</button>
            <button type="button" class="chip" data-compare-mode="list">全部详情（${runs.length}）</button>
          </div>
        </div>` : ""}
      </div>
      ${canCompare ? renderCompareView(grouped) : ""}
      <div class="runs-list" id="runs-list" ${canCompare ? "hidden" : ""}>
        ${runs.length ? runs.map((run) => renderRun(run, canCompare)).join("") : `<div class="callout">这件任务还没有一次可公开的模型运行。没有原始响应，就不写成功或失败。</div>`}
      </div>
    </section>
    <nav class="pager" aria-label="相邻任务">
      ${prev ? `<a href="${href(`/t/${prev.id}`, params)}">← 上一件 · ${esc(prev.title)}</a>` : `<span></span>`}
      ${next ? `<a href="${href(`/t/${next.id}`, params)}">下一件 · ${esc(next.title)} →</a>` : `<span></span>`}
    </nav>
  </article>`
}

function statusPillClass(status) {
  if (status === "failure") return "pill-fail"
  if (status === "partial") return "pill-partial"
  return "pill-ok"
}

function renderCompareView(groupedModels) {
  return `<div class="compare-grid" id="compare-view">
    ${groupedModels.map(([modelKey, list]) => {
      const latestIdx = list.length - 1
      const cardId = `cmp-card-${modelKey}`
      const hasMulti = list.length > 1
      return `<section class="compare-card" id="${esc(cardId)}">
        <div class="compare-head">
          <div>
            <span class="pill ${modelPillClass(modelKey)} pill-ok">${esc(runModelShort(list[0]))}</span>
            <h3>${esc(list[latestIdx].model || list[latestIdx].label)}</h3>
          </div>
          ${hasMulti ? `<div class="chips" role="tablist" aria-label="切换版本">
            ${list.map((r, i) => `<button type="button" class="chip chip-xs ${i === latestIdx ? "on" : ""}" data-rev-card="${esc(cardId)}" data-rev-idx="${i}">${esc(r.revision || "v1")} · ${esc(statusWord(r.status))}</button>`).join("")}
          </div>` : `<span class="pill ${statusPillClass(list[0].status)}">${esc(list[0].revision || "v1")} · ${esc(statusWord(list[0].status))}</span>`}
        </div>
        ${list.map((run, idx) => {
          const iframeId = `cmp-${run.id}`
          const isHtml = run.artifact?.endsWith(".html")
          const passed = (run.checks || []).filter((c) => c.pass).length
          const total = (run.checks || []).length
          return `<div class="rev-pane" data-rev-pane="${idx}" ${idx === latestIdx ? "" : "hidden"}>
            ${isHtml ? `
              <div class="run-bar">
                <button type="button" class="btn btn-ghost btn-sm" data-reload-iframe="${esc(iframeId)}">重载</button>
                <button type="button" class="btn btn-ghost btn-sm" data-expand-iframe="${esc(iframeId)}">放大高度</button>
                <a class="btn btn-ghost btn-sm" href="${esc(run.artifact)}" target="_blank" rel="noopener">新窗口打开</a>
                <span class="quiet" style="margin-left:auto;">验收 ${passed}/${total}</span>
              </div>
              <iframe id="${esc(iframeId)}" class="run-iframe" sandbox="allow-scripts allow-downloads allow-modals" ${idx === latestIdx ? `src="${esc(run.artifact)}"` : `data-src="${esc(run.artifact)}"`} title="${esc(runModelShort(run))} ${esc(run.revision || "v1")} 产物对比预览"></iframe>
            ` : `<div class="json-callout"><p class="quiet">非 HTML 数据产物：<code>${esc(run.artifact)}</code>（验收 ${passed}/${total}）</p><a class="btn btn-ghost btn-sm" href="${esc(run.artifact)}" target="_blank" rel="noopener">查看原始文件</a></div>`}
            <ul class="check-list">${(run.checks || []).map((item) => `<li class="${item.pass ? "chk-ok" : "chk-fail"}"><strong>${esc(checkWord(item))}</strong>：${esc(item.name)}</li>`).join("")}</ul>
          </div>`
        }).join("")}
      </section>`
    }).join("")}
  </div>`
}

function sourceBlock(task) {
  if (task.coverage === "original") {
    return `<section class="source-box"><h2>来源</h2><p>${esc(task.originalNote)}</p></section>`
  }
  return `<section class="source-box">
    <h2>题面来源</h2>
    <p>${esc(task.source.origin)}</p>
    <p><a href="${esc(task.source.page)}" target="_blank" rel="noopener">原站该任务页面</a></p>
    <p>${esc(task.source.licenseNote)}</p>
    <p class="quiet">该页若展示了某个模型的答案，那些答案不是问笺馆跑的，不会出现在这里。</p>
  </section>`
}

function renderRun(run, defer = false) {
  const iframeId = `frame-${run.id}`
  const isHtml = run.artifact?.endsWith(".html")
  const attachments = (run.files || []).filter((file) => file.artifact !== run.artifact)
  const preview = isHtml
    ? `<div class="run-bar">
        <button type="button" class="btn btn-ghost btn-sm" data-reload-iframe="${esc(iframeId)}">重载预览</button>
        <button type="button" class="btn btn-ghost btn-sm" data-expand-iframe="${esc(iframeId)}">放大高度</button>
        <a class="btn btn-ghost btn-sm" href="${esc(run.artifact)}" target="_blank" rel="noopener">新窗口单独打开</a>
      </div>
      <iframe id="${esc(iframeId)}" class="run-iframe" sandbox="allow-scripts allow-downloads allow-modals" ${defer ? `data-src="${esc(run.artifact)}"` : `src="${esc(run.artifact)}"`} title="产物预览，已隔离脚本"></iframe>`
    : `<p><a class="btn btn-ghost btn-sm" href="${esc(run.artifact)}" target="_blank" rel="noopener">打开产物文件（${esc(run.artifact)}）</a></p>`

  return `<article class="run">
    <div class="run-head">
      <div>
        <span class="pill ${modelPillClass(runModelKey(run))} ${statusPillClass(run.status)}">${esc(runModelShort(run))} · ${esc(statusWord(run.status))} · ${esc(run.revision || "v1")}</span>
        <h3>${esc(run.label || "运行")}（${esc(run.model || "模型未注明")}）</h3>
      </div>
      <span class="quiet">${esc((run.startedAt || "").slice(0, 10))}</span>
    </div>
    ${preview}
    ${attachments.length ? `<ul class="check-list" aria-label="附带产物">${attachments.map((file) => `<li><a href="${esc(file.artifact)}" target="_blank" rel="noopener">${esc(file.artifact.split("/").at(-1))}</a></li>`).join("")}</ul>` : ""}
    <ul class="check-list">${(run.checks || []).map((item) => `<li class="${item.pass ? "chk-ok" : "chk-fail"}"><strong>${esc(checkWord(item))}</strong>：${esc(item.name)} — ${esc(item.evidence || "")}</li>`).join("")}</ul>
    <details class="run-meta-details">
      <summary>查看完整复现元信息与 SHA-256 校验</summary>
      <div class="run-meta-body">
        <p><strong>执行平台：</strong>${esc(run.provider || "")} · 模型记录：${esc(run.model || "")}</p>
        <p><strong>时间：</strong>${esc(run.startedAt || "")} 至 ${esc(run.endedAt || "")}</p>
        <p><strong>上下文：</strong>${esc(run.context || "")}</p>
        <p><strong>运行环境：</strong>${esc(run.environment || "")}</p>
        ${run.parameters ? `<p><strong>运行参数：</strong>${esc(run.parameters)}</p>` : ""}
        <p><strong>题面 SHA-256：</strong><code>${esc(run.promptSha256 || "")}</code></p>
        <p><strong>产物 SHA-256：</strong><code>${esc(run.artifactSha256 || "")}</code></p>
        <p>${(run.repairs || []).length ? `另有后续版本，不替代这一次：${esc(run.repairs.join("、"))}` : "没有后续修复版，首次产物原样保留。"}</p>
      </div>
    </details>
  </article>`
}

export function taskPrompt(id) {
  return taskList.find((task) => task.id === id)?.prompt || ""
}

export function taskChecklist() {
  return taskList.map((task) => {
    const models = [...new Set(runsForTask(task.id).map(runModelShort))]
    return `${task.id}\t${task.title}\t${kindLabel(task.kind)}\t${task.coverage}\t${models.length ? models.join("+") : "待测"}`
  }).join("\n")
}

export const featuredTaskIds = [
  "ref-pelican-bicycle",
  "orig-aurora-sky",
  "orig-glass-orb",
  "orig-pendulum-wave",
  "orig-isometric-courtyard",
  "orig-ink-fluid",
  "ref-solar-system",
  "orig-fractal-canyon",
]
