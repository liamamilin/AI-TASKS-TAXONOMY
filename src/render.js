import { questions, resultBook, typeList, typeMap } from "./bank.js"
import { DIFF_LABEL, exhibitText, fullPrompt } from "./logic.js"
import { renderArt } from "./scenes.js"

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
  return queryHref("/gallery", next)
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
    <p class="exhibit-no">展品 No. ${exhibitNumber(question.id)}</p>
    <h3>${escapeHtml(question.title)}</h3>
    <p class="hook">${escapeHtml(question.hook)}</p>
    <p class="meta">${escapeHtml(metaLine(question))}</p>
  </a>`
}

export function homeView(params, featuredId) {
  const featured = questions.find((question) => question.id === featuredId) || questions[0]
  const shown = filterQuestions(params)
  const type = params.get("type") || ""
  const difficulty = params.get("d") || ""
  return `<section class="hero">
    <div>
      <p class="kicker">短题陈列 · 先给人，再给模型</p>
      <h1>问笺馆</h1>
      <p class="lede">馆里是短题：看一幅图、守一条约束、拆开一句歧义、读十行代码。提示词可以整段抄走，参考答案默认扣在展签背面。这里没有模型成绩——没跑过的，就不写。</p>
      <div class="actions">
        <a class="btn btn-primary" href="#/gallery">浏览考题</a>
        <a class="btn btn-ghost" href="#/method">测试方法</a>
      </div>
      <div class="stats">
        <p><b>${questions.length}</b><span>道短题</span></p>
        <p><b>${resultBook.records.length}</b><span>个已测模型</span></p>
        <p><b>${typeList.length}</b><span>个类型</span></p>
      </div>
      <p class="quiet">模型页是空的。这是故意留白，不是还没写完的表格。</p>
    </div>
    <div class="hero-exhibit">
      <a class="exhibit-link" href="${queryHref(`/q/${featured.id}`, params)}">
        ${frame(featured, "hero", `<div class="plaque"><p class="exhibit-no">展品 No. ${exhibitNumber(featured.id)} · 正在展出</p><h2>${escapeHtml(featured.title)}</h2><p>问笺馆自制陈列，2026</p></div>`)}
      </a>
      <div class="feature-nav">
        <button type="button" class="btn btn-ghost" data-feature="-1">上一件</button>
        <button type="button" class="btn btn-ghost" data-feature="1">下一件</button>
      </div>
    </div>
  </section>
  <section class="collection" id="collection">
    <div class="section-head">
      <div>
        <h2>馆藏考题</h2>
        <p>每道题都标了类型、难度和大概要几分钟，也写了一句它哪里好玩。</p>
      </div>
      <p class="count" id="shown">${shown.length} 件展品</p>
    </div>
    <div class="filters">
      <div class="chips" role="toolbar" aria-label="按类型">
        <a class="chip ${type ? "" : "on"}" href="${withParam(params, "type", "")}" aria-pressed="${type ? "false" : "true"}">全部</a>
        ${typeList.map((item) => `<a class="chip ${type === item.id ? "on" : ""}" href="${withParam(params, "type", item.id)}" aria-pressed="${type === item.id}" title="${escapeHtml(item.blurb)}">${escapeHtml(item.label)}</a>`).join("")}
      </div>
      <div class="chips" role="toolbar" aria-label="按难度">
        <a class="chip ${difficulty ? "" : "on"}" href="${withParam(params, "d", "")}" aria-pressed="${difficulty ? "false" : "true"}">任何难度</a>
        ${[1, 2, 3].map((level) => `<a class="chip ${difficulty === String(level) ? "on" : ""}" href="${withParam(params, "d", String(level))}" aria-pressed="${difficulty === String(level)}">${DIFF_LABEL[level]}</a>`).join("")}
      </div>
      <label class="search">检索
        <input id="qsearch" type="search" value="${escapeHtml(params.get("s") || "")}" placeholder="标题、编号或一句话" autocomplete="off">
      </label>
      <button type="button" class="btn btn-primary" data-random>随便逛逛</button>
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
  const linkBack = queryHref("/gallery", params)
  return `<article class="detail">
    <p class="crumb"><a href="${linkBack}">馆藏</a> / 展品 No. ${exhibitNumber(question.id)}</p>
    <p class="kicker">${escapeHtml(typeLabel)} · ${DIFF_LABEL[question.difficulty]} · 约 ${question.minutes} 分钟 · ${question.answerMode === "open" ? "开放题" : "客观题"}</p>
    <h1>${escapeHtml(question.title)}</h1>
    <p class="hook">${escapeHtml(question.hook)}</p>
    ${frame(question, "detail", plaque(question, " · 问笺馆自制"))}
    <section class="prompt-block">
      <div class="section-head">
        <h2>提示词</h2>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-copy="prompt">复制提示</button>
          <button type="button" class="btn btn-ghost" data-copy="link">复制链接</button>
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
      ${prev ? `<a href="${queryHref(`/q/${prev.id}`, params)}">上一件 · ${escapeHtml(prev.title)}</a>` : `<span></span>`}
      ${next ? `<a href="${queryHref(`/q/${next.id}`, params)}">下一件 · ${escapeHtml(next.title)}</a>` : `<span></span>`}
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

export function modelsView() {
  const lines = questions.map((question) => `${question.id}\t${question.title}\t${typeMap[question.type].label}\t${DIFF_LABEL[question.difficulty]}`).join("\n")
  return `<section class="prose">
    <p class="kicker">模型</p>
    <h1>尚未实测</h1>
    <p class="lede">问笺馆没有调用任何模型，也不会向你要密钥。下面没有分数、没有回答、没有「被哪道题难倒」的记录。那些东西要等原始输出留下来以后才配出现。</p>
    <div class="stats">
      <p><b>0</b><span>条已核记录</span></p>
      <p><b>${questions.length}</b><span>道待测短题</span></p>
    </div>
    <div class="callout">记录数组是空的。空，就是目前的全部事实。</div>
    <h2>一条记录长什么样</h2>
    <p>以后若有人实测，一条记录至少要有题号、模型、日期、逐字提示、原始输出和判定。缺原始输出的，不展示。</p>
    <pre class="prompt">{
  "questionId": "",
  "model": "",
  "date": "",
  "surface": "",
  "promptUnchanged": true,
  "prompt": "",
  "rawOutput": "",
  "verdict": "",
  "notes": ""
}</pre>
    <div class="actions">
      <button type="button" class="btn btn-primary" data-copy="record">复制测试记录</button>
      <button type="button" class="btn btn-ghost" data-copy="list">复制待测清单</button>
    </div>
    <h2>待测清单</h2>
    <p>只有编号、标题、类型和难度，没有答案。</p>
    <pre class="prompt" id="pending-list">${escapeHtml(lines)}</pre>
  </section>`
}

export function methodView() {
  return `<section class="prose">
    <p class="kicker">测试方法</p>
    <h1>固定提示，才好复现</h1>
    <p class="lede">问笺馆用来陈列短题，不用来给模型封榜。一道题上的成败，只说明这一次、这一道。</p>
    <h2>提示词不要改</h2>
    <p>每道题的「复制提示」是固定文本，里面已经带上作答需要的文字材料。拿去给模型时，整段粘贴，不要润色，不要追加「请一步步思考」，也不要把参考答案夹进去。改了提示，就不再是同一道题。</p>
    <h2>复现时记下什么</h2>
    <p>至少留下模型名称、日期、使用的界面，以及你能看到的参数。看不到温度就写「默认」。客观题写符合或不符合；开放题按展签上的要点逐条看，不打总分。原始输出保持原样，跑失败也留着。</p>
    <h2>客观题和开放题</h2>
    <p>客观题有一个可核对的参考答案。计数、代码、格子和约束题，可以由题目数据重算，校验脚本会再算一遍。语言歧义题接受不同措辞，只要两种意思都在。开放题没有标准句，只有评分要点，用来给人看，不用来自动打分。</p>
    <h2>个例不是排名</h2>
    <p>做对一道，不能说明一个模型整体更强；做错一道，也不能给它排座次。题库故意短、故意杂，是为了让一次失败或一次成功都容易看懂。它不是全面评测，也不代替任何其他基准。</p>
    <h2>这里拒绝做什么</h2>
    <ul>
      <li>没有原始输出，就不写模型成绩、回答或「被难倒」的故事。</li>
      <li>不调用外部模型，不索要密钥，页面本身不需要服务器。</li>
      <li>不把出题人的参照例句说成模型写的。</li>
    </ul>
    <p><a href="#/models">去看空着的模型页</a>，或回到 <a href="#/gallery">馆藏</a>。</p>
  </section>`
}

export function shell() {
  return `<a class="skip" href="#content">跳到内容</a>
  <header class="top">
    <a class="brand" href="#/"><span class="seal" aria-hidden="true">笺</span>问笺馆</a>
    <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="打开菜单">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <nav id="site-nav" aria-label="馆内">
      <a href="#/gallery" data-nav="gallery">考题</a>
      <details class="menu">
        <summary>模型</summary>
        <div class="menu-pop">
          <a href="#/models">实测记录</a>
          <p>尚无模型。馆里不编造成绩。</p>
        </div>
      </details>
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
    <p>问笺馆是独立的短题陈列。题目、插画和文案都是为本馆写的。</p>
    <p>个例不能当排行榜。没有原始输出的模型，不会出现在馆里。</p>
    <p class="quiet">斜杠键聚焦检索。在题目页按 Esc，先收起答案，再回到刚才的馆藏。</p>
  </footer>
  <div id="toast" role="status" aria-live="polite"></div>`
}

export function checklistText() {
  return questions.map((question) => `${question.id}\t${question.title}\t${typeMap[question.type].label}\t${DIFF_LABEL[question.difficulty]}`).join("\n")
}

export function promptFor(id) {
  const question = questions.find((item) => item.id === id)
  if (!question) return ""
  return fullPrompt(question, typeMap[question.type].label)
}
