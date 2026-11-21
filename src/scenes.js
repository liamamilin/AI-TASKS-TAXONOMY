import { esc } from "./logic.js"

function svg(uid, wash, body) {
  return `<svg class="art-svg" viewBox="0 0 640 420" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${wash[0]}"/>
        <stop offset="1" stop-color="${wash[1]}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#${uid}-sky)"/>
    ${body}
  </svg>`
}

function lantern(x, y, opacity = 1) {
  return `<g transform="translate(${x} ${y})" opacity="${opacity}">
    <line x1="0" y1="-34" x2="0" y2="-18" stroke="#2a2420" stroke-width="2"/>
    <rect x="-12" y="-20" width="24" height="7" rx="1.5" fill="#2a2420"/>
    <path d="M-16 -8 C-18 16 -8 28 0 30 C8 28 18 16 16 -8 Z" fill="#c4493a"/>
    <path d="M-16 -8 C-18 16 -8 28 0 30 C8 28 18 16 16 -8 Z" fill="none" stroke="#7d261d" stroke-width="2"/>
    <path d="M-12 0 H12 M-13 8 H13 M-12 16 H12" stroke="#f2c7a5" stroke-width="1.4"/>
    <path d="M-4 30 L0 44 L4 30" fill="#c4493a"/>
  </g>`
}

function hill(x, y, w, h, fill) {
  return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${fill}"/>`
}

function sun(x, y) {
  return `<g transform="translate(${x} ${y})">
    <circle r="26" fill="#f4d36a"/>
    <g stroke="#f4d36a" stroke-width="3" stroke-linecap="round">
      <path d="M0 -38 V-48 M0 38 V48 M-38 0 H-48 M38 0 H48 M-27 -27 L-34 -34 M27 -27 L34 -34 M-27 27 L-34 34 M27 27 L34 34"/>
    </g>
  </g>`
}

function tree(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-4" y="10" width="8" height="28" fill="#6b4632"/>
    <circle cy="-6" r="22" fill="#6e8b5a"/>
    <circle cx="-14" cy="2" r="14" fill="#7fa56a"/>
    <circle cx="14" cy="4" r="13" fill="#5e7a4c"/>
  </g>`
}

function house(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-46 28 L0 -20 L46 28 Z" fill="#8c4d3a"/>
    <rect x="-32" y="28" width="64" height="40" fill="#f3e2c8" stroke="#2a2420" stroke-width="2"/>
    <rect x="-8" y="44" width="16" height="24" fill="#6b4632"/>
    <rect x="-24" y="36" width="12" height="12" fill="#9ec9e6" stroke="#2a2420"/>
  </g>`
}

function bridge(x, y, w) {
  return `<g transform="translate(${x} ${y})" stroke="#5c5148" stroke-width="6" fill="none">
    <path d="M0 0 Q ${w / 2} 54 ${w} 0" />
    <path d="M8 -8 H ${w - 8}" stroke="#2a2420" stroke-width="4"/>
  </g>`
}

function cat(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="16" rx="22" ry="14" fill="#d9a066"/>
    <circle cy="-6" r="16" fill="#e2b27a"/>
    <path d="M-12 -16 L-18 -30 L-4 -18 M12 -16 L18 -30 L4 -18" fill="#e2b27a" stroke="#2a2420" stroke-width="2"/>
    <circle cx="-6" cy="-6" r="1.6" fill="#2a2420"/>
    <circle cx="6" cy="-6" r="1.6" fill="#2a2420"/>
    <path d="M-4 0 Q0 4 4 0" fill="none" stroke="#2a2420" stroke-width="1.5"/>
  </g>`
}

function ball(x, y, fill = "#c4493a") {
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="0" cy="18" rx="16" ry="5" fill="rgba(40,30,20,.15)"/>
    <circle r="16" fill="${fill}"/>
    <path d="M-16 0 Q0 -6 16 0 M0 -16 Q6 0 0 16" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>
  </g>`
}

