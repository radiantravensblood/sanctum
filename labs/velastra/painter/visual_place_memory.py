#!/usr/bin/env python3
"""Kernel 0040 Visual Place Memory carrier builder.

The carrier is candidate-local and experimental. It does not become scene
truth, canonical place identity, or a general Visual Witness automatically.

Two carriers are built from the exact same normalized source corpus:

- micro_scrub_control: destroys adjacency at 32px tile scale.
- visual_place_memory: shuffles 96px neighborhoods, preserving only
  meso-scale local adjacency while destroying global source layout.

The paired carrier design lets the trial ask whether meso-scale place
relations matter without changing the source pixels, painter-facing prompt,
scene truth, Handprint, brush, or provider.
"""

from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path
from typing import Any, Mapping, Sequence


PROTOCOL = "velastra.visual_place_memory_carrier.v1"
VERSION = 1
CONTROL_ALGORITHM = "micro_scrub_v1"
MEMORY_ALGORITHM = "neighborhood_quilt_v1"


class VisualPlaceMemoryError(RuntimeError):
    pass


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_pixel_sha256(image: Any) -> str:
    payload = (
        str(image.mode).encode("utf-8")
        + b"|"
        + str(image.size).encode("utf-8")
        + b"|"
        + image.tobytes()
    )
    return hashlib.sha256(payload).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise VisualPlaceMemoryError(f"Missing JSON file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise VisualPlaceMemoryError(
            f"Invalid JSON in {path}: {exc}"
        ) from exc
    if not isinstance(value, dict):
        raise VisualPlaceMemoryError(f"Expected JSON object: {path}")
    return value


def profile_visual_config(
    *,
    place_registry_path: Path,
    profile_id: str,
) -> dict[str, Any]:
    registry = read_json(place_registry_path)
    profile = (registry.get("profiles") or {}).get(profile_id)
    if not isinstance(profile, Mapping):
        raise VisualPlaceMemoryError(
            f"Unknown Place Memory profile: {profile_id}"
        )
    visual = profile.get("visualMemory")
    if not isinstance(visual, Mapping):
        raise VisualPlaceMemoryError(
            f"Place Memory profile has no visualMemory config: {profile_id}"
        )
    carrier = visual.get("carrier") or {}
    source_ids = [
        str(item).strip()
        for item in (visual.get("sourceWitnessIds") or [])
        if str(item).strip()
    ]
    if not source_ids:
        raise VisualPlaceMemoryError(
            "Visual Place Memory requires at least one source witness."
        )

    width = int(carrier.get("width") or 1536)
    height = int(carrier.get("height") or 864)
    micro_tile = int(carrier.get("microTileSize") or 32)
    neighborhood = int(carrier.get("neighborhoodSize") or 96)
    blur_radius = float(
        carrier.get("blurRadius")
        if carrier.get("blurRadius") is not None
        else 0.6
    )
    if micro_tile < 8:
        raise VisualPlaceMemoryError("microTileSize must be at least 8.")
    if neighborhood <= micro_tile:
        raise VisualPlaceMemoryError(
            "neighborhoodSize must exceed microTileSize."
        )
    if neighborhood % micro_tile != 0:
        raise VisualPlaceMemoryError(
            "neighborhoodSize must be divisible by microTileSize."
        )
    for value, label in (
        (width, "width"),
        (height, "height"),
    ):
        if value % micro_tile != 0:
            raise VisualPlaceMemoryError(
                f"Carrier {label} must be divisible by microTileSize."
            )
        if value % neighborhood != 0:
            raise VisualPlaceMemoryError(
                f"Carrier {label} must be divisible by neighborhoodSize."
            )

    return {
        "profileId": profile_id,
        "sourceWitnessIds": source_ids,
        "roles": list(visual.get("roles") or []),
        "doNotInherit": list(visual.get("doNotInherit") or []),
        "laws": dict(visual.get("laws") or {}),
        "carrier": {
            "width": width,
            "height": height,
            "microTileSize": micro_tile,
            "neighborhoodSize": neighborhood,
            "blurRadius": blur_radius,
            "controlAlgorithm": (
                carrier.get("controlAlgorithm") or CONTROL_ALGORITHM
            ),
            "experimentalAlgorithm": (
                carrier.get("experimentalAlgorithm") or MEMORY_ALGORITHM
            ),
        },
    }


