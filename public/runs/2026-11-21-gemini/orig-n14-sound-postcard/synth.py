#!/usr/bin/env python3
import hashlib, json, math, random, struct, wave
from pathlib import Path

BASE = Path(__file__).resolve().parent
SR = 22050
DUR = 8
N = SR * DUR
MAX_AMP = 24000  # strictly <= 0.8 * 32767 = 26213.6

def synthesize():
    rng = random.Random(42)
    samples = [0.0] * N

    def env(i, length, fade_s=0.015):
        f = max(1, int(SR * fade_s))
        if i < f: return i / f
        if i > length - f: return max(0.0, (length - i) / f)
        return 1.0

    # 1. Bell: 0.5 - 1.3s (two gentle chimes)
    for start_s, freq in [(0.5, 880.0), (0.9, 660.0)]:
        s0, length = int(start_s * SR), int(0.4 * SR)
        for i in range(length):
            t = i / SR
            val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 6.5) * env(i, length)
            samples[s0 + i] += val * 0.55

    # 2. Four footsteps: 2.0, 2.5, 3.0, 3.5s (0.2s each)
    for st in [2.0, 2.5, 3.0, 3.5]:
        s0, length = int(st * SR), int(0.2 * SR)
        for i in range(length):
            t = i / SR
            thump = math.sin(2 * math.pi * (110.0 - 40.0 * t) * t) * math.exp(-t * 18.0)
            grit = (rng.random() * 2 - 1) * 0.15 * math.exp(-t * 22.0)
            samples[s0 + i] += (thump * 0.65 + grit) * env(i, length, 0.012)

    # 3. Opening paper envelope: 5.0 - 7.0s
    s0, length = int(5.0 * SR), int(2.0 * SR)
    prev = 0.0
    for i in range(length):
        t = i / SR
        white = rng.random() * 2 - 1
        hp = white - 0.85 * prev
        prev = white
        mod = 0.45 + 0.55 * abs(math.sin(2 * math.pi * 1.8 * t))
        samples[s0 + i] += hp * 0.24 * mod * env(i, length, 0.03)

    pcm = [max(-MAX_AMP, min(MAX_AMP, int(round(x * MAX_AMP)))) for x in samples]
    return pcm

def write_wav(path: Path, pcm):
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(struct.pack(f"<{len(pcm)}h", *pcm))

if __name__ == "__main__":
    p1 = synthesize()
    p2 = synthesize()
    assert p1 == p2 and len(p1) == 176400
    peak = max(abs(x) for x in p1)
    assert peak <= 26214
    out = BASE / "postcard.wav"
    write_wav(out, p1)
    cues = {
      "sample_rate": SR, "duration_seconds": DUR, "frames": len(p1), "seed": 42, "peak": peak,
      "cues": [
        {"id": "bell", "start": 0.5, "end": 1.3, "description": "两声轻门铃"},
        {"id": "steps", "start": 2.0, "end": 4.0, "description": "四步脚步，起点2.0/2.5/3.0/3.5秒，每步0.2秒"},
        {"id": "paper", "start": 5.0, "end": 7.0, "description": "拆开纸信的沙沙声"}
      ]
    }
    (BASE / "cue-sheet.json").write_text(json.dumps(cues, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WAV SYNTH VERIFIED OK, peak=", peak, "sha=", hashlib.sha256(out.read_bytes()).hexdigest()[:12])
