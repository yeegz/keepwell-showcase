"""Cuts, speeds and frames the recorded tours into GIFs with one shared frame.

Every GIF is 1176 x 752 on the light canvas colour, content 704 px tall at the same scale:
a desk view at 1440 x 900 fills the frame; a split puts the phone (390 x 844) beside a desk view
(994 x 900), so desk text is the same size in every GIF.
Usage: python3 -I tools/compose_gifs.py [name ...]
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
VIDEO = HERE / "out" / "video"
DEST = HERE.parent / "assets" / "gifs"
W, H, TOP, CH = 1176, 752, 24, 704
CANVAS = "0xF2F0EA"
EDGE = "0xD6D3CB"
MAX_SECONDS = 6.0
HOLD = 0.7
FPS = 12


def layout(kind):
    if kind == "desk":
        w = round(1440 * CH / 900)
        return {"desk": ((W - w) // 2, w)}
    phone_w = round(390 * CH / 844)
    desk_w = round(994 * CH / 900)
    x0 = (W - (phone_w + 24 + desk_w)) // 2
    return {"phone": (x0, phone_w), "desk": (x0 + phone_w + 24, desk_w)}


def build(spec_path):
    spec = json.loads(spec_path.read_text())
    segs = spec["segments"]
    real = sum(b - a for a, b in segs) / 1000
    speed = max(1.0, real / (MAX_SECONDS - HOLD - 0.1))
    out_len = real / speed + HOLD
    boxes = layout(spec["layout"])
    inputs, chains, over = [], [], []
    base = f"color=c={CANVAS}:s={W}x{H}:r={FPS}:d={out_len:.3f}"
    for (x, w) in boxes.values():
        base += f",drawbox=x={x - 1}:y={TOP - 1}:w={w + 2}:h={CH + 2}:color={EDGE}:t=1"
    chains.append(base + "[bg]")
    for i, panel in enumerate(spec["panels"]):
        inputs += ["-i", str(HERE / panel["file"])]
        parts = []
        for j, (a, b) in enumerate(segs):
            s, e = (a - panel["epoch"]) / 1000, (b - panel["epoch"]) / 1000
            parts.append(f"[{i}:v]trim=start={s:.3f}:end={e:.3f},setpts=(PTS-STARTPTS)/{speed:.4f}[p{i}s{j}]")
        chains += parts
        x, w = boxes[panel["role"]]
        chains.append("".join(f"[p{i}s{j}]" for j in range(len(segs))) +
                      f"concat=n={len(segs)}:v=1:a=0,fps={FPS},scale={w}:{CH}:flags=lanczos,"
                      f"tpad=stop_mode=clone:stop_duration={HOLD}[v{i}]")
        over.append((i, x))
    last = "bg"
    for k, (i, x) in enumerate(over):
        tag = f"o{k}"
        chains.append(f"[{last}][v{i}]overlay=x={x}:y={TOP}:shortest=0:eof_action=repeat[{tag}]")
        last = tag
    chains.append(f"[{last}]trim=duration={out_len:.3f},split[a][b]")
    chains.append("[a]palettegen=max_colors=96:stats_mode=diff:reserve_transparent=0[pal]")
    chains.append("[b][pal]paletteuse=dither=none:diff_mode=rectangle")
    DEST.mkdir(parents=True, exist_ok=True)
    out = DEST / f"{spec['name']}.gif"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(chains), "-loop", "0", str(out)]
    subprocess.run(cmd, check=True)
    print(f"{out.name}: {out_len:.1f} s, speed x{speed:.2f}, {out.stat().st_size / 1e6:.2f} MB")


names = sys.argv[1:] or [p.stem for p in sorted(VIDEO.glob("*.json"))]
for n in names:
    build(VIDEO / f"{n}.json")