def resolve_sources(
    *,
    witness_registry_path: Path,
    source_ids: Sequence[str],
    repo_root: Path,
) -> list[dict[str, Any]]:
    registry = read_json(witness_registry_path)
    entries = registry.get("entries") or {}
    resolved: list[dict[str, Any]] = []

    for source_id in source_ids:
        entry = entries.get(source_id)
        if not isinstance(entry, Mapping):
            raise VisualPlaceMemoryError(
                f"Unknown visual-memory source witness: {source_id}"
            )
        if entry.get("status") != "approved":
            raise VisualPlaceMemoryError(
                f"Visual-memory source is not approved: {source_id}"
            )
        asset = entry.get("asset")
        if not isinstance(asset, Mapping):
            raise VisualPlaceMemoryError(
                f"Visual-memory source has no sealed asset: {source_id}"
            )
        raw_path = asset.get("path")
        recorded_sha = asset.get("sha256")
        if not raw_path or not recorded_sha:
            raise VisualPlaceMemoryError(
                f"Visual-memory source lacks path/hash: {source_id}"
            )

        path = (repo_root / str(raw_path)).resolve()
        try:
            path.relative_to(repo_root.resolve())
        except ValueError as exc:
            raise VisualPlaceMemoryError(
                f"Visual-memory source escapes repo root: {path}"
            ) from exc
        if not path.exists():
            raise VisualPlaceMemoryError(
                f"Visual-memory source asset missing: {path}"
            )
        actual_sha = sha256_file(path)
        if actual_sha != recorded_sha:
            raise VisualPlaceMemoryError(
                f"Visual-memory source hash mismatch: {source_id}"
            )

        resolved.append({
            "id": source_id,
            "title": entry.get("title"),
            "path": path,
            "pathRelative": path.relative_to(repo_root.resolve()).as_posix(),
            "sha256": actual_sha,
        })

    return resolved


