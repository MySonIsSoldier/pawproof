"""Recheck the public municipal CSV against the reviewed snapshot; never auto-publish changes."""
import collections
import csv
import hashlib
import io
import json
import pathlib
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
snapshot = json.loads((root / 'data/incheon/municipal-20260119.json').read_text())
with urllib.request.urlopen(snapshot['downloadUrl'], timeout=30) as response:
    content = response.read()
try:
    text = content.decode('utf-8-sig')
except UnicodeDecodeError:
    text = content.decode('cp949')
rows = list(csv.DictReader(io.StringIO(text)))
if not rows or not {'상호', '주소', '입장 가능 반려동물 제한사항'} <= rows[0].keys():
    raise ValueError('Unexpected municipal CSV schema')
changes = [record['rowNumber'] for record in snapshot['records']
           if record['rowNumber'] > len(rows) or rows[record['rowNumber'] - 1] != record['fields']]
report = {
    'sha256': hashlib.sha256(content).hexdigest(), 'rows': len(rows),
    'categories': dict(collections.Counter(row['구분'] for row in rows)),
    'filled': {key: sum(bool(row[key].strip()) for row in rows) for key in rows[0]},
    'reviewedLinks': len(snapshot['records']), 'changedReviewedRows': changes,
}
directory = root / '.cache/incheon'
directory.mkdir(parents=True, exist_ok=True)
(directory / 'municipal-source-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False))
if changes:
    raise SystemExit('Source changed: review name, address and policy before updating the bundled data.')
