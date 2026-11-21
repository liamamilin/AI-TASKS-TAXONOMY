export const DIFF_LABEL = { 1: "轻松", 2: "稍费神", 3: "要停一下" }

const COMPUTED = new Set([
  "marks", "front", "turn", "mirror", "lengths", "covers", "facing", "compass",
  "perm", "assign", "jars", "hats", "lights", "balls", "readings",
  "ice", "fly", "birthday", "rope", "milk", "clock",
  "code", "arrow", "stairs", "digits", "windows", "pairs", "angles", "pie",
  "area", "handshake", "template", "click",
  "ticket", "revision", "table", "note", "address", "menu", "chat", "receipt",
  "grid", "river", "tea", "tsp", "swaps", "bridge", "hanoi", "odd", "map",
])

export function isComputedKind(kind) {
  return COMPUTED.has(kind)
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]))
}

function permute(items) {
  if (items.length <= 1) return [items.slice()]
  const out = []
  for (let i = 0; i < items.length; i++) {
    const rest = items.slice(0, i).concat(items.slice(i + 1))
    for (const tail of permute(rest)) out.push([items[i], ...tail])
  }
  return out
}

function strictNorm(s) {
  return String(s).replace(/\r\n/g, "\n").trim()
}

function loose(s) {
  return strictNorm(s)
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/：/g, ":")
    .replace(/，/g, ",")
    .replace(/[ \t]+/g, "")
}

export function runCode(source) {
  const fn = new Function(`"use strict";\nlet result;\n${source}\nreturn result;`)
  return fn()
}

function expandArrow(lines) {
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = String(lines[i]).trim()
    const m = line.match(/^重复\s+(\d+)$/)
    if (m) {
      const n = Number(m[1])
      i += 1
      const body = []
      while (i < lines.length && String(lines[i]).trim() !== "结束") {
        body.push(String(lines[i]).trim())
        i += 1
      }
      if (String(lines[i] ?? "").trim() !== "结束") throw new Error("箭头指令缺少「结束」")
      i += 1
      if (body.some((cmd) => cmd.startsWith("重复"))) throw new Error("箭头指令先不要嵌套")
      for (let k = 0; k < n; k++) out.push(...body)
    } else if (line) {
      out.push(line)
      i += 1
    } else {
      i += 1
    }
  }
  return out
}

function formatPos(x, y) {
  const parts = []
  if (x > 0) parts.push(`东${x}`)
  if (x < 0) parts.push(`西${-x}`)
  if (y > 0) parts.push(`北${y}`)
  if (y < 0) parts.push(`南${-y}`)
  if (!parts.length) return "原地"
  return parts.join("，")
}

export function runArrow(lines) {
  let x = 0
  let y = 0
  for (const cmd of expandArrow(lines)) {
    const m = cmd.match(/^(东|西|南|北)\s+(\d+)$/)
    if (!m) throw new Error(`无法执行「${cmd}」`)
    const n = Number(m[2])
    if (m[1] === "东") x += n
    if (m[1] === "西") x -= n
    if (m[1] === "北") y += n
    if (m[1] === "南") y -= n
  }
  return formatPos(x, y)
}

function pathLength(pts) {
  let L = 0
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  }
  return L
}

function shoelace(pts) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x * y2 - x2 * y
  }
  return Math.abs(s) / 2
}

function solvePerm(spec) {
  const slots = spec.slots
  const ok = []
  for (const perm of permute(spec.items)) {
    const pos = Object.fromEntries(perm.map((item, i) => [item, i + 1]))
    const good = spec.rules.every((rule) => {
      if (rule.op === "notPos") return pos[rule.item] !== rule.pos
      if (rule.op === "isPos") return pos[rule.item] === rule.pos
      if (rule.op === "before") return pos[rule.earlier] < pos[rule.later]
      if (rule.op === "immediatelyBefore") return pos[rule.earlier] + 1 === pos[rule.later]
      if (rule.op === "adjacent") return Math.abs(pos[rule.a] - pos[rule.b]) === 1
      if (rule.op === "end") return rule.ends.includes(pos[rule.item])
      throw new Error(`未知排列规则 ${rule.op}`)
    })
    if (good) ok.push(perm)
  }
  if (ok.length !== 1) {
    throw new Error(`排列题解的个数是 ${ok.length}：${ok.map((p) => p.join("")).join(" | ")}`)
  }
  return slots.map((slot, i) => `${slot}${ok[0][i]}`).join("，")
}

