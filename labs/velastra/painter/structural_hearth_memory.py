#!/usr/bin/env python3
"""Kernel 0041 Structural Hearth Memory compiler.

This layer carries topology only. It does not provide reference pixels and may
not invent scene facts, people, relationships, or fixed objects.
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping


class StructuralMemoryError(RuntimeError):
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


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise StructuralMemoryError(f"Missing registry: {path}") from exc
    except json.JSONDecodeError as exc:
        raise StructuralMemoryError(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise StructuralMemoryError("Registry must be a JSON object.")
    return value


def resolve_contract(
    *,
    registry_path: Path,
    profile_id: str,
) -> dict[str, Any]:
    registry = _read_json(registry_path)
    profile = (registry.get("profiles") or {}).get(profile_id)
    if not isinstance(profile, Mapping):
        raise StructuralMemoryError(
            f"Unknown Place Memory profile: {profile_id}"
        )
    structural = profile.get("structuralMemory")
    if not isinstance(structural, Mapping):
        raise StructuralMemoryError(
            f"Profile has no structuralMemory config: {profile_id}"
        )

    directives = [
        str(item).strip()
        for item in (
            (structural.get("painterFacing") or {}).get("directives")
            or []
        )
        if str(item).strip()
    ]
    if not directives:
        raise StructuralMemoryError(
            "Structural Memory requires painter-facing directives."
        )

    return {
        "active": True,
        "profileId": profile_id,
        "status": structural.get("status"),
        "purpose": structural.get("purpose"),
        "nodes": list(structural.get("nodes") or []),
        "relations": list(structural.get("relations") or []),
        "laws": dict(structural.get("laws") or {}),
        "painterFacing": {
            "directives": directives,
        },
        "registry": registry_path.as_posix(),
        "registrySha256": _sha256_json(registry),
        "structuralSha256": _sha256_json(structural),
    }


def painter_section(contract: Mapping[str, Any]) -> str:
    directives = (
        (contract.get("painterFacing") or {}).get("directives")
        or []
    )
    return (
        "Lived-space topology: "
        + " ".join(
            str(item).strip()
            for item in directives
            if str(item).strip()
        )
    )


def augment_prompt_bundle(
    prompt_bundle: Mapping[str, Any],
    contract: Mapping[str, Any],
) -> dict[str, Any]:
    if contract.get("active") is not True:
        return copy.deepcopy(dict(prompt_bundle))

    bundle = copy.deepcopy(dict(prompt_bundle))
    section = painter_section(contract)

    forbidden_labels = [
        str(contract.get("profileId") or ""),
        "Structural Memory",
        "Structural Hearth Memory",
        "House Freedom",
    ]
    for label in forbidden_labels:
        if label and label.lower() in section.lower():
            raise StructuralMemoryError(
                f"Internal structural label leaked painter-facing text: {label}"
            )

    positive = str(bundle.get("positive") or "").rstrip()
    bundle["positive"] = positive + "\n" + section

    budget = dict(bundle.get("budget") or {})
    added = max(1, (len(section) + 3) // 4)
    before = int(budget.get("afterTokens") or 0)
    budget["structuralMemoryAddedTokensEstimate"] = added
    budget["afterStructuralMemoryTokensEstimate"] = before + added
    bundle["budget"] = budget

    bundle["structuralMemory"] = {
        "active": True,
        "profileId": contract.get("profileId"),
        "registry": contract.get("registry"),
        "registrySha256": contract.get("registrySha256"),
        "structuralSha256": contract.get("structuralSha256"),
        "nodes": list(contract.get("nodes") or []),
        "relations": list(contract.get("relations") or []),
        "laws": dict(contract.get("laws") or {}),
        "painterFacingDirectiveCount": len(
            (contract.get("painterFacing") or {}).get("directives") or []
        ),
    }
    return bundle
