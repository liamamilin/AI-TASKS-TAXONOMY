import { clickTargets, runArrow, runCode } from "./logic.js"

const CN = ["零", "一", "二", "三", "四", "五"]

function gridModel(spec) {
  const rows = spec.rows
  let start
  let goal
  let key
  rows.forEach((row, y) => {
    ;[...row].forEach((cell, x) => {
      if (cell === "S") start = [x, y]
      if (cell === "G") goal = [x, y]
      if (cell === "K") key = [x, y]
    })
  })
  return { rows, start, goal, key, needKey: Boolean(spec.key) }
}

function paintGrid(host, spec, state) {
  const { rows } = gridModel(spec)
  host.innerHTML = `<div class="board" style="--cols:${rows[0].length}">
    ${rows.map((row, y) => [...row].map((cell, x) => {
      const index = state.path.findIndex((point) => point[0] === x && point[1] === y)
      const wall = cell === "#"
      const label = cell === "." ? "" : cell
      return `<button type="button" class="cell ${wall ? "wall" : ""} ${index >= 0 ? "on" : ""}" data-x="${x}" data-y="${y}" ${wall ? "disabled" : ""} aria-label="第${y + 1}行第${x + 1}列 ${label || "空地"}">${index >= 0 ? index : label}</button>`
    }).join("")).join("")}
  </div>
  <p class="play-note" role="status">${state.note}</p>
  <button type="button" class="btn btn-ghost" data-reset>清空路线</button>`
}

function mountGrid(host, spec) {
  const model = gridModel(spec)
  const state = { path: [model.start], note: model.needKey ? "先走到钥匙，再走到终点。" : "从起点开始，点相邻的格子。" }
  const draw = () => paintGrid(host, spec, state)
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      state.path = [model.start]
      state.note = "路线已清空。"
      draw()
      return
    }
    const cell = event.target.closest(".cell")
    if (!cell || cell.disabled) return
    const x = Number(cell.dataset.x)
    const y = Number(cell.dataset.y)
    const head = state.path[state.path.length - 1]
    const prev = state.path[state.path.length - 2]
    if (prev && prev[0] === x && prev[1] === y) {
      state.path.pop()
      state.note = `已退回，当前 ${state.path.length - 1} 步。`
      draw()
      return
    }
    const neighbor = Math.abs(head[0] - x) + Math.abs(head[1] - y) === 1
    const used = state.path.some((point) => point[0] === x && point[1] === y)
    if (!neighbor || used) {
      state.note = "只能走到当前这一格的上下左右，而且不能踩重复的格子。"
      draw()
      return
    }
    state.path.push([x, y])
    const hasKey = !model.needKey || state.path.some((point) => model.key && point[0] === model.key[0] && point[1] === model.key[1])
    if (x === model.goal[0] && y === model.goal[1] && hasKey) state.note = `走到了，共 ${state.path.length - 1} 步。`
    else if (x === model.goal[0] && y === model.goal[1]) state.note = "还没拿到钥匙，可以继续走。"
    else state.note = `当前 ${state.path.length - 1} 步。`
    draw()
  })
  draw()
}

function mountCode(host, spec) {
  host.innerHTML = `<pre class="code">${spec.source.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</pre>
    <button type="button" class="btn btn-primary" data-run>运行这段代码（会显示结果）</button>
    <p class="play-note" role="status" hidden></p>`
  host.querySelector("[data-run]").addEventListener("click", () => {
    const note = host.querySelector(".play-note")
    try {
      note.hidden = false
      note.textContent = `运行结果：${String(runCode(spec.source))}。这是这段代码自己跑出来的，不是某个模型的回答。`
    } catch (error) {
      note.hidden = false
      note.textContent = "这段代码没有跑起来。"
    }
  })
}

function mountArrow(host, spec) {
  host.innerHTML = `<pre class="code">${spec.lines.join("\n")}</pre>
    <button type="button" class="btn btn-primary" data-run>走完这些指令（会显示终点）</button>
    <p class="play-note" role="status" hidden></p>`
  host.querySelector("[data-run]").addEventListener("click", () => {
    const note = host.querySelector(".play-note")
    note.hidden = false
    note.textContent = `停在${runArrow(spec.lines)}。这是指令自己走出来的终点。`
  })
}

