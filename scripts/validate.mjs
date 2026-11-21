import { questions, typeList, resultBook } from "../src/bank.js"
import { taskList } from "../src/task-render.js"
import { checkGuess, exhibitText, expectedAnswer, fullPrompt, isComputedKind } from "../src/logic.js"

const errors = []
const fail = (message) => errors.push(message)
const ids = new Set()
const titles = new Set()
const prompts = new Set()
const counts = Object.fromEntries(typeList.map((type) => [type.id, 0]))
const interactive = new Set(["grid", "river", "bridge", "hanoi", "swaps", "tsp", "lights", "click", "code", "arrow"])
let interactiveCount = 0
const banned = ["aitestmuseum", "ai考题博物馆", "鹈鹕", "atlas", "flappy bird", "minecraft"]

function walkStrings(value, found) {
  if (typeof value === "string") found.push(value)
  else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, found))
  else if (value && typeof value === "object") Object.values(value).forEach((item) => walkStrings(item, found))
}

const blob = []
walkStrings({ questions, typeList, resultBook }, blob)
const haystack = blob.join("\n").toLowerCase()
for (const word of banned) {
  if (haystack.includes(word)) fail(`题库里出现了不该出现的词：${word}`)
}

if (!Array.isArray(resultBook.records)) fail("results.records 不是数组")
if (!Array.isArray(resultBook.runs)) fail("results.runs 不是数组")
for (const run of resultBook.runs) {
  for (const key of ["taskId", "provider", "model", "rawOutput", "status", "promptSha256"]) {
    if (!run[key]) fail(`运行记录缺少 ${key}`)
  }
  if (run.taskId && !taskList.some((task) => task.id === run.taskId)) fail(`运行指向不存在的任务 ${run.taskId}`)
  if (run.status && !["success", "failure"].includes(run.status)) fail(`运行状态不合法 ${run.status}`)
}
const requiredSlugs = ["pelican-bicycle","bouncing-ball-hexagon","voxel-pagoda","minecraft-web","rubiks-cube","kart-racer","meteor-city","supernova","flappy-bird","tetris","solar-system","web-os-desktop","drowned-gothic-city","brick-builder","flight-sim","hand-gesture-particles","tesseract-ball","starship-control-panel","ai-world-clock","mars-round-trip"]
const quoted = taskList.filter((task) => task.coverage === "quoted")
if (quoted.length !== requiredSlugs.length) fail(`引用任务应有 ${requiredSlugs.length} 道，实际 ${quoted.length}`)
for (const slug of requiredSlugs) {
  const task = taskList.find((item) => item.slug === slug)
  if (!task) fail(`缺少参考站任务 ${slug}`)
  else {
    if (!task.prompt || task.prompt.length < 20) fail(`${slug} 题面太短`)
    if (!task.source?.page?.endsWith(`/tests/${slug}`)) fail(`${slug} 来源链接不对`)
    if (!task.checks || task.checks.length < 3) fail(`${slug} 验收点少于 3`)
    if (!task.artifact || !task.run) fail(`${slug} 缺少产物或打开方式`)
  }
}
const ticket = taskList.find((task) => task.id === "orig-ticket-json")
if (!ticket || ticket.expect?.priceYuan !== 40 || ticket.prompt.includes("priceYuan\":40") || ticket.prompt.includes("甲区 12 排 8 座") === false) {
  fail("票根任务的提示和验收样例不一致，或把样例写进了提示")
}
if (taskList.filter((task) => task.coverage === "original").length < 4) fail("原创作品任务太少")
if (resultBook.records.length !== 0) {
  for (const record of resultBook.records) {
    for (const key of ["questionId", "model", "date", "rawOutput"]) {
      if (!record[key]) fail(`实测记录缺少 ${key}`)
    }
    if (record.questionId && !questions.some((question) => question.id === record.questionId)) {
      fail(`实测记录指向不存在的题目 ${record.questionId}`)
    }
  }
}

