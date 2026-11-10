#!/usr/bin/env python3
"""Velastra experimental Place Memory / Spatial Identity layer.

Kernel 0039 keeps place identity candidate-local until paired evidence shows
that it improves Hearth fidelity without flattening the painterly hand or seed
basin character.
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping


class SpatialIdentityError(RuntimeError):
    pass


def _canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def _sha256_json(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value)).hexdigest()


def _read_registry(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SpatialIdentityError(
            f"Missing Place Memory registry: {path}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise SpatialIdentityError(
            f"Invalid Place Memory registry JSON: {exc}"
        ) from exc
    if not isinstance(value, dict):
        raise SpatialIdentityError(
            "Place Memory registry must be a JSON object."
        )
    return value


def _scene_kind(manifest: Mapping[str, Any]) -> str:
    scene = manifest.get("scene") or {}
    environment = scene.get("environment") or {}
    return (
        str(environment.get("kind") or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def resolve_contract(
    *,
    manifest: Mapping[str, Any],
    profile_id: str,
    registry_path: Path,
) -> dict[str, Any]:
    registry = _read_registry(registry_path)
    profiles = registry.get("profiles") or {}
    profile = profiles.get(profile_id)
    if not isinstance(profile, Mapping):
        raise SpatialIdentityError(
            f"Unknown Place Memory profile: {profile_id}"
        )

    target_kind = (
        str(profile.get("targetKind") or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )
    scene_kind = _scene_kind(manifest)
    if target_kind and target_kind != scene_kind:
        raise SpatialIdentityError(
            "Place Memory target mismatch: "
            f"profile expects {target_kind}, scene is {scene_kind or 'unknown'}."
        )

    painter = profile.get("painterFacing") or {}
    directives = [
        str(item).strip()
        for item in (painter.get("directives") or [])
        if str(item).strip()
    ]
    avoid = [
        str(item).strip()
        for item in (painter.get("avoid") or [])
        if str(item).strip()
    ]
    if not directives:
        raise SpatialIdentityError(
            f"Place Memory profile {profile_id} has no painter-facing directives."
        )

    return {
        "active": True,
        "profileId": profile_id,
        "version": profile.get("version"),
        "designation": profile.get("designation"),
        "targetKind": target_kind or None,
        "registry": registry_path.as_posix(),
        "registrySha256": _sha256_json(registry),
        "profileSha256": _sha256_json(profile),
        "semanticCommitments": dict(
            profile.get("semanticCommitments") or {}
        ),
        "domains": dict(profile.get("domains") or {}),
        "laws": dict(profile.get("laws") or {}),
        "painterFacing": {
            "directives": directives,
            "avoid": avoid,
        },
    }


def painter_section(contract: Mapping[str, Any]) -> str:
    directives = (
        (contract.get("painterFacing") or {}).get("directives")
        or []
    )
    return (
        "Lived-place behavior: "
        + " ".join(str(item).strip() for item in directives if str(item).strip())
    )


def augment_prompt_bundle(
    prompt_bundle: Mapping[str, Any],
    contract: Mapping[str, Any],
) -> dict[str, Any]:
    """Return a copied prompt bundle with Place Memory applied.

    Internal profile names and House labels remain in provenance only. The
    painter receives concrete spatial consequences, not control-plane names.
    """
    if contract.get("active") is not True:
        return copy.deepcopy(dict(prompt_bundle))

    bundle = copy.deepcopy(dict(prompt_bundle))
    positive = str(bundle.get("positive") or "").rstrip()
    section = painter_section(contract)

    forbidden_labels = [
        str(contract.get("profileId") or ""),
        str(contract.get("designation") or ""),
        "Place Memory",
        "Spatial Identity",
    ]
    for label in forbidden_labels:
        if label and label.lower() in section.lower():
            raise SpatialIdentityError(
                f"Internal Place Memory label leaked painter-facing text: {label}"
            )

    bundle["positive"] = positive + "\n" + section

    avoid = (
        (contract.get("painterFacing") or {}).get("avoid")
        or []
    )
    if avoid:
        negative = str(bundle.get("negative") or "").rstrip()
        addition = (
            "Avoid spatial shorthand that turns this lived room into: "
            + " | ".join(str(item).strip() for item in avoid if str(item).strip())
        )
        bundle["negative"] = (
            negative + "\n" + addition
            if negative
            else addition
        )

    before = int(
        ((bundle.get("budget") or {}).get("afterTokens"))
        or 0
    )
    added = max(1, (len(section) + 3) // 4)
    budget = dict(bundle.get("budget") or {})
    budget["placeMemoryAddedTokensEstimate"] = added
    budget["afterPlaceMemoryTokensEstimate"] = before + added
    bundle["budget"] = budget

    bundle["spatialIdentity"] = {
        "active": True,
        "profileId": contract.get("profileId"),
        "version": contract.get("version"),
        "targetKind": contract.get("targetKind"),
        "registry": contract.get("registry"),
        "registrySha256": contract.get("registrySha256"),
        "profileSha256": contract.get("profileSha256"),
        "semanticCommitments": dict(
            contract.get("semanticCommitments") or {}
        ),
        "domains": dict(contract.get("domains") or {}),
        "laws": dict(contract.get("laws") or {}),
        "painterFacingDirectiveCount": len(
            (contract.get("painterFacing") or {}).get("directives")
            or []
        ),
        "painterFacingAvoidCount": len(avoid),
    }
    return bundle