function solveAssign(spec) {
  const ok = []
  for (const perm of permute(spec.values)) {
    const assignment = Object.fromEntries(spec.people.map((person, i) => [person, perm[i]]))
    const good = spec.rules.every((rule) => {
      if (rule.op === "is") return assignment[rule.person] === rule.value
      if (rule.op === "not") return assignment[rule.person] !== rule.value
      throw new Error(`未知分配规则 ${rule.op}`)
    })
    if (good) ok.push(assignment)
  }
  if (ok.length !== 1) throw new Error(`分配题解的个数是 ${ok.length}`)
  return spec.people.map((person) => `${person}-${ok[0][person]}`).join("，")
}

function solveJars(spec) {
  const ok = []
  for (const perm of permute(spec.labels)) {
    const content = Object.fromEntries(spec.labels.map((label, i) => [label, perm[i]]))
    if (spec.labels.some((label) => content[label] === label)) continue
    if (content[spec.observed.label] !== spec.observed.content) continue
    ok.push(content)
  }
  if (ok.length !== 1) throw new Error(`罐子题解的个数是 ${ok.length}`)
  return ok[0][spec.ask]
}

function solveHats(spec) {
  if (spec.seen !== "白" || spec.white !== 1 || spec.red < 1) {
    throw new Error("这顶帽子的设定还不能自动核对")
  }
  return "红"
}

function solveLights(spec) {
  const state = Array(spec.n).fill(false)
  for (const key of spec.press) {
    const lamps = spec.toggles[key]
    if (!lamps) throw new Error(`没有按钮 ${key}`)
    for (const lamp of lamps) state[lamp - 1] = !state[lamp - 1]
  }
  const on = state.map((lit, i) => (lit ? i + 1 : 0)).filter(Boolean)
  const name = ["", "第一盏", "第二盏", "第三盏"]
  if (!on.length) return "都灭着"
  if (on.length === spec.n && spec.n === 3) return "三盏都亮"
  if (on.length === 1) return name[on[0]]
  if (on.length === 2) return `${name[on[0]]}和${name[on[1]]}`
  return on.map((n) => name[n]).join("、")
}

function solveBalls(spec) {
  const colors = ["红", "蓝"]
  const ok = []
  for (const left of colors) {
    for (const right of colors) {
      const world = [left, right]
      const reds = world.filter((c) => c === "红").length
      const claims = [reds >= 1, world.some((c) => c === "蓝"), world[0] === "红"]
      if (spec.claims.join(",") !== "atLeastOneRed,atLeastOneBlue,leftIsRed") {
        throw new Error("两球题的句子顺序被改过，核对器不认")
      }
      if (claims.filter(Boolean).length === spec.trueCount) ok.push(world)
    }
  }
  if (ok.length !== 1) throw new Error(`两球题解的个数是 ${ok.length}`)
  const [left, right] = ok[0]
  if (left === right) return left === "蓝" ? "两只都是蓝" : "两只都是红"
  return `左${left}，右${right}`
}

function solveReadings(spec) {
  const answer = spec.readings.join(" / ")
  for (const group of spec.groups) {
    if (!group.some((key) => answer.includes(key))) {
      throw new Error(`参考答案没有点到「${group.join("/")}」`)
    }
  }
  if (spec.groups.every((group) => group.some((key) => spec.quote.includes(key)))) {
    throw new Error("原句本身已经把两种意思都说破了")
  }
  return answer
}

function solveGrid(spec) {
  const rows = spec.rows
  const height = rows.length
  const width = rows[0].length
  let start
  let goal
  let key
  const walls = new Set()
  for (let y = 0; y < height; y++) {
    if (rows[y].length !== width) throw new Error("网格行宽不一致")
    for (let x = 0; x < width; x++) {
      const cell = rows[y][x]
      if (cell === "S") start = [x, y]
      else if (cell === "G") goal = [x, y]
      else if (cell === "K") key = [x, y]
      else if (cell === "#") walls.add(`${x},${y}`)
      else if (cell !== ".") throw new Error(`网格里有不认识的格子「${cell}」`)
    }
  }
  if (!start || !goal) throw new Error("网格缺少起点或终点")
  if (spec.key && !key) throw new Error("这张图要求钥匙，却没有 K")
  const queue = [[start[0], start[1], spec.key ? 0 : 1, 0]]
  const seen = new Set([`${start[0]},${start[1]},${spec.key ? 0 : 1}`])
  while (queue.length) {
    const [x, y, hasKey, dist] = queue.shift()
    if (x === goal[0] && y === goal[1] && hasKey === 1) return String(dist)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || walls.has(`${nx},${ny}`)) continue
      const nextKey = spec.key ? (hasKey || (nx === key[0] && ny === key[1]) ? 1 : 0) : 1
      const mark = `${nx},${ny},${nextKey}`
      if (seen.has(mark)) continue
      seen.add(mark)
      queue.push([nx, ny, nextKey, dist + 1])
    }
  }
  throw new Error("网格走不到终点")
}

