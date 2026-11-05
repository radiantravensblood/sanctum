#!/usr/bin/env python3
"""Evidence-bounded Handprint Grip derivation.

Grip does not redefine the historical Handprint. It interprets replicated
pressure-trial behavior as anchors, freedoms, and tendencies with explicit
scope and provenance.
"""

from __future__ import annotations

import hashlib
import json
import statistics
from datetime import datetime, timezone
from typing import Any, Mapping, Sequence


class GripError(RuntimeError):
    pass


METRIC_LABELS: dict[str, str] = {
    "meanLuminance": "overall luminance field",
    "meanSaturation": "overall saturation",
    "meanWarmth": "warmth bias",
    "darkShare": "dark-field occupancy",
    "highlightShare": "highlight occupancy",
    "tonalSpan": "tonal-span breadth",
    "edgeActivity": "edge activity",
    "centerLuminance": "center luminance",
    "peripheryLuminance": "peripheral luminance",
    "centerLightDelta": "center/periphery light relationship",
    "grayscaleEntropy": "material and tonal information density",
}


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(
        microsecond=0
    ).isoformat().replace("+00:00", "Z")


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


def metric_roles(
    handprint: Mapping[str, Any],
    role_metrics: Mapping[str, Sequence[str]],
) -> dict[str, list[str]]:
    facets = (handprint.get("facets") or {}).get("byRole") or {}
    result: dict[str, list[str]] = {}

    for role, names in role_metrics.items():
        facet = facets.get(role)
        if (
            not isinstance(facet, Mapping)
            or facet.get("eligibleForRender") is not True
        ):
            continue

        facet_metrics = facet.get("metrics") or {}
        for name in names:
            if name not in facet_metrics:
                continue
            result.setdefault(name, []).append(role)

    return {
        metric: sorted(set(roles))
        for metric, roles in result.items()
    }


def _direction(
    delta: float,
    baseline_stddev: float,
    deadband_in_stddev: float,
    minimum_baseline_stddev: float,
) -> str:
    scale = max(
        abs(baseline_stddev),
        minimum_baseline_stddev,
    )
    normalized = delta / scale
    if abs(normalized) <= deadband_in_stddev:
        return "stable"
    return "higher" if normalized > 0 else "lower"


def classify_metric(
    *,
    metric: str,
    witness_only: Sequence[float],
    governing: Sequence[float],
    thresholds: Mapping[str, Any],
    roles: Sequence[str],
) -> tuple[str, dict[str, Any]]:
    b = distribution(witness_only)
    c = distribution(governing)

    minimum_stddev = float(
        thresholds.get("minimumBaselineStddev") or 0.001
    )
    anchor_ratio = float(
        thresholds.get("anchorMaxStddevRatio") or 0.67
    )
    anchor_shift = float(
        thresholds.get(
            "anchorMaxMeanShiftInBaselineStddev"
        )
        or 1.0
    )
    freedom_ratio = float(
        thresholds.get("freedomMinStddevRatio") or 1.5
    )
    deadband = float(
        thresholds.get(
            "stableDirectionDeadbandInBaselineStddev"
        )
        or 0.25
    )

    b_std = float(b.get("stddev") or 0.0)
    c_std = float(c.get("stddev") or 0.0)
    b_mean = float(b.get("mean") or 0.0)
    c_mean = float(c.get("mean") or 0.0)
    delta = c_mean - b_mean

    reliable_baseline_variance = b_std >= minimum_stddev
    stddev_ratio = (
        c_std / b_std
        if reliable_baseline_variance and b_std > 0
        else None
    )
    shift_in_baseline_stddev = (
        abs(delta) / b_std
        if reliable_baseline_variance and b_std > 0
        else None
    )

    if (
        reliable_baseline_variance
        and stddev_ratio is not None
        and stddev_ratio <= anchor_ratio
        and shift_in_baseline_stddev is not None
        and shift_in_baseline_stddev <= anchor_shift
    ):
        category = "anchors"
        interpretation = (
            "Governing pressure reduced stochastic spread while keeping "
            "the condition mean within the allowed calibration shift. "
            "Hold the relationship; do not freeze an exact numeric value."
        )
    elif (
        reliable_baseline_variance
        and stddev_ratio is not None
        and stddev_ratio >= freedom_ratio
    ):
        category = "freedoms"
        interpretation = (
            "Governing pressure preserved or increased variation. "
            "Permit exploration here; do not force repeatability or a "
            "single historical value."
        )
    else:
        category = "tendencies"
        interpretation = (
            "The replicated trial did not establish a strong variance "
            "anchor or freedom signal. Treat this as directional context, "
            "not a compulsory rule."
        )

    return category, {
        "metric": metric,
        "label": METRIC_LABELS.get(metric, metric),
        "roles": list(roles),
        "witnessOnly": b,
        "governingTranslation": c,
        "meanDeltaCombinedMinusWitnessOnly": round(
            delta,
            4,
        ),
        "stddevRatioCombinedOverWitnessOnly": (
            round(stddev_ratio, 4)
            if stddev_ratio is not None
            else None
        ),
        "meanShiftInBaselineStddev": (
            round(shift_in_baseline_stddev, 4)
            if shift_in_baseline_stddev is not None
            else None
        ),
        "direction": _direction(
            delta,
            b_std,
            deadband,
            minimum_stddev,
        ),
        "baselineVarianceReliable": (
            reliable_baseline_variance
        ),
        "classification": {
            "anchors": "anchor",
            "freedoms": "freedom",
            "tendencies": "tendency",
        }[category],
        "interpretation": interpretation,
    }


