#!/usr/bin/env python3
"""Kernel 0042 Qwen Image Edit 2+2 spatial-carrier pilot.

The accepted structured transport probe is reused as structured repeat 1.
Therefore --execute authorizes exactly three additional provider requests:

1. destroyed repeat 1
2. structured repeat 2
3. destroyed repeat 2

Dry-run by default. No provider requests occur without --execute.
"""

from __future__ import annotations

import argparse
import hashlib
import inspect
import importlib.util
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROBE_MODULE_PATH = Path(__file__).with_name("spatial_carrier_qwen_probe.py")
PROBE_SPEC = importlib.util.spec_from_file_location(
    "velastra_spatial_carrier_qwen_probe_runtime",
    PROBE_MODULE_PATH,
)
if PROBE_SPEC is None or PROBE_SPEC.loader is None:
    raise RuntimeError("Unable to load spatial_carrier_qwen_probe.py")
probe = importlib.util.module_from_spec(PROBE_SPEC)
PROBE_SPEC.loader.exec_module(probe)


MODEL = probe.MODEL
PROVIDER = probe.PROVIDER
TOKEN_ENV = probe.TOKEN_ENV
WIDTH = probe.WIDTH
HEIGHT = probe.HEIGHT
PROMPT = probe.PROMPT

CARRIER_DIR = probe.CARRIER_DIR
CARRIER_RECORD = probe.CARRIER_RECORD
STRUCTURED = CARRIER_DIR / "structured.png"
DESTROYED = CARRIER_DIR / "destroyed.png"

PROBE_RECORD = probe.PROBE_RECORD
PROBE_IMAGE = probe.OUTPUT_IMAGE

OUT_DIR = Path(".velastra/spatial-carrier/hearth-0042/qwen-pilot")
TRIAL_RECORD = Path(
    "labs/velastra/evidence/trials/hearth-spatial-carrier-0042.json"
)