function box(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-28 8 L0 -12 L28 8 L0 24 Z" fill="#c9845a"/>
    <path d="M-28 8 L0 24 L0 48 L-28 30 Z" fill="#a86840"/>
    <path d="M28 8 L0 24 L0 48 L28 30 Z" fill="#8c5434"/>
    <path d="M-28 8 L0 -12 L28 8 L0 24 Z" fill="none" stroke="#2a2420" stroke-width="2"/>
  </g>`
}

function arrowShape(dir) {
  const rotate = { 上: 0, 右: 90, 下: 180, 左: -90 }[dir] ?? 0
  return `<g transform="rotate(${rotate})">
    <rect x="-8" y="-6" width="16" height="46" rx="3" fill="#c4493a"/>
    <path d="M0 -48 L22 -8 H-22 Z" fill="#c4493a"/>
  </g>`
}

function personFacing(x, y) {
  return `<g transform="translate(${x} ${y})">
    <circle cy="-78" r="22" fill="#f0c7a0"/>
    <path d="M-16 -92 Q0 -108 16 -92" fill="none" stroke="#2a2420" stroke-width="3"/>
    <circle cx="-7" cy="-80" r="2" fill="#2a2420"/>
    <circle cx="7" cy="-80" r="2" fill="#2a2420"/>
    <path d="M-6 -70 Q0 -64 6 -70" fill="none" stroke="#2a2420" stroke-width="1.6"/>
    <path d="M-34 -50 Q0 -36 34 -50 L28 36 H-28 Z" fill="#2c4a6e"/>
    <path d="M-34 -46 L-62 -8" stroke="#f0c7a0" stroke-width="8" stroke-linecap="round"/>
    <path d="M34 -46 L62 -8" stroke="#f0c7a0" stroke-width="8" stroke-linecap="round"/>
    <path d="M-16 36 L-20 78 M16 36 L20 78" stroke="#243044" stroke-width="8" stroke-linecap="round"/>
  </g>`
}

function clockAt(x, y, hour, minute, scale = 1) {
  const minuteAngle = minute * 6
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle r="54" fill="#f7f1e4" stroke="#2a2420" stroke-width="4"/>
    <circle r="3" fill="#2a2420"/>
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => `<rect x="-1.2" y="-46" width="2.4" height="8" fill="#2a2420" transform="rotate(${angle})"/>`).join("")}
    <rect x="-2.2" y="-28" width="4.4" height="28" rx="2" fill="#2a2420" transform="rotate(${hourAngle})"/>
    <rect x="-1.4" y="-40" width="2.8" height="40" rx="1.4" fill="#c4493a" transform="rotate(${minuteAngle})"/>
  </g>`
}

function glass(x, y, ice = false) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-28 0 L-22 78 H22 L28 0 Z" fill="#d5eef8" stroke="#2a2420" stroke-width="3"/>
    <path d="M-24 18 H24" stroke="#7eb4d6" stroke-width="8"/>
    ${ice ? `<rect x="-12" y="8" width="22" height="16" rx="3" fill="#f7fbff" stroke="#9ec4dd" transform="rotate(-8)"/>` : ""}
    <path d="M-30 -6 H30" stroke="#2a2420" stroke-width="3"/>
  </g>`
}

function cup(x, y, fill) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-26 0 H26 L20 36 H-20 Z" fill="${fill}" stroke="#2a2420" stroke-width="2.4"/>
    <path d="M26 8 H36 V24 H26" fill="none" stroke="#2a2420" stroke-width="2.4"/>
  </g>`
}

function car(x, y, fill) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-34 8 L-18 -12 H16 L30 8 Z" fill="${fill}"/>
    <rect x="-36" y="8" width="72" height="18" rx="4" fill="${fill}" stroke="#2a2420" stroke-width="2"/>
    <circle cx="-18" cy="28" r="7" fill="#2a2420"/>
    <circle cx="18" cy="28" r="7" fill="#2a2420"/>
    <rect x="-12" y="-8" width="16" height="10" fill="#d7ebf6"/>
  </g>`
}

function jar(x, y, label) {
  return `<g transform="translate(${x} ${y})">
    <path d="M-22 10 H22 L16 62 H-16 Z" fill="#f4e7cf" stroke="#2a2420" stroke-width="2.5"/>
    <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#c9845a" stroke="#2a2420" stroke-width="2"/>
    <rect x="-16" y="24" width="32" height="18" fill="#f7f1e4" stroke="#9c3b32"/>
    <text x="0" y="37" text-anchor="middle" font-size="11" fill="#9c3b32" font-family="Noto Serif SC, serif">${esc(label)}</text>
  </g>`
}

function bird(x, y) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#2a2420" stroke-width="3" stroke-linecap="round">
    <path d="M-16 6 Q-4 -10 8 0 Q16 -12 24 -2"/>
    <circle cx="10" cy="2" r="2" fill="#2a2420" stroke="none"/>
  </g>`
}