function solveRiver() {
  const start = { p: 0, cat: 0, fish: 0, food: 0 }
  const stamp = (s) => `${s.p},${s.cat},${s.fish},${s.food}`
  const safe = (s) => {
    if (s.cat === s.fish && s.cat !== s.p) return false
    if (s.fish === s.food && s.fish !== s.p) return false
    return true
  }
  const queue = [[start, 0]]
  const seen = new Set([stamp(start)])
  while (queue.length) {
    const [state, dist] = queue.shift()
    if (stamp(state) === "1,1,1,1") return String(dist)
    const cargo = ["cat", "fish", "food"].filter((item) => state[item] === state.p)
    const moves = [[]]
    for (const item of cargo) moves.push([item])
    for (const bringing of moves) {
      const next = { ...state, p: 1 - state.p }
      for (const item of bringing) next[item] = next.p
      if (!safe(next)) continue
      const mark = stamp(next)
      if (seen.has(mark)) continue
      seen.add(mark)
      queue.push([next, dist + 1])
    }
  }
  throw new Error("渡河没有解")
}

function solveBridge(spec) {
  const names = Object.keys(spec.times)
  const start = { lamp: 0 }
  for (const name of names) start[name] = 0
  const stamp = (s) => `${names.map((name) => s[name]).join(",")},${s.lamp}`
  const queue = [[start, 0]]
  const seen = new Set([stamp(start)])
  let best = Infinity
  while (queue.length) {
    queue.sort((a, b) => a[1] - b[1])
    const [state, time] = queue.shift()
    if (names.every((name) => state[name] === 1) && state.lamp === 1) {
      best = time
      break
    }
    const here = names.filter((name) => state[name] === state.lamp)
    const groups = []
    for (let i = 0; i < here.length; i++) {
      groups.push([here[i]])
      for (let j = i + 1; j < here.length; j++) groups.push([here[i], here[j]])
    }
    for (const group of groups) {
      const next = { ...state, lamp: 1 - state.lamp }
      for (const name of group) next[name] = next.lamp
      const mark = stamp(next)
      if (seen.has(mark)) continue
      seen.add(mark)
      queue.push([next, time + Math.max(...group.map((name) => spec.times[name]))])
    }
    if (seen.size > 5000) throw new Error("过桥状态太多")
  }
  if (!Number.isFinite(best)) throw new Error("过桥没有解")
  return String(best)
}

function solveHanoi(spec) {
  const n = spec.disks
  const start = Array(n).fill(0)
  const goal = Array(n).fill(2).join(",")
  const stamp = (pegs) => pegs.join(",")
  const queue = [[start, 0]]
  const seen = new Set([stamp(start)])
  while (queue.length) {
    const [pegs, dist] = queue.shift()
    if (stamp(pegs) === goal) return String(dist)
    for (let from = 0; from < 3; from++) {
      let top = -1
      for (let disk = 0; disk < n; disk++) {
        if (pegs[disk] === from) {
          top = disk
          break
        }
      }
      if (top < 0) continue
      for (let to = 0; to < 3; to++) {
        if (to === from) continue
        let topTo = -1
        for (let disk = 0; disk < n; disk++) {
          if (pegs[disk] === to) {
            topTo = disk
            break
          }
        }
        if (topTo !== -1 && topTo < top) continue
        const next = pegs.slice()
        next[top] = to
        const mark = stamp(next)
        if (seen.has(mark)) continue
        seen.add(mark)
        queue.push([next, dist + 1])
      }
    }
  }
  throw new Error("盘子搬不完")
}

function solveTsp(spec) {
  const places = Object.keys(spec.dist).filter((place) => place !== spec.home)
  let best = Infinity
  for (const route of permute(places)) {
    let total = 0
    let cursor = spec.home
    for (const place of route) {
      if (spec.dist[cursor]?.[place] == null) throw new Error(`缺少路程 ${cursor}→${place}`)
      total += spec.dist[cursor][place]
      cursor = place
    }
    total += spec.dist[cursor][spec.home]
    if (total < best) best = total
  }
  if (!Number.isFinite(best)) throw new Error("回路没有解")
  return String(best)
}