function mountClick(host, spec) {
  const goal = clickTargets(spec).split("，然后")
  const labels = spec.shapes.map((shape) => {
    const size = { 1: "小", 2: "中", 3: "大" }[shape.size]
    const color = { red: "红", blue: "蓝" }[shape.color]
    const form = { circle: "圆", square: "方" }[shape.shape]
    return { id: shape.id, label: size + color + form, shape: shape.shape, color: shape.color, size: shape.size }
  })
  const picked = []
  const draw = () => {
    host.innerHTML = `<div class="shape-row">${labels.map((item) => `<button type="button" class="shape ${item.shape} ${item.color} ${picked.includes(item.id) ? "picked" : ""}" data-id="${item.id}" style="--s:${28 + item.size * 16}px" aria-pressed="${picked.includes(item.id)}">${item.label}</button>`).join("")}</div>
      <p class="play-note" role="status">${picked.length ? `已点：${picked.map((id) => labels.find((item) => item.id === id).label).join("，然后")}` : "按题目的顺序点。"}</p>
      <div class="play-actions"><button type="button" class="btn btn-primary" data-check>核对顺序</button><button type="button" class="btn btn-ghost" data-reset>重来</button></div>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      picked.length = 0
      draw()
      return
    }
    const shape = event.target.closest(".shape")
    if (shape && !picked.includes(shape.dataset.id)) picked.push(shape.dataset.id)
    if (event.target.closest("[data-check]")) {
      const names = picked.map((id) => labels.find((item) => item.id === id).label)
      host.querySelector(".play-note").textContent = names.join("，然后") === goal.join("，然后") ? "点对了。" : "顺序或对象还不对。"
      return
    }
    if (shape) draw()
  })
  draw()
}

function mountLights(host, spec) {
  const state = Array(spec.n).fill(false)
  const draw = (note = "可以先随便按，看清每个按钮改哪些灯。题目问的是从全灭只按 A 再按 C。") => {
    host.innerHTML = `<div class="lamp-row">${state.map((on, index) => `<div class="lamp ${on ? "on" : ""}" aria-hidden="true"></div>`).join("")}</div>
      <div class="play-actions">${Object.keys(spec.toggles).map((key) => `<button type="button" class="btn btn-ghost" data-key="${key}">按钮 ${key}</button>`).join("")}<button type="button" class="btn btn-ghost" data-reset>回到全灭</button></div>
      <p class="play-note" role="status">${note}</p>`
  }
  host.addEventListener("click", (event) => {
    const key = event.target.closest("[data-key]")
    if (event.target.closest("[data-reset]")) {
      state.fill(false)
      draw("回到全灭。")
      return
    }
    if (!key) return
    for (const lamp of spec.toggles[key.dataset.key]) state[lamp - 1] = !state[lamp - 1]
    const names = ["第一盏", "第二盏", "第三盏"]
    const on = state.map((lit, index) => (lit ? names[index] : "")).filter(Boolean)
    draw(on.length ? `现在亮着：${on.join("、")}。` : "现在都灭着。")
  })
  draw()
}

const RIVER = [
  { id: "p", name: "人" },
  { id: "cat", name: "猫" },
  { id: "fish", name: "鱼" },
  { id: "food", name: "鱼食" },
]

function riverUnsafe(state) {
  if (state.cat === state.fish && state.cat !== state.p) return "猫和鱼单独在一起"
  if (state.fish === state.food && state.fish !== state.p) return "鱼和鱼食单独在一起"
  return ""
}

function mountRiver(host) {
  const state = { p: 0, cat: 0, fish: 0, food: 0, steps: 0, selected: new Set(), note: "点选人和至多一件东西，再渡河。" }
  const draw = () => {
    const bank = (side) => RIVER.filter((item) => state[item.id] === side).map((item) => `<button type="button" class="token ${state.selected.has(item.id) ? "picked" : ""}" data-id="${item.id}" aria-pressed="${state.selected.has(item.id)}">${item.name}</button>`).join("") || `<span class="empty">空</span>`
    host.innerHTML = `<div class="shores"><div><p>左岸</p><div class="tokens">${bank(0)}</div></div><div><p>右岸</p><div class="tokens">${bank(1)}</div></div></div>
      <div class="play-actions"><button type="button" class="btn btn-primary" data-cross>渡到对岸</button><button type="button" class="btn btn-ghost" data-reset>重来</button></div>
      <p class="play-note" role="status">已渡 ${state.steps} 次。${state.note}</p>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      Object.assign(state, { p: 0, cat: 0, fish: 0, food: 0, steps: 0, note: "已回到左岸。" })
      state.selected = new Set()
      draw()
      return
    }
    const token = event.target.closest(".token")
    if (token) {
      const id = token.dataset.id
      if (state.selected.has(id)) state.selected.delete(id)
      else state.selected.add(id)
      draw()
      return
    }
    if (!event.target.closest("[data-cross]")) return
    const chosen = [...state.selected]
    if (!chosen.includes("p")) {
      state.note = "人得跟着一起走。"
      draw()
      return
    }
    if (chosen.length > 2) {
      state.note = "一次最多再带一件。"
      draw()
      return
    }
    if (chosen.some((id) => state[id] !== state.p)) {
      state.note = "选中的东西不在人这一侧。"
      draw()
      return
    }
    const next = { ...state, p: 1 - state.p }
    for (const id of chosen) if (id !== "p") next[id] = next.p
    const problem = riverUnsafe(next)
    if (problem) {
      state.note = `不能留下这个局面：${problem}。`
      draw()
      return
    }
    state.p = next.p
    state.cat = next.cat
    state.fish = next.fish
    state.food = next.food
    state.steps += 1
    state.selected = new Set()
    state.note = state.p === 1 && state.cat === 1 && state.fish === 1 && state.food === 1 ? "都过去了。" : "这一岸安全。"
    draw()
  })
  draw()
}