function groundLine() {
  return `<path d="M40 318 H600" stroke="#e7d7bf" stroke-width="8" stroke-linecap="round"/>`
}

function lanternScene(spec, uid) {
  const bridgeCount = spec.rows.find((row) => row.label === "桥")?.marks.filter((mark) => mark === "灯").length ?? 0
  const eaveCount = spec.rows.find((row) => row.label === "檐")?.marks.filter((mark) => mark === "灯").length ?? 0
  const reflectionCount = spec.rows.find((row) => row.label === "河")?.marks.length ?? 0
  const bridgeLights = Array.from({ length: bridgeCount }, (_, index) => lantern(150 + index * 58, 168))
  const eaveLights = Array.from({ length: eaveCount }, (_, index) => lantern(500 + index * 36, 132))
  const reflections = Array.from({ length: reflectionCount }, (_, index) => lantern(168 + index * 70, 300, 0.38))
  return svg(uid, ["#9ec9e6", "#f6e2b8"], `
    ${sun(86, 74)}
    ${hill(180, 250, 150, 48, "#c5d59a")}
    ${hill(430, 246, 180, 54, "#8eae72")}
    <rect y="250" width="640" height="170" fill="#7eafc6"/>
    <path d="M0 268 Q160 292 320 270 T640 280 V420 H0 Z" fill="#6aa0b8" opacity=".65"/>
    ${house(500, 150)}
    ${tree(70, 196, 1.05)}
    ${bridge(120, 214, 250)}
    ${bridgeLights.join("")}
    ${eaveLights.join("")}
    ${reflections.join("")}
  `)
}

function frontScene(spec, uid) {
  const placed = {
    猫: cat(120, 210, 1.15),
    箱子: box(300, 230),
    球: ball(470, 250),
  }
  const shadow = spec.items.some((item) => item.shadow) ? ball(520, 286, "rgba(80,50,40,.28)") : ""
  return svg(uid, ["#f7f1e4", "#e7d3b4"], `
    <rect y="250" width="640" height="170" fill="#efe2cf"/>
    ${groundLine()}
    ${placed.猫 || ""}
    ${placed.箱子 || ""}
    ${placed.球 || ""}
    ${shadow}
    <text x="120" y="360" text-anchor="middle" font-size="16" fill="#5c5348" font-family="Noto Serif SC, serif">猫</text>
    <text x="300" y="378" text-anchor="middle" font-size="16" fill="#5c5348" font-family="Noto Serif SC, serif">箱子</text>
    <text x="470" y="392" text-anchor="middle" font-size="16" fill="#5c5348" font-family="Noto Serif SC, serif">球</text>
  `)
}

function paperScene(spec, uid) {
  const colors = { 红纸: "#c4493a", 蓝纸: "#3d6f9a", 黄纸: "#e2b656", 衬纸: "#f7f1e4" }
  const rects = spec.rects.map((rect) => {
    const x = 70 + rect.x * 4.6
    const y = 46 + rect.y * 3.2
    return `<rect x="${x}" y="${y}" width="${rect.w * 4.6}" height="${rect.h * 3.2}" fill="${colors[rect.label] || "#ddd"}" opacity="${rect.ignore ? 0.45 : 0.82}" stroke="#2a2420" stroke-width="2"/>
      <text x="${x + 8}" y="${y + 22}" font-size="14" fill="${rect.ignore ? "#5c5348" : "#fff"}" font-family="Noto Serif SC, serif">${esc(rect.label)}</text>`
  })
  const [px, py] = spec.point
  return svg(uid, ["#f6f0e4", "#efe2cf"], `
    ${rects.join("")}
    <circle cx="${70 + px * 4.6}" cy="${46 + py * 3.2}" r="7" fill="#1d1916"/>
    <circle cx="${70 + px * 4.6}" cy="${46 + py * 3.2}" r="12" fill="none" stroke="#1d1916" stroke-width="2"/>
  `)
}

