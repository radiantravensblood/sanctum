#!/usr/bin/env python3
"""Deterministic semantic scrubber for Velastra Visual Witness carriers.

The carrier preserves local pigment/color/texture evidence while destroying
global witness layout before an image-edit brush receives the pixels.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
from pathlib import Path
from typing import Any, Mapping


ALGORITHM = "patch_shuffle_v1"
VERSION = 1
DEFAULT_TILE_SIZE = 32
DEFAULT_BLUR_RADIUS = 0.6


class WitnessFirewallError(RuntimeError):
    pass


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def descriptor(
    source_sha256: str,
    *,
    tile_size: int = DEFAULT_TILE_SIZE,
    blur_radius: float = DEFAULT_BLUR_RADIUS,
) -> dict[str, Any]:
    if not source_sha256:
        raise WitnessFirewallError(
            "Witness Firewall requires a sealed source SHA-256."
        )
    if tile_size < 8:
        raise WitnessFirewallError(
            "Witness Firewall tile size must be at least 8 pixels."
        )
    payload = {
        "algorithm": ALGORITHM,
        "version": VERSION,
        "sourceSha256": source_sha256,
        "tileSize": int(tile_size),
        "blurRadius": float(blur_radius),
    }
    payload["carrierId"] = hashlib.sha256(
        canonical_json(payload)
    ).hexdigest()[:20]
    return payload


def _seed_from_descriptor(config: Mapping[str, Any]) -> int:
    digest = hashlib.sha256(
        canonical_json(dict(config))
    ).hexdigest()
    return int(digest[:16], 16)


def build_carrier(
    source_path: Path,
    output_path: Path,
    config: Mapping[str, Any],
) -> dict[str, Any]:
    try:
        from PIL import Image, ImageFilter
    except ImportError as exc:
        raise WitnessFirewallError(
            "Witness Firewall requires Pillow."
        ) from exc

    if not source_path.exists():
        raise WitnessFirewallError(
            f"Witness source does not exist: {source_path}"
        )

    tile_size = int(
        config.get("tileSize")
        or DEFAULT_TILE_SIZE
    )
    blur_radius = float(
        config.get("blurRadius")
        if config.get("blurRadius") is not None
        else DEFAULT_BLUR_RADIUS
    )

    with Image.open(source_path) as source:
        original = source.convert("RGB")
        original_width, original_height = original.size

        work_width = int(
            math.ceil(original_width / tile_size)
            * tile_size
        )
        work_height = int(
            math.ceil(original_height / tile_size)
            * tile_size
        )
        working = original.resize(
            (work_width, work_height),
            Image.Resampling.LANCZOS,
        )

    positions = [
        (x, y)
        for y in range(0, work_height, tile_size)
        for x in range(0, work_width, tile_size)
    ]
    tiles = [
        working.crop(
            (
                x,
                y,
                x + tile_size,
                y + tile_size,
            )
        )
        for x, y in positions
    ]

    rng = random.Random(_seed_from_descriptor(config))
    order = list(range(len(tiles)))
    rng.shuffle(order)

    canvas = Image.new(
        "RGB",
        (work_width, work_height),
    )
    for target, source_index in zip(positions, order):
        canvas.paste(tiles[source_index], target)

    if blur_radius > 0:
        canvas = canvas.filter(
            ImageFilter.GaussianBlur(radius=blur_radius)
        )

    carrier = canvas.resize(
        (original_width, original_height),
        Image.Resampling.LANCZOS,
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )
    carrier.save(output_path, format="PNG")

    return {
        "algorithm": config.get("algorithm") or ALGORITHM,
        "version": int(config.get("version") or VERSION),
        "carrierId": config.get("carrierId"),
        "source": source_path.as_posix(),
        "output": output_path.as_posix(),
        "width": original_width,
        "height": original_height,
        "tileSize": tile_size,
        "blurRadius": blur_radius,
        "semanticLayoutDestroyed": True,
        "localPixelEvidencePreserved": True,
        "law": (
            "The carrier may preserve local palette, pigment, texture, "
            "and edge memory. It must not preserve witness room layout "
            "as scene authority."
        ),
    }
