#!/usr/bin/env python3
"""Cross-scene replication analysis for observational Handprint Grip.

Kernel 0032 compares two completed pressure trials while keeping Grip
observation-only. It does not activate render guidance or mutate canon.
"""

from __future__ import annotations

import json
from typing import Any, Mapping, Sequence


class ReplicationError(RuntimeError):
    pass


EXCLUDED_METRICS = {
    "width",
    "height",
    "aspectRatio",
    "p10Luminance",
    "p90Luminance",
}


def _condition_metrics(
    trial: Mapping[str, Any],
    condition: str,
) -> list[Mapping[str, Any]]:
    arms = (trial.get("conditions") or {}).get(condition) or []
    rows: list[Mapping[str, Any]] = []
    for arm in arms:
        evaluation = arm.get("evaluation")
        if not isinstance(evaluation, Mapping):
            raise ReplicationError(
                f"Trial {trial.get('trialId')} has an unevaluated {condition} arm."
            )
        metrics = evaluation.get("metrics")
        if not isinstance(metrics, Mapping):
            raise ReplicationError(
                f"Trial {trial.get('trialId')} has a {condition} arm without metrics."
            )
        rows.append(metrics)
    return rows


def _frozen_identity(trial: Mapping[str, Any]) -> dict[str, Any]:
    frozen = trial.get("frozen") or {}
    return {
        "handprintSha256": frozen.get("handprintSha256"),
        "handprintAlgorithmVersion": frozen.get(
            "handprintAlgorithmVersion"
        ),
        "pressureSchemaVersion": frozen.get(
            "pressureSchemaVersion"
        ),
        "witnessRegistrySha256": frozen.get(
            "witnessRegistrySha256"
        ),
        "witnessId": frozen.get("witnessId"),
        "witnessSha256": frozen.get("witnessSha256"),
        "model": trial.get("model"),
        "brush": trial.get("brush"),
        "transport": trial.get("transport"),
        "repeatsPerCondition": trial.get(
            "repeatsPerCondition"
        ),
    }


def validate_pair(
    baseline: Mapping[str, Any],
    replication: Mapping[str, Any],
    *,
    minimum_repeats: int = 4,
) -> dict[str, Any]:
    for name, trial in (
        ("baseline", baseline),
        ("replication", replication),
    ):
        if trial.get("status") != "complete":
            raise ReplicationError(
                f"{name} trial must be complete."
            )
        for condition in (
            "witness_only",
            "governing_translation",
        ):
            arms = (
                (trial.get("conditions") or {}).get(condition)
                or []
            )
            if len(arms) < minimum_repeats:
                raise ReplicationError(
                    f"{name} trial requires at least "
                    f"{minimum_repeats} {condition} arms."
                )

    if baseline.get("assetKey") == replication.get("assetKey"):
        raise ReplicationError(
            "Cross-scene replication requires a different assetKey."
        )

    baseline_identity = _frozen_identity(baseline)
    replication_identity = _frozen_identity(replication)
    mismatches = {
        key: {
            "baseline": baseline_identity.get(key),
            "replication": replication_identity.get(key),
        }
        for key in baseline_identity
        if baseline_identity.get(key)
        != replication_identity.get(key)
    }
    if mismatches:
        detail = ", ".join(sorted(mismatches))
        raise ReplicationError(
            "Cross-scene trials changed frozen experimental controls: "
            + detail
        )

    return {
        "baseline": baseline_identity,
        "replication": replication_identity,
        "controlsMatch": True,
    }


def classify_trial(
    *,
    trial: Mapping[str, Any],
    handprint: Mapping[str, Any],
    thresholds: Mapping[str, Any],
    role_metrics: Mapping[str, Sequence[str]],
    grip_module: Any,
) -> dict[str, Any]:
    witness_only = _condition_metrics(
        trial,
        "witness_only",
    )
    governing = _condition_metrics(
        trial,
        "governing_translation",
    )

    shared = set.intersection(
        *(set(row.keys()) for row in witness_only + governing)
    )
    metric_names = sorted(shared - EXCLUDED_METRICS)
    by_metric_roles = grip_module.metric_roles(
        handprint,
        role_metrics,
    )

    dimensions: dict[str, dict[str, Any]] = {
        "anchors": {},
        "freedoms": {},
        "tendencies": {},
    }
    category_by_metric: dict[str, str] = {}

    for metric in metric_names:
        category, record = grip_module.classify_metric(
            metric=metric,
            witness_only=[
                float(row[metric]) for row in witness_only
            ],
            governing=[
                float(row[metric]) for row in governing
            ],
            thresholds=thresholds,
            roles=by_metric_roles.get(metric, []),
        )
        dimensions[category][metric] = record
        category_by_metric[metric] = {
            "anchors": "anchor",
            "freedoms": "freedom",
            "tendencies": "tendency",
        }[category]

    return {
        "trialId": trial.get("trialId"),
        "assetKey": trial.get("assetKey"),
        "manifestSha256": trial.get("manifestSha256"),
        "facetRoles": list(trial.get("facetRoles") or []),
        "dimensions": dimensions,
        "categoryByMetric": category_by_metric,
    }


