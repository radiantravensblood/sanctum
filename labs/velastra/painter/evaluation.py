#!/usr/bin/env python3
"""Transparent candidate evaluation for Velastra Pressure Calibration.

This module measures candidates. It does not approve them, judge scene truth,
or decide aesthetic quality.
"""

from __future__ import annotations

import json
import math
import statistics
from pathlib import Path
from typing import Any, Mapping, Sequence


ROLE_METRICS: dict[str, tuple[str, ...]] = {
    "edge_behavior": (
        "edgeActivity",
    ),
    "tonal_memory": (
        "meanWarmth",
        "meanSaturation",
        "tonalSpan",
        "highlightShare",
    ),
    "compositional_cadence": (
        "centerLightDelta",
        "centerLuminance",
        "peripheryLuminance",
    ),
    "material_hand": (
        "edgeActivity",
        "grayscaleEntropy",
        "tonalSpan",
    ),
    "spatial_depth": (
        "darkShare",
        "tonalSpan",
        "centerLightDelta",
    ),
    "sacred_incompletion": (
        "edgeActivity",
        "grayscaleEntropy",
        "tonalSpan",
    ),
    "relational_light": (
        "centerLightDelta",
        "highlightShare",
        "darkShare",
    ),
    "intimate_presence": (
        "edgeActivity",
        "meanLuminance",
        "centerLightDelta",
    ),
}


class EvaluationError(RuntimeError):
    pass


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise EvaluationError(f"JSON file does not exist: {path}") from exc
    except json.JSONDecodeError as exc:
        raise EvaluationError(f"Invalid JSON: {path}: {exc}") from exc


def analyze_image_metrics(path: Path) -> dict[str, Any]:
    """Measure the same bounded visual vocabulary used by Handprint."""
    try:
        from PIL import Image, ImageFilter, ImageStat
    except ImportError as exc:
        raise EvaluationError(
            "Candidate evaluation requires Pillow."
        ) from exc

    if not path.exists():
        raise EvaluationError(f"Image does not exist: {path}")

    with Image.open(path) as source:
        image = source.convert("RGB")
        width, height = image.size
        working = image.copy()
        working.thumbnail((256, 256))

    pixels = list(working.getdata())
    if not pixels:
        raise EvaluationError(f"Image has no pixels: {path}")

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
        saturation = (
            0.0
            if maximum <= 0
            else (maximum - minimum) / maximum
        )
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
    cx0 = int(w * 0.25)
    cx1 = max(int(w * 0.75), cx0 + 1)
    cy0 = int(h * 0.25)
    cy1 = max(int(h * 0.75), cy0 + 1)
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

    periphery_mean = (
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
        "peripheryLuminance": round(periphery_mean, 4),
        "centerLightDelta": round(center_mean - periphery_mean, 4),
        "grayscaleEntropy": round(float(gray.entropy()) / 8.0, 4),
    }


def percentile_from_histogram(
    histogram: Sequence[int],
    fraction: float,
) -> float:
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


def _normalized_outside_distance(
    value: float,
    minimum: float,
    maximum: float,
    stddev: float,
) -> float:
    if minimum <= value <= maximum:
        return 0.0

    nearest = minimum if value < minimum else maximum
    scale = max(
        abs(maximum - minimum),
        abs(stddev),
        0.05,
    )
    return abs(value - nearest) / scale


def range_adherence(
    value: float,
    distribution: Mapping[str, Any],
) -> dict[str, Any]:
    minimum = float(distribution.get("min") or 0.0)
    maximum = float(distribution.get("max") or 0.0)
    median = float(distribution.get("median") or 0.0)
    stddev = float(distribution.get("stddev") or 0.0)
    span = max(abs(maximum - minimum), 0.05)

    outside = _normalized_outside_distance(
        value,
        minimum,
        maximum,
        stddev,
    )
    score = max(0.0, 1.0 - min(1.0, outside))

    return {
        "value": round(value, 4),
        "min": round(minimum, 4),
        "max": round(maximum, 4),
        "median": round(median, 4),
        "stddev": round(stddev, 4),
        "withinObservedRange": minimum <= value <= maximum,
        "outsideDistance": round(outside, 4),
        "medianDistanceNormalized": round(
            abs(value - median) / span,
            4,
        ),
        "rangeAdherence": round(score, 4),
    }