def derive_grip(
    *,
    trial: Mapping[str, Any],
    handprint: Mapping[str, Any],
    template: Mapping[str, Any],
    role_metrics: Mapping[str, Sequence[str]],
) -> dict[str, Any]:
    if trial.get("status") != "complete":
        raise GripError(
            "Grip requires a completed replicated pressure trial."
        )

    conditions = trial.get("conditions") or {}
    witness_only = conditions.get("witness_only") or []
    governing = conditions.get("governing_translation") or []

    thresholds = dict(template.get("thresholds") or {})
    minimum_repeats = int(
        thresholds.get("minimumRepeatsPerCondition") or 4
    )
    if (
        len(witness_only) < minimum_repeats
        or len(governing) < minimum_repeats
    ):
        raise GripError(
            "Grip requires at least "
            + str(minimum_repeats)
            + " repeats per condition."
        )

    def metrics_for(arms: Sequence[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
        rows: list[Mapping[str, Any]] = []
        for arm in arms:
            evaluation = arm.get("evaluation")
            if not isinstance(evaluation, Mapping):
                raise GripError(
                    "Every pressure-trial arm must carry an evaluation."
                )
            metrics = evaluation.get("metrics")
            if not isinstance(metrics, Mapping):
                raise GripError(
                    "Every pressure-trial evaluation must carry metrics."
                )
            rows.append(metrics)
        return rows

    b_metrics = metrics_for(witness_only)
    c_metrics = metrics_for(governing)

    names = sorted(
        set.intersection(
            *(set(row.keys()) for row in b_metrics + c_metrics)
        )
        - {"width", "height", "aspectRatio", "p10Luminance", "p90Luminance"}
    )

    by_metric_roles = metric_roles(handprint, role_metrics)
    dimensions: dict[str, dict[str, Any]] = {
        "anchors": {},
        "freedoms": {},
        "tendencies": {},
    }

    for name in names:
        b_values = [float(row[name]) for row in b_metrics]
        c_values = [float(row[name]) for row in c_metrics]
        category, record = classify_metric(
            metric=name,
            witness_only=b_values,
            governing=c_values,
            thresholds=thresholds,
            roles=by_metric_roles.get(name, []),
        )
        dimensions[category][name] = record

    role_projection: dict[str, Any] = {}
    for role, metric_names in role_metrics.items():
        facet = (
            (handprint.get("facets") or {})
            .get("byRole", {})
            .get(role)
        )
        if (
            not isinstance(facet, Mapping)
            or facet.get("eligibleForRender") is not True
        ):
            continue

        projection = {
            "anchors": [],
            "freedoms": [],
            "tendencies": [],
        }
        for category, records in dimensions.items():
            for name in records:
                if name in metric_names:
                    projection[category].append(name)

        if any(projection.values()):
            role_projection[role] = projection

    summary = trial.get("summary") or {}
    b_summary = summary.get("witnessOnly") or {}
    c_summary = summary.get("governingCombined") or {}

    diagnostics = {
        "handprintRangeAdherenceStddev": {
            "witnessOnly": (
                (b_summary.get("handprintRangeAdherence") or {})
                .get("stddev")
            ),
            "governingTranslation": (
                (c_summary.get("handprintRangeAdherence") or {})
                .get("stddev")
            ),
        },
        "witnessSpatialSimilarityStddev": {
            "witnessOnly": (
                (b_summary.get("witnessSpatialSimilarity") or {})
                .get("stddev")
            ),
            "governingTranslation": (
                (c_summary.get("witnessSpatialSimilarity") or {})
                .get("stddev")
            ),
        },
        "note": (
            "Diagnostics describe trial-level stabilization. "
            "They are not prompt laws."
        ),
    }

    review = trial.get("humanReview") or {}
    review_pass = (
        review.get("status") in {"reviewed", "complete"}
        and review.get("sceneTruthPass") is True
    )

    output = json.loads(json.dumps(template))
    output["status"] = (
        "built"
        if review_pass
        else "provisional_pending_human_review"
    )
    output["renderEligible"] = bool(review_pass)
    output["dimensions"] = dimensions
    output["roleProjection"] = role_projection
    output["diagnostics"] = diagnostics
    output["sourceTrial"] = {
        **dict(template.get("sourceTrial") or {}),
        "trialId": trial.get("trialId"),
        "status": trial.get("status"),
        "assetKey": trial.get("assetKey"),
        "manifestSha256": trial.get("manifestSha256"),
        "handprintSha256": (
            (trial.get("frozen") or {}).get(
                "handprintSha256"
            )
        ),
        "witnessRegistrySha256": (
            (trial.get("frozen") or {}).get(
                "witnessRegistrySha256"
            )
        ),
        "witnessId": (
            (trial.get("frozen") or {}).get("witnessId")
        ),
        "witnessSha256": (
            (trial.get("frozen") or {}).get(
                "witnessSha256"
            )
        ),
        "humanReview": dict(review),
    }
    output["provenance"] = {
        **dict(template.get("provenance") or {}),
        "builder": "velastra-painter grip-build",
        "algorithmVersion": 1,
        "builtAt": utc_now(),
        "sourceTrialId": trial.get("trialId"),
        "manifestSha256": trial.get("manifestSha256"),
        "handprintSha256": (
            (trial.get("frozen") or {}).get("handprintSha256")
        ),
        "witnessRegistrySha256": (
            (trial.get("frozen") or {}).get("witnessRegistrySha256")
        ),
        "witnessSha256": (
            (trial.get("frozen") or {}).get("witnessSha256")
        ),
        "classificationThresholds": thresholds,
        "note": (
            "Grip is a scoped interpretation of replicated pressure-trial "
            "variance. It does not alter historical Handprint metrics."
        ),
    }
    return output


def summarize_grip(registry: Mapping[str, Any]) -> list[str]:
    lines = [
        "Virynism Handprint Grip | status="
        + str(registry.get("status"))
        + " | renderEligible="
        + str(bool(registry.get("renderEligible")))
    ]
    dimensions = registry.get("dimensions") or {}
    for category in ("anchors", "freedoms", "tendencies"):
        records = dimensions.get(category) or {}
        lines.append(
            category
            + ": "
            + (
                ", ".join(records.keys())
                if records
                else "none"
            )
        )
    return lines