function ropeScene(spec, uid) {
  const straight = spec.lines[0]
  const bent = spec.lines[1]
  const mapX = (x) => 80 + x * 22
  const mapY = (y, base) => base - y * 8
  const toPath = (line, base) => line.pts.map((point, index) => `${index ? "L" : "M"} ${mapX(point[0])} ${mapY(point[1], base)}`).join(" ")
  return svg(uid, ["#f7f1e4", "#e7f0e4"], `
    <text x="70" y="78" font-size="18" fill="#5c5348" font-family="Noto Serif SC, serif">${esc(straight.name)}</text>
    <path d="${toPath(straight, 120)}" fill="none" stroke="#c4493a" stroke-width="6" stroke-linecap="round"/>
    <text x="70" y="210" font-size="18" fill="#5c5348" font-family="Noto Serif SC, serif">${esc(bent.name)}</text>
    <path d="${toPath(bent, 300)}" fill="none" stroke="#2c4a6e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  `)
}

function compassScene(uid) {
  return svg(uid, ["#e7f2df", "#d5e4c8"], `
    <rect x="150" y="50" width="340" height="300" rx="8" fill="#f7f1e4" stroke="#2a2420" stroke-width="3"/>
    <text x="320" y="92" text-anchor="middle" font-size="28" fill="#9c3b32" font-family="Noto Serif SC, serif">南</text>
    <path d="M250 210 H430" stroke="#2c4a6e" stroke-width="8" stroke-linecap="round"/>
    <path d="M430 210 L398 192 V228 Z" fill="#2c4a6e"/>
    <text x="320" y="330" text-anchor="middle" font-size="14" fill="#5c5348" font-family="Noto Serif SC, serif">箭头指向画面右边</text>
  `)
}

function quoteScene(text, uid) {
  return svg(uid, ["#f7f1e4", "#efe2cf"], `
    <rect x="78" y="70" width="484" height="260" rx="6" fill="#fffaf3" stroke="#2a2420" stroke-width="2"/>
    <path d="M78 70 H180 L150 96 H78 Z" fill="#9c3b32"/>
    <text x="320" y="210" text-anchor="middle" font-size="32" fill="#1d1916" font-family="Noto Serif SC, serif">${esc(text)}</text>
  `)
}

function codeThumb(uid) {
  return svg(uid, ["#f7f1e4", "#e7dcc8"], `
    <rect x="120" y="54" width="400" height="300" rx="8" fill="#fffaf3" stroke="#2a2420" stroke-width="2"/>
    <path d="M150 110 H470 M150 150 H420 M150 190 H450 M150 230 H360" stroke="#cbbba6" stroke-width="8" stroke-linecap="round"/>
    <rect x="150" y="270" width="90" height="28" rx="4" fill="#2a2420"/>
    <text x="195" y="289" text-anchor="middle" font-size="13" fill="#f7f1e4" font-family="Newsreader, serif">result</text>
  `)
}

function gridThumb(spec, uid) {
  const rows = spec.rows
  const size = 64
  const originX = (640 - rows[0].length * size) / 2
  const originY = (420 - rows.length * size) / 2
  const cells = []
  rows.forEach((row, y) => {
    ;[...row].forEach((cell, x) => {
      const px = originX + x * size
      const py = originY + y * size
      const fill = cell === "#" ? "#2a2420" : cell === "S" ? "#6e8b5a" : cell === "G" ? "#c4493a" : cell === "K" ? "#e2b656" : "#fffaf3"
      cells.push(`<rect x="${px}" y="${py}" width="${size - 6}" height="${size - 6}" rx="6" fill="${fill}" stroke="#d9cbb8"/>`)
      if (cell !== "." && cell !== "#") {
        cells.push(`<text x="${px + (size - 6) / 2}" y="${py + 40}" text-anchor="middle" font-size="22" fill="${cell === "K" ? "#1d1916" : "#fff"}" font-family="Newsreader, serif">${cell}</text>`)
      }
    })
  })
  return svg(uid, ["#f6f0e4", "#efe2cf"], cells.join(""))
}

function chipRow(labels, uid, accent = "#9c3b32") {
  const gap = 140
  const start = 320 - ((labels.length - 1) * gap) / 2
  const chips = labels.map((label, index) => {
    const x = start + index * gap
    return `<g transform="translate(${x} 210)">
      <rect x="-58" y="-36" width="116" height="72" rx="36" fill="#fffaf3" stroke="${accent}" stroke-width="2"/>
      <text text-anchor="middle" y="8" font-size="20" fill="#1d1916" font-family="Noto Serif SC, serif">${esc(label)}</text>
    </g>`
  })
  return svg(uid, ["#f7f1e4", "#efe2cf"], chips.join(""))
}

