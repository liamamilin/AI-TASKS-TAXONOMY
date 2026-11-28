import "./style.css"
import { RECORD_TEMPLATE, methodView, modelsView, shell } from "./chrome.js"
import { featuredTaskIds, filterTasks, taskCardsHtml, taskChecklist, taskDetail, taskHome, taskPrompt } from "./task-render.js"

const featuredIds = ["wj-001", "wj-005", "wj-011", "wj-030", "wj-067", "wj-072", "wj-079"]
let featureIndex = 0
let taskFeatureIndex = 0
let route = parseRoute()
let internalNav = false
let preserveScroll = false
let viaPop = false
let liveObserver = null
let warmupMod = null
const scrollMemory = new Map()

const app = document.querySelector("#app")
app.innerHTML = shell()
const content = document.querySelector("#content")
bindShell()
applyTheme(document.documentElement.dataset.theme === "night" ? "night" : "day")
render()

window.addEventListener("popstate", () => {
  viaPop = true
})
window.addEventListener("hashchange", () => {
  route = parseRoute()
  preserveScroll = false
  render()
})

async function loadWarmup() {
  if (!warmupMod) warmupMod = await import("./warmup-bundle.js")
  return warmupMod
}

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "")
  const [path, query = ""] = raw.split("?")
  const params = new URLSearchParams(query)
  const parts = path.split("/").filter(Boolean)
  if (parts[0] === "q") return { name: "question", id: decodeURIComponent(parts[1] || ""), params }
  if (parts[0] === "t") return { name: "task", id: decodeURIComponent(parts[1] || ""), params }
  if (parts[0] === "models") return { name: "models", params }
  if (parts[0] === "method") return { name: "method", params }
  if (parts[0] === "warmup" || parts[0] === "gallery") return { name: "warmup", params, gallery: true }
  if (parts[0] && parts[0] !== "tasks") return { name: "missing", params }
  return { name: "home", params, gallery: false }
}

function disconnectLiveObserver() {
  if (liveObserver) {
    liveObserver.disconnect()
    liveObserver = null
  }
}

function mountLivePreviews() {
  disconnectLiveObserver()
  const hosts = content.querySelectorAll(".art-live[data-live-src]")
  if (!hosts.length) return
  if (typeof IntersectionObserver === "undefined") {
    hosts.forEach(attachLiveIframe)
    return
  }
  liveObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const host = entry.target
      if (entry.isIntersecting) attachLiveIframe(host)
      else detachLiveIframe(host)
    }
  }, { rootMargin: "120px 0px" })
  hosts.forEach((host) => liveObserver.observe(host))
}

function attachLiveIframe(host) {
  if (host.querySelector("iframe")) return
  const iframe = document.createElement("iframe")
  iframe.setAttribute("sandbox", "allow-scripts")
  iframe.setAttribute("tabindex", "-1")
  iframe.setAttribute("src", host.dataset.liveSrc)
  iframe.setAttribute("title", host.dataset.liveTitle || "实时预览")
  host.prepend(iframe)
  const ph = host.querySelector(".live-placeholder")
  if (ph) ph.hidden = true
}

function hydrateIframes(root) {
  if (!root) return
  root.querySelectorAll("iframe[data-src]").forEach((frame) => {
    frame.setAttribute("src", frame.dataset.src)
    frame.removeAttribute("data-src")
  })
}

function detachLiveIframe(host) {
  const iframe = host.querySelector("iframe")
  if (iframe) iframe.remove()
  const ph = host.querySelector(".live-placeholder")
  if (ph) ph.hidden = false
}

