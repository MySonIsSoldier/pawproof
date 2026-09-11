"""Regenerate the self-contained offline font. Optional asset tool, not a build dependency.

Requires fonttools[woff]==4.63.0. Source license: src/assets/fonts/OFL.txt.
"""
import base64
import io
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
source = (root / "src/infrastructure/pwa/offline-document.ts").read_text()
font = TTFont(root / "src/assets/fonts/PretendardVariable.woff2")
characters = sorted(set(source) & set(map(chr, font.getBestCmap())))
options = subset.Options()
options.flavor = "woff2"
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
subsetter = subset.Subsetter(options=options)
subsetter.populate(text="".join(characters))
subsetter.subset(font)
# The source reserves its family name; the modified subset gets its own name.
# Copyright and license records remain intact.
for record in font["name"].names:
    if record.nameID in {1, 3, 4, 6, 16, 25}:
        record.string = record.toUnicode().replace("Pretendard", "PawProofOffline")
buffer = io.BytesIO()
font.save(buffer)
output = root / "src/assets/fonts/offline-font.json"
output.write_text(json.dumps({
    "generatedBy": "scripts/generate-offline-font.py",
    "license": "OFL.txt",
    "characters": "".join(characters),
    "base64": base64.b64encode(buffer.getvalue()).decode("ascii"),
}, ensure_ascii=False, indent=2) + "\n")
print(f"Generated offline font: {len(buffer.getvalue())} bytes")
