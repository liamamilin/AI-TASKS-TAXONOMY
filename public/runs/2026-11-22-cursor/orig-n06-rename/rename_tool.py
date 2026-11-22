#!/usr/bin/env python3
"""只改本目录 sandbox/ 里的合成文本。不读取、不扫描目录外的照片。"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SANDBOX = ROOT / "sandbox"
INPUT_PATH = ROOT / "input" / "input.json"
PLAN_FILES = {
    "conflict": ROOT / "plan.json",
    "fixes": ROOT / "plan-fixes.json",
    "custom": ROOT / "plan-custom.json",
}
LOG_PATH = ROOT / "log.json"


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def fail(message, code=2):
    print(message, file=sys.stderr)
    raise SystemExit(code)


def load_input():
    return json.loads(INPUT_PATH.read_text(encoding="utf-8"))


def append_log(step):
    log = {"steps": []}
    if LOG_PATH.exists():
        log = json.loads(LOG_PATH.read_text(encoding="utf-8"))
    log["steps"].append(step)
    LOG_PATH.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def inside_sandbox(path):
    try:
        path.resolve().relative_to(SANDBOX.resolve())
    except ValueError:
        return False
    return path.resolve() != SANDBOX.resolve()


def snapshot():
    files = []
    if not SANDBOX.exists():
        return files
    for path in sorted(SANDBOX.iterdir()):
        if not path.is_file() or path.is_symlink():
            continue
        if path.name.startswith("."):
            continue
        data = path.read_bytes()
        files.append({"name": path.name, "sha256": sha256_bytes(data), "text": data.decode("utf-8")})
    return files


def assert_plain_file(path):
    if path.is_symlink():
        fail("拒绝符号链接")
    if path.exists() and not inside_sandbox(path):
        fail("路径越出 sandbox")


def safe_leaf(name):
    if not isinstance(name, str) or name == "":
        return "来源名为空"
    if name != Path(name).name or "/" in name or "\\" in name or ".." in name:
        return "拒绝目录外或带路径的来源"
    return None


def valid_date(text):
    if not isinstance(text, str) or len(text) != 10 or text[4] != "-" or text[7] != "-":
        return False
    year_text, month_text, day_text = text.split("-")
    if not (year_text.isdigit() and month_text.isdigit() and day_text.isdigit()):
        return False
    year, month, day = int(year_text), int(month_text), int(day_text)
    if month < 1 or month > 12 or day < 1:
        return False
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    month_days = [0, 31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return day <= month_days[month]


def map_slug(slug):
    if not isinstance(slug, str) or slug.strip() == "":
        return None, "slug 为空"
    if "/" in slug or "\\" in slug or ".." in slug:
        return None, "slug 含路径"
    mapped = slug.replace(" ", "_")
    if mapped in {".", ".."} or mapped.startswith("."):
        return None, "slug 非法"
    return mapped, None


def target_name(date, slug):
    mapped, error = map_slug(slug)
    if error:
        return None, error
    if not valid_date(date):
        return None, "日期无效，不从今天补齐"
    return f"{date}_{mapped}.jpg", None


def build_plan(entries):
    issues = []
    proposed = []
    targets = {}
    for index, entry in enumerate(entries):
        source = entry.get("from")
        path_error = safe_leaf(source) if isinstance(source, str) else "来源名非法"
        if path_error:
            issues.append({"index": index, "from": source, "kind": "path", "message": path_error})
            continue
        target, error = target_name(entry.get("date"), entry.get("slug"))
        if error:
            kind = "date" if "日期" in error else "slug"
            issues.append({
                "index": index,
                "from": source,
                "kind": kind,
                "message": error,
                "date": entry.get("date"),
            })
            continue
        proposed.append({
            "from": source,
            "to": target,
            "date": entry.get("date"),
            "slug": entry.get("slug"),
        })
        targets.setdefault(target, []).append(source)
    for target, sources in targets.items():
        if len(sources) > 1:
            issues.append({
                "kind": "duplicate-target",
                "target": target,
                "sources": sources,
                "message": "两个来源指向同一目标",
            })
        destination = SANDBOX / target
        if destination.exists():
            same_file = len(sources) == 1 and sources[0] == target
            if not same_file:
                issues.append({
                    "kind": "occupied",
                    "target": target,
                    "sources": sources,
                    "message": "目标已被另一文件占用",
                })
        for source in sources:
            source_path = SANDBOX / source
            if not source_path.exists():
                issues.append({"kind": "missing-source", "from": source, "message": "来源不在 sandbox"})
    return {
        "ok": not issues,
        "issues": issues,
        "moves": proposed if not issues else [],
        "proposed": proposed,
        "blocked": bool(issues),
    }


def command_init():
    data = load_input()
    SANDBOX.mkdir(exist_ok=True)
    for child in list(SANDBOX.iterdir()):
        if child.is_symlink() or child.is_file():
            child.unlink()
        else:
            fail("sandbox 里有子目录，停止")
    for name, text in data["files"].items():
        error = safe_leaf(name)
        if error:
            fail(error)
        path = SANDBOX / name
        if not inside_sandbox(path) and path.parent.resolve() != SANDBOX.resolve():
            fail("拒绝把初始文件写到 sandbox 外")
        path.write_text(text, encoding="utf-8")
    append_log({"op": "init", "ok": True, "snapshot": snapshot()})
    print("init ok")


def command_plan(which, entries):
    if which == "custom":
        chosen = entries
    else:
        data = load_input()
        chosen = data["manifest"] if which == "conflict" else data["fixes"]
    plan = build_plan(chosen)
    plan["set"] = which
    destination = PLAN_FILES[which]
    destination.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    append_log({
        "op": "plan",
        "set": which,
        "ok": plan["ok"],
        "issues": plan["issues"],
        "proposed": plan["proposed"],
        "snapshot": snapshot(),
    })
    print(json.dumps({"ok": plan["ok"], "issues": plan["issues"], "proposed": plan["proposed"]}, ensure_ascii=False))
    return 0 if plan["ok"] else 2


def command_apply(which, undo_path):
    plan_path = PLAN_FILES[which]
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    before = snapshot()
    if not plan.get("ok"):
        append_log({"op": "apply", "set": which, "ok": False, "reason": "计划未通过，未改任何文件", "snapshot": snapshot()})
        print("apply blocked")
        return 3
    fresh = build_plan([
        {"from": move["from"], "date": move["date"], "slug": move["slug"]}
        for move in plan["moves"]
    ])
    if not fresh["ok"]:
        append_log({"op": "apply", "set": which, "ok": False, "reason": "执行前复查失败", "issues": fresh["issues"], "snapshot": snapshot()})
        print("apply recheck blocked")
        return 3
    staged = []
    try:
        for index, move in enumerate(plan["moves"]):
            source = SANDBOX / move["from"]
            target = SANDBOX / move["to"]
            assert_plain_file(source)
            if not inside_sandbox(source) or not inside_sandbox(target):
                raise RuntimeError("路径越出 sandbox")
            if target.exists():
                raise RuntimeError("目标在提交时已存在")
            temporary = SANDBOX / f".tmp-rename-{index}"
            os.replace(source, temporary)
            staged.append((temporary, target, move))
        for temporary, target, move in staged:
            os.replace(temporary, target)
    except Exception as error:
        for temporary, target, move in staged:
            source = SANDBOX / move["from"]
            if target.exists() and not source.exists():
                os.replace(target, source)
            elif temporary.exists() and not source.exists():
                os.replace(temporary, source)
        append_log({"op": "apply", "set": which, "ok": False, "reason": str(error), "snapshot": snapshot()})
        print("apply rolled back")
        return 4
    applied = []
    for move in plan["moves"]:
        data = (SANDBOX / move["to"]).read_bytes()
        applied.append({**move, "sha256": sha256_bytes(data)})
    undo = {"applied": applied, "reverse": [{"from": item["to"], "to": item["from"], "sha256": item["sha256"]} for item in applied]}
    Path(undo_path).write_text(json.dumps(undo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    append_log({"op": "apply", "set": which, "ok": True, "moves": applied, "before": before, "snapshot": snapshot()})
    print("apply ok")
    return 0


def command_undo(undo_path):
    path = Path(undo_path)
    if not path.exists():
        print("no undo record")
        return 5
    undo = json.loads(path.read_text(encoding="utf-8"))
    for move in undo["reverse"]:
        source = SANDBOX / move["from"]
        target = SANDBOX / move["to"]
        if not source.exists() or source.is_symlink() or not inside_sandbox(source):
            append_log({"op": "undo", "ok": False, "reason": f"缺少 {move['from']}", "snapshot": snapshot()})
            print("undo missing")
            return 6
        if target.exists():
            append_log({"op": "undo", "ok": False, "reason": f"原路径已被占用 {move['to']}，不覆盖", "snapshot": snapshot()})
            print("undo occupied")
            return 6
        digest = sha256_bytes(source.read_bytes())
        if digest != move["sha256"]:
            append_log({"op": "undo", "ok": False, "reason": "字节与记录不符，停止撤销", "snapshot": snapshot()})
            print("undo hash mismatch")
            return 6
    for move in undo["reverse"]:
        os.replace(SANDBOX / move["from"], SANDBOX / move["to"])
    append_log({"op": "undo", "ok": True, "restored": undo["reverse"], "snapshot": snapshot()})
    print("undo ok")
    return 0


def write_page():
    exhibit = {
        "plan": json.loads((ROOT / "plan.json").read_text(encoding="utf-8")),
        "undo": json.loads((ROOT / "undo.json").read_text(encoding="utf-8")),
        "log": json.loads(LOG_PATH.read_text(encoding="utf-8")),
        "finalSnapshot": snapshot(),
    }
    payload = json.dumps(exhibit, ensure_ascii=False)
    html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>照片改名先后悔药</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f6f1e7; color: #1c1915; font-family: Georgia, "Songti SC", "Noto Serif CJK SC", serif; }
  main { width: min(48rem, calc(100% - 1.5rem)); margin: 0 auto; padding: 1rem 0 2rem; }
  h1 { font-size: 1.6rem; line-height: 1.3; }
  .banner { background: #efe2c9; padding: 0.6rem 0.75rem; }
  .quiet { color: #5e564c; }
  article { background: #fffdf8; border: 1px solid #d9cbb6; padding: 0.7rem; margin: 0.6rem 0; }
  .bad { color: #9c3b32; }
  code, pre { font-family: ui-monospace, monospace; word-break: break-all; white-space: pre-wrap; }
  ul { padding-left: 1.1rem; }
</style>
</head>
<body>
<main>
  <p class="quiet">问笺馆原创。受公开方法资料启发，不是那些网站的官方题目，也不代表对方背书。</p>
  <h1>照片改名先后悔药</h1>
  <p class="banner">这页只读。sandbox 里是合成文本，扩展名虽然写成 jpg，内容不是照片。工具只碰本任务目录里的 sandbox，没有去读别的文件。</p>
  <p id="final"></p>
  <h2>冲突计划</h2>
  <ul id="issues"></ul>
  <h2>操作记录</h2>
  <div id="steps"></div>
</main>
<script type="application/json" id="exhibit">__PAYLOAD__</script>
<script>
const exhibit = JSON.parse(document.getElementById("exhibit").textContent)
const finalNames = exhibit.finalSnapshot.map((file) => file.name).join("、")
document.getElementById("final").textContent = "最终 sandbox 已回到这些文件：" + finalNames
document.getElementById("issues").innerHTML = exhibit.plan.issues.map((issue) => `<li data-kind="${issue.kind}">${issue.message}${issue.target ? "：" + issue.target : ""}</li>`).join("")
document.getElementById("steps").innerHTML = exhibit.log.steps.map((step) => {
  const files = (step.snapshot || []).map((file) => `<li><code>${file.name}</code> <code>${file.sha256}</code></li>`).join("")
  const moves = (step.moves || []).map((move) => `<li>${move.from} → ${move.to}</li>`).join("")
  const reason = step.reason ? `<p class="bad">${step.reason}</p>` : ""
  return `<article data-op="${step.op}" data-ok="${step.ok !== false}"><h3>${step.op}${step.set ? " · " + step.set : ""} · ${step.ok === false ? "未改成" : "已记录"}</h3>${reason}${moves ? `<ul>${moves}</ul>` : ""}<ul>${files}</ul></article>`
}).join("")
</script>
</body>
</html>
"""
    (ROOT / "index.html").write_text(html.replace("__PAYLOAD__", payload), encoding="utf-8")
    print("page ok")


def main():
    parser = argparse.ArgumentParser(description="sandbox 内的可撤销改名")
    parser.add_argument("command", choices=["init", "plan", "apply", "undo", "page"])
    parser.add_argument("--set", dest="which", choices=["conflict", "fixes", "custom"], default="conflict")
    parser.add_argument("--entry", nargs=3, action="append", default=[], metavar=("FROM", "DATE", "SLUG"))
    parser.add_argument("--undo-file", default=str(ROOT / "undo.json"))
    args = parser.parse_args()
    if args.command == "init":
        command_init()
        return
    if args.command == "plan":
        entries = [{"from": item[0], "date": item[1], "slug": item[2]} for item in args.entry]
        code = command_plan(args.which, entries)
        raise SystemExit(code)
    if args.command == "apply":
        raise SystemExit(command_apply(args.which, args.undo_file))
    if args.command == "undo":
        raise SystemExit(command_undo(args.undo_file))
    if args.command == "page":
        write_page()


if __name__ == "__main__":
    main()
