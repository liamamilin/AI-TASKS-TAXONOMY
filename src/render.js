import { questions, resultBook, typeList, typeMap } from "./bank.js"
import { DIFF_LABEL, exhibitText, fullPrompt } from "./logic.js"
import { renderArt } from "./scenes.js"

export function exhibitNumber(id) {
  return id.slice(3)
}

export function filterQuestions(params) {
  const type = params.get("type") || ""
  const difficulty = params.get("d") || ""
  const word = (params.get("s") || "").trim().toLowerCase()
  return questions.filter((question) => {
    if (type && question.type !== type) return false
    if (difficulty && String(question.difficulty) !== difficulty) return false
    if (!word) return true
    const blob = `${question.id} ${question.title} ${question.hook} ${question.prompt} ${typeMap[question.type].label}`.toLowerCase()
    return blob.includes(word)
  })
}

function queryHref(path, params) {
  const text = params.toString()
  return `#${path}${text ? `?${text}` : ""}`
}

function withParam(params, key, value) {
  const next = new URLSearchParams(params)
  if (!value || next.get(key) === value) next.delete(key)
  else next.set(key, value)
  return queryHref("/warmup", next)
}

function metaLine(question) {
  return `${typeMap[question.type].label} · ${DIFF_LABEL[question.difficulty]} · 约 ${question.minutes} 分钟`
}

function frame(question, mode, plaque) {
  return `<div class="frame frame-${mode}">
    <div class="mat">${renderArt(question, mode === "card" ? "thumb" : mode)}</div>
    ${plaque || ""}
  </div>`
}

function plaque(question, extra = "") {
  return `<div class="plaque">
    <p class="exhibit-no">展品 No. ${exhibitNumber(question.id)}${extra}</p>
    <h3>${escapeHtml(question.title)}</h3>
    <p>${escapeHtml(question.hook)}</p>
  </div>`
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))
}

export function card(question, params) {
  return `<a class="card" href="${queryHref(`/q/${question.id}`, params)}">
    ${frame(question, "card")}
    <div class="card-body">
      <p class="exhibit-no">展品 No. ${exhibitNumber(question.id)}</p>
      <h3>${escapeHtml(question.title)}</h3>
      <p class="hook">${escapeHtml(question.hook)}</p>
      <p class="meta">${escapeHtml(metaLine(question))}</p>
    </div>
  </a>`
}

