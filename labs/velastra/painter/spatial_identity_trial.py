#!/usr/bin/env python3
"""Kernel 0039: paired Hearth Place Memory / Spatial Identity trial."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
DEFAULT_SEEDS = (190920, 190921, 190922, 190923)
KNOWN_BASINS = {
    190920: "smoky_presence",
    190921: "clear_intimate",
    190922: "wide_tableau",
    190923: "centered_ceremonial",
}


def load_local(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


painter = load_local("velastra_painter_0039", HERE / "velastra_painter.py")
spatial = load_local("velastra_spatial_identity_0039", HERE / "spatial_identity.py")


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
        raise RuntimeError("Spatial Identity trial requires at least two seeds.")
    return seeds


def render_namespace(
    args: argparse.Namespace,
    *,
    seed: int,
    attempt: str,
) -> argparse.Namespace:
    return argparse.Namespace(
        manifest=args.manifest,
        brush="qwen_image",
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
    bundle = painter.compile_prompt_bundle(manifest, spec)

    witness = bundle.get("witness") or {}
    if witness.get("active"):
        raise RuntimeError("0039 must remain witness-free.")

    style_ablations = (
        (bundle.get("style") or {}).get("ablations")
        or {}
    )
    if (
        style_ablations.get("disabledStyleIds")
        or style_ablations.get("disabledPhrases")
    ):
        raise RuntimeError("0039 must keep the painterly hand unablated.")

    if condition == "spatial_identity":
        bundle = spatial.augment_prompt_bundle(bundle, contract)

    cid = painter.candidate_id(manifest, bundle, spec)
    base = Path(args.out_dir) / manifest["assetKey"]
    image_path = base / f"{cid}.png"
    record_path = base / f"{cid}.candidate.json"

    arm = {
        "condition": condition,
        "seed": seed,
        "knownBasin": KNOWN_BASINS.get(seed),
        "attemptId": attempt,
        "candidateId": cid,
        "image": image_path.as_posix(),
        "candidateRecord": record_path.as_posix(),
        "promptSha256": prompt_sha(bundle),
        "spatialIdentity": (
            bundle.get("spatialIdentity")
            if condition == "spatial_identity"
            else {
                "active": False,
                "profileId": None,
            }
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
        "command": [
            ".venv/bin/python",
            "labs/velastra/painter/spatial_identity_trial.py",
            args.manifest,
            "--trial-id",
            args.trial_id,
            "--profile",
            args.profile,
            "--seeds",
            args.seeds,
            "--repo-root",
            args.repo_root,
            "--render",
        ],
        "humanReview": {
            "handFidelity": None,
            "hearthFidelity": None,
            "basinCharacter": None,
            "camera": None,
            "topology": None,
            "presentation": None,
            "relationalGeometry": None,
            "livedUse": None,
            "sacredOrdinaryCoexistence": None,
            "technologyBelongs": None,
            "temporalTexture": None,
            "thresholdHospitality": None,
            "genericPrestigePrior": None,
            "sceneTruthPass": None,
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
    record["source"]["spatialIdentity"] = (
        bundle.get("spatialIdentity")
        or {
            "active": False,
            "profileId": None,
        }
    )

    if spec.backend != "huggingface":
        raise RuntimeError("0039 is frozen to the Hugging Face transport.")

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
            "Plan or render Kernel 0039 paired baseline vs Place Memory "
            "Hearth trials at known seed basins."
        )
    )
    parser.add_argument("manifest")
    parser.add_argument(
        "--trial-id",
        default="hearth-spatial-identity-0039",
    )
    parser.add_argument(
        "--profile",
        default="house_freedom_hearth_v1",
    )
    parser.add_argument(
        "--seeds",
        default="190920,190921,190922,190923",
    )
    parser.add_argument("--repo-root", default=".")
    parser.add_argument(
        "--registry",
        default="world/velastra-place-identities.json",
    )
    parser.add_argument(
        "--handprint",
        default="world/velastra-handprint.json",
    )
    parser.add_argument(
        "--out-dir",
        default=".velastra/candidates",
    )
    parser.add_argument(
        "--output",
        default="labs/velastra/evidence/trials/hearth-spatial-identity-0039.json",
    )
    parser.add_argument(
        "--render",
        action="store_true",
        help="Explicitly execute the eight planned inferences.",
    )
    parser.add_argument(
        "--replace-trial",
        action="store_true",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    manifest_path = Path(args.manifest)
    manifest = painter.unwrap_manifest(
        painter.read_json(manifest_path)
    )
    painter.require_manifest(manifest)

    registry_path = Path(args.registry)
    if not registry_path.is_absolute():
        registry_path = repo_root / registry_path
    contract = spatial.resolve_contract(
        manifest=manifest,
        profile_id=args.profile,
        registry_path=registry_path,
    )

    handprint_path = Path(args.handprint)
    if not handprint_path.is_absolute():
        handprint_path = repo_root / handprint_path
    handprint = painter.read_json(handprint_path)

    seeds = parse_seeds(args.seeds)
    if any(seed not in KNOWN_BASINS for seed in seeds):
        unknown = [seed for seed in seeds if seed not in KNOWN_BASINS]
        raise RuntimeError(
            "0039 is intentionally anchored to known 0037/0038 basins; "
            f"unsupported seed(s): {unknown}"
        )

    arms: dict[str, list[dict[str, Any]]] = {
        "baseline": [],
        "spatial_identity": [],
    }
    runtime: dict[str, tuple[argparse.Namespace, dict[str, Any]]] = {}

    for seed in seeds:
        for condition in ("baseline", "spatial_identity"):
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
        arm["promptSha256"]
        for arm in arms["baseline"]
    }
    identity_hashes = {
        arm["promptSha256"]
        for arm in arms["spatial_identity"]
    }
    if len(baseline_hashes) != 1 or len(identity_hashes) != 1:
        raise RuntimeError(
            "Prompt drift detected within a 0039 condition across seeds."
        )
    if baseline_hashes == identity_hashes:
        raise RuntimeError(
            "Spatial Identity arm did not alter painter-facing prompts."
        )

    execution_order: list[str] = []
    for index, seed in enumerate(seeds):
        order = (
            ("baseline", "spatial_identity")
            if index % 2 == 0
            else ("spatial_identity", "baseline")
        )
        for condition in order:
            arm = next(
                item for item in arms[condition]
                if item["seed"] == seed
            )
            execution_order.append(arm["attemptId"])

    manifest_sha = painter.sha256_bytes(
        painter.canonical_json(manifest)
    )
    handprint_sha = painter.sha256_bytes(
        painter.canonical_json(handprint)
    )

    trial_path = Path(args.output)
    existing = (
        painter.read_json(trial_path)
        if trial_path.exists()
        else {}
    )
    prior_manifest = existing.get("manifestSha256")
    if (
        prior_manifest
        and prior_manifest != manifest_sha
        and not args.replace_trial
    ):
        raise RuntimeError(
            "Existing 0039 trial came from a different manifest. "
            "Use --replace-trial only after intentional review."
        )

    trial: dict[str, Any] = {
        "version": 1,
        "protocol": "velastra.spatial_identity_trial.v1",
        "trialId": args.trial_id,
        "status": "planned",
        "createdAt": existing.get("createdAt") or painter.utc_now(),
        "updatedAt": painter.utc_now(),
        "assetKey": manifest["assetKey"],
        "manifest": args.manifest,
        "manifestSha256": manifest_sha,
        "brush": "qwen_image",
        "transport": "huggingface",
        "seeds": seeds,
        "knownBasins": {
            str(seed): KNOWN_BASINS[seed]
            for seed in seeds
        },
        "conditions": arms,
        "executionOrder": execution_order,
        "frozen": {
            "handprintPath": Path(args.handprint).as_posix(),
            "handprintSha256": handprint_sha,
            "witnessPixels": "none",
            "styleAblations": "none",
            "controlPlaneIsolation": True,
            "thresholdIntegrity": True,
            "fixedObjectEnforcement": "unchanged_from_0038",
            "sameSeedWithinPair": True,
            "samePainterlyHandWithinPair": True,
            "sameSceneTruthWithinPair": True,
            "onlyExperimentalFactor": "place_memory_profile",
        },
        "experimentalFactor": {
            "profileId": contract.get("profileId"),
            "profileVersion": contract.get("version"),
            "registry": args.registry,
            "registrySha256": contract.get("registrySha256"),
            "profileSha256": contract.get("profileSha256"),
            "semanticCommitments": contract.get("semanticCommitments"),
            "domains": contract.get("domains"),
        },
        "promptDiagnostics": {
            "baselinePromptSha256": next(iter(baseline_hashes)),
            "spatialIdentityPromptSha256": next(iter(identity_hashes)),
        },
        "pairReviews": {
            str(seed): {
                "knownBasin": KNOWN_BASINS[seed],
                "basinCharacterPreserved": None,
                "handFidelityPreserved": None,
                "hearthFidelityImproved": None,
                "inhabitationImproved": None,
                "prestigeOrTableauPriorReduced": None,
                "sceneTruthStillRecognizable": None,
                "notes": None,
            }
            for seed in seeds
        },
        "humanReview": {
            "status": "pending",
            "primaryQuestion": (
                "Can Place Memory pull known Hearth seed basins toward "
                "House Freedom spatial identity without destroying painterly "
                "hand, scene truth, or basin character?"
            ),
            "successRequires": [
                "Hearth fidelity improves in more than one known basin.",
                "The same seed remains recognizably related across A/B.",
                "Painterly hand remains coherent.",
                "Authored scene truth remains recognizable.",
                "Improvements come from lived relational geometry rather than added prestige or spectacle."
            ],
            "notes": None,
        },
        "laws": {
            "trialCannotMutateCanon": True,
            "witnessMustRemainAbsent": True,
            "handMustRemainUnablated": True,
            "placeMemoryMustRemainCandidateLocal": True,
            "profileNameMustNotReachPainter": True,
            "sameSeedMustBeUsedWithinPair": True,
            "semanticSuccessRequiresHumanReview": True,
            "placeIdentityCannotInventPeopleOrRelationshipFacts": True,
            "basinClassificationCannotImplyAgency": True,
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
            "spatial_identity_prompt_sha256="
            + trial["promptDiagnostics"]["spatialIdentityPromptSha256"]
        )
        return 0

    trial["status"] = "running"
    trial["updatedAt"] = painter.utc_now()
    painter.write_json(trial_path, trial)

    by_attempt = {
        arm["attemptId"]: arm
        for condition in arms.values()
        for arm in condition
    }
    for attempt in execution_order:
        arm = by_attempt[attempt]
        ns, bundle = runtime[attempt]
        execute_render(
            manifest=manifest,
            arm=arm,
            ns=ns,
            bundle=bundle,
        )
        trial["updatedAt"] = painter.utc_now()
        painter.write_json(trial_path, trial)

    trial["status"] = "complete"
    trial["updatedAt"] = painter.utc_now()
    painter.write_json(trial_path, trial)
    print(trial_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
