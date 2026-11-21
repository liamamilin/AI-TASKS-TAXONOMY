import "./style.css"
import { getQuestion } from "./bank.js"
import { mountPlays } from "./interact.js"
import { checkGuess } from "./logic.js"
import {
  RECORD_TEMPLATE,
  checklistText,
  filterQuestions,
  homeView,
  methodView,
  modelsView,
  promptFor,
  questionView,
  shell,
} from "./render.js"

const featuredIds = ["wj-001", "wj-005", "wj-011", "wj-030", "wj-067", "wj-072", "wj-079"]
let featureIndex = 0
let route = parseRoute()
let internalNav = false
let preserveScroll = false
let viaPop = false
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

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "")
  const [path, query = ""] = raw.split("?")
  const params = new URLSearchParams(query)
  const parts = path.split("/").filter(Boolean)
  if (parts[0] === "q") return { name: "question", id: decodeURIComponent(parts[1] || ""), params }
  if (parts[0] === "models") return { name: "models", params }
  if (parts[0] === "method") return { name: "method", params }
  if (parts[0] && parts[0] !== "gallery") return { name: "missing", params }
  return { name: "home", params, gallery: parts[0] === "gallery" }
}

function render() {
  const y = window.scrollY
  try {
    if (route.name === "home") content.innerHTML = homeView(route.params, featuredIds[featureIndex])
    else if (route.name === "question") content.innerHTML = questionView(route.id, route.params)
    else if (route.name === "models") content.innerHTML = modelsView()
    else if (route.name === "method") content.innerHTML = methodView()
    else content.innerHTML = `<section class="missing"><h1>这一页不在馆里</h1><p><a href="#/gallery">回到馆藏</a></p></section>`
    const question = route.name === "question" ? getQuestion(route.id) : null
    if (question) mountPlays(content, question)
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
  else if (route.name === "home" && route.gallery) document.getElementById("collection")?.scrollIntoView()
  else window.scrollTo(0, 0)
  viaPop = false
  preserveScroll = false
}

function markNav() {
  document.querySelectorAll("#site-nav a").forEach((link) => {
    const href = link.getAttribute("href")
    const current = (href === "#/gallery" && (route.name === "home" || route.name === "question"))
      || (href === "#/models" && route.name === "models")
      || (href === "#/method" && route.name === "method")
    if (current) link.setAttribute("aria-current", "page")
    else link.removeAttribute("aria-current")
  })
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
  content.addEventListener("input", onSearch)
  content.addEventListener("compositionend", onSearch)
  content.addEventListener("submit", onGuess)
  document.addEventListener("click", (event) => {
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

function onSearch(event) {
  if (event.target.id !== "qsearch" || event.isComposing) return
  const start = event.target.selectionStart
  const end = event.target.selectionEnd
  const value = event.target.value.trim()
  if (value) route.params.set("s", event.target.value)
  else route.params.delete("s")
  const query = route.params.toString()
  history.replaceState({ app: 1 }, "", `#/gallery${query ? `?${query}` : ""}`)
  route = parseRoute()
  preserveScroll = true
  render()
  const input = document.getElementById("qsearch")
  if (input) {
    input.focus()
    input.setSelectionRange(start, end)
  }
}

function onGuess(event) {
  const form = event.target
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-guess]")) return
  event.preventDefault()
  const question = getQuestion(route.id)
  const field = form.querySelector("textarea, input")
  const result = checkGuess(question, field.value)
  const note = form.querySelector(".guess-note")
  if (result.empty) note.textContent = "先写点什么。"
  else if (result.ok) note.textContent = "对上了。参考答案还折着，想看理由再打开。"
  else if (question.spec.kind === "readings") note.textContent = "还没把两种意思都点到。"
  else note.textContent = "还不一样。可以再改，或者打开参考答案。"
}

function onContentClick(event) {
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
    const pool = filterQuestions(route.params)
    if (!pool.length) {
      toast("没有可逛的题")
      return
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    internalNav = true
    const query = route.params.toString()
    location.hash = `#/q/${pick.id}${query ? `?${query}` : ""}`
    return
  }
  const copy = event.target.closest("[data-copy]")
  if (copy) {
    const kind = copy.dataset.copy
    const text = kind === "prompt" ? promptFor(route.id)
      : kind === "link" ? canonical(route.id)
      : kind === "record" ? RECORD_TEMPLATE
      : checklistText()
    copyText(text, kind === "link" ? "链接已复制" : "已复制")
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
    const search = document.getElementById("qsearch")
    if (search) {
      event.preventDefault()
      search.focus()
    } else if (route.name !== "home") {
      location.hash = "#/gallery"
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
  if (route.name === "question") {
    if (internalNav) history.back()
    else location.hash = "#/gallery"
  }
}
