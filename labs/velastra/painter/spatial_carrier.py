#!/usr/bin/env python3
"""Kernel 0042: deterministic non-semantic spatial carrier generator.

The carrier encodes only low-frequency spatial organization. It contains no
room objects, people, text, symbols, furniture, or semantic scene content.

Two pixel-matched conditions are produced:
- structured: authored global topology preserved;
- destroyed: exact same 96px tiles deterministically permuted.

Both images therefore preserve the same local tile inventory and pixel
histogram while differing in global spatial arrangement.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from pathlib import Path
from typing import Any

from PIL import Image


WIDTH = 1536
HEIGHT = 864
TILE = 96
CONTROL_SEED = 42042


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _distance_to_segment(
    px: float,
    py: float,
    ax: float,
    ay: float,
    bx: float,
    by: float,
) -> float:
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    denom = vx * vx + vy * vy
    if denom <= 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, (wx * vx + wy * vy) / denom))
    cx, cy = ax + t * vx, ay + t * vy
    return math.hypot(px - cx, py - cy)


def _field_value(x: float, y: float) -> int:
    """Return one grayscale value for a coarse topology cell."""
    value = 128.0
    fields = (
        (0.20, 0.30, +20.0, 0.18),
        (0.68, 0.24, -16.0, 0.16),
        (0.74, 0.72, +14.0, 0.19),
        (0.30, 0.74, -11.0, 0.16),
    )
    for cx, cy, weight, sigma in fields:
        d2 = (x - cx) ** 2 + (y - cy) ** 2
        value += weight * math.exp(-d2 / (2.0 * sigma * sigma))

    # Preserve an open diagonal circulation band by damping local contrast
    # around a bent path through the field.
    d = min(
        _distance_to_segment(x, y, 0.02, 0.67, 0.48, 0.52),
        _distance_to_segment(x, y, 0.48, 0.52, 0.94, 0.36),
    )
    corridor = math.exp(-(d * d) / (2.0 * 0.055 * 0.055))
    value = value * (1.0 - 0.72 * corridor) + 128.0 * (0.72 * corridor)
    return int(max(88, min(168, round(value))))


def build_structured(width: int = WIDTH, height: int = HEIGHT, tile: int = TILE) -> Image.Image:
    if width % tile or height % tile:
        raise ValueError("Carrier dimensions must be evenly divisible by tile size.")
    cols, rows = width // tile, height // tile
    image = Image.new("RGB", (width, height))
    for row in range(rows):
        for col in range(cols):
            x = (col + 0.5) / cols
            y = (row + 0.5) / rows
            value = _field_value(x, y)
            block = Image.new("RGB", (tile, tile), (value, value, value))
            image.paste(block, (col * tile, row * tile))
    return image


def destroy_global_layout(
    structured: Image.Image,
    tile: int = TILE,
    seed: int = CONTROL_SEED,
) -> Image.Image:
    width, height = structured.size
    if width % tile or height % tile:
        raise ValueError("Carrier dimensions must be evenly divisible by tile size.")

    tiles = []
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            tiles.append(structured.crop((x, y, x + tile, y + tile)))

    rng = random.Random(seed)
    order = list(range(len(tiles)))
    rng.shuffle(order)

    control = Image.new("RGB", structured.size)
    cursor = 0
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            control.paste(tiles[order[cursor]], (x, y))
            cursor += 1
    return control


def histogram_sha(image: Image.Image) -> str:
    # Histogram equality demonstrates exact pixel-count preservation even
    # though spatial arrangement differs.
    payload = json.dumps(image.histogram(), separators=(",", ":")).encode("utf-8")
    return sha256_bytes(payload)


def save_pair(out_dir: Path) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    structured = build_structured()
    destroyed = destroy_global_layout(structured)

    structured_path = out_dir / "structured.png"
    destroyed_path = out_dir / "destroyed.png"
    structured.save(structured_path, format="PNG")
    destroyed.save(destroyed_path, format="PNG")

    structured_hist = histogram_sha(structured)
    destroyed_hist = histogram_sha(destroyed)
    if structured_hist != destroyed_hist:
        raise RuntimeError("0042 control failed: pixel histograms differ.")

    record = {
        "version": 1,
        "protocol": "velastra.spatial_carrier.v1",
        "width": WIDTH,
        "height": HEIGHT,
        "tileSize": TILE,
        "controlShuffleSeed": CONTROL_SEED,
        "semanticContent": "none",
        "styleContent": "none",
        "structured": {
            "path": structured_path.as_posix(),
            "sha256": sha256_file(structured_path),
            "pixelHistogramSha256": structured_hist,
            "globalTopologyPreserved": True,
        },
        "destroyed": {
            "path": destroyed_path.as_posix(),
            "sha256": sha256_file(destroyed_path),
            "pixelHistogramSha256": destroyed_hist,
            "globalTopologyPreserved": False,
            "sameLocalTileInventoryAsStructured": True,
        },
        "laws": {
            "carrierCannotContainSceneObjects": True,
            "carrierCannotContainTextOrSymbols": True,
            "carrierCannotTeachPainterlyHand": True,
            "carrierCannotMutateSceneTruth": True,
            "controlMustPreserveExactPixelHistogram": True,
        },
    }
    record_path = out_dir / "carrier.json"
    record_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Kernel 0042 spatial-carrier A/B inputs.")
    parser.add_argument(
        "--out-dir",
        default=".velastra/spatial-carrier/hearth-0042",
    )
    args = parser.parse_args()
    record = save_pair(Path(args.out_dir))
    print(Path(args.out_dir) / "carrier.json")
    print("structured_sha256=" + record["structured"]["sha256"])
    print("destroyed_sha256=" + record["destroyed"]["sha256"])
    print("histogram_sha256=" + record["structured"]["pixelHistogramSha256"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
