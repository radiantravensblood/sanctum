#!/usr/bin/env python3
"""Velastra Painter Bridge.

Authoring-side bridge between a renderer-neutral Velastra Atelier Manifest and
an image-generation backend. This tool never runs in Sanctum's browser runtime
and never promotes generated output to an approved asset automatically.
"""

from __future__ import annotations

import argparse
import hashlib
import inspect
import json
import os
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

PROTOCOL = "velastra.painter.v1"
CANDIDATE_STATUS = "candidate"
APPROVED_STATUS = "approved"
DEFAULT_WIDTH = 1536
DEFAULT_HEIGHT = 864
DEFAULT_BRUSH_REGISTRY = (
    Path(__file__).resolve().parents[3] / "world" / "velastra-brushes.json"
)


class PainterError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PainterError(f"Missing JSON file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PainterError(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise PainterError(f"Expected a JSON object in {path}.")
    return value


def write_json(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def unwrap_manifest(value: Mapping[str, Any]) -> dict[str, Any]:
    manifest = value.get("manifest", value)
    if not isinstance(manifest, dict):
        raise PainterError("Input must be an Atelier Manifest or an object containing `manifest`.")
    return dict(manifest)


def require_manifest(manifest: Mapping[str, Any]) -> None:
    required = ["assetKey", "artBrief", "scene", "provenance", "render"]
    missing = [key for key in required if key not in manifest]
    if missing:
        raise PainterError("Atelier Manifest is missing: " + ", ".join(missing))

    if manifest.get("engine") != "Velastra":
        raise PainterError("Input is not a Velastra manifest.")
    if manifest.get("layer") != "atelier_manifest":
        raise PainterError("Input is not an Atelier Manifest.")
    if not isinstance(manifest.get("assetKey"), str) or not manifest["assetKey"]:
        raise PainterError("Atelier Manifest requires a stable assetKey.")

    render = manifest.get("render") or {}
    if render.get("runtimeGeneration") is not False:
        raise PainterError("Painter Bridge refuses manifests that permit runtime generation.")


def flatten_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return " ".join(value.split())
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return "; ".join(filter(None, (flatten_text(item) for item in value)))
    if isinstance(value, Mapping):
        return "; ".join(
            f"{key}: {flatten_text(item)}"
            for key, item in value.items()
            if flatten_text(item)
        )
    return str(value)


def subject_lines(scene: Mapping[str, Any]) -> list[str]:
    lines: list[str] = []
    for subject in scene.get("subjects") or []:
        if not isinstance(subject, Mapping):
            continue
        subject_id = subject.get("id") or "unnamed_subject"
        description = (
            subject.get("description")
            or subject.get("visualClaim", {}).get("description")
            or subject.get("role")
            or ""
        )
        line = f"{subject_id}"
        if description:
            line += f": {flatten_text(description)}"
        lines.append(line)
    return lines


def relation_line(scene: Mapping[str, Any]) -> str:
    relation = scene.get("relation")
    if not isinstance(relation, Mapping) or not relation:
        return ""
    kind = relation.get("kind")
    facts = relation.get("facts") or relation.get("description") or relation.get("meaning")
    pieces = [flatten_text(kind), flatten_text(facts)]
    return " — ".join(piece for piece in pieces if piece)


def environment_lines(scene: Mapping[str, Any]) -> list[str]:
    env = scene.get("environment")
    if not isinstance(env, Mapping):
        return []
    lines: list[str] = []
    kind = flatten_text(env.get("kind"))
    if kind:
        lines.append(f"place kind: {kind}")
    for fact in env.get("facts") or []:
        text = flatten_text(fact)
        if text:
            lines.append(text)
    return lines


def motif_lines(manifest: Mapping[str, Any]) -> tuple[list[str], list[str]]:
    literal: list[str] = []
    symbolic: list[str] = []
    for motif in manifest.get("motifs") or []:
        if not isinstance(motif, Mapping):
            continue
        text = flatten_text({
            "id": motif.get("id"),
            "meaning": motif.get("meaning"),
        })
        if not text:
            continue
        if motif.get("mode") == "literal":
            literal.append(text)
        else:
            symbolic.append(text)
    return literal, symbolic


def compile_truth_envelope(manifest: Mapping[str, Any]) -> dict[str, Any]:
    scene = manifest.get("scene") or {}
    literal, symbolic = motif_lines(manifest)
    return {
        "assetKey": manifest["assetKey"],
        "subjects": subject_lines(scene),
        "relation": relation_line(scene) or None,
        "environment": environment_lines(scene),
        "literalMotifs": literal,
        "symbolicMotifs": symbolic,
        "laws": {
            "doNotInventIdentity": True,
            "doNotInventRelation": True,
            "doNotInventConsent": True,
            "doNotPromoteSymbolToLiteralFact": True,
            "scenePacketRemainsAuthoritative": True,
        },
    }


def style_lines(manifest: Mapping[str, Any]) -> dict[str, list[str]]:
    style = manifest.get("style")
    if not isinstance(style, Mapping):
        return {
            "hand": [],
            "archetype": [],
            "place": [],
            "avoid": [],
        }

    hand_entries = [
        entry
        for entry in (style.get("hand") or [])
        if isinstance(entry, Mapping) and entry.get("directive")
    ]
    emphasis = set(style.get("emphasis") or [])
    hand_entries.sort(
        key=lambda entry: (
            0 if entry.get("id") in emphasis else 1,
            -float(entry.get("weight") or 0),
        )
    )

    hand = [
        flatten_text(entry.get("directive"))
        for entry in hand_entries[:6]
        if flatten_text(entry.get("directive"))
    ]
    archetype_block = style.get("archetype") or {}
    place_block = style.get("place") or {}

    archetype = [
        flatten_text(item)
        for item in (archetype_block.get("directives") or [])
        if flatten_text(item)
    ]
    place = [
        flatten_text(item)
        for item in (place_block.get("directives") or [])
        if flatten_text(item)
    ]
    avoid = [
        flatten_text(item)
        for item in (
            ((place_block.get("avoid") or []))
            + (style.get("antiPatterns") or [])
        )[:10]
        if flatten_text(item)
    ]

    return {
        "hand": hand,
        "archetype": archetype,
        "place": place,
        "avoid": avoid,
    }


def compile_prompt_bundle(
    manifest: Mapping[str, Any],
    spec: "RenderSpec | None" = None,
) -> dict[str, Any]:
    brief = manifest.get("artBrief") or {}
    scene = manifest.get("scene") or {}
    truth = compile_truth_envelope(manifest)
    style = style_lines(manifest)
    dialect = spec.prompt_dialect if spec and spec.prompt_dialect else {}

    positive_sections: list[str] = [
        "Create a finished painterly image from this authored scene direction.",
        "Scene truth is authoritative. Style may interpret material, light, atmosphere, edge, and composition but may not invent semantic facts.",
        f"Primary visual argument: {flatten_text(brief.get('thesis'))}",
        f"Medium direction: {flatten_text(brief.get('medium') or manifest.get('medium', {}).get('id'))}",
    ]

    subjects = truth["subjects"]
    if subjects:
        positive_sections.append("Explicit subjects: " + " | ".join(subjects))

    if truth["relation"]:
        positive_sections.append("Explicit relation: " + truth["relation"])

    if truth["environment"]:
        positive_sections.append("Environment facts: " + " | ".join(truth["environment"]))

    hierarchy = flatten_text(brief.get("hierarchy"))
    if hierarchy:
        positive_sections.append(f"Focal hierarchy: {hierarchy}")

    if style["hand"]:
        positive_sections.append(
            "Virynism — handwriting laws: " + " | ".join(style["hand"])
        )

    if style["archetype"]:
        positive_sections.append(
            "Virynism — archetype handling: " + " | ".join(style["archetype"])
        )

    if style["place"]:
        positive_sections.append(
            "Virynism — place-specific handling: " + " | ".join(style["place"])
        )

    camera = flatten_text(
        brief.get("camera")
        or (scene.get("composition") or {}).get("camera")
    )
    if camera:
        positive_sections.append(f"Camera and composition: {camera}")

    lighting = flatten_text(brief.get("lighting"))
    if lighting:
        positive_sections.append("Lighting: " + lighting)

    edge = flatten_text(brief.get("edge"))
    if edge:
        positive_sections.append("Edge behavior: " + edge)

    surface = flatten_text(brief.get("surface"))
    if surface:
        positive_sections.append("Surface and patina: " + surface)

    if truth["literalMotifs"]:
        positive_sections.append(
            "Literal motifs permitted by scene truth: "
            + " | ".join(truth["literalMotifs"])
        )
    if truth["symbolicMotifs"]:
        positive_sections.append(
            "Symbolic motifs must remain metaphorical or materially embedded: "
            + " | ".join(truth["symbolicMotifs"])
        )

    directives = [
        flatten_text(item)
        for item in (brief.get("directives") or [])
    ]
    directives = [item for item in directives if item]
    if directives:
        positive_sections.append(
            "Scene art direction: " + " | ".join(directives)
        )

    dialect_directives = [
        flatten_text(item)
        for item in (dialect.get("directives") or [])
    ]
    dialect_directives = [
        item for item in dialect_directives if item
    ]
    if dialect_directives:
        positive_sections.append(
            "Brush translation rules: "
            + " | ".join(dialect_directives)
        )

    positive_sections.append(
        "Let material, light, gesture, residue, atmosphere, negative space, "
        "and painterly edges carry meaning. Preserve strangeness without spectacle."
    )

    negative = [
        "Do not invent additional people, identities, relationships, consent, touch, text, logos, symbols, or objects.",
        "Do not turn symbolic motifs into literal world facts.",
        "Do not add decorative UI chrome, cards, captions, labels, diagrams, or typography unless explicitly present in scene facts.",
        "Do not flatten the image into generic concept art, stock illustration, clip art, procedural SVG aesthetics, or staged showroom photography.",
        "Do not contradict the explicit subject, relation, environment, camera, lighting, or provenance constraints.",
    ]

    if style["avoid"]:
        negative.append(
            "Virynism rejects: " + " | ".join(style["avoid"])
        )

    dialect_negative = [
        flatten_text(item)
        for item in (dialect.get("negativePriorities") or [])
    ]
    dialect_negative = [
        item for item in dialect_negative if item
    ]
    if dialect_negative:
        negative.append(
            "Brush-specific avoidances: "
            + " | ".join(dialect_negative)
        )

    return {
        "positive": "\n".join(
            section
            for section in positive_sections
            if section and not section.endswith(": ")
        ),
        "negative": "\n".join(negative),
        "truthEnvelope": truth,
        "style": {
            "id": (manifest.get("style") or {}).get("id"),
            "version": (manifest.get("style") or {}).get("version"),
            "designation": (manifest.get("style") or {}).get("designation"),
            "emphasis": (manifest.get("style") or {}).get("emphasis") or [],
            "dialect": dialect.get("mode"),
        },
    }


def load_brush_cabinet(path: Path | None = None) -> dict[str, Any]:
    cabinet_path = path or DEFAULT_BRUSH_REGISTRY
    cabinet = read_json(cabinet_path)
    brushes = cabinet.get("brushes")
    if not isinstance(brushes, dict) or not brushes:
        raise PainterError(f"Brush cabinet has no active brushes: {cabinet_path}")
    return cabinet


def resolve_brush_config(
    *,
    brush_id: str | None,
    transport_id: str | None,
    registry_path: Path | None = None,
) -> tuple[str, dict[str, Any], str, dict[str, Any], dict[str, Any]]:
    cabinet = load_brush_cabinet(registry_path)
    chosen_brush = brush_id or cabinet.get("defaultBrush")
    brushes = cabinet.get("brushes") or {}
    brush = brushes.get(chosen_brush)

    if not isinstance(brush, dict):
        raise PainterError(f"Unknown Velastra brush: {chosen_brush}")

    transports = brush.get("transports") or {}
    cabinet_default = cabinet.get("defaultTransport")
    chosen_transport = (
        transport_id
        or (
            cabinet_default
            if cabinet_default in transports
            else None
        )
        or next(
            (
                key
                for key, value in transports.items()
                if isinstance(value, dict) and value.get("recommended") is True
            ),
            None,
        )
        or next(iter(transports), None)
    )
    transport = transports.get(chosen_transport)

    if not isinstance(transport, dict):
        raise PainterError(
            f"Brush {chosen_brush} does not support transport: {chosen_transport}"
        )

    return chosen_brush, brush, chosen_transport, transport, cabinet


def build_render_spec(args: argparse.Namespace) -> "RenderSpec":
    registry_path = Path(args.brush_registry) if args.brush_registry else None
    brush_id, brush, transport_id, transport, _ = resolve_brush_config(
        brush_id=args.brush,
        transport_id=args.transport,
        registry_path=registry_path,
    )
    defaults = brush.get("defaults") or {}

    return RenderSpec(
        backend=args.backend or transport.get("backend") or "diffusers",
        model=args.model or brush.get("model"),
        seed=args.seed if args.seed is not None else int(defaults.get("seed", 190919)),
        width=args.width if args.width is not None else int(defaults.get("width", DEFAULT_WIDTH)),
        height=args.height if args.height is not None else int(defaults.get("height", DEFAULT_HEIGHT)),
        steps=args.steps if args.steps is not None else defaults.get("steps"),
        guidance=args.guidance if args.guidance is not None else defaults.get("guidance"),
        device=args.device or transport.get("device") or "auto",
        dtype=args.dtype or transport.get("dtype") or "auto",
        brush=brush_id,
        transport=transport_id,
        provider=transport.get("provider"),
        token_env=transport.get("tokenEnv"),
        license=brush.get("license"),
        prompt_dialect=brush.get("promptDialect"),
    )


@dataclass(frozen=True)
class RenderSpec:
    backend: str
    model: str | None
    seed: int
    width: int
    height: int
    steps: int | None
    guidance: float | None
    device: str
    dtype: str
    brush: str | None = None
    transport: str | None = None
    provider: str | None = None
    token_env: str | None = None
    license: str | None = None
    prompt_dialect: Mapping[str, Any] | None = None


def candidate_id(manifest: Mapping[str, Any], prompts: Mapping[str, Any], spec: RenderSpec) -> str:
    identity = {
        "protocol": PROTOCOL,
        "assetKey": manifest["assetKey"],
        "promptBundle": prompts,
        "render": {
            "brush": spec.brush,
            "transport": spec.transport,
            "backend": spec.backend,
            "provider": spec.provider,
            "model": spec.model,
            "seed": spec.seed,
            "width": spec.width,
            "height": spec.height,
            "steps": spec.steps,
            "guidance": spec.guidance,
        },
    }
    return sha256_bytes(canonical_json(identity))[:20]


def build_candidate_record(
    manifest: Mapping[str, Any],
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    cid = candidate_id(manifest, prompts, spec)
    return {
        "version": 1,
        "protocol": PROTOCOL,
        "candidateId": cid,
        "assetKey": manifest["assetKey"],
        "status": CANDIDATE_STATUS,
        "reviewRequired": True,
        "canonical": False,
        "createdAt": utc_now(),
        "source": {
            "manifestSha256": sha256_bytes(canonical_json(manifest)),
            "atelierProvenance": manifest.get("provenance"),
            "truthEnvelope": prompts["truthEnvelope"],
            "style": prompts.get("style"),
        },
        "render": {
            "backend": spec.backend,
            "model": spec.model,
            "seed": spec.seed,
            "width": spec.width,
            "height": spec.height,
            "steps": spec.steps,
            "guidance": spec.guidance,
            "device": spec.device,
            "dtype": spec.dtype,
            "brush": spec.brush,
            "transport": spec.transport,
            "provider": spec.provider,
            "tokenEnv": spec.token_env,
            "license": spec.license,
            "promptDialect": (
                spec.prompt_dialect.get("mode")
                if isinstance(spec.prompt_dialect, Mapping)
                else None
            ),
        },
        "prompts": {
            "positive": prompts["positive"],
            "negative": prompts["negative"],
        },
        "output": {
            "path": str(output_path.as_posix()),
            "sha256": None,
            "mediaType": "image/png",
        },
        "laws": {
            "candidateCannotRenderInSanctum": True,
            "candidateCannotMutateRegistry": True,
            "humanReviewRequiredBeforeApproval": True,
            "runtimeGenerationForbidden": True,
            "modelIsBrushNotAuthority": True,
        },
    }


def detect_device(torch_module: Any) -> str:
    if getattr(torch_module, "cuda", None) and torch_module.cuda.is_available():
        return "cuda"
    mps = getattr(getattr(torch_module, "backends", None), "mps", None)
    if mps is not None and mps.is_available():
        return "mps"
    return "cpu"


def resolve_torch_dtype(torch_module: Any, device: str, requested: str) -> Any:
    if requested != "auto":
        try:
            return getattr(torch_module, requested)
        except AttributeError as exc:
            raise PainterError(f"Unknown torch dtype: {requested}") from exc

    if device == "cuda":
        if hasattr(torch_module.cuda, "is_bf16_supported") and torch_module.cuda.is_bf16_supported():
            return torch_module.bfloat16
        return torch_module.float16
    if device == "mps":
        return torch_module.float16
    return torch_module.float32


def render_diffusers(
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    try:
        import torch
        from diffusers import DiffusionPipeline
    except ImportError as exc:
        raise PainterError(
            "Diffusers backend requires torch and diffusers. "
            "Install the optional authoring dependencies documented beside this script."
        ) from exc

    device = detect_device(torch) if spec.device == "auto" else spec.device
    dtype = resolve_torch_dtype(torch, device, spec.dtype)

    if not spec.model:
        raise PainterError("--model is required for the diffusers backend.")

    load_kwargs: dict[str, Any] = {"dtype": dtype}
    try:
        pipe = DiffusionPipeline.from_pretrained(spec.model, **load_kwargs)
    except TypeError:
        pipe = DiffusionPipeline.from_pretrained(spec.model, torch_dtype=dtype)

    if hasattr(pipe, "to"):
        pipe = pipe.to(device)

    generator_device = "cpu" if device == "mps" else device
    generator = torch.Generator(device=generator_device).manual_seed(spec.seed)

    call_signature = inspect.signature(pipe.__call__)
    accepted = set(call_signature.parameters)
    accepts_kwargs = any(
        parameter.kind is inspect.Parameter.VAR_KEYWORD
        for parameter in call_signature.parameters.values()
    )
    kwargs: dict[str, Any] = {}

    if "negative_prompt" in accepted or accepts_kwargs:
        kwargs["negative_prompt"] = prompts["negative"]
    if "width" in accepted or accepts_kwargs:
        kwargs["width"] = spec.width
    if "height" in accepted or accepts_kwargs:
        kwargs["height"] = spec.height
    if spec.steps is not None and ("num_inference_steps" in accepted or accepts_kwargs):
        kwargs["num_inference_steps"] = spec.steps
    if spec.guidance is not None and ("guidance_scale" in accepted or accepts_kwargs):
        kwargs["guidance_scale"] = spec.guidance
    if "generator" in accepted or accepts_kwargs:
        kwargs["generator"] = generator

    result = pipe(prompts["positive"], **kwargs)
    images = getattr(result, "images", None)
    if not images:
        raise PainterError("Diffusers pipeline returned no images.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    images[0].save(output_path, format="PNG")
    return {
        "deviceResolved": device,
        "dtypeResolved": str(dtype),
        "pipelineClass": pipe.__class__.__name__,
    }


def render_huggingface(
    prompts: Mapping[str, Any],
    spec: RenderSpec,
    output_path: Path,
) -> dict[str, Any]:
    try:
        from huggingface_hub import InferenceClient
    except ImportError as exc:
        raise PainterError(
            "Hugging Face transport requires huggingface_hub and Pillow. "
            "Install labs/velastra/painter/requirements-provider.txt."
        ) from exc

    if not spec.model:
        raise PainterError("Brush transport did not resolve a model.")

    token_env = spec.token_env or "HF_TOKEN"
    token = os.environ.get(token_env)
    if not token:
        raise PainterError(
            f"{token_env} is not set. Export a Hugging Face token with "
            "Inference Providers permission before rendering. "
            "Credentials must never be stored in a Velastra manifest."
        )

    client = InferenceClient(
        provider=spec.provider or "auto",
        api_key=token,
    )

    image = client.text_to_image(
        prompt=prompts["positive"],
        negative_prompt=prompts["negative"],
        height=spec.height,
        width=spec.width,
        num_inference_steps=spec.steps,
        guidance_scale=spec.guidance,
        model=spec.model,
        seed=spec.seed,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")
    return {
        "providerResolved": spec.provider or "auto",
        "transport": "huggingface",
        "credentialEnv": token_env,
    }


def cmd_brushes(args: argparse.Namespace) -> int:
    registry_path = Path(args.brush_registry) if args.brush_registry else None
    cabinet = load_brush_cabinet(registry_path)
    if args.json:
        print(json.dumps(cabinet, indent=2, ensure_ascii=False))
        return 0

    default = cabinet.get("defaultBrush")
    for brush_id, brush in (cabinet.get("brushes") or {}).items():
        marker = "*" if brush_id == default else " "
        transports = ", ".join((brush.get("transports") or {}).keys())
        print(
            f"{marker} {brush_id}: {brush.get('label', brush_id)} | "
            f"{brush.get('model')} | {brush.get('license')} | {transports}"
        )
    return 0


def cmd_plan(args: argparse.Namespace) -> int:
    manifest = unwrap_manifest(read_json(Path(args.manifest)))
    require_manifest(manifest)
    spec = build_render_spec(args)
    prompts = compile_prompt_bundle(manifest, spec)
    cid = candidate_id(manifest, prompts, spec)
    out_dir = Path(args.out_dir)
    image_path = out_dir / manifest["assetKey"] / f"{cid}.png"
    record = build_candidate_record(manifest, prompts, spec, image_path)
    request_path = out_dir / manifest["assetKey"] / f"{cid}.candidate.json"
    write_json(request_path, record)
    print(request_path)
    return 0


def cmd_render(args: argparse.Namespace) -> int:
    manifest = unwrap_manifest(read_json(Path(args.manifest)))
    require_manifest(manifest)
    spec = build_render_spec(args)
    prompts = compile_prompt_bundle(manifest, spec)
    cid = candidate_id(manifest, prompts, spec)
    out_dir = Path(args.out_dir)
    image_path = out_dir / manifest["assetKey"] / f"{cid}.png"
    record_path = out_dir / manifest["assetKey"] / f"{cid}.candidate.json"
    record = build_candidate_record(manifest, prompts, spec, image_path)

    if spec.backend == "diffusers":
        runtime = render_diffusers(prompts, spec, image_path)
    elif spec.backend == "huggingface":
        runtime = render_huggingface(prompts, spec, image_path)
    else:
        raise PainterError(f"Unknown rendering backend: {spec.backend}")

    record["render"]["runtime"] = runtime

    record["output"]["sha256"] = sha256_file(image_path)
    write_json(record_path, record)
    print(image_path)
    print(record_path)
    return 0


def repo_relative_path(repo_root: Path, path: Path) -> str:
    try:
        relative = path.resolve().relative_to(repo_root.resolve())
    except ValueError as exc:
        raise PainterError(
            f"Approved asset must live inside repository root {repo_root}; got {path}"
        ) from exc
    return relative.as_posix()


def cmd_approve(args: argparse.Namespace) -> int:
    candidate_path = Path(args.candidate)
    candidate = read_json(candidate_path)
    if candidate.get("protocol") != PROTOCOL or candidate.get("status") != CANDIDATE_STATUS:
        raise PainterError("Approval requires a Velastra candidate record.")
    if candidate.get("reviewRequired") is not True:
        raise PainterError("Candidate does not carry the required review gate.")

    image_path = Path(candidate.get("output", {}).get("path") or "")
    if not image_path.exists():
        raise PainterError(f"Candidate image does not exist: {image_path}")

    actual_sha = sha256_file(image_path)
    recorded_sha = candidate.get("output", {}).get("sha256")
    if recorded_sha and recorded_sha != actual_sha:
        raise PainterError("Candidate image hash does not match its sidecar record.")

    registry_path = Path(args.registry)
    registry = read_json(registry_path)
    entries = registry.setdefault("entries", {})
    if not isinstance(entries, dict):
        raise PainterError("Asset registry `entries` must be an object.")

    repo_root = Path(args.repo_root)
    final_dir = repo_root / "assets" / "velastra" / "approved"
    final_dir.mkdir(parents=True, exist_ok=True)
    suffix = image_path.suffix.lower() or ".png"
    final_path = final_dir / f"{candidate['assetKey']}{suffix}"

    if final_path.exists() and not args.replace:
        raise PainterError(
            f"Approved asset already exists: {final_path}. Use --replace only after explicit review."
        )

    shutil.copy2(image_path, final_path)
    final_sha = sha256_file(final_path)

    entries[candidate["assetKey"]] = {
        "status": APPROVED_STATUS,
        "path": repo_relative_path(repo_root, final_path),
        "sha256": final_sha,
        "provenance": {
            "source": "velastra_painter_bridge",
            "candidateId": candidate["candidateId"],
            "candidateRecord": candidate_path.as_posix(),
            "manifestSha256": candidate.get("source", {}).get("manifestSha256"),
            "brush": candidate.get("render", {}).get("brush"),
            "transport": candidate.get("render", {}).get("transport"),
            "backend": candidate.get("render", {}).get("backend"),
            "provider": candidate.get("render", {}).get("provider"),
            "model": candidate.get("render", {}).get("model"),
            "license": candidate.get("render", {}).get("license"),
            "promptDialect": candidate.get("render", {}).get("promptDialect"),
            "style": candidate.get("source", {}).get("style"),
            "seed": candidate.get("render", {}).get("seed"),
            "reviewedBy": args.reviewed_by,
            "reviewedAt": utc_now(),
            "reviewNote": args.review_note,
            "imageSha256": final_sha,
        },
    }

    output_registry = Path(args.output_registry or registry_path)
    write_json(output_registry, registry)

    candidate["status"] = APPROVED_STATUS
    candidate["reviewRequired"] = False
    candidate["canonical"] = True
    candidate["approval"] = {
        "reviewedBy": args.reviewed_by,
        "reviewedAt": utc_now(),
        "reviewNote": args.review_note,
        "approvedPath": repo_relative_path(repo_root, final_path),
        "sha256": final_sha,
    }
    write_json(candidate_path, candidate)

    print(final_path)
    print(output_registry)
    return 0


def add_render_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--brush", help="Named brush from world/velastra-brushes.json.")
    parser.add_argument("--transport", help="Brush transport, such as huggingface or diffusers.")
    parser.add_argument("--brush-registry", help="Optional alternate brush cabinet path.")
    parser.add_argument(
        "--backend",
        choices=["diffusers", "huggingface"],
        help="Advanced backend override; normally resolved by the selected brush transport.",
    )
    parser.add_argument("--model", help="Advanced model override.")
    parser.add_argument("--seed", type=int)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--steps", type=int)
    parser.add_argument("--guidance", type=float)
    parser.add_argument("--device")
    parser.add_argument(
        "--dtype",
        help="Torch dtype name (float32, float16, bfloat16) or auto.",
    )
    parser.add_argument("--out-dir", default=".velastra/candidates")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="velastra-painter",
        description="Authoring-side painter bridge for Velastra Atelier Manifests.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", help="Compile prompts and a candidate sidecar without rendering.")
    plan.add_argument("manifest")
    add_render_arguments(plan)
    plan.set_defaults(func=cmd_plan)

    render = sub.add_parser("render", help="Render a candidate image. Candidate remains unapproved.")
    render.add_argument("manifest")
    add_render_arguments(render)
    render.set_defaults(func=cmd_render)

    brushes = sub.add_parser("brushes", help="List configured Velastra brushes.")
    brushes.add_argument("--brush-registry")
    brushes.add_argument("--json", action="store_true")
    brushes.set_defaults(func=cmd_brushes)

    approve = sub.add_parser("approve", help="Promote a reviewed candidate into a registry copy.")
    approve.add_argument("candidate")
    approve.add_argument("--registry", default="world/velastra-assets.json")
    approve.add_argument("--repo-root", default=".")
    approve.add_argument("--output-registry")
    approve.add_argument("--reviewed-by", required=True)
    approve.add_argument("--review-note", required=True)
    approve.add_argument("--replace", action="store_true")
    approve.set_defaults(func=cmd_approve)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except PainterError as exc:
        print(f"velastra-painter: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