async function render() {
  const y = window.scrollY
  disconnectLiveObserver()
  try {
    if (route.name === "home") {
      content.innerHTML = taskHome(route.params, featuredTaskIds[taskFeatureIndex])
      mountLivePreviews()
    } else if (route.name === "task") {
      content.innerHTML = taskDetail(route.id, route.params)
    } else if (route.name === "models") {
      content.innerHTML = modelsView()
    } else if (route.name === "method") {
      content.innerHTML = methodView()
    } else if (route.name === "warmup" || route.name === "question") {
      const w = await loadWarmup()
      if (route.name === "warmup") {
        content.innerHTML = w.homeView(route.params, featuredIds[featureIndex])
      } else {
        content.innerHTML = w.questionView(route.id, route.params)
        const question = w.getQuestion(route.id)
        if (question) w.mountPlays(content, question)
      }
    } else {
      content.innerHTML = `<section class="missing"><h1>这一页不在馆里</h1><p><a href="#/tasks">回到作品任务</a></p></section>`
    }
  } catch (error) {
    content.innerHTML = `<section class="missing"><h1>这一页没有展开</h1><p>${String(error.message || error)}</p></section>`
    console.error(error)
  }
  markNav()
  const title = content.querySelector("h1")?.textContent || "问笺馆"
  document.title = route.name === "home" ? "问笺馆" : `${title} · 问笺馆`
  const remembered = scrollMemory.get(location.hash || "#/")
  if (preserveScroll) window.scrollTo(0, y)
  else if (viaPop && remembered != null) window.scrollTo(0, remembered)
  else if (route.name === "home" && route.params.toString()) document.getElementById("collection")?.scrollIntoView()
  else window.scrollTo(0, 0)
  viaPop = false
  preserveScroll = false
}

function markNav() {
  const isCompare = route.name === "home" && ["both", "multi"].includes(route.params.get("model"))
  document.querySelectorAll("#site-nav a").forEach((link) => {
    const nav = link.dataset.nav
    const current = (nav === "compare" && isCompare)
      || (nav === "tasks" && ((route.name === "home" && !isCompare) || route.name === "task"))
      || (nav === "warmup" && (route.name === "warmup" || route.name === "question"))
      || (nav === "models" && route.name === "models")
      || (nav === "method" && route.name === "method")
    if (current) link.setAttribute("aria-current", "page")
    else link.removeAttribute("aria-current")
  })
}

function applyMatrixFilter() {
  const table = document.getElementById("matrix-table")
  if (!table) return
  const activeChip = document.querySelector("[data-matrix-filter].on")
  const statusKey = activeChip?.dataset.matrixFilter || "all"
  const kindKey = document.getElementById("matrix-kind")?.value || ""
  const word = (document.getElementById("matrix-search")?.value || "").trim().toLowerCase()
  let shown = 0
  const rows = table.querySelectorAll("tbody tr")
  rows.forEach((tr) => {
    const tags = (tr.dataset.mtags || "").split(" ").filter(Boolean)
    const okStatus = statusKey === "all" || tags.includes(statusKey)
    const okKind = !kindKey || tr.dataset.mkind === kindKey
    const okWord = !word || (tr.dataset.msearch || "").includes(word)
    const visible = okStatus && okKind && okWord
    tr.hidden = !visible
    if (visible) shown += 1
  })
  const countEl = document.getElementById("matrix-count")
  if (countEl) countEl.textContent = `当前显示 ${shown} / ${rows.length} 道任务`
}

function bindShell() {
  document.querySelector(".nav-toggle").addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open")
    document.querySelector(".nav-toggle").setAttribute("aria-expanded", String(open))
  })
  document.querySelectorAll("[data-theme-set]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeSet))
  })
  content.addEventListener("click", onContentClick)
  content.addEventListener("input", onInput)
  content.addEventListener("change", (event) => {
    if (event.target.id === "matrix-kind") applyMatrixFilter()
  })
  content.addEventListener("compositionend", onInput)
  content.addEventListener("submit", onGuess)
  document.addEventListener("click", (event) => {
    const scrollBtn = event.target.closest("[data-scroll-to]")
    if (scrollBtn) {
      const target = document.getElementById(scrollBtn.dataset.scrollTo)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
        if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true })
      }
      return
    }
    const link = event.target.closest("a[href^='#']")
    if (link) {
      scrollMemory.set(location.hash || "#/", window.scrollY)
      internalNav = true
    }
    if (event.target.closest("#site-nav a")) {
      document.body.classList.remove("nav-open")
      document.querySelector(".nav-toggle").setAttribute("aria-expanded", "false")
    }
  })
  document.addEventListener("keydown", onKey)
}

