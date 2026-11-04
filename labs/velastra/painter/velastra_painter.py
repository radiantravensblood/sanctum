#!/usr/bin/env python3
"""Velastra Painter Bridge.

Authoring-side bridge between a renderer-neutral Velastra Atelier Manifest and
an image-generation backend. This tool never runs in Sanctum's browser runtime
and never promotes generated output to an approved asset automatically.
"""

from __future__ import annotations

import argparse
import hashlib
import inspect
import json
import os
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

PROTOCOL = "velastra.painter.v1"
CANDIDATE_STATUS = "candidate"
APPROVED_STATUS = "approved"
DEFAULT_WIDTH = 1536
DEFAULT_HEIGHT = 864
DEFAULT_BRUSH_REGISTRY = (
    Path(__file__).resolve().parents[3] / "world" / "velastra-brushes.json"
)
DEFAULT_WITNESS_REGISTRY = (
    Path(__file__).resolve().parents[3] / "world" / "velastra-witnesses.json"
)
DEFAULT_HANDPRINT_REGISTRY = (
    Path(__file__).resolve().parents[3] / "world" / "velastra-handprint.json"
)


class PainterError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PainterError(f"Missing JSON file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PainterError(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise PainterError(f"Expected a JSON object in {path}.")
    return value


def write_json(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def unwrap_manifest(value: Mapping[str, Any]) -> dict[str, Any]:
    manifest = value.get("manifest", value)
    if not isinstance(manifest, dict):
        raise PainterError("Input must be an Atelier Manifest or an object containing `manifest`.")
    return dict(manifest)


def require_manifest(manifest: Mapping[str, Any]) -> None:
    required = ["assetKey", "artBrief", "scene", "provenance", "render"]
    missing = [key for key in required if key not in manifest]
    if missing:
        raise PainterError("Atelier Manifest is missing: " + ", ".join(missing))

    if manifest.get("engine") != "Velastra":
        raise PainterError("Input is not a Velastra manifest.")
    if manifest.get("layer") != "atelier_manifest":
        raise PainterError("Input is not an Atelier Manifest.")
    if not isinstance(manifest.get("assetKey"), str) or not manifest["assetKey"]:
        raise PainterError("Atelier Manifest requires a stable assetKey.")

    render = manifest.get("render") or {}
    if render.get("runtimeGeneration") is not False:
        raise PainterError("Painter Bridge refuses manifests that permit runtime generation.")


def flatten_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return " ".join(value.split())
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return "; ".join(filter(None, (flatten_text(item) for item in value)))
    if isinstance(value, Mapping):
        return "; ".join(
            f"{key}: {flatten_text(item)}"
            for key, item in value.items()
            if flatten_text(item)
        )
    return str(value)


def subject_lines(scene: Mapping[str, Any]) -> list[str]:
    lines: list[str] = []
    for subject in scene.get("subjects") or []:
        if not isinstance(subject, Mapping):
            continue
        subject_id = subject.get("id") or "unnamed_subject"
        description = (
            subject.get("description")
            or subject.get("visualClaim", {}).get("description")
            or subject.get("role")
            or ""
        )
        line = f"{subject_id}"
        if description:
            line += f": {flatten_text(description)}"
        lines.append(line)
    return lines


def relation_line(scene: Mapping[str, Any]) -> str:
    relation = scene.get("relation")
    if not isinstance(relation, Mapping) or not relation:
        return ""
    kind = relation.get("kind")
    facts = relation.get("facts") or relation.get("description") or relation.get("meaning")
    pieces = [flatten_text(kind), flatten_text(facts)]
    return " — ".join(piece for piece in pieces if piece)


def environment_lines(scene: Mapping[str, Any]) -> list[str]:
    env = scene.get("environment")
    if not isinstance(env, Mapping):
        return []
    lines: list[str] = []
    kind = flatten_text(env.get("kind"))
    if kind:
        lines.append(f"place kind: {kind}")
    for fact in env.get("facts") or []:
        text = flatten_text(fact)
        if text:
            lines.append(text)
    return lines


def motif_lines(manifest: Mapping[str, Any]) -> tuple[list[str], list[str]]:
    literal: list[str] = []
    symbolic: list[str] = []
    for motif in manifest.get("motifs") or []:
        if not isinstance(motif, Mapping):
            continue
        text = flatten_text({
            "id": motif.get("id"),
            "meaning": motif.get("meaning"),
        })
        if not text:
            continue
        if motif.get("mode") == "literal":
            literal.append(text)
        else:
            symbolic.append(text)
    return literal, symbolic


def compile_truth_envelope(manifest: Mapping[str, Any]) -> dict[str, Any]:
    scene = manifest.get("scene") or {}
    literal, symbolic = motif_lines(manifest)
    painterly_truth = (
        (scene.get("environment") or {}).get("painterlyTruth")
        or None
    )

    return {
        "assetKey": manifest["assetKey"],
        "subjects": subject_lines(scene),
        "relation": relation_line(scene) or None,
        "environment": environment_lines(scene),
        "painterlyTruth": {
            "id": painterly_truth.get("id"),
            "version": painterly_truth.get("version"),
            "revision": painterly_truth.get("revision"),
            "room": painterly_truth.get("room"),
            "fixedObjects": painterly_truth.get("fixedObjects") or [],
        } if isinstance(painterly_truth, Mapping) else None,
        "literalMotifs": literal,
        "symbolicMotifs": symbolic,
        "laws": {
            "doNotInventIdentity": True,
            "doNotInventRelation": True,
            "doNotInventConsent": True,
            "doNotPromoteSymbolToLiteralFact": True,
            "scenePacketRemainsAuthoritative": True,
        },
    }


def style_lines(manifest: Mapping[str, Any]) -> dict[str, list[str]]:
    style = manifest.get("style")
    if not isinstance(style, Mapping):
        return {
            "signature": "",
            "hand": [],
            "archetype": [],
            "place": [],
            "avoid": [],
        }

    hand_entries = [
        entry
        for entry in (style.get("hand") or [])
        if isinstance(entry, Mapping) and entry.get("directive")
    ]
    emphasis = set(style.get("emphasis") or [])
    hand_entries.sort(
        key=lambda entry: (
            0 if entry.get("id") in emphasis else 1,
            -float(entry.get("weight") or 0),
        )
    )

    hand = [
        flatten_text(entry.get("directive"))
        for entry in hand_entries[:6]
        if flatten_text(entry.get("directive"))
    ]
    archetype_block = style.get("archetype") or {}
    place_block = style.get("place") or {}

    archetype = [
        flatten_text(item)
        for item in (archetype_block.get("directives") or [])
        if flatten_text(item)
    ]
    place = [
        flatten_text(item)
        for item in (place_block.get("directives") or [])
        if flatten_text(item)
    ]
    avoid = [
        flatten_text(item)
        for item in (
            ((place_block.get("avoid") or []))
            + (style.get("antiPatterns") or [])
        )[:10]
        if flatten_text(item)
    ]

    return {
        "signature": flatten_text(style.get("compactSignature")),
        "hand": hand,
        "archetype": archetype,
        "place": place,
        "avoid": avoid,
    }


def evidence_lines(manifest: Mapping[str, Any]) -> dict[str, Any]:
    evidence = manifest.get("evidence")
    if not isinstance(evidence, Mapping):
        return {
            "id": None,
            "version": None,
            "minimumVisible": 0,
            "identityReframe": None,
            "required": [],
            "controls": [],
            "reviewQuestions": [],
        }

    required = [
        flatten_text(entry.get("instruction"))
        for entry in (evidence.get("required") or [])
        if isinstance(entry, Mapping) and flatten_text(entry.get("instruction"))
    ]
    controls = [
        flatten_text(entry.get("instruction"))
        for entry in (evidence.get("compositionControls") or [])
        if isinstance(entry, Mapping) and flatten_text(entry.get("instruction"))
    ]

    return {
        "id": evidence.get("id"),
        "version": evidence.get("version"),
        "minimumVisible": int(evidence.get("minimumVisible") or 0),
        "identityReframe": flatten_text(evidence.get("identityReframe")) or None,
        "required": required,
        "controls": controls,
        "reviewQuestions": [
            flatten_text(item)
            for item in (evidence.get("reviewQuestions") or [])
            if flatten_text(item)
        ],
    }


def witness_lines(
    manifest: Mapping[str, Any],
    spec: "RenderSpec | None" = None,
) -> dict[str, Any]:
    block = manifest.get("witnesses")
    control = spec.control_contract if spec and spec.control_contract else {}
    reference_contract = control.get("referenceImages") or {}
    required = reference_contract.get("required") is True

    if not isinstance(block, Mapping):
        if required:
            raise PainterError(
                "Selected brush requires an approved Visual Witness, "
                "but this manifest carries no witness packet."
            )
        return {
            "active": False,
            "required": required,
            "selected": None,
            "roles": [],
            "doNotInherit": [],
            "asset": None,
        }

    approved = [
        entry
        for entry in (block.get("approved") or [])
        if isinstance(entry, Mapping)
        and isinstance(entry.get("asset"), Mapping)
        and entry.get("asset", {}).get("path")
        and entry.get("asset", {}).get("sha256")
    ]

    explicit = spec.witness_id if spec else None
    selected = None

    if explicit:
        selected = next(
            (
                entry
                for entry in approved
                if entry.get("id") == explicit
            ),
            None,
        )
        if selected is None:
            raise PainterError(
                f"Requested witness is not approved in this manifest: {explicit}"
            )
    elif approved:
        selected = approved[0]

    if required and selected is None:
        proposed = [
            str(entry.get("id"))
            for entry in (block.get("selected") or [])
            if isinstance(entry, Mapping) and entry.get("id")
        ]
        suffix = (
            " Selected but not yet approved: " + ", ".join(proposed)
            if proposed
            else ""
        )
        raise PainterError(
            "Selected brush requires an approved Visual Witness asset."
            + suffix
        )

    if selected is None:
        return {
            "active": False,
            "required": required,
            "selected": None,
            "roles": [],
            "doNotInherit": [],
            "asset": None,
        }

    return {
        "active": True,
        "required": required,
        "selected": selected.get("id"),
        "title": selected.get("title"),
        "roles": list(selected.get("matchedRoles") or selected.get("teach") or []),
        "doNotInherit": list(selected.get("doNotInherit") or []),
        "notes": selected.get("notes"),
        "asset": dict(selected.get("asset") or {}),
    }


def resolve_witness_path(
    witness: Mapping[str, Any],
    repo_root: Path,
) -> Path:
    asset = witness.get("asset") or {}
    raw = asset.get("path")
    if not raw:
        raise PainterError("Visual Witness has no approved asset path.")

    path = (repo_root / str(raw)).resolve()
    try:
        path.relative_to(repo_root.resolve())
    except ValueError as exc:
        raise PainterError(
            f"Visual Witness must live inside repository root: {path}"
        ) from exc

    if not path.exists():
        raise PainterError(f"Visual Witness asset does not exist: {path}")

    recorded = asset.get("sha256")
    actual = sha256_file(path)
    if not recorded or recorded != actual:
        raise PainterError(
            "Visual Witness hash does not match its registry record."
        )

    return path


def handprint_lines(manifest: Mapping[str, Any]) -> dict[str, Any]:
    block = manifest.get("handprint")
    if not isinstance(block, Mapping) or block.get("active") is not True:
        return {
            "active": False,
            "witnessCount": 0,
            "desiredRoles": [],
            "consensusRoles": [],
            "interpretation": {},
            "metrics": {},
            "doNotInherit": [],
        }

    return {
        "active": True,
        "witnessCount": int(block.get("witnessCount") or 0),
        "desiredRoles": list(block.get("desiredRoles") or []),
        "consensusRoles": list(block.get("consensusRoles") or []),
        "interpretation": dict(block.get("interpretation") or {}),
        "metrics": dict(block.get("metrics") or {}),
        "doNotInherit": list(block.get("doNotInherit") or []),
    }


def handprint_prompt_text(handprint: Mapping[str, Any]) -> str:
    if not handprint.get("active"):
        return ""

    interpretation = handprint.get("interpretation") or {}
    parts: list[str] = [
        "Portfolio-derived Virynism Handprint from "
        + str(handprint.get("witnessCount") or 0)
        + " approved witnesses."
    ]

    labels = [
        ("tonalRestraint", "tonal restraint"),
        ("warmthBias", "warmth bias"),
        ("edgeCharacter", "edge character"),
        ("centerLightBias", "center/periphery light"),
        ("shadowPresence", "shadow presence"),
        ("tonalRange", "tonal range"),
    ]
    for key, label in labels:
        value = flatten_text(interpretation.get(key))
        if value:
            parts.append(label + ": " + value)

    roles = handprint.get("desiredRoles") or handprint.get("consensusRoles") or []
    if roles:
        parts.append(
            "Relevant recurring hand roles: "
            + ", ".join(str(role).replace("_", " ") for role in roles)
        )

    parts.append(
        "Use these as cross-portfolio tendencies only. Do not inherit any "
        "witness subject, object, architecture, identity, or layout."
    )
    return " ".join(parts)


def percentile_from_histogram(histogram: Sequence[int], fraction: float) -> float:
    total = sum(histogram)
    if total <= 0:
        return 0.0
    threshold = total * fraction
    running = 0
    for index, count in enumerate(histogram):
        running += count
        if running >= threshold:
            return index / 255.0
    return 1.0


def analyze_witness_image(path: Path) -> dict[str, Any]:
    try:
        from PIL import Image, ImageFilter, ImageStat
    except ImportError as exc:
        raise PainterError(
            "Handprint analysis requires Pillow. "
            "Install labs/velastra/painter/requirements-provider.txt."
        ) from exc

    with Image.open(path) as source:
        image = source.convert("RGB")
        width, height = image.size
        working = image.copy()
        working.thumbnail((256, 256))

    pixels = list(working.getdata())
    if not pixels:
        raise PainterError(f"Witness image has no pixels: {path}")

    luminances: list[float] = []
    saturations: list[float] = []
    warmth: list[float] = []
    dark = 0
    highlight = 0

    for red, green, blue in pixels:
        r = red / 255.0
        g = green / 255.0
        b = blue / 255.0
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        luminances.append(lum)

        maximum = max(r, g, b)
        minimum = min(r, g, b)
        saturation = 0.0 if maximum <= 0 else (maximum - minimum) / maximum
        saturations.append(saturation)
        warmth.append((r - b) / 2.0)

        if lum < 0.22:
            dark += 1
        if lum > 0.78:
            highlight += 1

    gray = working.convert("L")
    histogram = gray.histogram()
    p10 = percentile_from_histogram(histogram, 0.10)
    p90 = percentile_from_histogram(histogram, 0.90)

    edge_image = gray.filter(ImageFilter.FIND_EDGES)
    edge_mean = float(ImageStat.Stat(edge_image).mean[0]) / 255.0

    w, h = working.size
    cx0, cx1 = int(w * 0.25), max(int(w * 0.75), int(w * 0.25) + 1)
    cy0, cy1 = int(h * 0.25), max(int(h * 0.75), int(h * 0.25) + 1)
    center = gray.crop((cx0, cy0, cx1, cy1))
    center_mean = float(ImageStat.Stat(center).mean[0]) / 255.0

    border_values: list[int] = []
    gray_pixels = gray.load()
    border_x = max(1, int(w * 0.18))
    border_y = max(1, int(h * 0.18))
    for y in range(h):
        for x in range(w):
            if (
                x < border_x
                or x >= w - border_x
                or y < border_y
                or y >= h - border_y
            ):
                border_values.append(int(gray_pixels[x, y]))
    edge_luma = (
        sum(border_values) / (255.0 * len(border_values))
        if border_values
        else center_mean
    )

    count = float(len(pixels))
    return {
        "width": width,
        "height": height,
        "aspectRatio": round(width / height, 4) if height else 0.0,
        "meanLuminance": round(sum(luminances) / count, 4),
        "meanSaturation": round(sum(saturations) / count, 4),
        "meanWarmth": round(sum(warmth) / count, 4),
        "darkShare": round(dark / count, 4),
        "highlightShare": round(highlight / count, 4),
        "p10Luminance": round(p10, 4),
        "p90Luminance": round(p90, 4),
        "tonalSpan": round(max(0.0, p90 - p10), 4),
        "edgeActivity": round(edge_mean, 4),
        "centerLuminance": round(center_mean, 4),
        "peripheryLuminance": round(edge_luma, 4),
        "centerLightDelta": round(center_mean - edge_luma, 4),
        "grayscaleEntropy": round(float(gray.entropy()) / 8.0, 4),
    }


def mean_metric(records: Sequence[Mapping[str, Any]], key: str) -> float:
    values = [
        float(record[key])
        for record in records
        if record.get(key) is not None
    ]
    return round(sum(values) / len(values), 4) if values else 0.0


def interpret_handprint(aggregate: Mapping[str, Any]) -> dict[str, str]:
    saturation = float(aggregate.get("meanSaturation") or 0)
    warmth = float(aggregate.get("meanWarmth") or 0)
    edge = float(aggregate.get("edgeActivity") or 0)
    center_delta = float(aggregate.get("centerLightDelta") or 0)
    dark_share = float(aggregate.get("darkShare") or 0)
    span = float(aggregate.get("tonalSpan") or 0)

    return {
        "tonalRestraint": (
            "restrained saturation with selective chromatic emphasis"
            if saturation < 0.42
            else "moderate saturation with selective restraint"
        ),
        "warmthBias": (
            "warm-biased overall, with warmth carrying visual emphasis"
            if warmth > 0.025
            else (
                "cool-biased overall"
                if warmth < -0.025
                else "near-balanced warm/cool field"
            )
        ),
        "edgeCharacter": (
            "soft-to-moderate edge activity; resolution is selective rather than uniformly sharp"
            if edge < 0.22
            else "active edge field with selective softening"
        ),
        "centerLightBias": (
            "center fields tend to hold more light than the periphery"
            if center_delta > 0.035
            else (
                "periphery can carry equal or greater light than the center"
                if center_delta < -0.035
                else "light is distributed without a strong center bias"
            )
        ),
        "shadowPresence": (
            "shadow occupies a substantial share of the image field"
            if dark_share > 0.24
            else "shadow is present but not dominant"
        ),
        "tonalRange": (
            "broad tonal span from deep shadow to selective highlight"
            if span > 0.58
            else "compressed-to-moderate tonal span"
        ),
    }


def build_handprint_registry(
    witness_registry: Mapping[str, Any],
    repo_root: Path,
    template: Mapping[str, Any],
) -> dict[str, Any]:
    approved: list[tuple[str, Mapping[str, Any]]] = []
    for witness_id, entry in (witness_registry.get("entries") or {}).items():
        if not isinstance(entry, Mapping):
            continue
        asset = entry.get("asset")
        if (
            entry.get("status") == "approved"
            and isinstance(asset, Mapping)
            and asset.get("path")
            and asset.get("sha256")
        ):
            approved.append((str(witness_id), entry))

    minimum = int(template.get("minimumApprovedWitnesses") or 0)
    if len(approved) < minimum:
        raise PainterError(
            "Handprint requires at least "
            + str(minimum)
            + " approved witnesses; found "
            + str(len(approved))
            + "."
        )

    witness_records: list[dict[str, Any]] = []
    metric_records: list[dict[str, Any]] = []
    role_counts: dict[str, int] = {}
    exclusions: set[str] = set()
    per_witness: dict[str, Any] = {}

    for witness_id, entry in approved:
        asset = entry.get("asset") or {}
        path = (repo_root / str(asset.get("path"))).resolve()
        try:
            path.relative_to(repo_root.resolve())
        except ValueError as exc:
            raise PainterError(
                f"Witness asset must live inside repository root: {path}"
            ) from exc

        if not path.exists():
            raise PainterError(f"Missing approved witness asset: {path}")

        actual_sha = sha256_file(path)
        if actual_sha != asset.get("sha256"):
            raise PainterError(
                f"Witness hash mismatch for {witness_id}: {path}"
            )

        metrics = analyze_witness_image(path)
        metric_records.append(metrics)
        per_witness[witness_id] = metrics

        roles = [str(role) for role in (entry.get("teach") or [])]
        for role in roles:
            role_counts[role] = role_counts.get(role, 0) + 1

        for exclusion in entry.get("doNotInherit") or []:
            exclusions.add(str(exclusion))

        witness_records.append({
            "id": witness_id,
            "title": entry.get("title"),
            "sha256": actual_sha,
            "path": str(asset.get("path")),
            "roles": roles,
        })

    aggregate_keys = [
        "meanLuminance",
        "meanSaturation",
        "meanWarmth",
        "darkShare",
        "highlightShare",
        "tonalSpan",
        "edgeActivity",
        "centerLuminance",
        "peripheryLuminance",
        "centerLightDelta",
        "grayscaleEntropy",
    ]
    aggregate = {
        key: mean_metric(metric_records, key)
        for key in aggregate_keys
    }

    consensus_threshold = max(2, (len(approved) // 2) + 1)
    consensus_roles = [
        role
        for role, count in sorted(
            role_counts.items(),
            key=lambda item: (-item[1], item[0]),
        )
        if count >= consensus_threshold
    ]

    output = dict(template)
    output["status"] = "built"
    output["corpus"] = {
        "witnessCount": len(witness_records),
        "witnesses": witness_records,
        "roleCounts": dict(sorted(role_counts.items())),
        "consensusThreshold": consensus_threshold,
        "consensusRoles": consensus_roles,
        "doNotInherit": sorted(exclusions),
    }
    output["metrics"] = {
        "perWitness": per_witness,
        "aggregate": aggregate,
    }
    output["interpretation"] = interpret_handprint(aggregate)
    output["provenance"] = {
        "builder": "velastra-painter handprint-build",
        "algorithmVersion": 1,
        "builtAt": utc_now(),
        "witnessRegistrySha256": sha256_bytes(
            canonical_json(witness_registry)
        ),
        "corpusHashes": {
            record["id"]: record["sha256"]
            for record in witness_records
        },
        "note": (
            "Pixel metrics are descriptive portfolio measurements, "
            "not semantic scene facts."
        ),
    }
    return output


def estimate_prompt_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, (len(text) + 3) // 4)


def compact_positive_sections(
    sections: list[dict[str, Any]],
    safe_target_tokens: int | None,
) -> tuple[list[str], dict[str, Any]]:
    active = [dict(section) for section in sections if section.get("text")]

    def rendered() -> str:
        return "\n".join(section["text"] for section in active)

    before = estimate_prompt_tokens(rendered())
    dropped: list[str] = []

    if safe_target_tokens and safe_target_tokens > 0:
        while estimate_prompt_tokens(rendered()) > safe_target_tokens:
            optional = [
                (index, section)
                for index, section in enumerate(active)
                if not section.get("required")
            ]
            if not optional:
                break

            index, section = min(
                optional,
                key=lambda pair: (
                    int(pair[1].get("priority") or 0),
                    -pair[0],
                ),
            )
            dropped.append(str(section.get("id") or "unnamed"))
            active.pop(index)

    after = estimate_prompt_tokens(rendered())
    return [section["text"] for section in active], {
        "estimate": "characters_divided_by_four",
        "beforeTokens": before,
        "afterTokens": after,
        "targetTokens": safe_target_tokens,
        "overTarget": (
            bool(safe_target_tokens)
            and after > int(safe_target_tokens)
        ),
        "droppedSections": dropped,
        "requiredSectionsPreserved": True,
    }


def compile_prompt_bundle(
    manifest: Mapping[str, Any],
    spec: "RenderSpec | None" = None,
) -> dict[str, Any]:
    brief = manifest.get("artBrief") or {}
    scene = manifest.get("scene") or {}
    truth = compile_truth_envelope(manifest)
    style = style_lines(manifest)
    evidence = evidence_lines(manifest)
    witness = witness_lines(manifest, spec)
    handprint = handprint_lines(manifest)
    dialect = spec.prompt_dialect if spec and spec.prompt_dialect else {}
    control = spec.control_contract if spec and spec.control_contract else {}

    negative_contract = control.get("negativePrompt") or {}
    negative_supported = (
        True
        if spec is None
        else (
            negative_contract.get("supported") is True
            or negative_contract.get("supportedByBasePipeline") is True
        )
    )
    safe_target_tokens = (
        (control.get("promptBudget") or {}).get("safeTargetTokens")
    )

    sections: list[dict[str, Any]] = []

    def add(
        section_id: str,
        text: str,
        *,
        priority: int,
        required: bool = False,
    ) -> None:
        if text and not text.endswith(": "):
            sections.append({
                "id": section_id,
                "text": text,
                "priority": priority,
                "required": required,
            })

    add(
        "assignment",
        "Create a finished painterly image from this authored scene direction.",
        priority=100,
        required=True,
    )
    add(
        "authority",
        "Scene truth is authoritative. Style and brush translation may interpret material, light, atmosphere, edge, and composition but may not invent semantic facts.",
        priority=100,
        required=True,
    )
    add(
        "focal_argument",
        f"Primary visual argument: {flatten_text(brief.get('thesis'))}",
        priority=95,
        required=True,
    )

    subjects = truth["subjects"]
    if subjects:
        add(
            "subjects",
            "Explicit subjects: " + " | ".join(subjects),
            priority=100,
            required=True,
        )

    if truth["relation"]:
        add(
            "relation",
            "Explicit relation: " + truth["relation"],
            priority=100,
            required=True,
        )

    if truth["environment"]:
        painterly_truth = (
            (scene.get("environment") or {}).get("painterlyTruth")
            or {}
        )
        painterly_facts = {
            flatten_text(item)
            for item in (painterly_truth.get("facts") or [])
            if flatten_text(item)
        }
        core_environment = [
            item
            for item in truth["environment"]
            if item not in painterly_facts
        ]
        if core_environment:
            add(
                "environment",
                "Environment facts: " + " | ".join(core_environment),
                priority=100,
                required=True,
            )

    if evidence["identityReframe"]:
        add(
            "identity_reframe",
            "IDENTITY REFRAME — " + evidence["identityReframe"],
            priority=112,
            required=True,
        )

    if evidence["required"]:
        visible_count = min(
            evidence["minimumVisible"],
            len(evidence["required"]),
        )
        add(
            "visible_evidence",
            "VISIBLE EVIDENCE CONTRACT — the final image must make at least "
            + str(visible_count)
            + " of these already-true facts clearly perceptible: "
            + " | ".join(evidence["required"]),
            priority=110,
            required=True,
        )

    if evidence["controls"]:
        add(
            "evidence_controls",
            "POSITIVE COMPOSITION CONTROLS — satisfy these through what is visibly present: "
            + " | ".join(evidence["controls"]),
            priority=108,
            required=True,
        )

    hierarchy = flatten_text(brief.get("hierarchy"))
    if hierarchy:
        add(
            "hierarchy",
            f"Focal hierarchy: {hierarchy}",
            priority=90,
            required=True,
        )

    if style["signature"]:
        add(
            "virynism_core",
            "Virynism core — " + style["signature"],
            priority=96,
            required=True,
        )

    handprint_text = handprint_prompt_text(handprint)
    if handprint_text:
        add(
            "handprint",
            "HANDPRINT — " + handprint_text,
            priority=114,
            required=True,
        )

    if witness["active"]:
        roles = ", ".join(witness["roles"]) or "approved visual-hand roles"
        exclusions = ", ".join(witness["doNotInherit"]) or "all depicted scene content"
        add(
            "visual_witness",
            "VISUAL WITNESS — an input image accompanies this request. "
            "Use it only as evidence for these visual-hand roles: "
            + roles
            + ". Rebuild the target image from the authoritative target scene. "
            "Do not inherit witness content including: "
            + exclusions
            + ". Witness scene content is non-canonical.",
            priority=115,
            required=True,
        )

    add(
        "medium",
        f"Medium direction: {flatten_text(brief.get('medium') or manifest.get('medium', {}).get('id'))}",
        priority=70,
    )

    if style["hand"]:
        add(
            "virynism_hand",
            "Virynism — handwriting laws: " + " | ".join(style["hand"]),
            priority=62,
        )

    if style["archetype"]:
        add(
            "virynism_archetype",
            "Virynism — archetype handling: " + " | ".join(style["archetype"]),
            priority=66,
        )

    if style["place"]:
        add(
            "virynism_place",
            "Virynism — place-specific handling: " + " | ".join(style["place"]),
            priority=72,
        )

    camera = flatten_text(
        brief.get("camera")
        or (scene.get("composition") or {}).get("camera")
    )
    if camera:
        add(
            "camera",
            f"Camera and composition: {camera}",
            priority=76,
        )

    lighting = flatten_text(brief.get("lighting"))
    if lighting:
        add(
            "lighting",
            "Lighting: " + lighting,
            priority=74,
        )

    edge = flatten_text(brief.get("edge"))
    if edge:
        add(
            "edge",
            "Edge behavior: " + edge,
            priority=58,
        )

    surface = flatten_text(brief.get("surface"))
    if surface:
        add(
            "surface",
            "Surface and patina: " + surface,
            priority=78,
        )

    if truth["literalMotifs"]:
        add(
            "literal_motifs",
            "Literal motifs permitted by scene truth: "
            + " | ".join(truth["literalMotifs"]),
            priority=80,
        )

    if truth["symbolicMotifs"]:
        add(
            "symbolic_motifs",
            "Symbolic motifs must remain metaphorical or materially embedded: "
            + " | ".join(truth["symbolicMotifs"]),
            priority=50,
        )

    directives = [
        flatten_text(item)
        for item in (brief.get("directives") or [])
    ]
    directives = [item for item in directives if item]
    if directives:
        add(
            "scene_directives",
            "Scene art direction: " + " | ".join(directives),
            priority=68,
        )

    dialect_directives = [
        flatten_text(item)
        for item in (dialect.get("directives") or [])
    ]
    dialect_directives = [
        item for item in dialect_directives if item
    ]
    if dialect_directives:
        add(
            "brush_dialect",
            "Brush translation rules: "
            + " | ".join(dialect_directives),
            priority=64,
        )

    add(
        "closing",
        "Let material, light, gesture, residue, atmosphere, negative space, and painterly edges carry meaning. Preserve strangeness without spectacle.",
        priority=40,
    )

    positive_sections, budget = compact_positive_sections(
        sections,
        int(safe_target_tokens)
        if safe_target_tokens is not None
        else None,
    )

    negative = [
        "Do not invent additional people, identities, relationships, consent, touch, text, logos, symbols, or objects.",
        "Do not turn symbolic motifs into literal world facts.",
        "Do not add decorative UI chrome, cards, captions, labels, diagrams, or typography unless explicitly present in scene facts.",
        "Do not flatten the image into generic concept art, stock illustration, clip art, procedural SVG aesthetics, or staged showroom photography.",
        "Do not contradict the explicit subject, relation, environment, camera, lighting, or provenance constraints.",
    ]

    if style["avoid"]:
        negative.append(
            "Virynism rejects: " + " | ".join(style["avoid"])
        )

    if witness["active"] and witness["doNotInherit"]:
        negative.append(
            "Do not copy Visual Witness scene content: "
            + " | ".join(witness["doNotInherit"])
        )

    dialect_negative = [
        flatten_text(item)
        for item in (dialect.get("negativePriorities") or [])
    ]
    dialect_negative = [
        item for item in dialect_negative if item
    ]
    if dialect_negative:
        negative.append(
            "Brush-specific avoidances: "
            + " | ".join(dialect_negative)
        )

    negative_text = (
        "\n".join(negative)
        if negative_supported
        else ""
    )

    return {
        "positive": "\n".join(positive_sections),
        "negative": negative_text,
        "truthEnvelope": truth,
        "evidence": {
            "id": evidence["id"],
            "version": evidence["version"],
            "minimumVisible": evidence["minimumVisible"],
            "requiredCount": len(evidence["required"]),
            "identityReframe": evidence["identityReframe"],
            "reviewQuestions": evidence["reviewQuestions"],
        },
        "handprint": {
            "active": handprint["active"],
            "witnessCount": handprint.get("witnessCount", 0),
            "desiredRoles": handprint.get("desiredRoles") or [],
            "consensusRoles": handprint.get("consensusRoles") or [],
            "interpretation": handprint.get("interpretation") or {},
            "metrics": handprint.get("metrics") or {},
        },
        "witness": {
            "active": witness["active"],
            "required": witness["required"],
            "selected": witness.get("selected"),
            "title": witness.get("title"),
            "roles": witness.get("roles") or [],
            "doNotInherit": witness.get("doNotInherit") or [],
            "asset": witness.get("asset"),
        },
        "style": {
            "id": (manifest.get("style") or {}).get("id"),
            "version": (manifest.get("style") or {}).get("version"),
            "designation": (manifest.get("style") or {}).get("designation"),
            "emphasis": (manifest.get("style") or {}).get("emphasis") or [],
            "dialect": dialect.get("mode"),
        },
        "control": {
            "negativePromptActive": negative_supported,
            "negativePromptReliability": (
                negative_contract.get("providerTransport")
                if spec and spec.transport == "huggingface"
                else (
                    "supported"
                    if negative_supported
                    else "unsupported"
                )
            ),
            "guidanceMode": (control.get("guidance") or {}).get("mode"),
            "guidanceReliability": (
                (control.get("guidance") or {}).get("providerTransport")
                if spec and spec.transport == "huggingface"
                else (
                    "supported"
                    if (control.get("guidance") or {}).get("supportedByBasePipeline")
                    else "unsupported"
                )
            ),
            "seedReliability": (
                "unsupported"
                if (
                    spec
                    and spec.transport == "huggingface"
                    and (control.get("seedControl") or {}).get("providerSupported") is False
                )
                else "supported"
            ),
            "evidenceStrategy": control.get("evidenceStrategy"),
            "role": control.get("role"),
        },
        "budget": budget,
    }


def load_brush_cabinet(path: Path | None = None) -> dict[str, Any]:
    cabinet_path = path or DEFAULT_BRUSH_REGISTRY
    cabinet = read_json(cabinet_path)
    brushes = cabinet.get("brushes")
    if not isinstance(brushes, dict) or not brushes:
        raise PainterError(f"Brush cabinet has no active brushes: {cabinet_path}")
    return cabinet


def resolve_brush_config(
    *,
    brush_id: str | None,
    transport_id: str | None,
    registry_path: Path | None = None,
) -> tuple[str, dict[str, Any], str, dict[str, Any], dict[str, Any]]:
    cabinet = load_brush_cabinet(registry_path)
    chosen_brush = brush_id or cabinet.get("defaultBrush")
    brushes = cabinet.get("brushes") or {}
    brush = brushes.get(chosen_brush)

    if not isinstance(brush, dict):
        raise PainterError(f"Unknown Velastra brush: {chosen_brush}")

    transports = brush.get("transports") or {}
    cabinet_default = cabinet.get("defaultTransport")
    chosen_transport = (
        transport_id
        or (
            cabinet_default
            if cabinet_default in transports
            else None
        )
        or next(
            (
                key
                for key, value in transports.items()
                if isinstance(value, dict) and value.get("recommended") is True
            ),
            None,
        )
        or next(iter(transports), None)
    )
    transport = transports.get(chosen_transport)

    if not isinstance(transport, dict):
        raise PainterError(
            f"Brush {chosen_brush} does not support transport: {chosen_transport}"
        )

    return chosen_brush, brush, chosen_transport, transport, cabinet


def build_render_spec(args: argparse.Namespace) -> "RenderSpec":
    registry_path = Path(args.brush_registry) if args.brush_registry else None
    brush_id, brush, transport_id, transport, _ = resolve_brush_config(
        brush_id=args.brush,
        transport_id=args.transport,
        registry_path=registry_path,
    )
    defaults = brush.get("defaults") or {}
    control = brush.get("controlContract") or {}
    guidance_contract = control.get("guidance") or {}
    seed_contract = control.get("seedControl") or {}
    attempt_required = (
        seed_contract.get("candidateAttemptRequired") is True
        and transport_id == "huggingface"
    )
    attempt_id = (
        getattr(args, "attempt", None)
        or (utc_now() if attempt_required else None)
    )

    resolved_true_cfg = (
        args.true_cfg_scale
        if getattr(args, "true_cfg_scale", None) is not None
        else (
            guidance_contract.get("diffusersDefault")
            if transport_id == "diffusers"
            else None
        )
    )

    return RenderSpec(
        backend=args.backend or transport.get("backend") or "diffusers",
        task=transport.get("task") or "text_to_image",
        model=args.model or brush.get("model"),
        seed=args.seed if args.seed is not None else int(defaults.get("seed", 190919)),
        width=args.width if args.width is not None else int(defaults.get("width", DEFAULT_WIDTH)),
        height=args.height if args.height is not None else int(defaults.get("height", DEFAULT_HEIGHT)),
        steps=args.steps if args.steps is not None else defaults.get("steps"),
        guidance=args.guidance if args.guidance is not None else defaults.get("guidance"),
        true_cfg_scale=resolved_true_cfg,
        device=args.device or transport.get("device") or "auto",
        dtype=args.dtype or transport.get("dtype") or "auto",
        brush=brush_id,
        transport=transport_id,
        provider=transport.get("provider"),
        token_env=transport.get("tokenEnv"),
        license=brush.get("license"),
        prompt_dialect=brush.get("promptDialect"),
        control_contract=brush.get("controlContract"),
        witness_id=getattr(args, "witness", None),
        repo_root=getattr(args, "repo_root", ".") or ".",
        attempt_id=attempt_id,
    )


@dataclass(frozen=True)
class RenderSpec:
    backend: str
    model: str | None
    seed: int
    width: int
    height: int
    steps: int | None
    guidance: float | None
    device: str
    dtype: str
    task: str = "text_to_image"
    true_cfg_scale: float | None = None
    brush: str | None = None
    transport: str | None = None
    provider: str | None = None
    token_env: str | None = None
    license: str | None = None
    prompt_dialect: Mapping[str, Any] | None = None
    control_contract: Mapping[str, Any] | None = None
    witness_id: str | None = None
    repo_root: str = "."
    attempt_id: str | None = None


def candidate_id(manifest: Mapping[str, Any], prompts: Mapping[str, Any], spec: RenderSpec) -> str:
    identity = {
        "protocol": PROTOCOL,
        "assetKey": manifest["assetKey"],
        "promptBundle": prompts,
        "render": {
            "brush": spec.brush,
            "transport": spec.transport,
            "backend": spec.backend,
            "task": spec.task,
            "provider": spec.provider,
            "model": spec.model,
            "seed": spec.seed,
            "width": spec.width,
            "height": spec.height,
            "steps": spec.steps,
            "guidance": spec.guidance,
            "trueCfgScale": spec.true_cfg_scale,
            "attemptId": spec.attempt_id,
        },
    }
    return sha256_bytes(canonical_json(identity))[:20]


def build_candidate_record(
    manifest: Mapping[str, Any],
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    cid = candidate_id(manifest, prompts, spec)
    return {
        "version": 1,
        "protocol": PROTOCOL,
        "candidateId": cid,
        "assetKey": manifest["assetKey"],
        "status": CANDIDATE_STATUS,
        "reviewRequired": True,
        "canonical": False,
        "createdAt": utc_now(),
        "source": {
            "manifestSha256": sha256_bytes(canonical_json(manifest)),
            "atelierProvenance": manifest.get("provenance"),
            "truthEnvelope": prompts["truthEnvelope"],
            "style": prompts.get("style"),
            "evidence": prompts.get("evidence"),
            "handprint": prompts.get("handprint"),
            "witness": prompts.get("witness"),
            "promptBudget": prompts.get("budget"),
        },
        "render": {
            "backend": spec.backend,
            "task": spec.task,
            "model": spec.model,
            "seed": spec.seed,
            "width": spec.width,
            "height": spec.height,
            "steps": spec.steps,
            "guidance": spec.guidance,
            "trueCfgScale": spec.true_cfg_scale,
            "attemptId": spec.attempt_id,
            "device": spec.device,
            "dtype": spec.dtype,
            "brush": spec.brush,
            "transport": spec.transport,
            "provider": spec.provider,
            "tokenEnv": spec.token_env,
            "license": spec.license,
            "promptDialect": (
                spec.prompt_dialect.get("mode")
                if isinstance(spec.prompt_dialect, Mapping)
                else None
            ),
            "controlContract": prompts.get("control"),
        },
        "prompts": {
            "positive": prompts["positive"],
            "negative": prompts["negative"],
        },
        "output": {
            "path": str(output_path.as_posix()),
            "sha256": None,
            "mediaType": "image/png",
        },
        "laws": {
            "candidateCannotRenderInSanctum": True,
            "candidateCannotMutateRegistry": True,
            "humanReviewRequiredBeforeApproval": True,
            "runtimeGenerationForbidden": True,
            "modelIsBrushNotAuthority": True,
        },
    }


def detect_device(torch_module: Any) -> str:
    if getattr(torch_module, "cuda", None) and torch_module.cuda.is_available():
        return "cuda"
    mps = getattr(getattr(torch_module, "backends", None), "mps", None)
    if mps is not None and mps.is_available():
        return "mps"
    return "cpu"


def resolve_torch_dtype(torch_module: Any, device: str, requested: str) -> Any:
    if requested != "auto":
        try:
            return getattr(torch_module, requested)
        except AttributeError as exc:
            raise PainterError(f"Unknown torch dtype: {requested}") from exc

    if device == "cuda":
        if hasattr(torch_module.cuda, "is_bf16_supported") and torch_module.cuda.is_bf16_supported():
            return torch_module.bfloat16
        return torch_module.float16
    if device == "mps":
        return torch_module.float16
    return torch_module.float32


def render_diffusers(
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    if spec.task != "text_to_image":
        raise PainterError(
            f"Local Diffusers task not implemented for this brush: {spec.task}"
        )

    try:
        import torch
        from diffusers import DiffusionPipeline
    except ImportError as exc:
        raise PainterError(
            "Diffusers backend requires torch and diffusers. "
            "Install the optional authoring dependencies documented beside this script."
        ) from exc

    device = detect_device(torch) if spec.device == "auto" else spec.device
    dtype = resolve_torch_dtype(torch, device, spec.dtype)

    if not spec.model:
        raise PainterError("--model is required for the diffusers backend.")

    load_kwargs: dict[str, Any] = {"dtype": dtype}
    try:
        pipe = DiffusionPipeline.from_pretrained(spec.model, **load_kwargs)
    except TypeError:
        pipe = DiffusionPipeline.from_pretrained(spec.model, torch_dtype=dtype)

    if hasattr(pipe, "to"):
        pipe = pipe.to(device)

    generator_device = "cpu" if device == "mps" else device
    generator = torch.Generator(device=generator_device).manual_seed(spec.seed)

    call_signature = inspect.signature(pipe.__call__)
    accepted = set(call_signature.parameters)
    accepts_kwargs = any(
        parameter.kind is inspect.Parameter.VAR_KEYWORD
        for parameter in call_signature.parameters.values()
    )
    kwargs: dict[str, Any] = {}

    if prompts.get("negative") and ("negative_prompt" in accepted or accepts_kwargs):
        kwargs["negative_prompt"] = prompts["negative"]
    if "width" in accepted or accepts_kwargs:
        kwargs["width"] = spec.width
    if "height" in accepted or accepts_kwargs:
        kwargs["height"] = spec.height
    if spec.steps is not None and ("num_inference_steps" in accepted or accepts_kwargs):
        kwargs["num_inference_steps"] = spec.steps
    if spec.guidance is not None and ("guidance_scale" in accepted or accepts_kwargs):
        kwargs["guidance_scale"] = spec.guidance
    if spec.true_cfg_scale is not None and ("true_cfg_scale" in accepted or accepts_kwargs):
        kwargs["true_cfg_scale"] = spec.true_cfg_scale
    if "generator" in accepted or accepts_kwargs:
        kwargs["generator"] = generator

    result = pipe(prompts["positive"], **kwargs)
    images = getattr(result, "images", None)
    if not images:
        raise PainterError("Diffusers pipeline returned no images.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    images[0].save(output_path, format="PNG")
    return {
        "deviceResolved": device,
        "dtypeResolved": str(dtype),
        "pipelineClass": pipe.__class__.__name__,
    }


def render_huggingface(
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    try:
        from huggingface_hub import InferenceClient
    except ImportError as exc:
        raise PainterError(
            "Hugging Face transport requires huggingface_hub and Pillow. "
            "Install labs/velastra/painter/requirements-provider.txt."
        ) from exc

    if not spec.model:
        raise PainterError("Brush transport did not resolve a model.")

    token_env = spec.token_env or "HF_TOKEN"
    token = os.environ.get(token_env)
    if not token:
        raise PainterError(
            f"{token_env} is not set. Export a Hugging Face token with "
            "Inference Providers permission before rendering. "
            "Credentials must never be stored in a Velastra manifest."
        )

    client = InferenceClient(
        provider=spec.provider or "auto",
        api_key=token,
    )

    if spec.task == "text_to_image":
        request: dict[str, Any] = {
            "prompt": prompts["positive"],
            "height": spec.height,
            "width": spec.width,
            "model": spec.model,
            "seed": spec.seed,
        }
        if prompts.get("negative"):
            request["negative_prompt"] = prompts["negative"]
        if spec.steps is not None:
            request["num_inference_steps"] = spec.steps
        if spec.guidance is not None:
            request["guidance_scale"] = spec.guidance

        image = client.text_to_image(**request)
        witness_runtime = None

    elif spec.task == "image_to_image":
        witness = prompts.get("witness") or {}
        if not witness.get("active"):
            raise PainterError(
                "Image-to-image brush requires an active approved Visual Witness."
            )

        witness_path = resolve_witness_path(
            witness,
            Path(spec.repo_root),
        )
        input_image = witness_path.read_bytes()

        method = client.image_to_image
        signature = inspect.signature(method)
        accepted = set(signature.parameters)
        accepts_kwargs = any(
            parameter.kind is inspect.Parameter.VAR_KEYWORD
            for parameter in signature.parameters.values()
        )

        request = {
            "prompt": prompts["positive"],
            "model": spec.model,
        }
        if prompts.get("negative") and (
            "negative_prompt" in accepted or accepts_kwargs
        ):
            request["negative_prompt"] = prompts["negative"]
        if spec.steps is not None and (
            "num_inference_steps" in accepted or accepts_kwargs
        ):
            request["num_inference_steps"] = spec.steps
        if spec.guidance is not None and (
            "guidance_scale" in accepted or accepts_kwargs
        ):
            request["guidance_scale"] = spec.guidance
        if "target_size" in accepted or accepts_kwargs:
            request["target_size"] = {
                "width": spec.width,
                "height": spec.height,
            }

        image = method(input_image, **request)
        witness_runtime = {
            "id": witness.get("selected"),
            "path": str(witness_path.as_posix()),
            "sha256": (witness.get("asset") or {}).get("sha256"),
            "roles": witness.get("roles") or [],
        }

    else:
        raise PainterError(
            f"Unknown Hugging Face image task: {spec.task}"
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")
    return {
        "providerResolved": spec.provider or "auto",
        "transport": "huggingface",
        "task": spec.task,
        "credentialEnv": token_env,
        "witness": witness_runtime,
    }


def cmd_handprint_build(args: argparse.Namespace) -> int:
    witness_registry = load_witness_registry(
        Path(args.witness_registry)
        if args.witness_registry
        else None
    )
    template_path = Path(args.handprint)
    template = read_json(template_path)
    repo_root = Path(args.repo_root).resolve()

    handprint = build_handprint_registry(
        witness_registry,
        repo_root,
        template,
    )

    output = Path(args.output or template_path)
    write_json(output, handprint)
    print(output)
    print(
        "witnesses="
        + str(handprint["corpus"]["witnessCount"])
        + " consensus="
        + ",".join(handprint["corpus"]["consensusRoles"])
    )
    return 0


def cmd_handprint(args: argparse.Namespace) -> int:
    registry = read_json(Path(args.handprint))
    if args.json:
        print(json.dumps(registry, indent=2, ensure_ascii=False))
        return 0

    corpus = registry.get("corpus") or {}
    print(
        f"{registry.get('designation', 'Handprint')} | "
        f"{registry.get('status', 'unknown')} | "
        f"{corpus.get('witnessCount', 0)} witnesses"
    )
    roles = corpus.get("consensusRoles") or []
    if roles:
        print("consensus: " + ", ".join(roles))
    for key, value in (registry.get("interpretation") or {}).items():
        if value:
            print(f"{key}: {value}")
    return 0


def load_witness_registry(path: Path | None = None) -> dict[str, Any]:
    registry_path = path or DEFAULT_WITNESS_REGISTRY
    registry = read_json(registry_path)
    entries = registry.get("entries")
    if not isinstance(entries, dict):
        raise PainterError(
            f"Visual Witness registry has no entries object: {registry_path}"
        )
    return registry


def cmd_witnesses(args: argparse.Namespace) -> int:
    registry_path = Path(args.registry) if args.registry else None
    registry = load_witness_registry(registry_path)

    if args.json:
        print(json.dumps(registry, indent=2, ensure_ascii=False))
        return 0

    for witness_id, entry in registry.get("entries", {}).items():
        roles = ", ".join(entry.get("teach") or [])
        asset = entry.get("asset") or {}
        path = asset.get("path") or "no approved asset"
        print(
            f"{witness_id}: {entry.get('title', witness_id)} | "
            f"{entry.get('status', 'unknown')} | {roles} | {path}"
        )
    return 0


def cmd_witness_register(args: argparse.Namespace) -> int:
    try:
        from PIL import Image
    except ImportError as exc:
        raise PainterError(
            "Witness registration requires Pillow. "
            "Install labs/velastra/painter/requirements-provider.txt."
        ) from exc

    repo_root = Path(args.repo_root).resolve()
    registry_path = Path(args.registry)
    registry = load_witness_registry(registry_path)
    entries = registry["entries"]
    entry = entries.get(args.witness_id)

    if not isinstance(entry, dict):
        raise PainterError(
            f"Unknown Visual Witness ID: {args.witness_id}"
        )

    source = Path(args.image)
    if not source.exists():
        raise PainterError(
            f"Visual Witness source image does not exist: {source}"
        )

    final_dir = repo_root / "assets" / "velastra" / "witnesses"
    final_dir.mkdir(parents=True, exist_ok=True)
    final_path = final_dir / f"{args.witness_id}.png"

    if final_path.exists() and not args.replace:
        raise PainterError(
            f"Visual Witness asset already exists: {final_path}. "
            "Use --replace only after explicit review."
        )

    with Image.open(source) as image:
        normalized = image.convert("RGB")
        width, height = normalized.size
        normalized.save(final_path, format="PNG")

    final_sha = sha256_file(final_path)
    entry["status"] = "approved"
    entry["asset"] = {
        "path": repo_relative_path(repo_root, final_path),
        "sha256": final_sha,
        "width": width,
        "height": height,
        "mediaType": "image/png",
    }
    provenance = entry.setdefault("provenance", {})
    provenance.update({
        "assetSource": "velastra_witness_register",
        "reviewedBy": args.reviewed_by,
        "reviewedAt": utc_now(),
        "reviewNote": args.review_note,
        "imageSha256": final_sha,
    })

    output_registry = Path(args.output_registry or registry_path)
    write_json(output_registry, registry)

    print(final_path)
    print(output_registry)
    return 0


def cmd_brushes(args: argparse.Namespace) -> int:
    registry_path = Path(args.brush_registry) if args.brush_registry else None
    cabinet = load_brush_cabinet(registry_path)
    if args.json:
        print(json.dumps(cabinet, indent=2, ensure_ascii=False))
        return 0

    default = cabinet.get("defaultBrush")
    for brush_id, brush in (cabinet.get("brushes") or {}).items():
        marker = "*" if brush_id == default else " "
        transports = ", ".join((brush.get("transports") or {}).keys())
        print(
            f"{marker} {brush_id}: {brush.get('label', brush_id)} | "
            f"{brush.get('model')} | {brush.get('license')} | {transports}"
        )
    return 0


def cmd_plan(args: argparse.Namespace) -> int:
    manifest = unwrap_manifest(read_json(Path(args.manifest)))
    require_manifest(manifest)
    spec = build_render_spec(args)
    prompts = compile_prompt_bundle(manifest, spec)
    cid = candidate_id(manifest, prompts, spec)
    out_dir = Path(args.out_dir)
    image_path = out_dir / manifest["assetKey"] / f"{cid}.png"
    record = build_candidate_record(manifest, prompts, spec, image_path)
    request_path = out_dir / manifest["assetKey"] / f"{cid}.candidate.json"
    write_json(request_path, record)
    print(request_path)
    return 0


def cmd_render(args: argparse.Namespace) -> int:
    manifest = unwrap_manifest(read_json(Path(args.manifest)))
    require_manifest(manifest)
    spec = build_render_spec(args)
    prompts = compile_prompt_bundle(manifest, spec)
    cid = candidate_id(manifest, prompts, spec)
    out_dir = Path(args.out_dir)
    image_path = out_dir / manifest["assetKey"] / f"{cid}.png"
    record_path = out_dir / manifest["assetKey"] / f"{cid}.candidate.json"
    record = build_candidate_record(manifest, prompts, spec, image_path)

    if spec.backend == "diffusers":
        runtime = render_diffusers(prompts, spec, image_path)
    elif spec.backend == "huggingface":
        runtime = render_huggingface(prompts, spec, image_path)
    else:
        raise PainterError(f"Unknown rendering backend: {spec.backend}")

    record["render"]["runtime"] = runtime

    record["output"]["sha256"] = sha256_file(image_path)
    write_json(record_path, record)
    print(image_path)
    print(record_path)
    return 0


def repo_relative_path(repo_root: Path, path: Path) -> str:
    try:
        relative = path.resolve().relative_to(repo_root.resolve())
    except ValueError as exc:
        raise PainterError(
            f"Approved asset must live inside repository root {repo_root}; got {path}"
        ) from exc
    return relative.as_posix()


def cmd_approve(args: argparse.Namespace) -> int:
    candidate_path = Path(args.candidate)
    candidate = read_json(candidate_path)
    if candidate.get("protocol") != PROTOCOL or candidate.get("status") != CANDIDATE_STATUS:
        raise PainterError("Approval requires a Velastra candidate record.")
    if candidate.get("reviewRequired") is not True:
        raise PainterError("Candidate does not carry the required review gate.")

    image_path = Path(candidate.get("output", {}).get("path") or "")
    if not image_path.exists():
        raise PainterError(f"Candidate image does not exist: {image_path}")

    actual_sha = sha256_file(image_path)
    recorded_sha = candidate.get("output", {}).get("sha256")
    if recorded_sha and recorded_sha != actual_sha:
        raise PainterError("Candidate image hash does not match its sidecar record.")

    registry_path = Path(args.registry)
    registry = read_json(registry_path)
    entries = registry.setdefault("entries", {})
    if not isinstance(entries, dict):
        raise PainterError("Asset registry `entries` must be an object.")

    repo_root = Path(args.repo_root)
    final_dir = repo_root / "assets" / "velastra" / "approved"
    final_dir.mkdir(parents=True, exist_ok=True)
    suffix = image_path.suffix.lower() or ".png"
    final_path = final_dir / f"{candidate['assetKey']}{suffix}"

    if final_path.exists() and not args.replace:
        raise PainterError(
            f"Approved asset already exists: {final_path}. Use --replace only after explicit review."
        )

    shutil.copy2(image_path, final_path)
    final_sha = sha256_file(final_path)

    entries[candidate["assetKey"]] = {
        "status": APPROVED_STATUS,
        "path": repo_relative_path(repo_root, final_path),
        "sha256": final_sha,
        "provenance": {
            "source": "velastra_painter_bridge",
            "candidateId": candidate["candidateId"],
            "candidateRecord": candidate_path.as_posix(),
            "manifestSha256": candidate.get("source", {}).get("manifestSha256"),
            "brush": candidate.get("render", {}).get("brush"),
            "transport": candidate.get("render", {}).get("transport"),
            "backend": candidate.get("render", {}).get("backend"),
            "provider": candidate.get("render", {}).get("provider"),
            "model": candidate.get("render", {}).get("model"),
            "license": candidate.get("render", {}).get("license"),
            "promptDialect": candidate.get("render", {}).get("promptDialect"),
            "style": candidate.get("source", {}).get("style"),
            "handprint": candidate.get("source", {}).get("handprint"),
            "witness": candidate.get("source", {}).get("witness"),
            "seed": candidate.get("render", {}).get("seed"),
            "attemptId": candidate.get("render", {}).get("attemptId"),
            "reviewedBy": args.reviewed_by,
            "reviewedAt": utc_now(),
            "reviewNote": args.review_note,
            "imageSha256": final_sha,
        },
    }

    output_registry = Path(args.output_registry or registry_path)
    write_json(output_registry, registry)

    candidate["status"] = APPROVED_STATUS
    candidate["reviewRequired"] = False
    candidate["canonical"] = True
    candidate["approval"] = {
        "reviewedBy": args.reviewed_by,
        "reviewedAt": utc_now(),
        "reviewNote": args.review_note,
        "approvedPath": repo_relative_path(repo_root, final_path),
        "sha256": final_sha,
    }
    write_json(candidate_path, candidate)

    print(final_path)
    print(output_registry)
    return 0


def add_render_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--brush", help="Named brush from world/velastra-brushes.json.")
    parser.add_argument("--transport", help="Brush transport, such as huggingface or diffusers.")
    parser.add_argument("--witness", help="Explicit approved Visual Witness ID when the brush supports references.")
    parser.add_argument("--attempt", help="Explicit attempt identity for transports without reliable seed control.")
    parser.add_argument("--repo-root", default=".", help="Repository root used to resolve approved witness assets.")
    parser.add_argument("--brush-registry", help="Optional alternate brush cabinet path.")
    parser.add_argument(
        "--backend",
        choices=["diffusers", "huggingface"],
        help="Advanced backend override; normally resolved by the selected brush transport.",
    )
    parser.add_argument("--model", help="Advanced model override.")
    parser.add_argument("--seed", type=int)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--steps", type=int)
    parser.add_argument("--guidance", type=float)
    parser.add_argument(
        "--true-cfg-scale",
        type=float,
        help="Traditional CFG scale for pipelines such as Qwen Image when supported.",
    )
    parser.add_argument("--device")
    parser.add_argument(
        "--dtype",
        help="Torch dtype name (float32, float16, bfloat16) or auto.",
    )
    parser.add_argument("--out-dir", default=".velastra/candidates")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="velastra-painter",
        description="Authoring-side painter bridge for Velastra Atelier Manifests.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", help="Compile prompts and a candidate sidecar without rendering.")
    plan.add_argument("manifest")
    add_render_arguments(plan)
    plan.set_defaults(func=cmd_plan)

    render = sub.add_parser("render", help="Render a candidate image. Candidate remains unapproved.")
    render.add_argument("manifest")
    add_render_arguments(render)
    render.set_defaults(func=cmd_render)

    brushes = sub.add_parser("brushes", help="List configured Velastra brushes.")
    brushes.add_argument("--brush-registry")
    brushes.add_argument("--json", action="store_true")
    brushes.set_defaults(func=cmd_brushes)

    handprint = sub.add_parser(
        "handprint",
        help="Inspect the current Virynism portfolio handprint.",
    )
    handprint.add_argument("--handprint", default="world/velastra-handprint.json")
    handprint.add_argument("--json", action="store_true")
    handprint.set_defaults(func=cmd_handprint)

    handprint_build = sub.add_parser(
        "handprint-build",
        help="Rebuild the Virynism Handprint from approved sealed witness pixels.",
    )
    handprint_build.add_argument("--witness-registry", default="world/velastra-witnesses.json")
    handprint_build.add_argument("--handprint", default="world/velastra-handprint.json")
    handprint_build.add_argument("--repo-root", default=".")
    handprint_build.add_argument("--output")
    handprint_build.set_defaults(func=cmd_handprint_build)

    witnesses = sub.add_parser("witnesses", help="List curated Virynism Visual Witnesses.")
    witnesses.add_argument("--registry", default="world/velastra-witnesses.json")
    witnesses.add_argument("--json", action="store_true")
    witnesses.set_defaults(func=cmd_witnesses)

    witness_register = sub.add_parser(
        "witness-register",
        help="Approve and seal an image asset into the Visual Witness canon.",
    )
    witness_register.add_argument("witness_id")
    witness_register.add_argument("image")
    witness_register.add_argument("--registry", default="world/velastra-witnesses.json")
    witness_register.add_argument("--repo-root", default=".")
    witness_register.add_argument("--output-registry")
    witness_register.add_argument("--reviewed-by", required=True)
    witness_register.add_argument("--review-note", required=True)
    witness_register.add_argument("--replace", action="store_true")
    witness_register.set_defaults(func=cmd_witness_register)

    approve = sub.add_parser("approve", help="Promote a reviewed candidate into a registry copy.")
    approve.add_argument("candidate")
    approve.add_argument("--registry", default="world/velastra-assets.json")
    approve.add_argument("--repo-root", default=".")
    approve.add_argument("--output-registry")
    approve.add_argument("--reviewed-by", required=True)
    approve.add_argument("--review-note", required=True)
    approve.add_argument("--replace", action="store_true")
    approve.set_defaults(func=cmd_approve)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except PainterError as exc:
        print(f"velastra-painter: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
