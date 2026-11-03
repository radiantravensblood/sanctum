import argparse
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("velastra_painter.py")
SPEC = importlib.util.spec_from_file_location("velastra_painter", MODULE_PATH)
painter = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = painter
assert SPEC.loader is not None
SPEC.loader.exec_module(painter)


def manifest_fixture():
    return {
        "version": 1,
        "engine": "Velastra",
        "layer": "atelier_manifest",
        "assetKey": "velastra.place_tableau.test",
        "render": {
            "strategy": "procedural_underpainting",
            "runtimeGeneration": False,
            "reviewedAsset": None,
            "fallback": "procedural_underpainting",
        },
        "medium": {"id": "environmental_oil"},
        "scene": {
            "composition": {"camera": "wide intimate room tableau"},
            "lighting": {"meaning": "cool rain held by warm brass"},
            "edge": {"meaning": "soft peripheral edges"},
            "patina": {"meaning": "handled age"},
            "subjects": [],
            "relation": None,
            "environment": {
                "kind": "ceiling_storm",
                "facts": [
                    "old basin",
                    "rain without visible sky",
                    "aged brass lines",
                ],
            },
        },
        "motifs": [
            {
                "id": "rain_without_sky",
                "mode": "literal",
                "meaning": "impossible rain",
                "provenance": {"source": "effect"},
            },
            {
                "id": "thread_trace",
                "mode": "symbolic",
                "meaning": "memory crossing the room",
                "provenance": {"source": "remembrance"},
            },
        ],
        "artBrief": {
            "thesis": "Render place tableau as the image's primary argument.",
            "medium": "environmental_oil",
            "camera": "wide intimate room tableau",
            "hierarchy": ["rain", "basin", "brass traces"],
            "lighting": {"meaning": "cool rain held by warm brass"},
            "edge": {"meaning": "room dissolves into shadow"},
            "surface": {"meaning": "patinated, layered"},
            "directives": [
                "make the room feel inhabited by weather rather than decorated by it"
            ],
        },
        "provenance": {
            "source": "velastra_atelier_compiler",
            "sceneSource": "test",
        },
    }


class PainterBridgeTests(unittest.TestCase):
    def render_spec(self, seed=190919):
        return painter.RenderSpec(
            backend="diffusers",
            model="example/model",
            seed=seed,
            width=1536,
            height=864,
            steps=None,
            guidance=None,
            device="auto",
            dtype="auto",
        )

    def test_truth_envelope_separates_literal_and_symbolic_motifs(self):
        bundle = painter.compile_prompt_bundle(manifest_fixture())
        truth = bundle["truthEnvelope"]

        self.assertIn("rain_without_sky", truth["literalMotifs"][0])
        self.assertIn("thread_trace", truth["symbolicMotifs"][0])
        self.assertIn("Do not invent additional people", bundle["negative"])

    def test_candidate_identity_is_deterministic_and_seed_sensitive(self):
        manifest = manifest_fixture()
        prompts = painter.compile_prompt_bundle(manifest)

        first = painter.candidate_id(manifest, prompts, self.render_spec(seed=1))
        repeat = painter.candidate_id(manifest, prompts, self.render_spec(seed=1))
        changed = painter.candidate_id(manifest, prompts, self.render_spec(seed=2))

        self.assertEqual(first, repeat)
        self.assertNotEqual(first, changed)

    def test_runtime_generation_is_rejected(self):
        manifest = manifest_fixture()
        manifest["render"]["runtimeGeneration"] = True

        with self.assertRaises(painter.PainterError):
            painter.require_manifest(manifest)

    def brush_args(self, **overrides):
        values = {
            "brush": None,
            "transport": None,
            "brush_registry": None,
            "backend": None,
            "model": None,
            "seed": None,
            "width": None,
            "height": None,
            "steps": None,
            "guidance": None,
            "device": None,
            "dtype": None,
            "out_dir": ".velastra/candidates",
        }
        values.update(overrides)
        return argparse.Namespace(**values)

    def test_default_brush_resolves_to_z_image_provider(self):
        spec = painter.build_render_spec(self.brush_args())

        self.assertEqual(spec.brush, "z_image_turbo")
        self.assertEqual(spec.transport, "huggingface")
        self.assertEqual(spec.backend, "huggingface")
        self.assertEqual(spec.provider, "fal-ai")
        self.assertEqual(spec.model, "Tongyi-MAI/Z-Image-Turbo")
        self.assertEqual(spec.license, "apache-2.0")
        self.assertEqual(spec.steps, 9)
        self.assertEqual(spec.guidance, 0)
        self.assertEqual(spec.token_env, "HF_TOKEN")

    def test_alternate_brush_can_use_local_diffusers(self):
        spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image",
                transport="diffusers",
            )
        )

        self.assertEqual(spec.brush, "qwen_image")
        self.assertEqual(spec.backend, "diffusers")
        self.assertEqual(spec.model, "Qwen/Qwen-Image")
        self.assertEqual(spec.license, "apache-2.0")
        self.assertEqual(spec.steps, 40)

    def test_candidate_records_credential_name_not_secret(self):
        manifest = manifest_fixture()
        prompts = painter.compile_prompt_bundle(manifest)

        with mock.patch.dict(
            os.environ,
            {"HF_TOKEN": "hf_secret_example"},
            clear=False,
        ):
            spec = painter.build_render_spec(self.brush_args())
            record = painter.build_candidate_record(
                manifest,
                prompts,
                spec,
                Path(".velastra/candidate.png"),
            )

        serialized = json.dumps(record)
        self.assertIn("HF_TOKEN", serialized)
        self.assertNotIn("hf_secret_example", serialized)

    def test_approval_promotes_only_explicit_candidate(self):
        manifest = manifest_fixture()
        prompts = painter.compile_prompt_bundle(manifest)
        spec = self.render_spec()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidate_dir = root / ".velastra" / "candidates" / manifest["assetKey"]
            candidate_dir.mkdir(parents=True)

            image_path = candidate_dir / "candidate.png"
            image_path.write_bytes(b"not-a-real-png-but-stable-test-bytes")

            record = painter.build_candidate_record(
                manifest,
                prompts,
                spec,
                image_path,
            )
            record["output"]["sha256"] = painter.sha256_file(image_path)

            candidate_path = candidate_dir / "candidate.candidate.json"
            painter.write_json(candidate_path, record)

            registry_path = root / "world" / "velastra-assets.json"
            painter.write_json(
                registry_path,
                {
                    "version": 1,
                    "laws": {},
                    "entries": {},
                },
            )

            args = argparse.Namespace(
                candidate=str(candidate_path),
                registry=str(registry_path),
                repo_root=str(root),
                output_registry=None,
                reviewed_by="test-reviewer",
                review_note="semantic and composition review passed",
                replace=False,
            )

            result = painter.cmd_approve(args)
            self.assertEqual(result, 0)

            registry = painter.read_json(registry_path)
            approved = registry["entries"][manifest["assetKey"]]
            self.assertEqual(approved["status"], "approved")
            self.assertTrue(approved["path"].startswith("assets/velastra/approved/"))
            self.assertEqual(
                approved["sha256"],
                painter.sha256_file(root / approved["path"]),
            )
            self.assertEqual(
                approved["provenance"]["reviewedBy"],
                "test-reviewer",
            )


if __name__ == "__main__":
    unittest.main()
