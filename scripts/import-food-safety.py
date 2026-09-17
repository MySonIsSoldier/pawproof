#!/usr/bin/env python3
"""Build the reviewed Food Safety Korea venue snapshot used by PawProof.

The upstream XLSX is an official attachment. This script keeps only normalized
venue fields and Kakao address coordinates; it does not commit the XLSX/PDF.
"""

import argparse
import json
import os
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_xlsx(path: Path):
    with ZipFile(path) as archive:
        strings_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        strings = [
            "".join(text.text or "" for text in item.findall(".//a:t", NS))
            for item in strings_root.findall("a:si", NS)
        ]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.findall(".//a:sheetData/a:row", NS):
        values = []
        for cell in row.findall("a:c", NS):
            value = cell.find("a:v", NS)
            if value is None:
                values.append("")
            elif cell.get("t") == "s":
                values.append(strings[int(value.text)])
            else:
                values.append(value.text or "")
        rows.append(values)
    header = rows[0]
    return [dict(zip(header, row)) for row in rows[1:]]


def geocode(item, key):
    def request(endpoint, params):
        url = endpoint + "?" + urllib.parse.urlencode(params)
        request = urllib.request.Request(
            url, headers={"Authorization": f"KakaoAK {key}"}
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response).get("documents") or []

    documents = request(
        "https://dapi.kakao.com/v2/local/search/address.json",
        {"query": item["업소주소"], "analyze_type": "similar"},
    )
    if not documents:
        documents = request(
            "https://dapi.kakao.com/v2/local/search/keyword.json",
            {"query": f'{item["업소명"]} {item["업소주소"]}'},
        )
    if not documents:
        raise RuntimeError(f'주소 좌표를 찾지 못했습니다: {item["업소주소"]}')
    document = documents[0]
    return {
        **item,
        "lat": float(document["y"]),
        "lng": float(document["x"]),
        "geocodeAddress": document.get("road_address_name")
        or document.get("address_name", ""),
        "geocodeStatus": "matched",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--published-at", required=True)
    parser.add_argument("--accessed-at", required=True)
    args = parser.parse_args()
    key = os.environ.get("KAKAO_MOBILITY_REST_KEY", "").strip()
    if not key:
        raise SystemExit("KAKAO_MOBILITY_REST_KEY가 필요합니다.")

    rows = read_xlsx(args.xlsx)
    records = [None] * len(rows)
    with ThreadPoolExecutor(max_workers=8) as executor:
        jobs = {executor.submit(geocode, row, key): index for index, row in enumerate(rows)}
        for job in as_completed(jobs):
            records[jobs[job]] = job.result()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(
            {
                "sourceUrl": "https://www.foodsafetykorea.go.kr/portal/petKorea.do",
                "noticeUrl": "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs078&menu_grp=MENU_NEW05&menu_no=2852&ntctxt_no=45138",
                "downloadUrl": "https://www.mfds.go.kr/brd/m_74/down.do?brd_id=ntc0003&data_tp=A&file_seq=1&seq=45138",
                "publishedAt": args.published_at,
                "accessedAt": args.accessed_at,
                "recordCount": len(records),
                "records": records,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"{len(records)}개 업소를 {args.output}에 저장했습니다.")


if __name__ == "__main__":
    main()