function mountBridge(host, spec) {
  const names = Object.keys(spec.times)
  const state = { side: Object.fromEntries(names.map((name) => [name, 0])), lamp: 0, time: 0, selected: new Set(), note: "选 1 或 2 个在手电这边的人。" }
  const draw = () => {
    const bank = (side) => names.filter((name) => state.side[name] === side).map((name) => `<button type="button" class="token ${state.selected.has(name) ? "picked" : ""}" data-id="${name}">${name} ${spec.times[name]}分</button>`).join("") || `<span class="empty">空</span>`
    host.innerHTML = `<div class="shores"><div><p>出发岸 ${state.lamp === 0 ? "· 手电" : ""}</p><div class="tokens">${bank(0)}</div></div><div><p>对岸 ${state.lamp === 1 ? "· 手电" : ""}</p><div class="tokens">${bank(1)}</div></div></div>
      <div class="play-actions"><button type="button" class="btn btn-primary" data-cross>过桥</button><button type="button" class="btn btn-ghost" data-reset>重来</button></div>
      <p class="play-note" role="status">已用 ${state.time} 分钟。${state.note}</p>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      state.side = Object.fromEntries(names.map((name) => [name, 0]))
      state.lamp = 0
      state.time = 0
      state.selected = new Set()
      state.note = "已回到出发岸。"
      draw()
      return
    }
    const token = event.target.closest(".token")
    if (token) {
      const id = token.dataset.id
      if (state.selected.has(id)) state.selected.delete(id)
      else state.selected.add(id)
      draw()
      return
    }
    if (!event.target.closest("[data-cross]")) return
    const chosen = [...state.selected]
    if (chosen.length < 1 || chosen.length > 2) {
      state.note = "一次走 1 或 2 个人。"
      draw()
      return
    }
    if (chosen.some((name) => state.side[name] !== state.lamp)) {
      state.note = "人要和手电在同一岸。"
      draw()
      return
    }
    state.lamp = 1 - state.lamp
    for (const name of chosen) state.side[name] = state.lamp
    state.time += Math.max(...chosen.map((name) => spec.times[name]))
    state.selected = new Set()
    state.note = names.every((name) => state.side[name] === 1) ? "全部到了对岸。" : "手电跟着过去了。"
    draw()
  })
  draw()
}

function mountHanoi(host, spec) {
  const pegs = [Array.from({ length: spec.disks }, (_, index) => spec.disks - index), [], []]
  let from = null
  let moves = 0
  let note = "先点一根柱子拿起最上面的盘，再点另一根放下。"
  const draw = () => {
    host.innerHTML = `<div class="pegs">${pegs.map((peg, index) => `<button type="button" class="peg ${from === index ? "picked" : ""}" data-peg="${index}" aria-label="第${CN[index + 1]}根柱子">${peg.map((disk) => `<span class="disk" style="width:${36 + disk * 28}px"></span>`).join("") || `<span class="empty">空</span>`}</button>`).join("")}</div>
      <p class="play-note" role="status">已搬 ${moves} 步。${note}</p>
      <button type="button" class="btn btn-ghost" data-reset>重来</button>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      pegs.splice(0, 3, Array.from({ length: spec.disks }, (_, index) => spec.disks - index), [], [])
      from = null
      moves = 0
      note = "已回到左边。"
      draw()
      return
    }
    const peg = event.target.closest(".peg")
    if (!peg) return
    const index = Number(peg.dataset.peg)
    if (from === null) {
      if (!pegs[index].length) note = "这根柱子是空的。"
      else {
        from = index
        note = "选好了，再点要放下的柱子。"
      }
      draw()
      return
    }
    if (from === index) {
      from = null
      note = "取消了。"
      draw()
      return
    }
    const disk = pegs[from][pegs[from].length - 1]
    const top = pegs[index][pegs[index].length - 1]
    if (top && top < disk) {
      note = "大的不能压在小的上面。"
      draw()
      return
    }
    pegs[index].push(pegs[from].pop())
    from = null
    moves += 1
    note = pegs[2].length === spec.disks ? "全部到了右边。" : "放下了。"
    draw()
  })
  draw()
}