export function homeView(params, featuredId) {
  const featured = questions.find((question) => question.id === featuredId) || questions[0]
  const shown = filterQuestions(params)
  const type = params.get("type") || ""
  const difficulty = params.get("d") || ""
  return `<section class="hero">
    <div>
      <p class="kicker">短题热身 · 给人先玩，不做模型打分</p>
      <h1>短题</h1>
      <p class="lede">这 88 道是上一版留下的短题：看图、约束、歧义和几行代码。它们给人先热手，作品任务与多模型实测产物请看主馆与模型档案。</p>
      <div class="actions">
        <a class="btn btn-primary" href="#/tasks">回到作品任务</a>
        <a class="btn btn-ghost" href="#/models">模型档案</a>
      </div>
      <div class="stats">
        <p><b>${questions.length}</b><span>道短题</span></p>
        <p><b>${typeList.length}</b><span>个类型</span></p>
        <p><b>${resultBook.runs?.length || 0}</b><span>次主馆运行</span></p>
      </div>
    </div>
    <div class="hero-exhibit">
      <a class="exhibit-link" href="${queryHref(`/q/${featured.id}`, params)}">
        ${frame(featured, "hero", `<div class="plaque"><p class="exhibit-no">展品 No. ${exhibitNumber(featured.id)} · 正在展出</p><h2>${escapeHtml(featured.title)}</h2><p>问笺馆自制陈列，2026</p></div>`)}
      </a>
      <div class="feature-nav">
        <button type="button" class="btn btn-ghost btn-sm" data-feature="-1">← 上一件</button>
        <button type="button" class="btn btn-ghost btn-sm" data-feature="1">下一件 →</button>
      </div>
    </div>
  </section>
  <section class="collection" id="collection">
    <div class="section-head">
      <div>
        <h2>短题热身</h2>
        <p>给人先热手。参考答案默认收着。这里的点击和核对是人在做题，不是模型交作品。</p>
      </div>
      <p class="count" id="shown">${shown.length} 件展品</p>
    </div>
    <div class="filters-panel">
      <div class="filter-row">
        <span class="filter-label">类型</span>
        <div class="chips" role="toolbar" aria-label="按类型">
          <a class="chip ${type ? "" : "on"}" href="${withParam(params, "type", "")}" aria-pressed="${type ? "false" : "true"}">全部</a>
          ${typeList.map((item) => `<a class="chip ${type === item.id ? "on" : ""}" href="${withParam(params, "type", item.id)}" aria-pressed="${type === item.id}" title="${escapeHtml(item.blurb)}">${escapeHtml(item.label)}</a>`).join("")}
        </div>
      </div>
      <div class="filter-row filter-row-bottom">
        <div class="chips" role="toolbar" aria-label="按难度">
          <a class="chip ${difficulty ? "" : "on"}" href="${withParam(params, "d", "")}" aria-pressed="${difficulty ? "false" : "true"}">任何难度</a>
          ${[1, 2, 3].map((level) => `<a class="chip ${difficulty === String(level) ? "on" : ""}" href="${withParam(params, "d", String(level))}" aria-pressed="${difficulty === String(level)}">${DIFF_LABEL[level]}</a>`).join("")}
        </div>
        <div class="search-tools">
          <label class="search">
            <span class="sr-only">检索短题</span>
            <input id="qsearch" data-search-base="/warmup" type="search" value="${escapeHtml(params.get("s") || "")}" placeholder="标题、编号或一句话（/）" autocomplete="off">
          </label>
          <button type="button" class="btn btn-primary btn-sm" data-random>随便逛逛</button>
        </div>
      </div>
    </div>
    <div class="cards" id="cards">
      ${shown.length ? shown.map((question) => card(question, params)).join("") : `<p class="empty">没有对上的展品。换个词，或清掉筛选。</p>`}
    </div>
  </section>`
}

export function cardsHtml(params) {
  const shown = filterQuestions(params)
  return {
    count: `${shown.length} 件展品`,
    html: shown.length ? shown.map((question) => card(question, params)).join("") : `<p class="empty">没有对上的展品。换个词，或清掉筛选。</p>`,
  }
}

function guessControl(question) {
  if (question.answerMode === "open") {
    return `<label class="guess" for="draft">先写在这里。文字只留在这台浏览器里，不会上传。
      <textarea id="draft" rows="5"></textarea>
    </label>`
  }
  const multiline = question.spec.kind === "template" && (question.spec.op === "powers" || question.spec.op === "judge-repeat")
  const hint = question.spec.kind === "readings" ? "两种意思都点到即可，字不必和参考答案完全一样。" : "对错只告诉你有没有对上，不会趁机把答案说出来。"
  return `<form class="guess" data-guess>
    <label for="guess">先写你的答案</label>
    ${multiline ? `<textarea id="guess" name="guess" rows="${question.spec.op === "powers" ? 3 : 2}" autocomplete="off" spellcheck="false"></textarea>` : `<input id="guess" name="guess" autocomplete="off" spellcheck="false" autocapitalize="off">`}
    <button class="btn btn-primary" type="submit">核对</button>
    <p class="quiet">${hint}</p>
    <p class="guess-note" role="status"></p>
  </form>`
}