def evaluate_handprint_adherence(
    metrics: Mapping[str, Any],
    handprint: Mapping[str, Any],
    roles: Sequence[str] | None = None,
) -> dict[str, Any]:
    facets = (handprint.get("facets") or {}).get("byRole") or {}
    chosen_roles = list(roles or [])
    if not chosen_roles:
        chosen_roles = [
            role
            for role, facet in facets.items()
            if isinstance(facet, Mapping)
            and facet.get("eligibleForRender") is True
        ]

    by_role: dict[str, Any] = {}
    all_scores: list[float] = []
    all_in_range: list[bool] = []
    all_median_distances: list[float] = []

    for role in chosen_roles:
        facet = facets.get(role)
        if (
            not isinstance(facet, Mapping)
            or facet.get("eligibleForRender") is not True
        ):
            continue

        metric_names = ROLE_METRICS.get(role, ())
        facet_metrics = facet.get("metrics") or {}
        measured: dict[str, Any] = {}
        scores: list[float] = []
        in_range: list[bool] = []
        median_distances: list[float] = []

        for metric_name in metric_names:
            if metric_name not in metrics:
                continue
            distribution = facet_metrics.get(metric_name)
            if not isinstance(distribution, Mapping):
                continue

            detail = range_adherence(
                float(metrics[metric_name]),
                distribution,
            )
            measured[metric_name] = detail
            scores.append(float(detail["rangeAdherence"]))
            in_range.append(bool(detail["withinObservedRange"]))
            median_distances.append(
                float(detail["medianDistanceNormalized"])
            )

        if not measured:
            continue

        facet_score = statistics.fmean(scores)
        facet_in_range = (
            sum(1 for value in in_range if value) / len(in_range)
        )
        facet_median_distance = statistics.fmean(
            median_distances
        )

        by_role[role] = {
            "witnessCount": int(facet.get("witnessCount") or 0),
            "support": facet.get("support"),
            "metricCount": len(measured),
            "rangeAdherence": round(facet_score, 4),
            "inRangeRate": round(facet_in_range, 4),
            "medianDistanceNormalized": round(
                facet_median_distance,
                4,
            ),
            "metrics": measured,
        }

        all_scores.extend(scores)
        all_in_range.extend(in_range)
        all_median_distances.extend(median_distances)

    return {
        "rolesRequested": chosen_roles,
        "rolesEvaluated": list(by_role),
        "rangeAdherence": (
            round(statistics.fmean(all_scores), 4)
            if all_scores
            else None
        ),
        "inRangeRate": (
            round(
                sum(1 for value in all_in_range if value)
                / len(all_in_range),
                4,
            )
            if all_in_range
            else None
        ),
        "medianDistanceNormalized": (
            round(statistics.fmean(all_median_distances), 4)
            if all_median_distances
            else None
        ),
        "byRole": by_role,
        "law": (
            "Range adherence is descriptive proximity to the reviewed "
            "Handprint facet envelope. It is not an aesthetic score."
        ),
    }


def _coarse_pixels(
    path: Path,
    mode: str,
    size: tuple[int, int],
) -> list[Any]:
    try:
        from PIL import Image
    except ImportError as exc:
        raise EvaluationError(
            "Candidate evaluation requires Pillow."
        ) from exc

    with Image.open(path) as source:
        image = source.convert(mode).resize(size)
        return list(image.getdata())


