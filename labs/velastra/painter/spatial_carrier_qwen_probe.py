#!/usr/bin/env python3
"""Kernel 0042 fallback transport gate: one structured-carrier Qwen Image Edit probe.

Dry-run by default. Pass --execute to authorize exactly one provider request.

The input image is a non-semantic spatial carrier. It is not a Visual Witness
and must not be interpreted as painterly or semantic source content.
"""

from __future__ import annotations

import argparse
import hashlib
import inspect
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MODEL = "Qwen/Qwen-Image-Edit"
PROVIDER = "fal-ai"
TOKEN_ENV = "HF_TOKEN"
WIDTH = 1536
HEIGHT = 864

CARRIER_DIR = Path(
    "labs/velastra/evidence/artifacts/hearth-spatial-carrier-0042"
)
CARRIER_RECORD = CARRIER_DIR / "carrier.json"
STRUCTURED = CARRIER_DIR / "structured.png"

OUT_DIR = Path(".velastra/spatial-carrier/hearth-0042")
OUTPUT_IMAGE = OUT_DIR / "qwen-structured-probe.png"
PROBE_RECORD = Path(
    "labs/velastra/evidence/trials/hearth-spatial-carrier-0042-qwen-probe.json"
)

PROMPT = (
    "Rebuild this input into a finished environmental oil painting of The Hearth. "
    "Use the input only as non-semantic spatial guidance for broad arrangement; "
    "do not copy blocks, grayscale appearance, or any imagined object from it. "
    "The authored scene contains exactly one low, contained fire and exactly one "
    "velvet cushion. Velvet-dark walls keep the room close without making it small. "
    "Preserve authored scene facts. Use warm-biased restrained color, selective "
    "edge resolution, deep environmental shadow, worn patina, layered pigment, "
    "and tactile material memory. Let illumination carry relation rather than spectacle. "
    "Do not add people, text, symbols, extra furniture, or decorative props."
)

FORBIDDEN_INTERNAL_TERMS = (
    "handprint",
    "visual witness",
    "witness firewall",
    "structural memory",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def estimate_tokens(text: str) -> int:
    return max(1, (len(text) + 3) // 4)


def load_and_verify_carrier() -> dict[str, Any]:
    if not CARRIER_RECORD.exists():
        raise RuntimeError(f"Missing canonical carrier record: {CARRIER_RECORD}")
    if not STRUCTURED.exists():
        raise RuntimeError(f"Missing canonical structured carrier: {STRUCTURED}")

    record = json.loads(CARRIER_RECORD.read_text(encoding="utf-8"))
    structured = record.get("structured") or {}
    destroyed = record.get("destroyed") or {}

    actual = sha256_file(STRUCTURED)
    if actual != structured.get("sha256"):
        raise RuntimeError(
            "Structured carrier SHA mismatch: "
            f"recorded={structured.get('sha256')} actual={actual}"
        )

    if (
        structured.get("pixelHistogramSha256")
        != destroyed.get("pixelHistogramSha256")
    ):
        raise RuntimeError("0042 carrier invariant failed: histogram SHA differs.")

    if record.get("semanticContent") != "none":
        raise RuntimeError("Carrier record does not assert semanticContent=none.")
    if record.get("styleContent") != "none":
        raise RuntimeError("Carrier record does not assert styleContent=none.")
    return record


def validate_prompt() -> None:
    lowered = PROMPT.lower()
    leaks = [term for term in FORBIDDEN_INTERNAL_TERMS if term in lowered]
    if leaks:
        raise RuntimeError(
            "0042 internal control vocabulary leaked into provider prompt: "
            + ", ".join(leaks)
        )


def plan_record(carrier: dict[str, Any]) -> dict[str, Any]:
    return {
        "version": 1,
        "trial": "hearth-spatial-carrier-0042-qwen-transport-probe",
        "status": "planned",
        "createdAt": utc_now(),
        "purpose": (
            "Verify Qwen Image Edit accepts the structured non-semantic carrier "
            "before authorizing the 2+2 geometry pilot."
        ),
        "providerRequestCountAuthorized": 0,
        "input": {
            "condition": "structured",
            "path": STRUCTURED.as_posix(),
            "sha256": carrier["structured"]["sha256"],
            "pixelHistogramSha256": carrier["structured"][
                "pixelHistogramSha256"
            ],
            "semanticContent": "none",
            "styleContent": "none",
        },
        "prompt": {
            "sha256": hashlib.sha256(PROMPT.encode("utf-8")).hexdigest(),
            "estimatedTokens": estimate_tokens(PROMPT),
            "internalControlLeaks": [],
        },
        "render": {
            "provider": PROVIDER,
            "model": MODEL,
            "task": "image_to_image",
            "width": WIDTH,
            "height": HEIGHT,
            "providerSeedControl": False,
            "attempts": 1,
        },
        "output": None,
        "providerResult": None,
        "laws": {
            "probeMaySpendAtMostOneRequest": True,
            "probeUsesStructuredCarrierOnly": True,
            "carrierIsNotVisualWitness": True,
            "carrierCarriesNoSemanticSceneAuthority": True,
            "rejectionMustBeRecorded": True,
            "noRetryOnRejectedTransport": True,
        },
    }


def execute(record: dict[str, Any]) -> dict[str, Any]:
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

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PROBE_RECORD.parent.mkdir(parents=True, exist_ok=True)

    client = InferenceClient(provider=PROVIDER, api_key=token)
    method = client.image_to_image
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

    record["status"] = "executing"
    record["providerRequestCountAuthorized"] = 1
    record["executedAt"] = utc_now()
    PROBE_RECORD.write_text(
        json.dumps(record, indent=2) + "\n",
        encoding="utf-8",
    )

    try:
        image = method(STRUCTURED.read_bytes(), **request)
    except Exception as exc:
        record["status"] = "transport_rejected"
        record["providerResult"] = {
            "accepted": False,
            "errorType": type(exc).__name__,
            "error": str(exc),
            "recordedAt": utc_now(),
        }
        record["output"] = None
        PROBE_RECORD.write_text(
            json.dumps(record, indent=2) + "\n",
            encoding="utf-8",
        )
        print(PROBE_RECORD)
        print("transport_rejected")
        print(f"{type(exc).__name__}: {exc}")
        return record

    image.save(OUTPUT_IMAGE, format="PNG")
    record["status"] = "transport_accepted"
    record["providerResult"] = {
        "accepted": True,
        "recordedAt": utc_now(),
    }
    record["output"] = {
        "path": OUTPUT_IMAGE.as_posix(),
        "sha256": sha256_file(OUTPUT_IMAGE),
    }
    PROBE_RECORD.write_text(
        json.dumps(record, indent=2) + "\n",
        encoding="utf-8",
    )
    print(PROBE_RECORD)
    print(OUTPUT_IMAGE)
    print("transport_accepted")
    return record


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Kernel 0042 one-request Qwen Image Edit transport probe."
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Authorize exactly one paid provider request.",
    )
    args = parser.parse_args()

    carrier = load_and_verify_carrier()
    validate_prompt()
    record = plan_record(carrier)

    if not args.execute:
        PROBE_RECORD.parent.mkdir(parents=True, exist_ok=True)
        PROBE_RECORD.write_text(
            json.dumps(record, indent=2) + "\n",
            encoding="utf-8",
        )
        print(PROBE_RECORD)
        print("status=planned")
        print(f"prompt_tokens_estimate={estimate_tokens(PROMPT)}")
        print("provider_requests=0")
        return 0

    execute(record)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