function onInput(event) {
  if (event.target.id === "matrix-search" && !event.isComposing) {
    applyMatrixFilter()
    return
  }
  if (event.target.id !== "qsearch" || event.isComposing) return
  const start = event.target.selectionStart
  const end = event.target.selectionEnd
  const value = event.target.value.trim()
  if (value) route.params.set("s", event.target.value)
  else route.params.delete("s")
  const query = route.params.toString()
  const base = event.target.dataset.searchBase || "/tasks"
  history.replaceState({ app: 1 }, "", `#${base}${query ? `?${query}` : ""}`)
  route = parseRoute()
  const cardsEl = document.getElementById("cards")
  const shownEl = document.getElementById("shown")
  // Keep filter chip hrefs in sync with the current search query
  document.querySelectorAll(".filters-panel a.chip:not(.chip-clear)").forEach((a) => {
    const rawHref = (a.getAttribute("href") || "").replace(/^#/, "")
    const [p, q = ""] = rawHref.split("?")
    const sp = new URLSearchParams(q)
    if (value) sp.set("s", event.target.value)
    else sp.delete("s")
    const qs = sp.toString()
    a.setAttribute("href", `#${p}${qs ? `?${qs}` : ""}`)
  })
  if (cardsEl && shownEl) {
    if (base === "/tasks") {
      const next = taskCardsHtml(route.params)
      cardsEl.innerHTML = next.html
      shownEl.textContent = next.count
      mountLivePreviews()
    } else {
      loadWarmup().then((w) => {
        const next = w.cardsHtml(route.params)
        cardsEl.innerHTML = next.html
        shownEl.textContent = next.count
      })
    }
    return
  }
  preserveScroll = true
  render()
}

async function onGuess(event) {
  const form = event.target
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-guess]")) return
  event.preventDefault()
  const w = await loadWarmup()
  const question = w.getQuestion(route.id)
  const field = form.querySelector("textarea, input")
  const result = w.checkGuess(question, field.value)
  const note = form.querySelector(".guess-note")
  if (result.empty) note.textContent = "先写点什么。"
  else if (result.ok) note.textContent = "对上了。参考答案还折着，想看理由再打开。"
  else if (question.spec.kind === "readings") note.textContent = "还没把两种意思都点到。"
  else note.textContent = "还不一样。可以再改，或者打开参考答案。"
}

async function onContentClick(event) {
  const revBtn = event.target.closest("[data-rev-card]")
  if (revBtn) {
    const card = document.getElementById(revBtn.dataset.revCard)
    const idx = revBtn.dataset.revIdx
    if (card) {
      card.querySelectorAll("[data-rev-card]").forEach((b) => b.classList.toggle("on", b === revBtn))
      card.querySelectorAll("[data-rev-pane]").forEach((p) => {
        const show = p.dataset.revPane === idx
        p.hidden = !show
        if (show) hydrateIframes(p)
      })
    }
    return
  }
  const matrixFilter = event.target.closest("[data-matrix-filter]")
  if (matrixFilter) {
    document.querySelectorAll("[data-matrix-filter]").forEach((b) => b.classList.toggle("on", b === matrixFilter))
    applyMatrixFilter()
    return
  }
  const wideBtn = event.target.closest("[data-wide-compare]")
  if (wideBtn) {
    const cmpEl = document.getElementById("compare-view")
    if (cmpEl) {
      const wide = cmpEl.classList.toggle("wide")
      wideBtn.textContent = wide ? "退出宽幅" : "宽幅沉浸对比"
    }
    return
  }
  const reloadAll = event.target.closest("[data-reload-all]")
  if (reloadAll) {
    document.querySelectorAll("#compare-view .rev-pane:not([hidden]) iframe").forEach((frame) => {
      frame.setAttribute("src", frame.getAttribute("src"))
    })
    toast("已同步重载产物")
    return
  }
  const cmpMode = event.target.closest("[data-compare-mode]")
  if (cmpMode) {
    const mode = cmpMode.dataset.compareMode
    const cmpEl = document.getElementById("compare-view")
    const listEl = document.getElementById("runs-list")
    if (cmpEl && listEl) {
      cmpEl.hidden = mode !== "side"
      listEl.hidden = mode === "side"
      if (mode === "list") hydrateIframes(listEl)
      document.querySelectorAll("[data-compare-mode]").forEach((btn) => {
        btn.classList.toggle("on", btn.dataset.compareMode === mode)
      })
    }
    return
  }
  const reloadBtn = event.target.closest("[data-reload-iframe]")
  if (reloadBtn) {
    const frame = document.getElementById(reloadBtn.dataset.reloadIframe)
    if (frame) {
      frame.setAttribute("src", frame.getAttribute("src"))
      toast("已重载预览")
    }
    return
  }
  const expandBtn = event.target.closest("[data-expand-iframe]")
  if (expandBtn) {
    const frame = document.getElementById(expandBtn.dataset.expandIframe)
    if (frame) {
      const tall = frame.classList.toggle("expanded")
      expandBtn.textContent = tall ? "恢复高度" : "放大高度"
    }
    return
  }
  const taskFeature = event.target.closest("[data-task-feature]")
  if (taskFeature) {
    const step = Number(taskFeature.dataset.taskFeature)
    taskFeatureIndex = (taskFeatureIndex + step + featuredTaskIds.length) % featuredTaskIds.length
    preserveScroll = true
    render()
    return
  }
  const feature = event.target.closest("[data-feature]")
  if (feature) {
    const step = Number(feature.dataset.feature)
    featureIndex = (featureIndex + step + featuredIds.length) % featuredIds.length
    preserveScroll = true
    render()
    return
  }
  const random = event.target.closest("[data-random]")
  if (random) {
    const tasksMode = random.dataset.random === "tasks"
    const pool = tasksMode ? filterTasks(route.params) : (await loadWarmup()).filterQuestions(route.params)
    if (!pool.length) {
      toast("没有可逛的题")
      return
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    internalNav = true
    const query = route.params.toString()
    location.hash = `#/${tasksMode ? "t" : "q"}/${pick.id}${query ? `?${query}` : ""}`
    return
  }
  const copy = event.target.closest("[data-copy]")
  if (copy) {
    const kind = copy.dataset.copy
    let text = ""
    if (kind === "task") text = taskPrompt(route.id)
    else if (kind === "task-link") text = canonicalTask(route.id)
    else if (kind === "link") text = canonical(route.id)
    else if (kind === "record") text = RECORD_TEMPLATE
    else if (kind === "prompt") text = (await loadWarmup()).promptFor(route.id)
    else text = `${taskChecklist()}\n\n短题\n${(await loadWarmup()).checklistText()}`
    copyText(text, kind.includes("link") ? "链接已复制" : "已复制")
    return
  }
  const reveal = event.target.closest(".reveal")
  if (reveal) {
    const panel = document.getElementById("answer-panel")
    const open = panel.hidden
    panel.hidden = !open
    reveal.setAttribute("aria-expanded", String(open))
    if (open) panel.focus()
  }
}

function canonicalTask(id) {
  const url = new URL(location.href)
  url.hash = `#/t/${id}`
  url.search = ""
  return `${url.origin}${url.pathname}${url.hash}`
}

function canonical(id) {
  const url = new URL(location.href)
  url.hash = `#/q/${id}`
  url.search = ""
  return `${url.origin}${url.pathname}${url.hash}`
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    document.body.appendChild(area)
    area.select()
    document.execCommand("copy")
    area.remove()
  }
  toast(message)
}