export function questionView(id, params) {
  const question = questions.find((item) => item.id === id)
  if (!question) {
    return `<section class="missing"><h1>这件展品不在馆里</h1><p><a href="#/gallery">回到馆藏</a></p></section>`
  }
  const pool = filterQuestions(params)
  const list = pool.some((item) => item.id === id) ? pool : questions
  const index = list.findIndex((item) => item.id === id)
  const prev = list[index - 1]
  const next = list[index + 1]
  const typeLabel = typeMap[question.type].label
  const prompt = fullPrompt(question, typeLabel)
  const linkBack = queryHref("/warmup", params)
  return `<article class="detail">
    <p class="crumb"><a href="${linkBack}">短题</a> / 展品 No. ${exhibitNumber(question.id)}</p>
    <p class="kicker">${escapeHtml(typeLabel)} · ${DIFF_LABEL[question.difficulty]} · 约 ${question.minutes} 分钟 · ${question.answerMode === "open" ? "开放题" : "客观题"}</p>
    <h1>${escapeHtml(question.title)}</h1>
    <p class="hook">${escapeHtml(question.hook)}</p>
    ${frame(question, "detail", plaque(question, " · 问笺馆自制"))}
    <section class="prompt-block">
      <div class="section-head">
        <h2>提示词</h2>
        <div class="actions">
          <button type="button" class="btn btn-primary btn-sm" data-copy="prompt">复制提示</button>
          <button type="button" class="btn btn-ghost btn-sm" data-copy="link">复制链接</button>
        </div>
      </div>
      <pre class="prompt" id="prompt-text">${escapeHtml(prompt)}</pre>
      ${exhibitText(question).trim() ? `<p class="quiet">上面的文字材料和图画是同一份内容。复制时会把文字材料一并带走。</p>` : ""}
    </section>
    ${guessControl(question)}
    <button type="button" class="btn btn-ghost reveal" aria-expanded="false" aria-controls="answer-panel">${question.answerMode === "open" ? "看评分要点" : "看参考答案"}</button>
    <div id="answer-panel" class="answer" hidden tabindex="-1">
      ${question.answerMode === "open" ? openAnswer(question) : objectiveAnswer(question)}
    </div>
    <nav class="pager" aria-label="相邻展品">
      ${prev ? `<a href="${queryHref(`/q/${prev.id}`, params)}">← 上一件 · ${escapeHtml(prev.title)}</a>` : `<span></span>`}
      ${next ? `<a href="${queryHref(`/q/${next.id}`, params)}">下一件 · ${escapeHtml(next.title)} →</a>` : `<span></span>`}
    </nav>
  </article>`
}

function objectiveAnswer(question) {
  const computed = !["points", "audit"].includes(question.spec.kind)
  return `<h2>参考答案</h2>
    <p class="answer-text">${escapeHtml(question.answer)}</p>
    <h2>为什么</h2>
    <p>${escapeHtml(question.explanation)}</p>
    <p class="quiet">${computed ? "这道题的参考答案可以由题目数据重算。仓库里的校验脚本会再算一遍，和写下的答案比对。" : "这道题的核对点写在解释里。它不是模型的输出，也没有被人拿去跑过。"}</p>`
}

function openAnswer(question) {
  return `<h2>评分要点</h2>
    <ul>${question.rubric.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <p class="quiet">这些要点是给人打分用的，不是模型的回答，也不合成一个总分。</p>
    ${question.example ? `<h2>参照例句</h2><p>出题人写的，不是模型输出，也不是唯一正确答案。</p><pre class="prompt">${escapeHtml(question.example)}</pre>` : ""}
    <p>${escapeHtml(question.explanation)}</p>`
}

export function checklistText() {
  return questions.map((question) => `${question.id}\t${question.title}\t${typeMap[question.type].label}\t${DIFF_LABEL[question.difficulty]}`).join("\n")
}

export function promptFor(id) {
  const question = questions.find((item) => item.id === id)
  if (!question) return ""
  return fullPrompt(question, typeMap[question.type].label)
}
