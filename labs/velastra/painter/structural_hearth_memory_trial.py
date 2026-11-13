#!/usr/bin/env python3
"""Kernel 0041: same-seed Structural Hearth Memory A/B trial.

Baseline: authored scene truth + Handprint.
Experimental: exact same bundle + Structural Hearth Memory.

No reference pixels are admitted. Z-Image Turbo provides deterministic seed
control, allowing true same-seed pairing again.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from dataclasses import replace
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
DEFAULT_SEEDS = (190920, 190923)


def load_local(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


painter = load_local("velastra_painter_0041", HERE / "velastra_painter.py")
structural = load_local(
    "velastra_structural_memory_0041",
    HERE / "structural_hearth_memory.py",
)


def prompt_sha(bundle: dict[str, Any]) -> str:
    payload = json.dumps(
        {
            "positive": bundle.get("positive") or "",
            "negative": bundle.get("negative") or "",
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def parse_seeds(raw: str) -> list[int]:
    seeds: list[int] = []
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        try:
            seed = int(item)
        except ValueError as exc:
            raise RuntimeError(f"Invalid seed: {item}") from exc
        if seed not in seeds:
            seeds.append(seed)
    if len(seeds) < 2:
        raise RuntimeError("0041 requires at least two seeds.")
    return seeds


def render_namespace(
    args: argparse.Namespace,
    *,
    seed: int,
    attempt: str,
) -> argparse.Namespace:
    return argparse.Namespace(
        manifest=args.manifest,
        brush="z_image_turbo",
        transport="huggingface",
        witness=None,
        witness_firewall=False,
        firewall_tile_size=32,
        firewall_blur_radius=0.6,
        without_handprint=False,
        without_witness=False,
        without_style_law=[],
        without_style_phrase=[],
        attempt=attempt,
        repo_root=args.repo_root,
        brush_registry=None,
        backend=None,
        model=None,
        seed=seed,
        width=None,
        height=None,
        steps=None,
        guidance=None,
        true_cfg_scale=None,
        device=None,
        dtype=None,
        out_dir=args.out_dir,
    )


def compact_trial_base_bundle(
    manifest: dict[str, Any],
    bundle: dict[str, Any],
) -> dict[str, Any]:
    """Build a bounded causal prompt for the 0041 same-seed A/B trial.

    The normal Painter compiler correctly refuses to drop required scene-truth,
    threshold, and Handprint sections. On dense manifests that can leave the
    compiled prompt above Z-Image Turbo's observed 512-token envelope even when
    the configured safe target is lower.

    0041 therefore derives a compact painter-facing base from the already-
    compiled bundle and authoritative manifest. Both arms receive this exact
    same base. Structural Memory is the only text added to the experimental
    arm.
    """
    compact = dict(bundle)
    scene = manifest.get("scene") or {}
    environment = scene.get("environment") or {}
    painterly_truth = environment.get("painterlyTruth") or {}
    brief = manifest.get("artBrief") or {}
    style = manifest.get("style") or {}

    facts: list[str] = []
    for raw in environment.get("facts") or []:
        value = painter.flatten_text(raw)
        lowered = value.lower()
        if not value or lowered.startswith("fixed room object:"):
            continue
        if value not in facts:
            facts.append(value)

    fixed_objects: list[str] = []
    for entry in painterly_truth.get("fixedObjects") or []:
        if isinstance(entry, dict):
            value = painter.flatten_text(entry.get("name") or entry.get("id"))
        else:
            value = painter.flatten_text(entry)
        if value and value not in fixed_objects:
            fixed_objects.append(value)

    hierarchy = painter.flatten_text(
        brief.get("hierarchy")
        or (scene.get("composition") or {}).get("hierarchy")
    )
    camera = painter.flatten_text(
        brief.get("camera")
        or (scene.get("composition") or {}).get("camera")
    )
    lighting = painter.flatten_text(
        (brief.get("lighting") or {}).get("meaning")
        if isinstance(brief.get("lighting"), dict)
        else brief.get("lighting")
    )
    surface = painter.flatten_text(
        (brief.get("surface") or {}).get("meaning")
        if isinstance(brief.get("surface"), dict)
        else brief.get("surface")
    )

    handprint = bundle.get("handprint") or {}
    interpretation = handprint.get("interpretation") or {}
    handprint_bits = [
        painter.flatten_text(interpretation.get("warmthBias")),
        painter.flatten_text(interpretation.get("edgeCharacter")),
        painter.flatten_text(interpretation.get("shadowPresence")),
    ]
    handprint_bits = [item for item in handprint_bits if item]

    parts = [
        "Create a finished painterly image from this authored Hearth scene.",
        (
            "Scene truth: "
            + " | ".join(facts[:3])
            if facts
            else "Scene truth: preserve the authored Hearth environment."
        ),
        (
            "Fixed authored objects: " + ", ".join(fixed_objects) + "."
            if fixed_objects
            else ""
        ),
        (
            "Composition: "
            + "; ".join(item for item in (camera, hierarchy) if item)
            + "."
            if camera or hierarchy
            else ""
        ),
        (
            "Atmosphere: "
            + "; ".join(item for item in (lighting, surface) if item)
            + "."
            if lighting or surface
            else ""
        ),
        (
            "Virynism hand: "
            + painter.flatten_text(style.get("compactSignature"))
        ),
        (
            "Portfolio-derived visual tendencies: " + "; ".join(handprint_bits) + "."
            if handprint_bits
            else ""
        ),
        (
            "Keep thresholds permeable and movement easy. "
            "Do not invent people, relationships, text, logos, symbols, or "
            "objects. Keep symbolic motifs nonliteral."
        ),
    ]
    positive = "\n".join(item for item in parts if item)
    estimate = painter.estimate_prompt_tokens(positive)
    target = 300
    if estimate > target:
        raise RuntimeError(
            "0041 compact shared base exceeded its 300-token target: "
            f"{estimate}"
        )

    budget = dict(bundle.get("budget") or {})
    raw_after = int(
        budget.get("afterTokens")
        or painter.estimate_prompt_tokens(str(bundle.get("positive") or ""))
    )
    budget["rawBaseTokensEstimate"] = raw_after
    budget["compactBaseTokensEstimate"] = estimate
    budget["afterTokens"] = estimate
    budget["targetTokens"] = target
    budget["overTarget"] = False
    budget["compaction"] = "0041_causal_trial_v1"

    compact["positive"] = positive
    compact["budget"] = budget
    compact["trialPrompt"] = {
        "profile": "0041_causal_trial_v1",
        "rawBaseTokensEstimate": raw_after,
        "compactBaseTokensEstimate": estimate,
        "targetTokens": target,
    }
    return compact

def candidate_plan(
    *,
    args: argparse.Namespace,
    manifest: dict[str, Any],
    seed: int,
    condition: str,
    contract: dict[str, Any],
) -> tuple[dict[str, Any], argparse.Namespace, dict[str, Any]]:
    suffix = "a" if condition == "baseline" else "b"
    attempt = f"{args.trial_id}-s{seed}-{suffix}"
    ns = render_namespace(args, seed=seed, attempt=attempt)
    spec = painter.build_render_spec(ns)

    if spec.task != "text_to_image":
        raise RuntimeError("0041 is frozen to text-to-image.")
    if spec.brush != "z_image_turbo":
        raise RuntimeError("0041 is frozen to Z-Image Turbo.")
    if spec.provider != "fal-ai":
        raise RuntimeError("0041 is frozen to the current hosted provider.")

    bundle = painter.compile_prompt_bundle(manifest, spec)
    bundle = compact_trial_base_bundle(manifest, bundle)
    witness = bundle.get("witness") or {}
    if witness.get("active"):
        raise RuntimeError("0041 must remain reference-pixel-free.")

    style_ablations = (
        (bundle.get("style") or {}).get("ablations")
        or {}
    )
    if (
        style_ablations.get("disabledStyleIds")
        or style_ablations.get("disabledPhrases")
    ):
        raise RuntimeError("0041 keeps the painterly hand unablated.")

    if condition == "structural_memory":
        bundle = structural.augment_prompt_bundle(bundle, contract)
        final_estimate = int(
            (bundle.get("budget") or {}).get(
                "afterStructuralMemoryTokensEstimate"
            )
            or 0
        )
        if final_estimate > 420:
            raise RuntimeError(
                "0041 structural prompt exceeded Z-Image's 420-token safe "
                f"target after reserved-budget compilation: {final_estimate}"
            )
        leaks = painter.control_plane_leaks(
            str(bundle.get("positive") or "")
            + "\n"
            + str(bundle.get("negative") or "")
        )
        if leaks:
            raise RuntimeError(
                "0041 control-plane vocabulary leaked after structural "
                "augmentation: " + ", ".join(leaks)
            )

    cid = painter.candidate_id(manifest, bundle, spec)
    base = Path(args.out_dir) / manifest["assetKey"]
    image_path = base / f"{cid}.png"
    record_path = base / f"{cid}.candidate.json"

    arm = {
        "condition": condition,
        "seed": seed,
        "attemptId": attempt,
        "candidateId": cid,
        "image": image_path.as_posix(),
        "candidateRecord": record_path.as_posix(),
        "promptSha256": prompt_sha(bundle),
        "structuralMemory": (
            bundle.get("structuralMemory")
            if condition == "structural_memory"
            else {"active": False}
        ),
        "promptBudget": dict(bundle.get("budget") or {}),
        "status": (
            "rendered"
            if image_path.exists() and record_path.exists()
            else "planned"
        ),
        "outputSha256": (
            painter.sha256_file(image_path)
            if image_path.exists()
            else None
        ),
        "humanReview": {
            "handFidelityPreserved": None,
            "sceneTruthStillRecognizable": None,
            "ceremonialAxisReduced": None,
            "bilateralSymmetryReduced": None,
            "multipleCentersOfUse": None,
            "openCirculation": None,
            "inhabitableViewpoint": None,
            "fireSubordinateToRoom": None,
            "ordinaryDomesticity": None,
            "notes": None,
        },
    }
    return arm, ns, bundle


def execute_render(
    *,
    manifest: dict[str, Any],
    arm: dict[str, Any],
    ns: argparse.Namespace,
    bundle: dict[str, Any],
) -> None:
    image_path = Path(arm["image"])
    record_path = Path(arm["candidateRecord"])

    if image_path.exists() and record_path.exists():
        arm["status"] = "rendered"
        arm["outputSha256"] = painter.sha256_file(image_path)
        return

    spec = painter.build_render_spec(ns)
    record = painter.build_candidate_record(
        manifest,
        bundle,
        spec,
        image_path,
    )
    record["source"]["structuralMemory"] = bundle.get(
        "structuralMemory"
    ) or {"active": False}

    runtime = painter.render_huggingface(
        bundle,
        spec,
        image_path,
    )
    record["render"]["runtime"] = runtime
    record["output"]["sha256"] = painter.sha256_file(image_path)
    painter.write_json(record_path, record)

    arm["status"] = "rendered"
    arm["outputSha256"] = record["output"]["sha256"]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Plan or render Kernel 0041 Structural Hearth Memory A/B."
    )
    parser.add_argument("manifest")
    parser.add_argument(
        "--trial-id",
        default="hearth-structural-memory-0041",
    )
    parser.add_argument(
        "--profile",
        default="house_freedom_hearth_v1",
    )
    parser.add_argument(
        "--seeds",
        default="190920,190923",
    )
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--registry",
        default="world/velastra-place-identities.json",
    )
    parser.add_argument(
        "--out-dir",
        default=".velastra/candidates",
    )
    parser.add_argument(
        "--output",
        default="labs/velastra/evidence/trials/hearth-structural-memory-0041.json",
    )
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--replace-trial", action="store_true")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    manifest = painter.unwrap_manifest(
        painter.read_json(Path(args.manifest))
    )
    painter.require_manifest(manifest)

    registry_path = Path(args.registry)
    if not registry_path.is_absolute():
        registry_path = repo_root / registry_path
    contract = structural.resolve_contract(
        registry_path=registry_path,
        profile_id=args.profile,
    )

    seeds = parse_seeds(args.seeds)
    conditions = ("baseline", "structural_memory")
    arms: dict[str, list[dict[str, Any]]] = {
        condition: []
        for condition in conditions
    }
    runtime: dict[
        str,
        tuple[argparse.Namespace, dict[str, Any]],
    ] = {}

    for seed in seeds:
        for condition in conditions:
            arm, ns, bundle = candidate_plan(
                args=args,
                manifest=manifest,
                seed=seed,
                condition=condition,
                contract=contract,
            )
            arms[condition].append(arm)
            runtime[arm["attemptId"]] = (ns, bundle)

    baseline_hashes = {
        item["promptSha256"]
        for item in arms["baseline"]
    }
    structural_hashes = {
        item["promptSha256"]
        for item in arms["structural_memory"]
    }
    if len(baseline_hashes) != 1 or len(structural_hashes) != 1:
        raise RuntimeError(
            "0041 prompt drift detected within a condition across seeds."
        )
    if baseline_hashes == structural_hashes:
        raise RuntimeError(
            "0041 structural condition did not alter painter-facing prompt."
        )

    execution_order: list[str] = []
    for index, seed in enumerate(seeds):
        order = (
            conditions
            if index % 2 == 0
            else tuple(reversed(conditions))
        )
        for condition in order:
            arm = next(
                item
                for item in arms[condition]
                if item["seed"] == seed
            )
            execution_order.append(arm["attemptId"])

    manifest_sha = painter.sha256_bytes(
        painter.canonical_json(manifest)
    )
    trial_path = Path(args.output)
    existing = (
        painter.read_json(trial_path)
        if trial_path.exists()
        else {}
    )
    if (
        existing.get("manifestSha256")
        and existing.get("manifestSha256") != manifest_sha
        and not args.replace_trial
    ):
        raise RuntimeError(
            "Existing 0041 trial came from a different manifest."
        )

    trial: dict[str, Any] = {
        "version": 1,
        "protocol": "velastra.structural_memory_trial.v1",
        "trialId": args.trial_id,
        "status": "planned",
        "createdAt": existing.get("createdAt") or painter.utc_now(),
        "updatedAt": painter.utc_now(),
        "manifest": args.manifest,
        "manifestSha256": manifest_sha,
        "brush": "z_image_turbo",
        "transport": "huggingface",
        "provider": "fal-ai",
        "seeds": seeds,
        "conditions": arms,
        "executionOrder": execution_order,
        "promptDiagnostics": {
            "baselinePromptSha256": next(iter(baseline_hashes)),
            "structuralPromptSha256": next(iter(structural_hashes)),
            "promptsDifferAcrossConditions": True,
            "rawBaseTokensEstimate": int(
                (
                    arms["baseline"][0].get("promptBudget")
                    or {}
                ).get("rawBaseTokensEstimate")
                or 0
            ),
            "compactBaseTokensEstimate": int(
                (
                    arms["baseline"][0].get("promptBudget")
                    or {}
                ).get("compactBaseTokensEstimate")
                or 0
            ),
            "sharedBaseSafeTargetTokens": 300,
            "finalBrushSafeTargetTokens": 420,
            "structuralSectionTokensEstimate": int(
                (
                    arms["structural_memory"][0].get("promptBudget")
                    or {}
                ).get("structuralMemoryAddedTokensEstimate")
                or 0
            ),
            "structuralFinalTokensEstimate": int(
                (
                    arms["structural_memory"][0].get("promptBudget")
                    or {}
                ).get("afterStructuralMemoryTokensEstimate")
                or 0
            ),
        },
        "frozen": {
            "referencePixels": "none",
            "sameSeedWithinPair": True,
            "samePainterlyHandWithinPair": True,
            "sameAuthoredSceneTruthWithinPair": True,
            "sameBrushWithinPair": True,
            "sameProviderWithinPair": True,
            "onlyExperimentalFactor": "structural_hearth_memory",
        },
        "experimentalFactor": {
            "profileId": args.profile,
            "registry": contract.get("registry"),
            "registrySha256": contract.get("registrySha256"),
            "structuralSha256": contract.get("structuralSha256"),
            "nodes": contract.get("nodes"),
            "relations": contract.get("relations"),
            "laws": contract.get("laws"),
        },
        "humanReview": {
            "status": "pending",
            "questions": [
                "Does the structural arm reduce axial / ceremonial Hearth grammar?",
                "Does bilateral mirror seating decrease?",
                "Does the room gain multiple centers of ordinary use?",
                "Does circulation read as open and inhabitable?",
                "Does fire become one room element rather than sovereign center?",
                "Do scene truth and painterly hand remain recognizable?",
            ],
            "notes": None,
        },
        "successCriteria": [
            "Structural memory produces directional topology change in more than one seed.",
            "Same-seed pairs remain recognizably related rather than becoming unrelated images.",
            "Ceremonial axis and bilateral mirror composition reduce.",
            "Scene truth remains recognizable.",
            "Painterly hand remains coherent.",
        ],
        "falsification": [
            "Structural and baseline arms remain topologically indistinguishable.",
            "Structural arm merely adds clutter without changing room organization.",
            "Scene truth degrades.",
            "Structural directives introduce un-authored people or semantic relationships.",
        ],
        "laws": {
            "noCanonMutation": True,
            "humanReviewRequired": True,
            "referencePixelsForbidden": True,
            "structuralMemoryCannotInventSceneFacts": True,
        },
    }

    painter.write_json(trial_path, trial)

    if not args.render:
        print(trial_path)
        print(f"planned={len(seeds) * 2} renders; no inference executed")
        print(
            "baseline_prompt_sha256="
            + trial["promptDiagnostics"]["baselinePromptSha256"]
        )
        print(
            "structural_prompt_sha256="
            + trial["promptDiagnostics"]["structuralPromptSha256"]
        )
        return 0

    trial["status"] = "running"
    painter.write_json(trial_path, trial)

    arm_by_attempt = {
        arm["attemptId"]: arm
        for condition in conditions
        for arm in arms[condition]
    }
    for attempt in execution_order:
        arm = arm_by_attempt[attempt]
        ns, bundle = runtime[attempt]
        execute_render(
            manifest=manifest,
            arm=arm,
            ns=ns,
            bundle=bundle,
        )
        trial["updatedAt"] = painter.utc_now()
        painter.write_json(trial_path, trial)

    all_rendered = all(
        arm.get("status") == "rendered"
        and arm.get("outputSha256")
        for condition in conditions
        for arm in arms[condition]
    )
    trial["status"] = "complete" if all_rendered else "incomplete"
    trial["updatedAt"] = painter.utc_now()
    painter.write_json(trial_path, trial)

    print(trial_path)
    print(
        "rendered="
        + str(
            sum(
                1
                for condition in conditions
                for arm in arms[condition]
                if arm.get("status") == "rendered"
            )
        )
    )
    print("status=" + trial["status"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
