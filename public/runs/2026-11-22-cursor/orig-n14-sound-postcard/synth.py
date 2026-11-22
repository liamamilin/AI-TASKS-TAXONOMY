#!/usr/bin/env python3
"""合成 8 秒单声道明信片。只用标准库，种子固定，两次运行字节相同。"""

import json
import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SR = 22050
SECONDS = 8
FRAMES = SR * SECONDS
PEAK = 0.75

def silence():
    return [0.0] * FRAMES

def add_span(samples, start, duration, signal, rng):
    begin = int(round(start * SR))
    end = int(round((start + duration) * SR))
    fade = int(round(0.01 * SR))
    for index in range(begin, end):
        local = index - begin
        edge = min(local, end - index - 1, fade)
        envelope = 1.0 if fade == 0 else max(0.0, edge / fade)
        samples[index] += signal(local / SR, rng) * envelope

def bell(frequency):
    def signal(time, _rng):
        return 0.42 * math.sin(2 * math.pi * frequency * time) * math.exp(-3.4 * time)
    return signal

def step(_time_unused=None):
    def signal(time, rng):
        thump = math.sin(2 * math.pi * 95 * time) * math.exp(-16 * time)
        noise = (rng.random() * 2 - 1) * math.exp(-10 * time)
        return 0.5 * thump + 0.08 * noise
    return signal

def paper(time, rng):
    return 0.18 * (rng.random() * 2 - 1)

def render():
    rng = random.Random(42)
    samples = silence()
    add_span(samples, 0.50, 0.38, bell(880), rng)
    add_span(samples, 0.92, 0.38, bell(1175), rng)
    for start in (2.0, 2.5, 3.0, 3.5):
        add_span(samples, start, 0.20, step(), rng)
    add_span(samples, 5.0, 2.0, paper, rng)
    peak = max(abs(sample) for sample in samples) or 1
    if peak > PEAK:
        scale = PEAK / peak
        samples = [sample * scale for sample in samples]
    pcm = []
    for sample in samples:
        value = int(round(sample * 32767))
        value = max(-32768, min(32767, value))
        pcm.append(value)
    return pcm

def write_wav(pcm, path):
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(b"".join(struct.pack("<h", value) for value in pcm))

def main():
    pcm = render()
    write_wav(pcm, ROOT / "postcard.wav")
    cues = {
        "sample_rate": SR,
        "frames": len(pcm),
        "peak": max(abs(value) for value in pcm),
        "cues": [
            {"id": "bell", "start": 0.5, "end": 1.3, "description": "两声轻门铃"},
            {"id": "steps", "start": 2.0, "end": 4.0, "description": "四步脚步，起点2.0/2.5/3.0/3.5秒，每步0.2秒"},
            {"id": "paper", "start": 5.0, "end": 7.0, "description": "拆开纸信的沙沙声"}
        ]
    }
    (ROOT / "cue-sheet.json").write_text(json.dumps(cues, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"frames {len(pcm)} peak {cues['peak']}")

if __name__ == "__main__":
    main()