function creativeScene(scene, uid) {
  const scenes = {
    top: `<g transform="translate(320 230)">
      <ellipse cx="0" cy="40" rx="70" ry="16" fill="rgba(40,30,20,.12)"/>
      <path d="M0 -70 L54 36 H-54 Z" fill="#c4493a"/>
      <circle cy="-8" r="8" fill="#f4d36a"/>
      <rect x="-6" y="36" width="12" height="16" fill="#2a2420"/>
    </g>`,
    window: `<g>
      <rect x="180" y="60" width="280" height="250" fill="#9ec9e6" stroke="#2a2420" stroke-width="8"/>
      <path d="M190 80 H450 M190 140 H450 M190 210 H450" stroke="rgba(255,255,255,.7)" stroke-width="3"/>
      <path d="M250 70 Q270 120 250 180" fill="none" stroke="#d5eef8" stroke-width="4"/>
      <rect x="160" y="300" width="320" height="16" fill="#6b4632"/>
    </g>`,
    table: `<g>
      <rect x="120" y="230" width="400" height="18" rx="4" fill="#6b4632"/>
      <rect x="160" y="248" width="16" height="70" fill="#6b4632"/>
      <rect x="464" y="248" width="16" height="70" fill="#6b4632"/>
      <ellipse cx="300" cy="214" rx="70" ry="18" fill="#f7f1e4" stroke="#2a2420" stroke-width="2"/>
      <circle cx="430" cy="200" r="16" fill="#c4493a"/>
    </g>`,
    stop: `<g>
      <rect x="150" y="80" width="14" height="230" fill="#5c5148"/>
      <rect x="150" y="80" width="220" height="90" rx="4" fill="#f7f1e4" stroke="#2a2420" stroke-width="3"/>
      <text x="260" y="134" text-anchor="middle" font-size="28" fill="#1d1916" font-family="Noto Serif SC, serif">车站</text>
      <path d="M80 250 Q140 180 200 250" fill="none" stroke="#2a2420" stroke-width="3"/>
    </g>`,
    cat: cat(320, 210, 2.2),
    chair: `<g transform="translate(320 250)">
      <rect x="-70" y="-80" width="140" height="16" rx="3" fill="#6b4632"/>
      <rect x="-78" y="-20" width="156" height="16" rx="3" fill="#a86840"/>
      <rect x="-62" y="-4" width="12" height="70" fill="#6b4632"/>
      <rect x="50" y="-4" width="12" height="70" fill="#6b4632"/>
      <path d="M90 -40 H120" stroke="#e2b656" stroke-width="6"/>
    </g>`,
    empty: `<g>
      <rect x="170" y="70" width="300" height="250" fill="none" stroke="#1d1916" stroke-width="18"/>
      <rect x="196" y="96" width="248" height="198" fill="#f7f1e4" stroke="#cbbba6"/>
    </g>`,
    moon: `<g>
      <circle cx="250" cy="150" r="48" fill="#f4d36a"/>
      <circle cx="270" cy="138" r="40" fill="#1d2a44"/>
      <rect x="420" y="250" width="8" height="70" fill="#2a2420"/>
      <circle cx="424" cy="246" r="16" fill="none" stroke="#2a2420" stroke-width="4"/>
    </g>`,
  }
  const wash = scene === "moon" ? ["#1d2a44", "#31486d"] : ["#f7f1e4", "#efe2cf"]
  return svg(uid, wash, scenes[scene] || scenes.empty)
}

function analogyScene(spec, uid) {
  if (spec.kind === "odd") return chipRow(spec.items.map((item) => item.name), uid)
  const table = Object.fromEntries(spec.pairs)
  const cards = spec.show.map((name) => `${name} → ${table[name]}`).concat(`${spec.ask} → ？`)
  return chipRow(cards, uid, "#2c4a6e")
}