function solveSwaps(spec) {
  const rank = new Map(spec.goal.map((value, index) => [value, index]))
  const seq = spec.start.map((value) => {
    if (!rank.has(value)) throw new Error("换书的两列对不上")
    return rank.get(value)
  })
  let inversions = 0
  for (let i = 0; i < seq.length; i++) {
    for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) inversions += 1
  }
  const stamp = (row) => row.join(",")
  const queue = [[seq, 0]]
  const seen = new Set([stamp(seq)])
  let best = null
  while (queue.length) {
    const [row, dist] = queue.shift()
    if (row.every((value, index) => value === index)) {
      best = dist
      break
    }
    for (let i = 0; i < row.length - 1; i++) {
      const next = row.slice()
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      const mark = stamp(next)
      if (seen.has(mark)) continue
      seen.add(mark)
      queue.push([next, dist + 1])
    }
  }
  if (best !== inversions) throw new Error(`交换次数对不上：逆序 ${inversions}，搜索 ${best}`)
  return String(inversions)
}

function solveTemplate(spec) {
  if (spec.op === "reverse-join") return spec.prefix + spec.parts.slice().reverse().join(spec.sep)
  if (spec.op === "powers") {
    const lines = []
    for (let exp = spec.from; exp <= spec.to; exp++) lines.push(String(spec.base ** exp))
    return lines.join("\n")
  }
  if (spec.op === "interpunct") return [...spec.text].join(spec.sep)
  if (spec.op === "judge-repeat") {
    const sum = spec.left + spec.right
    const line = sum === spec.eq ? "是" : "否"
    return `${line}\n${line}`
  }
  if (spec.op === "json-sum") return JSON.stringify({ [spec.key]: spec.a + spec.b })
  if (spec.op === "delete-char") return spec.text.split(spec.drop).join("")
  if (spec.op === "sort-len") {
    const lengths = spec.items.map((item) => [...item].length)
    if (new Set(lengths).size !== lengths.length) throw new Error("字数有并列，排序不唯一")
    return spec.items.slice().sort((a, b) => [...a].length - [...b].length).join(spec.sep)
  }
  throw new Error(`未知格式操作 ${spec.op}`)
}

function describeShape(shape) {
  const size = { 1: "小", 2: "中", 3: "大" }[shape.size]
  const color = { red: "红", blue: "蓝", yellow: "黄" }[shape.color]
  const form = { circle: "圆", square: "方" }[shape.shape]
  if (!size || !color || !form) throw new Error("图形描述不完整")
  return size + color + form
}

function solveClick(spec) {
  let shapes = spec.shapes.filter((shape) => {
    if (spec.rule.shape && shape.shape !== spec.rule.shape) return false
    if (spec.rule.color && shape.color !== spec.rule.color) return false
    return true
  })
  if (spec.rule.order === "sizeDesc") {
    shapes = shapes.slice().sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
  } else {
    throw new Error("点击顺序还不能自动核对")
  }
  if (shapes.length < 1) throw new Error("没有图形符合规则")
  return shapes.map(describeShape).join("，然后")
}

function solveOdd(spec) {
  const groups = new Map()
  for (const item of spec.items) {
    if (!groups.has(item.f)) groups.set(item.f, [])
    groups.get(item.f).push(item.name)
  }
  const singles = [...groups.values()].filter((names) => names.length === 1)
  if (singles.length !== 1) throw new Error("异类不是唯一的")
  return singles[0][0]
}

function solveMap(spec) {
  const table = Object.fromEntries(spec.pairs)
  if (!table[spec.ask]) throw new Error("类比缺少要问的那一对")
  for (const shown of spec.show) {
    if (!table[shown]) throw new Error(`类比缺少示例 ${shown}`)
  }
  return table[spec.ask]
}

function solveCode(spec) {
  const value = runCode(spec.source)
  if (value === undefined) throw new Error("代码没有给出 result")
  return String(value)
}

function countRightAngles(hour) {
  const h = hour % 12
  const seen = new Set()
  for (const diff of [90, -90, 270, -270]) {
    const minute = (30 * h - diff) / 5.5
    if (minute >= 0 && minute < 60) seen.add(minute.toFixed(6))
  }
  return seen.size
}