EXECUTION_ORDER = (
    ("destroyed", 1),
    ("structured", 2),
    ("destroyed", 2),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def attempt_id(condition: str, repeat: int) -> str:
    return f"hearth-spatial-carrier-0042-{condition}-r{repeat:02d}"


def load_carrier() -> dict[str, Any]:
    record = probe.load_and_verify_carrier()
    if not DESTROYED.exists():
        raise RuntimeError(f"Missing canonical destroyed carrier: {DESTROYED}")
    destroyed = record.get("destroyed") or {}
    actual = sha256_file(DESTROYED)
    if actual != destroyed.get("sha256"):
        raise RuntimeError(
            "Destroyed carrier SHA mismatch: "
            f"recorded={destroyed.get('sha256')} actual={actual}"
        )
    return record


def load_structured_probe() -> dict[str, Any]:
    if not PROBE_RECORD.exists():
        raise RuntimeError(
            "Missing accepted Qwen structured probe record: "
            f"{PROBE_RECORD}"
        )
    if not PROBE_IMAGE.exists():
        raise RuntimeError(
            "Missing accepted Qwen structured probe image: "
            f"{PROBE_IMAGE}"
        )

    record = json.loads(PROBE_RECORD.read_text(encoding="utf-8"))
    if record.get("status") != "transport_accepted":
        raise RuntimeError(
            "Qwen structured probe was not accepted; cannot reuse it as "
            "structured repeat 1."
        )

    expected_prompt_sha = hashlib.sha256(PROMPT.encode("utf-8")).hexdigest()
    if (record.get("prompt") or {}).get("sha256") != expected_prompt_sha:
        raise RuntimeError("Structured probe prompt does not match pilot prompt.")

    render = record.get("render") or {}
    if render.get("model") != MODEL or render.get("provider") != PROVIDER:
        raise RuntimeError("Structured probe model/provider does not match pilot.")

    output = record.get("output") or {}
    actual_sha = sha256_file(PROBE_IMAGE)
    if output.get("sha256") != actual_sha:
        raise RuntimeError("Structured probe output SHA mismatch.")

    return record


def carrier_path(condition: str) -> Path:
    if condition == "structured":
        return STRUCTURED
    if condition == "destroyed":
        return DESTROYED
    raise RuntimeError(f"Unknown 0042 condition: {condition}")


def make_attempt_plan(
    carrier: dict[str, Any],
    condition: str,
    repeat: int,
) -> dict[str, Any]:
    entry = carrier[condition]
    aid = attempt_id(condition, repeat)
    image_path = OUT_DIR / f"{aid}.png"
    sidecar_path = OUT_DIR / f"{aid}.candidate.json"
    return {
        "attemptId": aid,
        "condition": condition,
        "repeat": repeat,
        "carrier": {
            "path": carrier_path(condition).as_posix(),
            "sha256": entry["sha256"],
            "pixelHistogramSha256": entry["pixelHistogramSha256"],
            "globalTopologyPreserved": entry["globalTopologyPreserved"],
        },
        "output": {
            "path": image_path.as_posix(),
            "sha256": None,
        },
        "candidateRecord": sidecar_path.as_posix(),
        "providerResult": None,
    }


def build_trial(
    carrier: dict[str, Any],
    structured_probe: dict[str, Any],
) -> dict[str, Any]:
    prompt_sha = hashlib.sha256(PROMPT.encode("utf-8")).hexdigest()

    s1 = {
        "attemptId": attempt_id("structured", 1),
        "condition": "structured",
        "repeat": 1,
        "source": "accepted_transport_probe",
        "carrier": {
            "path": STRUCTURED.as_posix(),
            "sha256": carrier["structured"]["sha256"],
            "pixelHistogramSha256": carrier["structured"][
                "pixelHistogramSha256"
            ],
            "globalTopologyPreserved": True,
        },
        "output": {
            "path": PROBE_IMAGE.as_posix(),
            "sha256": (structured_probe.get("output") or {}).get("sha256"),
        },
        "candidateRecord": None,
        "providerResult": structured_probe.get("providerResult"),
    }

    remaining = [
        make_attempt_plan(carrier, condition, repeat)
        for condition, repeat in EXECUTION_ORDER
    ]

    return {
        "version": 1,
        "trial": "hearth-spatial-carrier-0042",
        "status": "planned",
        "createdAt": utc_now(),
        "question": (
            "Does preserved global carrier geometry shift Hearth topology "
            "relative to an exact-pixel-histogram destroyed-layout control?"
        ),
        "prompt": {
            "sha256": prompt_sha,
            "estimatedTokens": probe.estimate_tokens(PROMPT),
            "textIdenticalAcrossConditions": True,
            "containsExplicitTopologyLayoutInstructions": False,
        },
        "render": {
            "provider": PROVIDER,
            "model": MODEL,
            "task": "image_to_image",
            "width": WIDTH,
            "height": HEIGHT,
            "providerSeedControl": False,
            "interpretation": "distributional_2_plus_2",
        },
        "frozen": {
            "samePromptAcrossConditions": True,
            "sameModelAcrossConditions": True,
            "sameProviderAcrossConditions": True,
            "sameDimensionsAcrossConditions": True,
            "samePixelHistogramAcrossCarriers": True,
            "sameLocalTileInventoryAcrossCarriers": True,
            "carrierSemanticContent": "none",
            "carrierStyleContent": "none",
            "onlySystematicFactor": "carrier_global_spatial_retention",
        },
        "providerRequestsAlreadySpent": 1,
        "providerRequestsRemaining": 3,
        "executionOrder": [
            attempt_id("structured", 1),
            *[
                attempt_id(condition, repeat)
                for condition, repeat in EXECUTION_ORDER
            ],
        ],
        "conditions": {
            "structured": [
                s1,
                next(
                    item for item in remaining
                    if item["condition"] == "structured"
                ),
            ],
            "destroyed": [
                item for item in remaining
                if item["condition"] == "destroyed"
            ],
        },
        "humanReview": {
            "status": "pending",
            "questions": [
                "Does preserved geometry reduce the sovereign central axis?",
                "Does preserved geometry create multiple non-collinear zones of use?",
                "Does preserved geometry improve open circulation?",
                "Does preserved geometry reduce bilateral seating grammar?",
                "Does fire become subordinate to the room?",
                "Does either condition inherit block/tile artifacts?",
                "Does scene-truth fidelity differ materially by condition?",
            ],
            "notes": None,
        },
        "laws": {
            "trialCannotMutateCanon": True,
            "providerSeedControlMustNotBeClaimed": True,
            "carrierIsNotVisualWitness": True,
            "carrierCannotTeachPainterlyHand": True,
            "carrierCannotCarrySemanticSceneAuthority": True,
            "pilotMaySpendExactlyThreeAdditionalRequests": True,
            "noExpansionBeyondTwoPlusTwoWithoutHumanReview": True,
        },
    }


def write_trial(trial: dict[str, Any]) -> None:
    TRIAL_RECORD.parent.mkdir(parents=True, exist_ok=True)
    TRIAL_RECORD.write_text(
        json.dumps(trial, indent=2) + "\n",
        encoding="utf-8",
    )


def provider_method():
    try:
        from huggingface_hub import InferenceClient
    except ImportError as exc:
        raise RuntimeError(
            "Install labs/velastra/painter/requirements-provider.txt first."
        ) from exc

    token = os.environ.get(TOKEN_ENV)
    if not token:
        raise RuntimeError(
            f"{TOKEN_ENV} is not set. Export an Inference Providers token."
        )

    client = InferenceClient(provider=PROVIDER, api_key=token)
    return client.image_to_image


def execute_attempt(
    method,
    attempt: dict[str, Any],
) -> None:
    input_path = Path(attempt["carrier"]["path"])
    image_path = Path(attempt["output"]["path"])
    sidecar_path = Path(attempt["candidateRecord"])

    signature = inspect.signature(method)
    accepted = set(signature.parameters)
    accepts_kwargs = any(
        parameter.kind is inspect.Parameter.VAR_KEYWORD
        for parameter in signature.parameters.values()
    )

    request: dict[str, Any] = {
        "prompt": PROMPT,
        "model": MODEL,
    }
    if "target_size" in accepted or accepts_kwargs:
        request["target_size"] = {"width": WIDTH, "height": HEIGHT}

    image_path.parent.mkdir(parents=True, exist_ok=True)
    image = method(input_path.read_bytes(), **request)
    image.save(image_path, format="PNG")
    output_sha = sha256_file(image_path)

    attempt["output"]["sha256"] = output_sha
    attempt["providerResult"] = {
        "accepted": True,
        "recordedAt": utc_now(),
    }

    sidecar = {
        "version": 1,
        "protocol": "velastra.spatial_carrier.qwen_pilot.v1",
        "attemptId": attempt["attemptId"],
        "condition": attempt["condition"],
        "repeat": attempt["repeat"],
        "carrier": attempt["carrier"],
        "prompt": {
            "sha256": hashlib.sha256(PROMPT.encode("utf-8")).hexdigest(),
        },
        "render": {
            "provider": PROVIDER,
            "model": MODEL,
            "task": "image_to_image",
            "width": WIDTH,
            "height": HEIGHT,
            "providerSeedControl": False,
        },
        "output": {
            "path": image_path.as_posix(),
            "sha256": output_sha,
        },
        "createdAt": utc_now(),
    }
    sidecar_path.write_text(
        json.dumps(sidecar, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Kernel 0042 Qwen Image Edit 2+2 spatial-carrier pilot."
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Authorize exactly three additional paid provider requests.",
    )
    args = parser.parse_args()

    probe.validate_prompt()
    carrier = load_carrier()
    structured_probe = load_structured_probe()
    trial = build_trial(carrier, structured_probe)

    if not args.execute:
        write_trial(trial)
        print(TRIAL_RECORD)
        print("status=planned")
        print("provider_requests_already_spent=1")
        print("provider_requests_remaining=3")
        print("execution_order=" + ",".join(trial["executionOrder"]))
        return 0

    method = provider_method()
    trial["status"] = "executing"
    trial["executedAt"] = utc_now()
    write_trial(trial)

    by_id = {
        item["attemptId"]: item
        for condition in ("structured", "destroyed")
        for item in trial["conditions"][condition]
    }

    # Structured r01 already exists as the accepted transport probe.
    for aid in trial["executionOrder"][1:]:
        attempt = by_id[aid]
        try:
            execute_attempt(method, attempt)
        except Exception as exc:
            attempt["providerResult"] = {
                "accepted": False,
                "errorType": type(exc).__name__,
                "error": str(exc),
                "recordedAt": utc_now(),
            }
            trial["status"] = "partial_failure"
            trial["failedAttemptId"] = aid
            write_trial(trial)
            print(TRIAL_RECORD)
            print("partial_failure")
            print(f"{aid}: {type(exc).__name__}: {exc}")
            return 1
        write_trial(trial)
        print(
            f"{aid} -> {attempt['output']['path']} "
            f"sha256={attempt['output']['sha256']}"
        )

    trial["status"] = "rendered_pending_human_review"
    trial["completedAt"] = utc_now()
    trial["providerRequestsSpentTotal"] = 4
    write_trial(trial)
    print(TRIAL_RECORD)
    print("status=rendered_pending_human_review")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