function mountSwaps(host, spec) {
  let row = spec.start.slice()
  let swaps = 0
  const name = (n) => `第${CN[n]}册`
  const draw = (note = "点两本之间的交换。") => {
    host.innerHTML = `<div class="books">${row.map((book, index) => `${index ? `<button type="button" class="swap" data-i="${index - 1}" aria-label="交换第${index}本和第${index + 1}本">换</button>` : ""}<div class="book b${book}">${name(book)}</div>`).join("")}</div>
      <p class="play-note" role="status">已交换 ${swaps} 次。${note}</p>
      <button type="button" class="btn btn-ghost" data-reset>重来</button>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      row = spec.start.slice()
      swaps = 0
      draw("已恢复原样。")
      return
    }
    const button = event.target.closest(".swap")
    if (!button) return
    const index = Number(button.dataset.i)
    ;[row[index], row[index + 1]] = [row[index + 1], row[index]]
    swaps += 1
    const done = row.every((book, i) => book === spec.goal[i])
    draw(done ? "排好了。" : "换过了。")
  })
  draw()
}

function mountTsp(host, spec) {
  const places = Object.keys(spec.dist).filter((place) => place !== spec.home)
  let route = []
  const draw = () => {
    let text = "从家出发，按顺序点另外三个地方。"
    if (route.length === places.length) {
      let total = 0
      let cursor = spec.home
      for (const place of route) {
        total += spec.dist[cursor][place]
        cursor = place
      }
      total += spec.dist[cursor][spec.home]
      text = `${spec.home} → ${route.join(" → ")} → ${spec.home}，一共 ${total}。`
    } else if (route.length) text = `已选 ${route.join(" → ")}。`
    host.innerHTML = `<div class="place-row">${places.map((place) => `<button type="button" class="btn btn-ghost ${route.includes(place) ? "picked" : ""}" data-place="${place}" ${route.includes(place) ? "disabled" : ""}>${place}</button>`).join("")}</div>
      <p class="play-note" role="status">${text}</p>
      <button type="button" class="btn btn-ghost" data-reset>清空</button>`
  }
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset]")) {
      route = []
      draw()
      return
    }
    const place = event.target.closest("[data-place]")
    if (!place || route.includes(place.dataset.place) || route.length >= places.length) return
    route.push(place.dataset.place)
    draw()
  })
  draw()
}

export function mountPlays(root, question) {
  const host = root.querySelector(".play-host")
  if (!host) return
  const spec = question.spec
  const kind = host.dataset.kind
  if (kind === "grid") mountGrid(host, spec)
  else if (kind === "code") mountCode(host, spec)
  else if (kind === "arrow") mountArrow(host, spec)
  else if (kind === "click") mountClick(host, spec)
  else if (kind === "lights") mountLights(host, spec)
  else if (kind === "river") mountRiver(host)
  else if (kind === "bridge") mountBridge(host, spec)
  else if (kind === "hanoi") mountHanoi(host, spec)
  else if (kind === "swaps") mountSwaps(host, spec)
  else if (kind === "tsp") mountTsp(host, spec)
}
