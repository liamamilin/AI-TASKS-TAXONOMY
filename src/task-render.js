import tasks from "../data/tasks.json" with { type: "json" }
import { resultBook } from "./bank.js"

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

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))
}

export function filterTasks(params) {
  const kind = params.get("kind") || ""
  const coverage = params.get("src") || ""
  const word = (params.get("s") || "").trim().toLowerCase()
  return taskList.filter((task) => {
    if (kind && task.kind !== kind) return false
    if (coverage && task.coverage !== coverage) return false
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

function motif(kind) {
  const shapes = {
    animation: `<circle cx="70" cy="54" r="18" fill="#e2b656"/><path d="M40 92 H120" stroke="#2a2420" stroke-width="4"/>`,
    scene3d: `<path d="M80 28 L120 52 V100 L80 76 Z M40 52 L80 28 V76 L40 100 Z M40 52 L80 76 L120 52" fill="#c4493a" stroke="#2a2420"/>`,
    game: `<rect x="36" y="40" width="88" height="52" rx="8" fill="#2c4a6e"/><circle cx="58" cy="66" r="8" fill="#f7f1e4"/><circle cx="102" cy="66" r="8" fill="#f7f1e4"/>`,
    app: `<rect x="34" y="30" width="92" height="68" rx="4" fill="#f7f1e4" stroke="#2a2420"/><rect x="42" y="42" width="36" height="24" fill="#9ec9e6"/>`,
    shader: `<path d="M30 90 Q60 20 90 90 T150 90" fill="none" stroke="#3d6f9a" stroke-width="6"/>`,
    data: `<rect x="40" y="28" width="80" height="72" fill="#fffaf3" stroke="#2a2420"/><path d="M52 48 H108 M52 64 H96 M52 80 H88" stroke="#c4493a" stroke-width="3"/>`,
  }
  return `<svg class="art-svg" viewBox="0 0 640 360" aria-hidden="true"><rect width="640" height="360" fill="#f6efe2"/><g transform="translate(240 110) scale(2.2)">${shapes[kind] || shapes.data}</g></svg>`
}

function statusText(task) {
  const runs = (resultBook.runs || []).filter((run) => run.taskId === task.id)
  if (!runs.length) return "未测"
  const ok = runs.some((run) => run.status === "success")
  const bad = runs.some((run) => run.status === "failure")
  if (ok && bad) return "有成功也有失败"
  return ok ? "Cursor运行成功" : "Cursor运行失败"
}

export function taskHome(params, featuredId) {
  const featured = taskList.find((task) => task.id === featuredId) || taskList[0]
  const shown = filterTasks(params)
  const kind = params.get("kind") || ""
  const coverage = params.get("src") || ""
  const quoted = taskList.filter((task) => task.coverage === "quoted").length
  return `<section class="hero">
    <div>
      <p class="kicker">让模型交作品 · 不是让人猜谜</p>
      <h1>问笺馆</h1>
      <p class="lede">这里的主馆是任务：要交出一个能打开的文件。已上架的运行标明「Cursor辅助执行/含工具」，发生在带有本仓库上下文的会话里，不是裸接口盲测。没有原始产物的任务仍写未测。</p>
      <div class="actions">
        <a class="btn btn-primary" href="#/tasks">浏览任务</a>
        <a class="btn btn-ghost" href="#/warmup">短题热身</a>
      </div>
      <div class="stats">
        <p><b>${taskList.length}</b><span>道作品任务</span></p>
        <p><b>${quoted}</b><span>道对应参考站</span></p>
        <p><b>${resultBook.runs?.length || 0}</b><span>次已记录运行</span></p>
      </div>
      <p class="quiet">88 道短题还在，只作为热身，不再当作主馆。</p>
    </div>
    <div class="hero-exhibit">
      <a class="exhibit-link" href="#/t/${featured.id}">
        <div class="frame frame-hero">
          <div class="mat"><div class="art">${motif(featured.kind)}</div></div>
          <div class="plaque">
            <p class="exhibit-no">${featured.coverage === "quoted" ? "引用公开题面" : "问笺馆原创"} · ${esc(statusText(featured))}</p>
            <h2>${esc(featured.title)}</h2>
            <p>${esc(featured.artifact)}</p>
          </div>
        </div>
      </a>
      <div class="feature-nav">
        <button type="button" class="btn btn-ghost" data-task-feature="-1">上一件</button>
        <button type="button" class="btn btn-ghost" data-task-feature="1">下一件</button>
      </div>
    </div>
  </section>
  <section class="collection" id="collection">
    <div class="section-head">
      <div>
        <h2>作品任务</h2>
        <p>每张卡片都是一次交给模型的制作。打开后有完整题面、产物格式、打开方式和验收点。</p>
      </div>
      <p class="count" id="shown">${shown.length} 件任务</p>
    </div>
    <div class="filters">
      <div class="chips" role="toolbar" aria-label="按产物">
        <a class="chip ${kind ? "" : "on"}" href="${toggle(params, "kind", "")}">全部</a>
        ${Object.entries(KINDS).map(([id, label]) => `<a class="chip ${kind === id ? "on" : ""}" href="${toggle(params, "kind", id)}">${label}</a>`).join("")}
      </div>
      <div class="chips" role="toolbar" aria-label="按来源">
        <a class="chip ${coverage ? "" : "on"}" href="${toggle(params, "src", "")}">全部来源</a>
        <a class="chip ${coverage === "quoted" ? "on" : ""}" href="${toggle(params, "src", "quoted")}">引用公开题面</a>
        <a class="chip ${coverage === "original" ? "on" : ""}" href="${toggle(params, "src", "original")}">问笺馆原创</a>
      </div>
      <label class="search">检索
        <input id="qsearch" data-search-base="/tasks" type="search" value="${esc(params.get("s") || "")}" placeholder="任务名或提示里的词" autocomplete="off">
      </label>
      <button type="button" class="btn btn-primary" data-random="tasks">随便看一件</button>
    </div>
    <div class="cards" id="cards">
      ${shown.length ? shown.map((task) => taskCard(task, params)).join("") : `<p class="empty">没有对上的任务。</p>`}
    </div>
  </section>`
}

function taskCard(task, params) {
  return `<a class="card" href="${href(`/t/${task.id}`, params)}">
    <div class="frame frame-thumb"><div class="mat"><div class="art">${motif(task.kind)}</div></div></div>
    <p class="exhibit-no">${esc(kindLabel(task.kind))} · ${task.coverage === "quoted" ? "引用" : "原创"} · ${esc(statusText(task))}</p>
    <h3>${esc(task.title)}</h3>
    <p class="hook">${esc(task.summary)}</p>
    <p class="meta">约 ${task.minutes} 分钟制作</p>
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
  const runs = (resultBook.runs || []).filter((run) => run.taskId === task.id)
  return `<article class="detail">
    <p class="crumb"><a href="${href("/tasks", params)}">作品任务</a> / ${esc(task.id)}</p>
    <p class="kicker">${esc(kindLabel(task.kind))} · ${task.coverage === "quoted" ? "引用公开题面" : "问笺馆原创"} · 约 ${task.minutes} 分钟 · ${esc(runs.length ? "见下方运行" : "未测")}</p>
    <h1>${esc(task.title)}</h1>
    <p class="hook">${esc(task.summary)}</p>
    <div class="spec-grid">
      <section><h2>要交的产物</h2><p>${esc(task.artifact)}</p></section>
      <section><h2>怎么打开</h2><p>${esc(task.run)}</p></section>
    </div>
    <h2>约束</h2>
    <ul>${task.constraints.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    <h2>打开之后怎样算做成</h2>
    <ul>${task.checks.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    <section class="prompt-block">
      <div class="section-head">
        <h2>给模型的题面</h2>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-copy="task">复制题面</button>
          <button type="button" class="btn btn-ghost" data-copy="task-link">复制链接</button>
        </div>
      </div>
      <pre class="prompt" id="prompt-text">${esc(task.prompt)}</pre>
      <p class="quiet">复制出去的就是上面这一段，不含验收清单，也不含任何模型回答。</p>
    </section>
    ${sourceBlock(task)}
    <h2>本馆运行</h2>
    ${runs.length ? runs.map(renderRun).join("") : `<div class="callout">这件任务还没有一次可公开的模型运行。没有原始响应，就不写成功或失败。</div>`}
    <nav class="pager" aria-label="相邻任务">
      ${prev ? `<a href="${href(`/t/${prev.id}`, params)}">上一件 · ${esc(prev.title)}</a>` : `<span></span>`}
      ${next ? `<a href="${href(`/t/${next.id}`, params)}">下一件 · ${esc(next.title)}</a>` : `<span></span>`}
    </nav>
  </article>`
}

function sourceBlock(task) {
  if (task.coverage === "original") {
    return `<section class="source-box"><h2>来源</h2><p>${esc(task.originalNote)}</p></section>`
  }
  return `<section class="source-box">
    <h2>题面来源</h2>
    <p>${esc(task.source.origin)}</p>
    <p><a href="${esc(task.source.page)}">原站该任务页面</a></p>
    <p>${esc(task.source.licenseNote)}</p>
    <p class="quiet">该页若展示了某个模型的答案，那些答案不是问笺馆跑的，不会出现在这里。</p>
  </section>`
}

function renderRun(run) {
  const preview = run.artifact?.endsWith(".html")
    ? `<iframe sandbox="allow-scripts" src="${esc(run.artifact)}" title="首次产物预览，已隔离脚本"></iframe>`
    : `<p><a href="${esc(run.artifact)}">打开首次产物</a></p>`
  return `<article class="run">
    <h3>${esc(run.label || "运行")} · ${esc(run.status === "failure" ? "失败" : "成功")} · ${esc(run.revision || "v1")}</h3>
    <p>${esc(run.provider || "")} · 平台记录的模型名：${esc(run.model || "底层模型未提供")}</p>
    <p>${esc(run.startedAt || "")} 至 ${esc(run.endedAt || "")}</p>
    <p>${esc(run.context || "")}</p>
    <p>${esc(run.environment || "")}</p>
    <p>题面 SHA-256 ${esc(run.promptSha256 || "")}</p>
    <p>产物 SHA-256 ${esc(run.artifactSha256 || "")}</p>
    <ul>${(run.checks || []).map((item) => `<li>${item.pass ? "通过" : "未通过"}：${esc(item.name)}。${esc(item.evidence || "")}</li>`).join("")}</ul>
    ${(run.repairs || []).length ? `<p>另有后续版本，不替代这一次：${esc(run.repairs.join("、"))}</p>` : `<p>没有后续修复版。这一次的文件没有被覆盖。</p>`}
    ${preview}
    <p><a href="${esc(run.artifact)}">单独打开首次产物</a></p>
  </article>`
}

export function taskPrompt(id) {
  return taskList.find((task) => task.id === id)?.prompt || ""
}

export function taskChecklist() {
  const ran = new Set((resultBook.runs || []).map((run) => run.taskId))
  return taskList.map((task) => `${task.id}\t${task.title}\t${kindLabel(task.kind)}\t${task.coverage}\t${ran.has(task.id) ? "有Cursor辅助运行" : "未测"}`).join("\n")
}

export const featuredTaskIds = ["ref-pelican-bicycle", "ref-minecraft-web", "ref-flappy-bird", "orig-lantern-bridge", "orig-ticket-json", "ref-ai-world-clock"]