for (const question of questions) {
  if (!/^wj-\d{3}$/.test(question.id)) fail(`${question.id} 的编号格式不对`)
  if (ids.has(question.id)) fail(`编号重复 ${question.id}`)
  ids.add(question.id)
  if (titles.has(question.title)) fail(`标题重复 ${question.title}`)
  titles.add(question.title)
  if (prompts.has(question.prompt)) fail(`提示重复 ${question.id}`)
  prompts.add(question.prompt)
  if (!counts.hasOwnProperty(question.type)) fail(`${question.id} 的类型不在目录里`)
  else counts[question.type] += 1
  if (![1, 2, 3].includes(question.difficulty)) fail(`${question.id} 难度超出 1 到 3`)
  if (![1, 2, 3].includes(question.minutes)) fail(`${question.id} 用时超出 1 到 3`)
  if (!question.hook || question.hook.length < 4 || question.hook.length > 42) fail(`${question.id} 的趣味点长度不合适`)
  if (!question.prompt || question.prompt.length < 8 || question.prompt.length > 280) fail(`${question.id} 的提示长度不合适：${question.prompt.length}`)
  if (!question.explanation || question.explanation.length < 16) fail(`${question.id} 的解释太短`)
  if (!question.spec || !question.spec.kind) fail(`${question.id} 缺少 spec`)
  if (interactive.has(question.spec?.kind)) interactiveCount += 1

  const answer = question.answer || ""
  if (question.answerMode === "open") {
    if (question.spec.kind !== "rubric") fail(`${question.id} 开放题的 spec 应该是 rubric`)
    if (answer !== "") fail(`${question.id} 开放题不应该有唯一答案`)
    if (!Array.isArray(question.rubric) || question.rubric.length < 3) fail(`${question.id} 评分要点少于 3 条`)
    else if (question.rubric.some((item) => item.length < 6)) fail(`${question.id} 有一条评分要点太短`)
  } else if (question.answerMode === "objective") {
    if (!answer) fail(`${question.id} 客观题缺少答案`)
    if (question.spec.kind === "rubric") fail(`${question.id} 客观题用了开放题的 spec`)
    let expected = null
    try {
      expected = expectedAnswer(question)
    } catch (error) {
      fail(`${question.id} 无法重算：${error.message}`)
    }
    if (expected !== null && expected !== answer) fail(`${question.id} 写下的答案是「${answer}」，重算得到「${expected}」`)
    if (!checkGuess(question, answer).ok) fail(`${question.id} 的标准答案过不了自己的核对`)
  } else {
    fail(`${question.id} 的 answerMode 不对`)
  }

  if (answer.length >= 2) {
    if (question.hook.includes(answer)) fail(`${question.id} 的趣味点泄露了答案`)
    if (question.title.includes(answer)) fail(`${question.id} 的标题泄露了答案`)
    if (question.prompt.includes(answer)) {
      const choices = question.spec.choices || question.spec.options || (question.spec.kind === "odd" ? question.spec.items.map((item) => item.name) : [])
      const material = `${question.prompt}\n${exhibitText(question)}`
      const listed = choices.length >= 2 && choices.includes(answer) && choices.every((choice) => material.includes(choice))
      if (!listed) fail(`${question.id} 的提示泄露了答案`)
    }
  }

  if (question.spec.kind === "code" && !fullPrompt(question, "短代码").includes(question.spec.source)) {
    fail(`${question.id} 的复制文本没有带上代码`)
  }
  if (question.spec.kind === "readings") {
    const wrong = question.spec.readings[0]
    if (checkGuess(question, wrong).ok) fail(`${question.id} 只写一种意思也被算对`)
    if (!checkGuess(question, question.spec.readings.join(" / ")).ok) fail(`${question.id} 两种意思没有被算对`)
  }
}

const ordered = questions.map((question) => question.id).join(",")
const sorted = [...ids].sort().join(",")
if (ordered !== sorted) fail("题目没有按编号排列")
if (questions.length < 80) fail(`题目只有 ${questions.length} 道`)
if (typeList.length < 10) fail("类型目录少于 10 种")
for (const type of typeList) {
  if (counts[type.id] < 8) fail(`${type.label} 只有 ${counts[type.id]} 道`)
}
if (interactiveCount < 12) fail(`可交互的题只有 ${interactiveCount} 道`)

const sample = questions.find((question) => question.id === "wj-055")
if (sample && checkGuess(sample, "馆, 问笺, 陈列室").ok) fail("指令题把多出来的空格也算对了")

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"))
  console.error(`\n${errors.length} 项没有通过`)
  process.exit(1)
}

const kindCounts = {}
for (const question of questions) kindCounts[question.spec.kind] = (kindCounts[question.spec.kind] || 0) + 1
console.log(`题库 ${questions.length} 道，类型 ${typeList.length} 种，可交互 ${interactiveCount} 道，重算种类 ${Object.keys(kindCounts).length} 种。`)
for (const type of typeList) console.log(`  ${type.label} ${counts[type.id]}`)
console.log("答案核对：")
for (const question of questions) {
  const answer = question.answerMode === "open" ? "（开放）" : question.answer.replaceAll("\n", " / ")
  console.log(`  ${question.id} ${question.spec.kind.padEnd(10)} ${answer}`)
}
if (questions.some((question) => question.answerMode === "objective" && !isComputedKind(question.spec.kind) && !["points", "audit"].includes(question.spec.kind))) {
  console.error("有客观题没有核对器")
  process.exit(1)
}
