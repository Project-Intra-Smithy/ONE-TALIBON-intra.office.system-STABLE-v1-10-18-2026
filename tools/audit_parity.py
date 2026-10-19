#!/usr/bin/env python3
"""Create an exact tracked-file parity inventory for two Git worktrees."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import subprocess
from pathlib import Path


def tracked(root: Path) -> dict[str, str]:
    raw = subprocess.check_output(
        ["git", "-C", str(root), "ls-files", "-z"], stderr=subprocess.STDOUT
    )
    result: dict[str, str] = {}
    for encoded in raw.split(b"\0"):
        if not encoded:
            continue
        rel = encoded.decode("utf-8", errors="surrogateescape")
        path = root / rel
        if path.is_file():
            result[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("backend", type=Path)
    parser.add_argument("frontend", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    backend = tracked(args.backend.resolve())
    frontend = tracked(args.frontend.resolve())
    rows = []
    for path in sorted(set(backend) | set(frontend)):
        if path not in backend:
            disposition = "FRONTEND_ONLY"
        elif path not in frontend:
            disposition = "BACKEND_ONLY"
        elif backend[path] == frontend[path]:
            disposition = "IDENTICAL"
        else:
            disposition = "DIFFERENT"
        rows.append(
            {
                "path": path,
                "disposition": disposition,
                "backend_sha256": backend.get(path),
                "frontend_sha256": frontend.get(path),
            }
        )

    counts: dict[str, int] = {}
    for row in rows:
        counts[row["disposition"]] = counts.get(row["disposition"], 0) + 1

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "file-parity.json").write_text(
        json.dumps({"counts": counts, "files": rows}, indent=2) + "\n",
        encoding="utf-8",
    )
    with (args.output / "file-parity.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps(counts, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