export function renderArt(question, mode = "thumb") {
  const uid = `${question.id}${mode === "thumb" ? "t" : "f"}`.replace(/[^a-zA-Z0-9]/g, "")
  const spec = question.spec
  if (mode === "detail" && ["grid", "river", "bridge", "hanoi", "swaps", "tsp", "lights", "click", "code", "arrow"].includes(spec.kind)) {
    return `<div class="play-host" data-kind="${spec.kind}"></div>`
  }
  let picture = ""
  switch (spec.kind) {
    case "marks":
      picture = lanternScene(spec, uid)
      break
    case "front":
      picture = frontScene(spec, uid)
      break
    case "turn":
      picture = svg(uid, ["#f7f1e4", "#f6e2b8"], `<g transform="translate(320 210)">${arrowShape(spec.start)}</g>`)
      break
    case "mirror":
      picture = svg(uid, ["#e7f3f8", "#f7f1e4"], `<g transform="translate(220 210)">${arrowShape(spec.arrow)}</g><rect x="430" y="70" width="16" height="280" rx="3" fill="#d5eef8" stroke="#2a2420"/>`)
      break
    case "lengths":
      picture = ropeScene(spec, uid)
      break
    case "covers":
      picture = paperScene(spec, uid)
      break
    case "facing":
      picture = svg(uid, ["#f7f1e4", "#e7eef6"], personFacing(320, 250))
      break
    case "compass":
      picture = compassScene(uid)
      break
    case "assign":
      picture = svg(uid, ["#f7f1e4", "#e7eef6"], `${car(140, 230, "#c4493a")}${car(320, 230, "#3d6f9a")}${car(500, 230, "#6e8b5a")}`)
      break
    case "perm":
      picture = spec.slots.length > 3
        ? svg(uid, ["#f7f1e4", "#efe2cf"], [120, 230, 340, 450].map((x) => `<g transform="translate(${x} 230)"><rect x="-28" y="-20" width="56" height="16" fill="#6b4632"/><rect x="-24" y="-4" width="8" height="48" fill="#6b4632"/><rect x="16" y="-4" width="8" height="48" fill="#6b4632"/></g>`).join(""))
        : svg(uid, ["#f7f1e4", "#f6e2b8"], `<path d="M80 300 H560" stroke="#c4493a" stroke-width="8"/><circle cx="140" cy="250" r="18" fill="#2c4a6e"/><circle cx="300" cy="230" r="18" fill="#c4493a"/><circle cx="460" cy="250" r="18" fill="#6e8b5a"/>`)
      break
    case "jars":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], `${jar(160, 150, "茶")}${jar(320, 150, "咖啡")}${jar(480, 150, "混合")}`)
      break
    case "hats":
      picture = svg(uid, ["#f7f1e4", "#e7eef6"], `<g transform="translate(220 180)"><ellipse cx="0" cy="20" rx="40" ry="10" fill="#c4493a"/><path d="M-24 20 Q0 -30 24 20 Z" fill="#c4493a"/></g><g transform="translate(400 180)"><ellipse cx="0" cy="20" rx="40" ry="10" fill="#f7f1e4" stroke="#2a2420"/><path d="M-24 20 Q0 -30 24 20 Z" fill="#f7f1e4" stroke="#2a2420"/></g>`)
      break
    case "points":
      picture = svg(uid, ["#243044", "#1d1916"], `<circle cx="320" cy="150" r="36" fill="#f4d36a"/><rect x="120" y="270" width="70" height="36" rx="8" fill="#f7f1e4"/><rect x="285" y="270" width="70" height="36" rx="8" fill="#f7f1e4"/><rect x="450" y="270" width="70" height="36" rx="8" fill="#f7f1e4"/>`)
      break
    case "lights":
      picture = svg(uid, ["#243044", "#1d1916"], [180, 320, 460].map((x, i) => `<g transform="translate(${x} 180)"><circle r="34" fill="${i === 1 ? "#f4d36a" : "#3a342c"}" stroke="#f7f1e4"/><rect x="-8" y="36" width="16" height="24" fill="#6b4632"/></g>`).join(""))
      break
    case "balls":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], `${ball(250, 200, "#c4493a")}${ball(390, 200, "#3d6f9a")}`)
      break
    case "readings":
      picture = quoteScene(spec.quote, uid)
      break
    case "ice":
      picture = svg(uid, ["#e7f3f8", "#f7f1e4"], glass(320, 150, true))
      break
    case "fly":
      picture = svg(uid, ["#d7ebf6", "#f6e2b8"], `${car(150, 250, "#c4493a")}${car(470, 250, "#3d6f9a")}${bird(300, 120)}`)
      break
    case "birthday":
      picture = svg(uid, ["#f7f1e4", "#f3d7c8"], Array.from({ length: 30 }, (_, index) => {
        const col = index % 6
        const row = Math.floor(index / 6)
        return `<circle cx="${150 + col * 68}" cy="${90 + row * 58}" r="16" fill="${index % 2 ? "#c4493a" : "#2c4a6e"}"/>`
      }).join(""))
      break
    case "rope":
      picture = svg(uid, ["#d7ebf6", "#e7f3f8"], `<circle cx="320" cy="210" r="90" fill="#6e8b5a"/><circle cx="320" cy="210" r="118" fill="none" stroke="#c4493a" stroke-width="4" stroke-dasharray="8 6"/>`)
      break
    case "milk":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], `${cup(230, 180, "#6b3a2a")}${cup(400, 180, "#f7f1e4")}<path d="M300 150 C340 120 360 170 400 150" fill="none" stroke="#c9845a" stroke-width="6"/>`)
      break
    case "clock":
    case "angles":
      picture = svg(uid, ["#f7f1e4", "#e7eef6"], clockAt(320, 210, spec.h || 12, spec.m || 0, 1.4))
      break
    case "audit":
      picture = spec.sceneNote?.includes("冰箱") || question.id === "wj-032"
        ? svg(uid, ["#e7f3f8", "#f7f1e4"], `<rect x="250" y="90" width="120" height="200" rx="6" fill="#d5eef8" stroke="#2a2420" stroke-width="3"/><path d="M370 100 H470 L450 270 H370" fill="#f7f1e4" stroke="#2a2420" stroke-width="3"/>`)
        : svg(uid, ["#e7eef6", "#f7f1e4"], `<rect x="250" y="70" width="140" height="180" rx="8" fill="#d9e4ef" stroke="#2a2420" stroke-width="3"/><path d="M320 70 V40 M300 40 H340" stroke="#c4493a" stroke-width="6" stroke-linecap="round"/>`)
      break
    case "code":
    case "template":
      picture = codeThumb(uid)
      break
    case "arrow":
      picture = svg(uid, ["#f7f1e4", "#e7f0e4"], `<path d="M120 300 H260 V180 H400 V120" fill="none" stroke="#c4493a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M400 120 L378 142 M400 120 L422 142" fill="none" stroke="#c4493a" stroke-width="8" stroke-linecap="round"/>`)
      break
    case "stairs":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], `<path d="M120 320 H220 V250 H320 V180 H420 V110 H540" fill="none" stroke="#2a2420" stroke-width="8"/>`)
      break
    case "digits":
    case "pairs":
    case "handshake":
      picture = chipRow(spec.kind === "handshake" ? ["甲", "乙", "丙", "丁", "戊"] : spec.kind === "digits" ? ["1", "2", "3"] : ["1", "…", "9"], uid)
      break
    case "windows":
      picture = svg(uid, ["#d7ebf6", "#f7f1e4"], [80, 180, 280, 380, 480].map((x, index) => `<rect x="${x}" y="110" width="70" height="110" fill="${index % 2 ? "#f4d36a" : "#9ec9e6"}" stroke="#2a2420" stroke-width="3"/>`).join(""))
      break
    case "pie":
      picture = svg(uid, ["#f7f1e4", "#f6e2b8"], `<circle cx="300" cy="210" r="110" fill="#e2b656" stroke="#2a2420" stroke-width="3"/><circle cx="300" cy="210" r="70" fill="#f3d7a0"/><path d="M470 250 L560 220" stroke="#2a2420" stroke-width="6"/><path d="M548 200 L572 214 L548 230 Z" fill="#c4493a"/>`)
      break
    case "area":
      picture = svg(uid, ["#f7f1e4", "#e7f0e4"], `<rect x="170" y="70" width="280" height="280" fill="none" stroke="#2a2420" stroke-width="3"/><path d="M310 70 L450 210 L310 350 L170 210 Z" fill="#c4493a" opacity=".8"/>`)
      break
    case "click":
      picture = svg(uid, ["#f7f1e4", "#e7eef6"], `<circle cx="160" cy="200" r="46" fill="#3d6f9a"/><rect x="250" y="150" width="90" height="90" fill="#3d6f9a"/><circle cx="470" cy="210" r="28" fill="#c4493a"/>`)
      break
    case "ticket":
    case "revision":
    case "table":
    case "note":
    case "address":
    case "menu":
    case "chat":
    case "receipt":
      picture = paperCard(question)
      break
    case "grid":
      picture = gridThumb(spec, uid)
      break
    case "river":
      picture = svg(uid, ["#d7ebf6", "#e7f0e4"], `<rect y="230" width="640" height="40" fill="#7eafc6"/>${cat(120, 150, 1)}${ball(200, 170, "#7eafc6")}<rect x="250" y="150" width="36" height="28" rx="4" fill="#c9845a"/>${personFacing(430, 210)}`)
      break
    case "tea":
      picture = svg(uid, ["#f7f1e4", "#f6e2b8"], `<rect x="150" y="150" width="90" height="70" rx="8" fill="#c4493a"/><path d="M180 140 Q200 100 220 140" fill="none" stroke="#8ec6e6" stroke-width="4"/>${cup(430, 190, "#6e8b5a")}`)
      break
    case "tsp":
      picture = svg(uid, ["#e7f2df", "#f7f1e4"], `<path d="M120 250 L240 120 L420 160 L520 280 Z" fill="none" stroke="#c4493a" stroke-width="4" stroke-dasharray="7 6"/>${["家", "邮局", "书店", "菜场"].map((name, index) => {
        const points = [[120, 250], [240, 120], [420, 160], [520, 280]]
        const [x, y] = points[index]
        return `<circle cx="${x}" cy="${y}" r="8" fill="#2a2420"/><text x="${x}" y="${y - 16}" text-anchor="middle" font-size="16" fill="#1d1916" font-family="Noto Serif SC, serif">${name}</text>`
      }).join("")}`)
      break
    case "swaps":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], [180, 320, 460].map((x, index) => `<g transform="translate(${x} 110)"><rect width="80" height="200" rx="4" fill="${["#c4493a", "#2c4a6e", "#6e8b5a"][index]}"/><text x="40" y="110" text-anchor="middle" font-size="28" fill="#fff" font-family="Noto Serif SC, serif">${"三一二"[index]}</text></g>`).join(""))
      break
    case "bridge":
      picture = svg(uid, ["#d7ebf6", "#e7eef6"], `${bridge(140, 220, 360)}${personFacing(200, 210)}${personFacing(320, 210)}${personFacing(450, 210)}`)
      break
    case "hanoi":
      picture = svg(uid, ["#f7f1e4", "#efe2cf"], `<rect x="80" y="300" width="480" height="12" fill="#6b4632"/>${[160, 320, 480].map((x) => `<rect x="${x}" y="120" width="8" height="180" fill="#6b4632"/>`).join("")}<rect x="110" y="250" width="108" height="16" rx="8" fill="#c4493a"/><rect x="124" y="230" width="80" height="16" rx="8" fill="#e2b656"/><rect x="138" y="210" width="52" height="16" rx="8" fill="#3d6f9a"/>`)
      break
    case "rubric":
      picture = creativeScene(spec.scene, uid)
      break
    case "odd":
    case "map":
      picture = analogyScene(spec, uid)
      break
    default:
      picture = quoteScene(question.title, uid)
  }
  return `<div class="art">${picture}</div>`
}