def compare_classifications(
    baseline: Mapping[str, Any],
    replication: Mapping[str, Any],
) -> dict[str, Any]:
    b = baseline.get("categoryByMetric") or {}
    r = replication.get("categoryByMetric") or {}
    metrics = sorted(set(b) & set(r))

    replicated: dict[str, list[str]] = {
        "anchor": [],
        "freedom": [],
        "tendency": [],
    }
    changed: dict[str, Any] = {}

    for metric in metrics:
        b_category = b[metric]
        r_category = r[metric]
        if b_category == r_category:
            replicated[b_category].append(metric)
        else:
            changed[metric] = {
                "baseline": b_category,
                "replication": r_category,
            }

    baseline_anchors = {
        metric for metric, category in b.items()
        if category == "anchor"
    }
    replication_anchors = {
        metric for metric, category in r.items()
        if category == "anchor"
    }
    anchor_union = baseline_anchors | replication_anchors
    anchor_overlap = baseline_anchors & replication_anchors

    baseline_freedoms = {
        metric for metric, category in b.items()
        if category == "freedom"
    }
    replication_freedoms = {
        metric for metric, category in r.items()
        if category == "freedom"
    }
    freedom_union = baseline_freedoms | replication_freedoms
    freedom_overlap = baseline_freedoms & replication_freedoms

    def jaccard(
        overlap: set[str],
        union: set[str],
    ) -> float | None:
        if not union:
            return None
        return round(len(overlap) / len(union), 4)

    return {
        "replicated": replicated,
        "changed": changed,
        "anchorOverlap": {
            "metrics": sorted(anchor_overlap),
            "jaccard": jaccard(
                anchor_overlap,
                anchor_union,
            ),
        },
        "freedomOverlap": {
            "metrics": sorted(freedom_overlap),
            "jaccard": jaccard(
                freedom_overlap,
                freedom_union,
            ),
        },
        "interpretationBoundary": (
            "Matching categories across two scenes are replicated observations, "
            "not global render laws. A changed category is evidence of scene "
            "dependence, not failure."
        ),
    }


def build_replication_record(
    *,
    baseline_trial: Mapping[str, Any],
    replication_trial: Mapping[str, Any],
    handprint: Mapping[str, Any],
    grip_template: Mapping[str, Any],
    role_metrics: Mapping[str, Sequence[str]],
    grip_module: Any,
) -> dict[str, Any]:
    thresholds = dict(
        grip_template.get("thresholds") or {}
    )
    minimum_repeats = int(
        thresholds.get("minimumRepeatsPerCondition")
        or 4
    )

    controls = validate_pair(
        baseline_trial,
        replication_trial,
        minimum_repeats=minimum_repeats,
    )

    baseline = classify_trial(
        trial=baseline_trial,
        handprint=handprint,
        thresholds=thresholds,
        role_metrics=role_metrics,
        grip_module=grip_module,
    )
    replication = classify_trial(
        trial=replication_trial,
        handprint=handprint,
        thresholds=thresholds,
        role_metrics=role_metrics,
        grip_module=grip_module,
    )
    comparison = compare_classifications(
        baseline,
        replication,
    )

    return {
        "version": 1,
        "protocol": "velastra.grip_replication.v1",
        "status": "complete",
        "baseline": baseline,
        "replication": replication,
        "controls": controls,
        "comparison": comparison,
        "humanObservations": {
            "status": "pending",
            "sceneTruthPass": {
                "baseline": None,
                "replication": None,
            },
            "signatureLikeArtifacts": {
                "baseline": [],
                "replication": [],
                "note": (
                    "Human-observed incidence only. Signature-like marks "
                    "are not interpreted as authorship or Grip law."
                ),
            },
            "notes": None,
        },
        "laws": {
            "crossSceneComparisonCannotActivateGrip": True,
            "sameFrozenControlsRequired": True,
            "differentAssetKeyRequired": True,
            "matchingCategoryIsReplicationNotGlobalLaw": True,
            "changedCategoryMayIndicateSceneDependence": True,
            "humanObservationCannotBecomeMetricWithoutSeparateDesign": True,
            "signatureLikeArtifactCannotEstablishAuthorship": True,
        },
    }