export function solveSpec(spec) {
  switch (spec.kind) {
    case "marks":
      return String(spec.rows.reduce((sum, row) => sum + row.marks.filter((mark) => mark === spec.mark).length, 0))
    case "front": {
      const pool = spec.items.filter((item) => !item.shadow).slice().sort((a, b) => b.foot - a.foot)
      if (pool.length < 2 || pool[0].foot === pool[1].foot) throw new Error("最前面的对象不唯一")
      return pool[0].name
    }
    case "turn": {
      const order = ["上", "右", "下", "左"]
      let index = order.indexOf(spec.start)
      if (index < 0) throw new Error("箭头方向不认识")
      const step = spec.dir === "cw" ? 1 : -1
      index = (index + step * spec.steps) % 4
      if (index < 0) index += 4
      return order[index]
    }
    case "mirror":
      return { 左: "右", 右: "左", 上: "上", 下: "下" }[spec.arrow]
    case "lengths": {
      const measured = spec.lines.map((line) => ({ name: line.name, length: pathLength(line.pts) }))
      const longest = Math.max(...measured.map((line) => line.length))
      const shortest = Math.min(...measured.map((line) => line.length))
      if (Math.abs(longest - shortest) < 1e-6) return "一样长"
      const winners = measured.filter((line) => Math.abs(line.length - longest) < 1e-6)
      if (winners.length !== 1) throw new Error("最长的绳子不唯一")
      return winners[0].name
    }
    case "covers": {
      const [px, py] = spec.point
      return String(spec.rects.filter((rect) => !rect.ignore && px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h).length)
    }
    case "facing":
      if (spec.ask === "their-right") return "左"
      if (spec.ask === "their-left") return "右"
      throw new Error("左右问题不认识")
    case "compass": {
      const order = ["北", "东", "南", "西"]
      const index = order.indexOf(spec.up)
      if (index < 0) throw new Error("方位不认识")
      if (spec.ask === "right") return order[(index + 1) % 4]
      if (spec.ask === "left") return order[(index + 3) % 4]
      throw new Error("没有问左右")
    }
    case "perm":
      return solvePerm(spec)
    case "assign":
      return solveAssign(spec)
    case "jars":
      return solveJars(spec)
    case "hats":
      return solveHats(spec)
    case "lights":
      return solveLights(spec)
    case "balls":
      return solveBalls(spec)
    case "readings":
      return solveReadings(spec)
    case "ice": {
      if (!(spec.iceDensity < 1)) throw new Error("这块冰不会浮着")
      const displaced = spec.mass / 1
      const melted = spec.mass / 1
      if (Math.abs(displaced - melted) > 1e-9) throw new Error("冰的体积对不上")
      return "不变"
    }
    case "fly": {
      const km = spec.bird * (spec.distance / (spec.speedA + spec.speedB))
      if (!Number.isInteger(km)) throw new Error("鸟飞过的路程不是整数")
      return `${km}公里`
    }
    case "birthday": {
      let logP = 0
      for (let i = 0; i < spec.people; i++) logP += Math.log(365 - i) - Math.log(365)
      const probability = 1 - Math.exp(logP)
      let best = spec.options[0]
      let bestGap = Infinity
      for (const option of spec.options) {
        const gap = Math.abs(parseFloat(option) / 100 - probability)
        if (gap < bestGap) {
          bestGap = gap
          best = option
        }
      }
      return best
    }
    case "rope":
      return `${Math.round((spec.extraMeters / (2 * Math.PI)) * 100)}厘米`
    case "milk": {
      let coffeeCupCoffee = spec.volume
      let coffeeCupMilk = 0
      let milkCupCoffee = 0
      let milkCupMilk = spec.volume
      const spoon = spec.spoon
      milkCupCoffee += spoon
      coffeeCupCoffee -= spoon
      const total = milkCupCoffee + milkCupMilk
      const movedCoffee = (spoon * milkCupCoffee) / total
      const movedMilk = (spoon * milkCupMilk) / total
      milkCupCoffee -= movedCoffee
      milkCupMilk -= movedMilk
      coffeeCupCoffee += movedCoffee
      coffeeCupMilk += movedMilk
      if (Math.abs(coffeeCupMilk - milkCupCoffee) > 1e-6) throw new Error("两杯没有一样多")
      return "一样多"
    }
    case "clock": {
      const minutes = (12 * 60 - (spec.h * 60 + spec.m)) % (12 * 60)
      return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
    }
    case "code":
      return solveCode(spec)
    case "arrow":
      return runArrow(spec.lines)
    case "stairs": {
      const ways = [1, 1]
      for (let i = 2; i <= spec.steps; i++) ways[i] = ways[i - 1] + ways[i - 2]
      return String(ways[spec.steps])
    }
    case "digits": {
      let count = 0
      const walk = (left, prev) => {
        if (left === 0) {
          count += 1
          return
        }
        for (const digit of spec.alphabet) {
          if (prev !== null && digit === prev) continue
          walk(left - 1, digit)
        }
      }
      walk(spec.length, null)
      return String(count)
    }
    case "windows": {
      let count = 0
      const total = 1 << spec.n
      for (let mask = 0; mask < total; mask++) {
        let ok = true
        for (let i = 0; i < spec.n - 1; i++) {
          if ((mask & (1 << i)) && (mask & (1 << (i + 1)))) ok = false
        }
        if (ok) count += 1
      }
      return String(count)
    }
    case "pairs": {
      let count = 0
      for (let a = spec.from; a <= spec.to; a++) {
        for (let b = a + 1; b <= spec.to; b++) if ((a + b) % 2 === 0) count += 1
      }
      return String(count)
    }
    case "angles":
      return String(countRightAngles(spec.hour === 12 ? 0 : spec.hour))
    case "pie":
      return String((spec.cuts * (spec.cuts + 1)) / 2 + 1)
    case "area": {
      const mids = spec.outer.map((point, index) => {
        const next = spec.outer[(index + 1) % spec.outer.length]
        return [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2]
      })
      const ratio = shoelace(mids) / shoelace(spec.outer)
      if (Math.abs(ratio - 0.5) < 1e-9) return "1/2"
      throw new Error(`面积比不是二分之一：${ratio}`)
    }
    case "handshake":
      return String((spec.n * (spec.n - 1)) / 2)
    case "template":
      return solveTemplate(spec)
    case "click":
      return solveClick(spec)
    case "ticket": {
      const hits = spec.rows.filter((row) => row[0] === spec.ask)
      if (hits.length !== 1) throw new Error("票上的字段不唯一")
      return hits[0][1]
    }
    case "revision":
      if (spec.void === spec.current) throw new Error("改价前后一样")
      return spec.current
    case "table": {
      const where = spec.columns.indexOf(spec.where[0])
      const take = spec.columns.indexOf(spec.take)
      const hits = spec.rows.filter((row) => row[where] === spec.where[1])
      if (hits.length !== 1) throw new Error("表格里的目标不唯一")
      return hits[0][take]
    }
    case "note":
    case "address":
      if (!spec.text.includes(spec.value)) throw new Error("材料里没有这个答案")
      for (const extra of spec.also || []) {
        if (!spec.text.includes(extra)) throw new Error(`材料里缺少干扰项 ${extra}`)
        if (extra === spec.value) throw new Error("干扰项和答案相同")
      }
      return spec.value
    case "menu": {
      const pool = spec.items.filter((item) => item.tag === spec.tag).slice().sort((a, b) => a.price - b.price)
      if (pool.length < 2 || pool[0].price === pool[1].price) throw new Error("最便宜的菜不唯一")
      return pool[0].name
    }
    case "chat": {
      const accepts = spec.lines.filter((line) => line.act === "accept")
      if (!accepts.length) throw new Error("对话里没有人答应")
      return accepts[accepts.length - 1].place
    }
    case "receipt":
      return String(spec.subtotal - spec.discount)
    case "grid":
      return solveGrid(spec)
    case "river":
      return solveRiver()
    case "tea":
      return String(Math.max(spec.boil, spec.cup + spec.leaf) + spec.brew)
    case "tsp":
      return solveTsp(spec)
    case "swaps":
      return solveSwaps(spec)
    case "bridge":
      return solveBridge(spec)
    case "hanoi":
      return solveHanoi(spec)
    case "odd":
      return solveOdd(spec)
    case "map":
      return solveMap(spec)
    default:
      throw new Error(`还不能重算「${spec.kind}」`)
  }
}