def _fit_cover(image: Any, size: tuple[int, int]) -> Any:
    from PIL import Image

    target_w, target_h = size
    source_w, source_h = image.size
    scale = max(target_w / source_w, target_h / source_h)
    resized = image.resize(
        (
            max(target_w, int(round(source_w * scale))),
            max(target_h, int(round(source_h * scale))),
        ),
        Image.Resampling.LANCZOS,
    )
    left = max(0, (resized.width - target_w) // 2)
    top = max(0, (resized.height - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def build_normalized_corpus(
    sources: Sequence[Mapping[str, Any]],
    *,
    width: int,
    height: int,
) -> Any:
    try:
        from PIL import Image
    except ImportError as exc:
        raise VisualPlaceMemoryError(
            "Visual Place Memory requires Pillow."
        ) from exc

    if not sources:
        raise VisualPlaceMemoryError("Cannot build an empty visual corpus.")

    canvas = Image.new("RGB", (width, height))
    count = len(sources)
    base_width = width // count
    x = 0

    for index, source in enumerate(sources):
        cell_width = (
            width - x
            if index == count - 1
            else base_width
        )
        path = Path(str(source["path"]))
        with Image.open(path) as opened:
            fitted = _fit_cover(
                opened.convert("RGB"),
                (cell_width, height),
            )
        canvas.paste(fitted, (x, 0))
        x += cell_width

    return canvas


def _rng_seed(
    *,
    sources: Sequence[Mapping[str, Any]],
    config: Mapping[str, Any],
    condition: str,
) -> int:
    payload = {
        "protocol": PROTOCOL,
        "condition": condition,
        "sources": [
            {
                "id": item.get("id"),
                "sha256": item.get("sha256"),
            }
            for item in sources
        ],
        "carrier": dict(config),
    }
    digest = hashlib.sha256(canonical_json(payload)).hexdigest()
    return int(digest[:16], 16)


def _global_micro_scrub(
    corpus: Any,
    *,
    tile_size: int,
    rng: random.Random,
) -> Any:
    from PIL import Image

    positions = [
        (x, y)
        for y in range(0, corpus.height, tile_size)
        for x in range(0, corpus.width, tile_size)
    ]
    tiles = [
        corpus.crop((x, y, x + tile_size, y + tile_size))
        for x, y in positions
    ]
    order = list(range(len(tiles)))
    rng.shuffle(order)

    canvas = Image.new("RGB", corpus.size)
    for target, source_index in zip(positions, order):
        canvas.paste(tiles[source_index], target)
    return canvas


def _neighborhood_quilt(
    corpus: Any,
    *,
    neighborhood_size: int,
    rng: random.Random,
) -> Any:
    from PIL import Image

    positions = [
        (x, y)
        for y in range(0, corpus.height, neighborhood_size)
        for x in range(0, corpus.width, neighborhood_size)
    ]
    blocks = [
        corpus.crop(
            (
                x,
                y,
                x + neighborhood_size,
                y + neighborhood_size,
            )
        )
        for x, y in positions
    ]
    order = list(range(len(blocks)))
    rng.shuffle(order)

    canvas = Image.new("RGB", corpus.size)
    rotations = (0, 90, 180, 270)
    for target, source_index in zip(positions, order):
        block = blocks[source_index]
        angle = rotations[rng.randrange(len(rotations))]
        if angle:
            block = block.rotate(angle)
        if rng.random() < 0.5:
            block = block.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        canvas.paste(block, target)
    return canvas


def build_pair(
    *,
    sources: Sequence[Mapping[str, Any]],
    output_dir: Path,
    config: Mapping[str, Any],
) -> dict[str, Any]:
    try:
        from PIL import ImageFilter
    except ImportError as exc:
        raise VisualPlaceMemoryError(
            "Visual Place Memory requires Pillow."
        ) from exc

    width = int(config.get("width") or 1536)
    height = int(config.get("height") or 864)
    micro_tile = int(config.get("microTileSize") or 32)
    neighborhood = int(config.get("neighborhoodSize") or 96)
    blur_radius = float(
        config.get("blurRadius")
        if config.get("blurRadius") is not None
        else 0.6
    )

    corpus = build_normalized_corpus(
        sources,
        width=width,
        height=height,
    )
    corpus_pixel_sha = image_pixel_sha256(corpus)

    output_dir.mkdir(parents=True, exist_ok=True)
    control_path = output_dir / "micro_scrub_control.png"
    memory_path = output_dir / "visual_place_memory.png"

    control_rng = random.Random(
        _rng_seed(
            sources=sources,
            config=config,
            condition="micro_scrub_control",
        )
    )
    memory_rng = random.Random(
        _rng_seed(
            sources=sources,
            config=config,
            condition="visual_place_memory",
        )
    )

    control = _global_micro_scrub(
        corpus,
        tile_size=micro_tile,
        rng=control_rng,
    )
    memory = _neighborhood_quilt(
        corpus,
        neighborhood_size=neighborhood,
        rng=memory_rng,
    )

    if blur_radius > 0:
        control = control.filter(
            ImageFilter.GaussianBlur(radius=blur_radius)
        )
        memory = memory.filter(
            ImageFilter.GaussianBlur(radius=blur_radius)
        )

    control.save(control_path, format="PNG")
    memory.save(memory_path, format="PNG")

    source_snapshot = [
        {
            "id": item.get("id"),
            "title": item.get("title"),
            "path": item.get("pathRelative"),
            "sha256": item.get("sha256"),
        }
        for item in sources
    ]
    pair_payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "sources": source_snapshot,
        "corpusPixelSha256": corpus_pixel_sha,
        "carrier": dict(config),
    }
    pair_id = sha256_json(pair_payload)[:20]

    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "pairId": pair_id,
        "sourceCorpus": source_snapshot,
        "corpusPixelSha256": corpus_pixel_sha,
        "sameSourcePixelsAfterNormalization": True,
        "conditions": {
            "micro_scrub_control": {
                "algorithm": (
                    config.get("controlAlgorithm")
                    or CONTROL_ALGORITHM
                ),
                "path": control_path.as_posix(),
                "carrierSha256": sha256_file(control_path),
                "microTileSize": micro_tile,
                "neighborhoodSize": None,
                "blurRadius": blur_radius,
                "globalLayoutDestroyed": True,
                "mesoSpatialAdjacencyPreserved": False,
                "localPixelEvidencePreserved": True,
            },
            "visual_place_memory": {
                "algorithm": (
                    config.get("experimentalAlgorithm")
                    or MEMORY_ALGORITHM
                ),
                "path": memory_path.as_posix(),
                "carrierSha256": sha256_file(memory_path),
                "microTileSize": micro_tile,
                "neighborhoodSize": neighborhood,
                "blurRadius": blur_radius,
                "globalLayoutDestroyed": True,
                "mesoSpatialAdjacencyPreserved": True,
                "localPixelEvidencePreserved": True,
            },
        },
        "laws": {
            "sourcePixelsAreNotSceneTruth": True,
            "sourceLayoutIsNotAuthority": True,
            "carrierCannotInventPeopleOrRelationships": True,
            "carrierCannotOverrideAuthoredSceneTruth": True,
            "carrierCannotPromoteWitnessObjectsToCanonicalObjects": True,
            "controlAndExperimentalShareNormalizedSourceCorpus": True,
        },
    }
