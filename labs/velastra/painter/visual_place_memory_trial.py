#!/usr/bin/env python3
"""Kernel 0040: Visual Place Memory distributional A/B trial.

Hosted Qwen Image Edit does not expose seed control. This trial therefore uses
alternating repeated renders rather than false same-seed pairing.

Both conditions share:
- the same authored scene truth,
- the same Handprint,
- the same 0039 semantic Place Memory profile,
- the same approved source-image corpus,
- the same painter-facing prompt,
- the same brush/provider.

The only systematic factor is carrier spatial retention:
- micro_scrub_control destroys adjacency at 32px scale;
- visual_place_memory preserves 96px neighborhoods while shuffling global layout.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any, Mapping


HERE = Path(__file__).resolve().parent
CONDITIONS = ("micro_scrub_control", "visual_place_memory")


def load_local(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


painter = load_local("velastra_painter_0040", HERE / "velastra_painter.py")
spatial = load_local("velastra_spatial_identity_0040", HERE / "spatial_identity.py")
visual = load_local("velastra_visual_place_memory_0040", HERE / "visual_place_memory.py")


def prompt_sha(bundle: Mapping[str, Any]) -> str:
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


def render_namespace(
    args: argparse.Namespace,
    *,
    attempt: str,
) -> argparse.Namespace:
    return argparse.Namespace(
        manifest=args.manifest,
        brush="qwen_image_edit",
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
        seed=None,
        width=None,
        height=None,
        steps=None,
        guidance=None,
        true_cfg_scale=None,
        device=None,
        dtype=None,
        out_dir=args.out_dir,
    )


def carrier_manifest(
    *,
    manifest: Mapping[str, Any],
    carrier: Mapping[str, Any],
    pair: Mapping[str, Any],
    config: Mapping[str, Any],
    repo_root: Path,
) -> dict[str, Any]:
    result = copy.deepcopy(dict(manifest))
    carrier_path = Path(str(carrier["path"])).resolve()
    try:
        relative = carrier_path.relative_to(repo_root.resolve()).as_posix()
    except ValueError as exc:
        raise RuntimeError(
            f"0040 carrier must live inside repo root: {carrier_path}"
        ) from exc

    result["witnesses"] = {
        "selected": [
            {
                "id": "visual_place_memory_carrier_v1",
                "reason": (
                    "Candidate-local 0040 carrier; never canonical scene truth."
                ),
            }
        ],
        "approved": [
            {
                "id": "visual_place_memory_carrier_v1",
                "title": "Visual Place Memory carrier",
                "status": "approved",
                "origin": "kernel_0040_candidate_local_carrier",
                "matchedRoles": list(config.get("roles") or []),
                "teach": list(config.get("roles") or []),
                "doNotInherit": list(config.get("doNotInherit") or []),
                "notes": (
                    "The carrier is transformed evidence from an approved source "
                    "corpus. Its source people, objects, architecture, layout, and "
                    "relationships are non-canonical."
                ),
                "asset": {
                    "path": relative,
                    "sha256": carrier["carrierSha256"],
                    "width": int((config.get("carrier") or {}).get("width") or 1536),
                    "height": int((config.get("carrier") or {}).get("height") or 864),
                    "mediaType": "image/png",
                },
                "provenance": {
                    "protocol": pair.get("protocol"),
                    "pairId": pair.get("pairId"),
                    "corpusPixelSha256": pair.get("corpusPixelSha256"),
                },
            }
        ],
    }
    return result


def candidate_plan(
    *,
    args: argparse.Namespace,
    source_manifest: dict[str, Any],
    spatial_contract: dict[str, Any],
    pair: dict[str, Any],
    config: dict[str, Any],
    condition: str,
    repeat: int,
    repo_root: Path,
) -> tuple[
    dict[str, Any],
    argparse.Namespace,
    dict[str, Any],
    dict[str, Any],
]:
    carrier = (pair.get("conditions") or {}).get(condition)
    if not isinstance(carrier, Mapping):
        raise RuntimeError(f"0040 carrier missing condition: {condition}")

    attempt = f"{args.trial_id}-r{repeat:02d}-{condition}"
    ns = render_namespace(args, attempt=attempt)
    manifest_variant = carrier_manifest(
        manifest=source_manifest,
        carrier=carrier,
        pair=pair,
        config=config,
        repo_root=repo_root,
    )

    spec = painter.build_render_spec(ns)
    if spec.task != "image_to_image":
        raise RuntimeError("0040 is frozen to image-to-image translation.")
    if spec.provider != "fal-ai":
        raise RuntimeError("0040 is frozen to the current Qwen Image Edit provider.")

    bundle = painter.compile_prompt_bundle(manifest_variant, spec)
    witness = bundle.get("witness") or {}
    if witness.get("active") is not True:
        raise RuntimeError("0040 requires an active candidate-local carrier.")
    if (witness.get("firewall") or {}).get("active"):
        raise RuntimeError(
            "0040 carriers are already transformed; ordinary Witness Firewall "
            "must remain disabled."
        )

    style_ablations = (
        (bundle.get("style") or {}).get("ablations")
        or {}
    )
    if (
        style_ablations.get("disabledStyleIds")
        or style_ablations.get("disabledPhrases")
    ):
        raise RuntimeError("0040 must keep the painterly hand unablated.")

    bundle = spatial.augment_prompt_bundle(bundle, spatial_contract)
    leaks = painter.control_plane_leaks(
        str(bundle.get("positive") or "")
        + "\n"
        + str(bundle.get("negative") or "")
    )
    if leaks:
        raise RuntimeError(
            "0040 control-plane vocabulary leaked painter-facing text: "
            + ", ".join(leaks)
        )

    bundle["visualPlaceMemory"] = {
        "active": True,
        "trialId": args.trial_id,
        "condition": condition,
        "pairId": pair.get("pairId"),
        "protocol": pair.get("protocol"),
        "corpusPixelSha256": pair.get("corpusPixelSha256"),
        "carrier": dict(carrier),
        "laws": dict(pair.get("laws") or {}),
        "sourceCorpus": list(pair.get("sourceCorpus") or []),
    }

    cid = painter.candidate_id(manifest_variant, bundle, spec)
    base = Path(args.out_dir) / source_manifest["assetKey"]
    image_path = base / f"{cid}.png"
    record_path = base / f"{cid}.candidate.json"

    arm = {
        "condition": condition,
        "repeat": repeat,
        "attemptId": attempt,
        "candidateId": cid,
        "image": image_path.as_posix(),
        "candidateRecord": record_path.as_posix(),
        "promptSha256": prompt_sha(bundle),
        "carrierSha256": carrier.get("carrierSha256"),
        "carrierAlgorithm": carrier.get("algorithm"),
        "mesoSpatialAdjacencyPreserved": carrier.get(
            "mesoSpatialAdjacencyPreserved"
        ),
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
            "sceneTruthStillRecognizable": None,
            "handFidelityPreserved": None,
            "sourceLayoutLeakage": None,
            "sourceObjectLeakage": None,
            "placeSpecificity": None,
            "inhabitation": None,
            "relationalGeometry": None,
            "sacredOrdinaryCoexistence": None,
            "oldNewCoexistence": None,
            "technologyBelongs": None,
            "genericPrestigePrior": None,
            "notes": None,
        },
    }
    return arm, ns, bundle, manifest_variant


def execute_render(
    *,
    source_manifest: dict[str, Any],
    arm: dict[str, Any],
    ns: argparse.Namespace,
    bundle: dict[str, Any],
    manifest_variant: dict[str, Any],
) -> None:
    image_path = Path(arm["image"])
    record_path = Path(arm["candidateRecord"])

    if image_path.exists() and record_path.exists():
        arm["status"] = "rendered"
        arm["outputSha256"] = painter.sha256_file(image_path)
        return

    spec = painter.build_render_spec(ns)
    record = painter.build_candidate_record(
        manifest_variant,
        bundle,
        spec,
        image_path,
    )
    record["source"]["originalManifestSha256"] = painter.sha256_bytes(
        painter.canonical_json(source_manifest)
    )
    record["source"]["spatialIdentity"] = bundle.get("spatialIdentity")
    record["source"]["visualPlaceMemory"] = bundle.get("visualPlaceMemory")

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
        description=(
            "Plan or render Kernel 0040 Visual Place Memory repeated A/B trial."
        )
    )
    parser.add_argument("manifest")
    parser.add_argument(
        "--trial-id",
        default="hearth-visual-place-memory-0040",
    )
    parser.add_argument(
        "--profile",
        default="house_freedom_hearth_v1",
    )
    parser.add_argument("--repeats", type=int, default=4)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--place-registry",
        default="world/velastra-place-identities.json",
    )
    parser.add_argument(
        "--witness-registry",
        default="world/velastra-witnesses.json",
    )
    parser.add_argument(
        "--out-dir",
        default=".velastra/candidates",
    )
    parser.add_argument(
        "--carrier-dir",
        default=".velastra/place-memory/hearth-visual-place-memory-0040",
    )
    parser.add_argument(
        "--output",
        default="labs/velastra/evidence/trials/hearth-visual-place-memory-0040.json",
    )
    parser.add_argument(
        "--render",
        action="store_true",
        help="Execute the planned hosted image-to-image inferences.",
    )
    parser.add_argument("--replace-trial", action="store_true")
    args = parser.parse_args()

    if args.repeats < 2:
        raise RuntimeError("0040 requires at least two repeats per condition.")

    repo_root = Path(args.repo_root).resolve()
    manifest_path = Path(args.manifest)
    source_manifest = painter.unwrap_manifest(
        painter.read_json(manifest_path)
    )
    painter.require_manifest(source_manifest)

    place_registry = Path(args.place_registry)
    if not place_registry.is_absolute():
        place_registry = repo_root / place_registry
    witness_registry = Path(args.witness_registry)
    if not witness_registry.is_absolute():
        witness_registry = repo_root / witness_registry

    config = visual.profile_visual_config(
        place_registry_path=place_registry,
        profile_id=args.profile,
    )
    sources = visual.resolve_sources(
        witness_registry_path=witness_registry,
        source_ids=config["sourceWitnessIds"],
        repo_root=repo_root,
    )

    carrier_dir = Path(args.carrier_dir)
    if not carrier_dir.is_absolute():
        carrier_dir = repo_root / carrier_dir
    pair = visual.build_pair(
        sources=sources,
        output_dir=carrier_dir,
        config=config["carrier"],
    )

    spatial_contract = spatial.resolve_contract(
        manifest=source_manifest,
        profile_id=args.profile,
        registry_path=place_registry,
    )

    arms: dict[str, list[dict[str, Any]]] = {
        condition: []
        for condition in CONDITIONS
    }
    runtime: dict[
        str,
        tuple[
            argparse.Namespace,
            dict[str, Any],
            dict[str, Any],
        ],
    ] = {}

    for repeat in range(1, args.repeats + 1):
        for condition in CONDITIONS:
            arm, ns, bundle, manifest_variant = candidate_plan(
                args=args,
                source_manifest=source_manifest,
                spatial_contract=spatial_contract,
                pair=pair,
                config=config,
                condition=condition,
                repeat=repeat,
                repo_root=repo_root,
            )
            arms[condition].append(arm)
            runtime[arm["attemptId"]] = (
                ns,
                bundle,
                manifest_variant,
            )

    prompt_hashes = {
        condition: {
            item["promptSha256"]
            for item in arms[condition]
        }
        for condition in CONDITIONS
    }
    if any(len(items) != 1 for items in prompt_hashes.values()):
        raise RuntimeError(
            "0040 painter-facing prompt drift detected within a condition."
        )
    if prompt_hashes[CONDITIONS[0]] != prompt_hashes[CONDITIONS[1]]:
        raise RuntimeError(
            "0040 condition prompts differ. Carrier pixels must be the only "
            "systematic painter-facing factor."
        )

    execution_order: list[str] = []
    for repeat in range(1, args.repeats + 1):
        order = (
            CONDITIONS
            if repeat % 2 == 1
            else tuple(reversed(CONDITIONS))
        )
        for condition in order:
            arm = next(
                item
                for item in arms[condition]
                if item["repeat"] == repeat
            )
            execution_order.append(arm["attemptId"])

    trial_path = Path(args.output)
    existing = (
        painter.read_json(trial_path)
        if trial_path.exists()
        else {}
    )
    manifest_sha = painter.sha256_bytes(
        painter.canonical_json(source_manifest)
    )
    prior_manifest = existing.get("manifestSha256")
    if (
        prior_manifest
        and prior_manifest != manifest_sha
        and not args.replace_trial
    ):
        raise RuntimeError(
            "Existing 0040 trial came from a different manifest. "
            "Use --replace-trial only after intentional review."
        )

    trial: dict[str, Any] = {
        "version": 1,
        "protocol": "velastra.visual_place_memory_trial.v1",
        "trialId": args.trial_id,
        "status": "planned",
        "createdAt": existing.get("createdAt") or painter.utc_now(),
        "updatedAt": painter.utc_now(),
        "manifest": args.manifest,
        "manifestSha256": manifest_sha,
        "profileId": args.profile,
        "repeatsPerCondition": args.repeats,
        "brush": "qwen_image_edit",
        "transport": "huggingface",
        "provider": "fal-ai",
        "providerSeedControl": False,
        "carrierPair": pair,
        "promptDiagnostics": {
            "sharedPromptSha256": next(
                iter(prompt_hashes[CONDITIONS[0]])
            ),
            "painterFacingPromptIdenticalAcrossConditions": True,
        },
        "conditions": arms,
        "executionOrder": execution_order,
        "frozen": {
            "sameAuthoredSceneTruth": True,
            "sameHandprint": True,
            "sameSemanticPlaceMemory": True,
            "sameApprovedSourceCorpus": True,
            "sameNormalizedSourcePixels": True,
            "samePainterFacingPrompt": True,
            "sameBrush": True,
            "sameProvider": True,
            "ordinaryWitnessFirewall": "disabled",
            "providerSeedControl": False,
            "onlySystematicFactor": "carrier_spatial_retention",
        },
        "humanReview": {
            "status": "pending",
            "questions": [
                "Does meso-scale adjacency increase lived-place specificity across repeated outputs?",
                "Does the experimental carrier reduce generic prestige/parlor priors?",
                "Does authored scene truth remain recognizable?",
                "Does the painterly hand remain coherent?",
                "Does any source architecture, object inventory, or layout leak into the target?",
                "Do old/new, sacred/ordinary, technical/domestic relations appear more naturally without becoming spectacle?",
            ],
            "notes": None,
        },
        "successCriteria": [
            "Visual Place Memory improves place specificity across more than one repeated output.",
            "The effect is directional across the distribution, not dependent on one lucky render.",
            "Authored scene truth remains recognizable.",
            "Painterly hand remains coherent.",
            "Source room layout and object inventory do not become target scene facts.",
            "The experimental carrier does not collapse outputs into one copied source composition.",
        ],
        "falsification": [
            "Control and experimental distributions are visually indistinguishable.",
            "Experimental outputs copy source architecture, furniture, people, or object inventory.",
            "Scene truth degrades materially under the experimental carrier.",
            "Any improvement is only generic prettiness or atmosphere rather than lived-place specificity.",
        ],
        "laws": {
            "noCanonMutation": True,
            "humanReviewRequired": True,
            "sourcePixelsAreEvidenceNotAuthority": True,
            "placeMemoryCannotInventPeopleOrRelationships": True,
            "carrierCannotOverrideSceneTruth": True,
            "providerStochasticityMustNotBeMisreportedAsSeedControl": True,
        },
    }

    painter.write_json(trial_path, trial)

    if not args.render:
        print(trial_path)
        print(
            f"planned={args.repeats * len(CONDITIONS)} renders; "
            "no inference executed"
        )
        print(
            "shared_prompt_sha256="
            + trial["promptDiagnostics"]["sharedPromptSha256"]
        )
        return 0

    trial["status"] = "running"
    trial["updatedAt"] = painter.utc_now()
    painter.write_json(trial_path, trial)

    arm_by_attempt = {
        arm["attemptId"]: arm
        for condition in CONDITIONS
        for arm in arms[condition]
    }
    for attempt in execution_order:
        arm = arm_by_attempt[attempt]
        ns, bundle, manifest_variant = runtime[attempt]
        execute_render(
            source_manifest=source_manifest,
            arm=arm,
            ns=ns,
            bundle=bundle,
            manifest_variant=manifest_variant,
        )
        trial["updatedAt"] = painter.utc_now()
        painter.write_json(trial_path, trial)

    all_rendered = all(
        arm.get("status") == "rendered"
        and arm.get("outputSha256")
        for condition in CONDITIONS
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
                for condition in CONDITIONS
                for arm in arms[condition]
                if arm.get("status") == "rendered"
            )
        )
    )
    print("status=" + trial["status"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