export function expectedAnswer(question) {
  const spec = question.spec
  if (spec.kind === "rubric") return null
  if (spec.kind === "points") {
    for (const group of spec.groups) {
      if (!group.some((phrase) => question.answer.includes(phrase))) {
        throw new Error(`答案没有点到「${group.join("/")}」`)
      }
    }
    return question.answer
  }
  if (spec.kind === "audit") {
    if (question.answer !== spec.value) throw new Error("答案和核对值不一致")
    for (const phrase of spec.explanationMust) {
      if (!question.explanation.includes(phrase)) throw new Error(`解释里缺少「${phrase}」`)
    }
    return question.answer
  }
  return solveSpec(spec)
}

export function exhibitText(question) {
  const spec = question.spec
  switch (spec.kind) {
    case "marks":
      return spec.rows.map((row) => `${row.label}：${row.marks.join(" ")}`).join("\n")
    case "front":
      return spec.items.map((item) => `${item.name}　落脚高度 ${item.foot}${item.shadow ? "　这是影子" : ""}`).join("\n")
    case "turn":
      return `箭头现在指向：${spec.start}\n操作：顺时针转 ${spec.steps * 90} 度`
    case "mirror":
      return `箭头指向：${spec.arrow}\n镜子竖直立在箭头右侧，只把左右对调。`
    case "lengths":
      return spec.lines.map((line) => `${line.name}：${line.pts.map((point) => `(${point[0]},${point[1]})`).join(" → ")}`).join("\n")
    case "covers":
      return `观察点：(${spec.point[0]}, ${spec.point[1]})\n` + spec.rects.map((rect) => `${rect.label}：左上 (${rect.x},${rect.y})，宽 ${rect.w}，高 ${rect.h}${rect.ignore ? "，衬纸，不算" : ""}`).join("\n")
    case "facing":
      return "人物面向你站着，双手自然下垂，手上没有标左右。"
    case "compass":
      return `图的上方标着：${spec.up}\n图上有一支指向画面右边的箭头。`
    case "perm":
      return spec.rules.map((rule) => {
        if (rule.op === "immediatelyBefore") return `${rule.earlier}紧挨在${rule.later}的左边。`
        if (rule.op === "before") return `${rule.earlier}在${rule.later}前面。`
        if (rule.op === "end") return `${rule.item}在两端之一：${rule.ends.join(" 或 ")}。`
        if (rule.op === "adjacent") return `${rule.a}和${rule.b}紧挨着。`
        if (rule.op === "notPos") return `${rule.item}不在 ${rule.pos}。`
        return JSON.stringify(rule)
      }).join("\n")
    case "assign":
      return spec.rules.map((rule) => (rule.op === "is" ? `${rule.person}是${rule.value}。` : `${rule.person}不是${rule.value}。`)).join("\n")
    case "jars":
      return `三张标签：${spec.labels.join("、")}。每一张都贴错了。\n从标着「${spec.observed.label}」的罐子里舀到的是纯${spec.observed.content}。`
    case "hats":
      return `抽屉里有红帽 ${spec.red} 顶、白帽 ${spec.white} 顶。甲看见乙戴着${spec.seen}帽。`
    case "points":
      return "门外看不见灯。你可以留在门外随意试开关，但最后只能进门一次。"
    case "lights":
      return Object.entries(spec.toggles).map(([key, lamps]) => `按钮 ${key} 切换第 ${lamps.join("、")} 盏。`).join("\n") + `\n按下的顺序：${spec.press.join("，")}。开始时全灭。`
    case "balls":
      return "甲：至少有一只红的。\n乙：至少有一只蓝的。\n丙：左边那只是红的。\n恰好一句为真。"
    case "readings":
      return `原句：${spec.quote}`
    case "ice":
      return `冰的质量按 ${spec.mass} 份水来想，冰的密度是 ${spec.iceDensity}，水的密度是 1。冰浮着。`
    case "fly":
      return `两城相距 ${spec.distance} 公里。两车相向，各每小时 ${spec.speedA} 公里。鸟每小时 ${spec.bird} 公里。`
    case "birthday":
      return spec.options.join("　")
    case "rope":
      return `绳子接长 ${spec.extraMeters} 米，仍然是和地面同心的正圆。`
    case "milk":
      return `两杯各 ${spec.volume} 份。勺子是 ${spec.spoon} 份。`
    case "clock":
      return `钟面现在是 ${spec.h}:${String(spec.m).padStart(2, "0")}。镜子左右对调。`
    case "audit":
      return spec.sceneNote || ""
    case "code":
      return spec.source
    case "arrow":
      return spec.lines.join("\n")
    case "stairs":
      return `${spec.steps} 级台阶，每步可以走 1 级或 2 级。`
    case "digits":
      return `位数 ${spec.length}。每位取自 ${spec.alphabet.join("、")}，相邻两位不同。`
    case "windows":
      return `${spec.n} 扇窗，每扇开或关，相邻不能同时开。全关也算一种。`
    case "pairs":
      return `号牌 ${spec.from} 到 ${spec.to}，摸出两张不同的，顺序不计。`
    case "angles":
      return `看 ${spec.hour}:00 到 ${(spec.hour % 12) + 1}:00 之间，不含结束那一刻。`
    case "pie":
      return `${spec.cuts} 刀都是切穿整张饼的直线，尽量让每刀都和之前每一刀相交，而且不要三刀交在同一点。`
    case "area":
      return `外框顶点：${spec.outer.map((point) => `(${point[0]},${point[1]})`).join(" ")}。把每条边的中点顺次连起来。`
    case "handshake":
      return `${spec.n} 个人，每两个人握一次。`
    case "template":
      return ""
    case "click":
      return spec.shapes.map((shape) => describeShape(shape)).join("\n")
    case "ticket":
      return spec.rows.map((row) => `${row[0]}　${row[1]}`).join("\n")
    case "revision":
      return `作废：${spec.void}\n现价：${spec.current}`
    case "table":
      return [spec.columns.join("　"), ...spec.rows.map((row) => row.join("　"))].join("\n")
    case "note":
    case "address":
      return spec.text
    case "menu":
      return spec.items.map((item) => `${item.name}　${item.price}　${item.tag}`).join("\n")
    case "chat":
      return spec.lines.map((line) => `${line.who}：${line.text}`).join("\n")
    case "receipt":
      return `小计 ${spec.subtotal}\n折扣 ${spec.discount}\n折扣从应付里减掉。`
    case "grid":
      return `${spec.rows.map((row) => row.split("").join(" ")).join("\n")}\nS 起点，G 终点，# 墙，. 空地${spec.key ? "，K 钥匙" : ""}。只能上下左右走。`
    case "river":
      return "左岸出发的有：人、猫、鱼、鱼食。船一次只能有人，外加至多一件。人不在时，猫会吃鱼，鱼会吃鱼食；猫不吃鱼食。"
    case "tea":
      return `烧水 ${spec.boil} 分钟，不用盯着。洗杯子 ${spec.cup} 分钟。找茶叶 ${spec.leaf} 分钟。三件事都完成后才能泡，泡 ${spec.brew} 分钟。你只有一个人。`
    case "tsp": {
      const places = Object.keys(spec.dist)
      const lines = []
      for (const from of places) {
        for (const to of places) {
          if (from < to) lines.push(`${from}—${to} ${spec.dist[from][to]}`)
        }
      }
      return `从${spec.home}出发再回到${spec.home}。\n${lines.join("\n")}`
    }
    case "swaps":
      return `现在从左到右：${spec.start.map((n) => `第${"零一二三四五"[n]}册`).join("、")}\n目标：${spec.goal.map((n) => `第${"零一二三四五"[n]}册`).join("、")}`
    case "bridge":
      return Object.entries(spec.times).map(([name, time]) => `${name} 需要 ${time} 分钟`).join("\n")
    case "hanoi":
      return `${spec.disks} 层圆盘，一开始全在左边，要全到右边。`
    case "rubric":
      return ""
    case "odd":
      return spec.items.map((item) => item.name).join("、")
    case "map":
      return spec.show.map((name) => `${name} → ${Object.fromEntries(spec.pairs)[name]}`).concat(`${spec.ask} → ？`).join("\n")
    default:
      return ""
  }
}

export function fullPrompt(question, typeLabel) {
  const lines = [
    `【问笺馆 ${question.id}】${question.title}`,
    `类型：${typeLabel}　难度：${DIFF_LABEL[question.difficulty]}　大约 ${question.minutes} 分钟`,
    "",
    question.prompt.trim(),
  ]
  const exhibit = exhibitText(question).trim()
  if (exhibit) lines.push("", exhibit)
  lines.push("", "请只按题目要求作答。这是问笺馆的固定提示，拿去比较时不要改写。")
  return lines.join("\n")
}

export function checkGuess(question, input) {
  const raw = String(input ?? "")
  if (!raw.trim()) return { ok: false, empty: true }
  if (question.spec.kind === "readings") {
    return { ok: question.spec.groups.every((group) => group.some((key) => raw.includes(key))) }
  }
  const answers = [question.answer, ...(question.accept || [])]
  if (question.spec.kind === "template") {
    const folded = strictNorm(raw)
    return { ok: answers.some((answer) => strictNorm(answer) === folded) }
  }
  const folded = loose(raw)
  return { ok: answers.some((answer) => loose(answer) === folded) }
}

export function clickTargets(spec) {
  return solveClick(spec)
}