let toastTimer = 0
function toast(message) {
  const node = document.getElementById("toast")
  node.textContent = message
  node.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => node.classList.remove("show"), 1800)
}

function applyTheme(theme) {
  const night = theme === "night"
  if (night) document.documentElement.dataset.theme = "night"
  else delete document.documentElement.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", night ? "#161310" : "#f3ecdf")
  document.querySelectorAll("[data-theme-set]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeSet === (night ? "night" : "day")))
  })
  try {
    localStorage.setItem("wenjian-theme", night ? "night" : "day")
  } catch {
    /* 光线偏好留在这一次访问里 */
  }
}

function onKey(event) {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
  if (event.key === "/" && !typing) {
    const search = document.getElementById("qsearch") || document.getElementById("matrix-search")
    if (search) {
      event.preventDefault()
      search.focus()
    } else if (route.name !== "home" && route.name !== "warmup") {
      location.hash = "#/tasks"
    }
    return
  }
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !typing && (route.name === "task" || route.name === "question")) {
    const pagerLinks = document.querySelectorAll(".pager > *")
    const target = event.key === "ArrowLeft" ? pagerLinks[0] : pagerLinks[1]
    if (target && target.tagName === "A") {
      event.preventDefault()
      target.click()
    }
    return
  }
  if (event.key !== "Escape") return
  const panel = document.getElementById("answer-panel")
  const reveal = document.querySelector(".reveal")
  if (panel && !panel.hidden) {
    panel.hidden = true
    reveal?.setAttribute("aria-expanded", "false")
    reveal?.focus()
    return
  }
  if (document.body.classList.contains("nav-open")) {
    document.body.classList.remove("nav-open")
    document.querySelector(".nav-toggle").setAttribute("aria-expanded", "false")
    return
  }
  if (route.name === "question" || route.name === "task") {
    if (internalNav) history.back()
    else location.hash = "#/tasks"
  }
}