def _dhash_bits(path: Path) -> list[int]:
    try:
        from PIL import Image
    except ImportError as exc:
        raise EvaluationError(
            "Candidate evaluation requires Pillow."
        ) from exc

    with Image.open(path) as source:
        image = source.convert("L").resize((9, 8))
        pixels = list(image.getdata())

    bits: list[int] = []
    for y in range(8):
        row = pixels[y * 9 : (y + 1) * 9]
        for x in range(8):
            bits.append(1 if row[x] > row[x + 1] else 0)
    return bits


def witness_spatial_similarity(
    candidate_path: Path,
    witness_path: Path,
) -> dict[str, Any]:
    """Coarse, transparent structure/color similarity. Not semantic copying."""
    if not candidate_path.exists():
        raise EvaluationError(
            f"Candidate image does not exist: {candidate_path}"
        )
    if not witness_path.exists():
        raise EvaluationError(
            f"Witness image does not exist: {witness_path}"
        )

    rgb_a = _coarse_pixels(candidate_path, "RGB", (16, 16))
    rgb_b = _coarse_pixels(witness_path, "RGB", (16, 16))
    gray_a = _coarse_pixels(candidate_path, "L", (16, 16))
    gray_b = _coarse_pixels(witness_path, "L", (16, 16))

    rgb_abs = 0.0
    rgb_count = 0
    for first, second in zip(rgb_a, rgb_b):
        for a, b in zip(first, second):
            rgb_abs += abs(float(a) - float(b))
            rgb_count += 1

    lum_abs = sum(
        abs(float(a) - float(b))
        for a, b in zip(gray_a, gray_b)
    )

    rgb_similarity = 1.0 - (
        rgb_abs / (255.0 * max(rgb_count, 1))
    )
    luminance_similarity = 1.0 - (
        lum_abs / (255.0 * max(len(gray_a), 1))
    )

    bits_a = _dhash_bits(candidate_path)
    bits_b = _dhash_bits(witness_path)
    equal_bits = sum(
        1 for a, b in zip(bits_a, bits_b) if a == b
    )
    dhash_similarity = equal_bits / max(len(bits_a), 1)

    aggregate = statistics.fmean([
        rgb_similarity,
        luminance_similarity,
        dhash_similarity,
    ])

    return {
        "score": round(aggregate, 4),
        "coarseRgbSimilarity": round(rgb_similarity, 4),
        "coarseLuminanceSimilarity": round(
            luminance_similarity,
            4,
        ),
        "dHashSimilarity": round(dhash_similarity, 4),
        "candidate": str(candidate_path.as_posix()),
        "witness": str(witness_path.as_posix()),
        "law": (
            "This is coarse spatial/color similarity only. It does not "
            "establish semantic copying or authorship."
        ),
    }


def resolve_witness_path(
    candidate_record: Mapping[str, Any],
    witness_registry: Mapping[str, Any],
    repo_root: Path,
) -> tuple[str | None, Path | None]:
    witness = (candidate_record.get("source") or {}).get("witness") or {}
    witness_id = witness.get("selected")

    if not witness_id:
        return None, None

    entries = witness_registry.get("entries") or {}
    entry = entries.get(witness_id)
    if not isinstance(entry, Mapping):
        raise EvaluationError(
            f"Candidate names unknown witness: {witness_id}"
        )

    asset = entry.get("asset") or {}
    relative = asset.get("path")
    if not relative:
        raise EvaluationError(
            f"Witness has no approved asset path: {witness_id}"
        )

    path = (repo_root / str(relative)).resolve()
    try:
        path.relative_to(repo_root.resolve())
    except ValueError as exc:
        raise EvaluationError(
            f"Witness asset leaves repository root: {path}"
        ) from exc

    return str(witness_id), path


