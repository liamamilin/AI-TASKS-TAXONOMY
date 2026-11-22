#!/usr/bin/env python3
import hashlib, json, os, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
SANDBOX = (BASE / "sandbox").resolve()

def safe_path(name: str) -> Path:
    if ".." in Path(name).parts or Path(name).is_absolute():
        raise ValueError(f"Rejected out-of-sandbox path: {name}")
    p = (SANDBOX / name).resolve()
    if SANDBOX not in p.parents:
        raise ValueError(f"Rejected out-of-sandbox path: {name}")
    return p

def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def make_plan(manifest):
    ops, conflicts, seen_targets = [], [], {}
    for row in manifest:
        src = safe_path(row["from"])
        if not row.get("date") or len(row["date"]) != 10:
            raise ValueError("Missing explicit YYYY-MM-DD date")
        dst_name = f"{row['date']}_{row['slug']}.jpg"
        dst = safe_path(dst_name)
        if dst_name in seen_targets:
            conflicts.append(f"Duplicate target {dst_name} from {seen_targets[dst_name]} and {row['from']}")
        seen_targets[dst_name] = row["from"]
        if dst.exists():
            conflicts.append(f"Target already exists: {dst_name}")
        ops.append({"from": row["from"], "to": dst_name, "sha256": sha256_file(src) if src.exists() else None})
    return {"ops": ops, "conflicts": conflicts, "canApply": len(conflicts) == 0}

def apply_plan(plan):
    if not plan["canApply"]:
        return False, "Blocked due to conflicts"
    undo = []
    for op in plan["ops"]:
        s, d = safe_path(op["from"]), safe_path(op["to"])
        s.rename(d)
        undo.append({"from": op["to"], "to": op["from"], "sha256": sha256_file(d)})
    return True, undo

def run_undo(undo):
    for op in reversed(undo):
        safe_path(op["from"]).rename(safe_path(op["to"]))

if __name__ == "__main__":
    SANDBOX.mkdir(exist_ok=True)
    init_files = {"IMG_01.jpg": "SYNTHETIC_RED", "IMG_02.jpg": "SYNTHETIC_BLUE", "2026-04-01_cloud.jpg": "SYNTHETIC_EXISTING"}
    for f in SANDBOX.iterdir(): f.unlink()
    for k, v in init_files.items(): (SANDBOX / k).write_text(v, encoding="utf-8")
    before_hashes = {k: sha256_file(SANDBOX / k) for k in init_files}

    log = []
    bad_manifest = [{"from": "IMG_01.jpg", "date": "2026-04-01", "slug": "cloud"}, {"from": "IMG_02.jpg", "date": "2026-04-01", "slug": "cloud"}]
    plan1 = make_plan(bad_manifest)
    ok1, res1 = apply_plan(plan1)
    log.append({"step": "conflict_plan", "applied": ok1, "conflicts": plan1["conflicts"]})
    assert not ok1 and {k: sha256_file(SANDBOX / k) for k in init_files} == before_hashes

    fixes = [{"from": "IMG_01.jpg", "date": "2026-04-01", "slug": "red"}, {"from": "IMG_02.jpg", "date": "2026-04-01", "slug": "blue"}]
    plan2 = make_plan(fixes)
    ok2, undo = apply_plan(plan2)
    assert ok2 and sha256_file(SANDBOX / "2026-04-01_cloud.jpg") == before_hashes["2026-04-01_cloud.jpg"]
    log.append({"step": "apply_fixes", "applied": ok2, "ops": plan2["ops"]})

    run_undo(undo)
    after_hashes = {k: sha256_file(SANDBOX / k) for k in init_files}
    assert after_hashes == before_hashes
    log.append({"step": "undo", "restored": True, "hashesMatch": True})

    try:
        make_plan([{"from": "../outside.jpg", "date": "2026-04-01", "slug": "escape"}])
        raise AssertionError("Should have rejected traversal")
    except ValueError as e:
        log.append({"step": "traversal_guard", "rejected": True, "error": str(e)})

    (BASE / "plan.json").write_text(json.dumps({"conflictPlan": plan1, "fixedPlan": plan2}, ensure_ascii=False, indent=2), encoding="utf-8")
    (BASE / "undo.json").write_text(json.dumps(undo, ensure_ascii=False, indent=2), encoding="utf-8")
    (BASE / "log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    print("RENAME CLI VERIFIED OK")