function paperCard(question) {
  const spec = question.spec
  if (spec.kind === "ticket") {
    return `<div class="paper ticket"><p class="paper-kicker">夜场票</p>${spec.rows.map((row) => `<p><span>${esc(row[0])}</span>${esc(row[1])}</p>`).join("")}</div>`
  }
  if (spec.kind === "revision") {
    return `<div class="paper note"><p class="void">${esc(spec.void)}</p><p class="current">现价 ${esc(spec.current)}</p></div>`
  }
  if (spec.kind === "table") {
    return `<div class="paper"><table><thead><tr>${spec.columns.map((col) => `<th>${esc(col)}</th>`).join("")}</tr></thead><tbody>${spec.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
  }
  if (spec.kind === "note" || spec.kind === "address") {
    return `<div class="paper note"><p>${esc(spec.text)}</p></div>`
  }
  if (spec.kind === "menu") {
    return `<div class="paper menu">${spec.items.map((item) => `<p><span>${esc(item.name)}</span><em>${esc(item.tag)}</em><b>${item.price}</b></p>`).join("")}</div>`
  }
  if (spec.kind === "chat") {
    return `<div class="paper chat">${spec.lines.map((line) => `<p><b>${esc(line.who)}</b>${esc(line.text)}</p>`).join("")}</div>`
  }
  return `<div class="paper receipt"><p><span>小计</span><b>${spec.subtotal}</b></p><p><span>折扣</span><b>${spec.discount}</b></p><p><span>应付</span><b>？</b></p></div>`
}
