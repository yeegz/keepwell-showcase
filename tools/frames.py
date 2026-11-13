"""Writes a contact strip of frames from a GIF, to check a tour by eye. Usage: python3 -I tools/frames.py in.gif out.png t1 t2 ..."""
import subprocess, sys, tempfile, pathlib
from PIL import Image
gif, out, *times = sys.argv[1:]
tmp = pathlib.Path(tempfile.mkdtemp())
ims = []
for t in times:
    f = tmp / f"{t}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", gif, "-frames:v", "1", str(f)], check=True)
    ims.append(Image.open(f).convert("RGB"))
w, h = ims[0].size
sheet = Image.new("RGB", (w, h * len(ims)))
for i, im in enumerate(ims):
    sheet.paste(im, (0, i * h))
sheet.save(out)