def evaluate_candidate(
    *,
    image_path: Path,
    candidate_record: Mapping[str, Any],
    handprint: Mapping[str, Any],
    witness_registry: Mapping[str, Any],
    repo_root: Path,
    roles: Sequence[str] | None = None,
) -> dict[str, Any]:
    metrics = analyze_image_metrics(image_path)
    adherence = evaluate_handprint_adherence(
        metrics,
        handprint,
        roles=roles,
    )

    witness_id, witness_path = resolve_witness_path(
        candidate_record,
        witness_registry,
        repo_root,
    )
    similarity = (
        witness_spatial_similarity(image_path, witness_path)
        if witness_path is not None
        else None
    )

    pressure = (
        (candidate_record.get("source") or {}).get(
            "handprintPressure"
        )
        or {}
    )

    return {
        "version": 1,
        "candidateId": candidate_record.get("candidateId"),
        "assetKey": candidate_record.get("assetKey"),
        "image": str(image_path.as_posix()),
        "pressure": {
            "active": pressure.get("active"),
            "profile": pressure.get("profile"),
            "mode": pressure.get("mode"),
            "combined": pressure.get("combined"),
        },
        "ablation": (
            candidate_record.get("render") or {}
        ).get("ablation"),
        "attemptId": (
            candidate_record.get("render") or {}
        ).get("attemptId"),
        "metrics": metrics,
        "handprintAdherence": adherence,
        "witnessSpatialSimilarity": similarity,
        "witnessId": witness_id,
        "laws": {
            "evaluationCannotPromoteCandidate": True,
            "metricScoreCannotReplaceHumanReview": True,
            "sceneTruthRequiresHumanReview": True,
            "spatialSimilarityIsNotSemanticCopyingProof": True,
        },
    }


def _numeric_values(
    evaluations: Sequence[Mapping[str, Any]],
    path: Sequence[str],
) -> list[float]:
    values: list[float] = []
    for evaluation in evaluations:
        current: Any = evaluation
        for key in path:
            if not isinstance(current, Mapping):
                current = None
                break
            current = current.get(key)
        if current is not None:
            values.append(float(current))
    return values


def distribution(values: Sequence[float]) -> dict[str, Any]:
    if not values:
        return {
            "count": 0,
            "mean": None,
            "median": None,
            "min": None,
            "max": None,
            "stddev": None,
        }

    return {
        "count": len(values),
        "mean": round(statistics.fmean(values), 4),
        "median": round(statistics.median(values), 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
        "stddev": round(
            statistics.pstdev(values)
            if len(values) > 1
            else 0.0,
            4,
        ),
    }


def summarize_condition(
    evaluations: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    adherence = _numeric_values(
        evaluations,
        ("handprintAdherence", "rangeAdherence"),
    )
    in_range = _numeric_values(
        evaluations,
        ("handprintAdherence", "inRangeRate"),
    )
    witness_similarity = _numeric_values(
        evaluations,
        ("witnessSpatialSimilarity", "score"),
    )

    return {
        "count": len(evaluations),
        "handprintRangeAdherence": distribution(adherence),
        "handprintInRangeRate": distribution(in_range),
        "witnessSpatialSimilarity": distribution(
            witness_similarity
        ),
    }


def summarize_trial(
    witness_only: Sequence[Mapping[str, Any]],
    combined: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    b = summarize_condition(witness_only)
    c = summarize_condition(combined)

    def delta(
        left: Mapping[str, Any],
        right: Mapping[str, Any],
        key: str,
    ) -> float | None:
        lv = ((left.get(key) or {}).get("mean"))
        rv = ((right.get(key) or {}).get("mean"))
        if lv is None or rv is None:
            return None
        return round(float(rv) - float(lv), 4)

    return {
        "witnessOnly": b,
        "governingCombined": c,
        "deltaCombinedMinusWitnessOnly": {
            "handprintRangeAdherence": delta(
                b,
                c,
                "handprintRangeAdherence",
            ),
            "handprintInRangeRate": delta(
                b,
                c,
                "handprintInRangeRate",
            ),
            "witnessSpatialSimilarity": delta(
                b,
                c,
                "witnessSpatialSimilarity",
            ),
        },
        "interpretationBoundary": (
            "These are descriptive distributions over stochastic provider "
            "outputs. They are not a significance test, aesthetic ranking, "
            "or replacement for scene-truth review."
        ),
    }
