#!/usr/bin/env python3
"""Archive and verify Kernel 0042 evidence.

Copies the completed Qwen 2+2 pilot outputs, transport-probe records, and
candidate sidecars into one canonical evidence directory.

This script performs no inference.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path


ROOT = Path(".")
ARTIFACT_DIR = Path(
    "labs/velastra/evidence/artifacts/hearth-spatial-carrier-0042"
)
RESULTS_DIR = ARTIFACT_DIR / "results"

TRIAL_RECORD = Path(
    "labs/velastra/evidence/trials/hearth-spatial-carrier-0042.json"
)
QWEN_PROBE_RECORD = Path(
    "labs/velastra/evidence/trials/hearth-spatial-carrier-0042-qwen-probe.json"
)
ZIMAGE_PROBE_RECORD = Path(
    "labs/velastra/evidence/trials/hearth-spatial-carrier-0042-probe.json"
)

QWEN_PROBE_IMAGE = Path(
    ".velastra/spatial-carrier/hearth-0042/qwen-structured-probe.png"
)
PILOT_DIR = Path(".velastra/spatial-carrier/hearth-0042/qwen-pilot")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def require(path: Path) -> None:
    if not path.exists():
        raise RuntimeError(f"Missing required 0042 evidence: {path}")


def copy_verified(
    source: Path,
    destination: Path,
    expected_sha: str | None = None,
) -> str:
    require(source)
    actual = sha256_file(source)
    if expected_sha and actual != expected_sha:
        raise RuntimeError(
            f"SHA mismatch for {source}: expected={expected_sha} actual={actual}"
        )
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    copied = sha256_file(destination)
    if copied != actual:
        raise RuntimeError(
            f"Archive copy SHA mismatch for {destination}: "
            f"source={actual} copied={copied}"
        )
    return actual


def main() -> int:
    require(TRIAL_RECORD)
    require(QWEN_PROBE_RECORD)
    require(ZIMAGE_PROBE_RECORD)
    require(QWEN_PROBE_IMAGE)

    trial = json.loads(TRIAL_RECORD.read_text(encoding="utf-8"))
    qwen_probe = json.loads(QWEN_PROBE_RECORD.read_text(encoding="utf-8"))
    zimage_probe = json.loads(ZIMAGE_PROBE_RECORD.read_text(encoding="utf-8"))

    if trial.get("status") != "rendered_pending_human_review":
        raise RuntimeError(
            "0042 trial is not in rendered_pending_human_review state: "
            f"{trial.get('status')}"
        )
    if qwen_probe.get("status") != "transport_accepted":
        raise RuntimeError("Qwen transport probe is not accepted.")
    if zimage_probe.get("status") != "transport_rejected":
        raise RuntimeError("Z-Image transport probe is not recorded as rejected.")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, object] = {
        "version": 1,
        "kernel": "0042",
        "trial": trial.get("trial"),
        "files": [],
    }

    def record(source: Path, name: str, expected: str | None = None) -> None:
        dest = RESULTS_DIR / name
        actual = copy_verified(source, dest, expected)
        manifest["files"].append({
            "name": name,
            "source": source.as_posix(),
            "sha256": actual,
        })

    # Transport records.
    record(
        ZIMAGE_PROBE_RECORD,
        "transport--z-image-rejected.json",
    )
    record(
        QWEN_PROBE_RECORD,
        "transport--qwen-accepted.json",
    )

    # Accepted Qwen probe = structured repeat 1.
    qwen_probe_sha = (qwen_probe.get("output") or {}).get("sha256")
    record(
        QWEN_PROBE_IMAGE,
        "structured-r01--qwen-probe.png",
        qwen_probe_sha,
    )

    # Trial record itself.
    record(
        TRIAL_RECORD,
        "trial.json",
    )

    # Remaining three outputs + candidate sidecars.
    attempts = []
    for condition in ("structured", "destroyed"):
        attempts.extend((trial.get("conditions") or {}).get(condition) or [])

    for attempt in attempts:
        if attempt.get("source") == "accepted_transport_probe":
            continue

        aid = attempt["attemptId"]
        output = attempt.get("output") or {}
        image_path = Path(output["path"])
        image_sha = output.get("sha256")
        sidecar_path = Path(attempt["candidateRecord"])

        record(
            image_path,
            f"{aid}.png",
            image_sha,
        )

        require(sidecar_path)
        sidecar = json.loads(sidecar_path.read_text(encoding="utf-8"))
        if sidecar.get("attemptId") != aid:
            raise RuntimeError(
                f"Candidate sidecar attempt mismatch for {aid}: "
                f"{sidecar.get('attemptId')}"
            )
        sidecar_sha = ((sidecar.get("output") or {}).get("sha256"))
        if sidecar_sha != image_sha:
            raise RuntimeError(
                f"Candidate sidecar output SHA mismatch for {aid}: "
                f"trial={image_sha} sidecar={sidecar_sha}"
            )

        record(
            sidecar_path,
            f"{aid}.candidate.json",
        )

    manifest_path = RESULTS_DIR / "archive-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )

    print(RESULTS_DIR)
    print(f"files_archived={len(manifest['files']) + 1}")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
