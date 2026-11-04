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
        "style": {
            "version": 1,
            "id": "virynism",
            "designation": "Virynism",
            "compactSignature": "Let light carry relation; let material remember handling and revision; preserve meaningful incompletion and purposeful asymmetry.",
            "hand": [
                {
                    "id": "material_memory",
                    "weight": 0.96,
                    "directive": "Let surfaces remember handling through patina and residue.",
                },
                {
                    "id": "sacred_incompletion",
                    "weight": 0.94,
                    "directive": "Permit unresolved marks, exposed grounds, and unfinished edges.",
                },
            ],
            "emphasis": ["material_memory", "sacred_incompletion"],
            "archetype": {
                "id": "place_tableau",
                "directives": [
                    "Paint the room as an inhabited memory-field rather than a decorated location."
                ],
            },
            "place": {
                "id": "gallery",
                "title": "The Gallery of Unfinished Things",
                "directives": [
                    "Unfinishedness must read as process and becoming, not merely blank framed surfaces."
                ],
                "avoid": [
                    "a symmetrical lineup of tasteful empty frames"
                ],
            },
            "antiPatterns": [
                "tasteful showroom minimalism",
                "generic cinematic concept art",
            ],
        },
        "evidence": {
            "version": 1,
            "id": "visible_evidence",
            "designation": "Visible Evidence Contract",
            "room": "gallery",
            "truthRevision": 1,
            "minimumVisible": 3,
            "identityReframe": "Paint a chamber defined first by visible revision and partial completion; it functions as a gallery but not as a conventional museum of finished pictures.",
            "required": [
                {
                    "id": "exposed_ground",
                    "sourceRefs": ["unfinished_works"],
                    "priority": 1,
                    "instruction": "At least one unfinished work must visibly expose raw ground or underpainting beneath partial pigment.",
                },
                {
                    "id": "interrupted_passage",
                    "sourceRefs": ["unfinished_works"],
                    "priority": 0.96,
                    "instruction": "At least one painted passage must visibly stop before the support edge.",
                },
                {
                    "id": "revision_marks",
                    "sourceRefs": ["unfinished_works"],
                    "priority": 0.94,
                    "instruction": "At least one surface must visibly preserve erased or overwritten marks.",
                },
                {
                    "id": "hanging_ghost",
                    "sourceRefs": ["hanging_field"],
                    "priority": 0.9,
                    "instruction": "At least one wall area must visibly retain a prior hanging trace.",
                },
            ],
            "compositionControls": [
                {
                    "id": "empty_frame_subordinate",
                    "instruction": "An empty frame may appear but must remain subordinate to visible unfinished processes.",
                },
                {
                    "id": "distributed_attention",
                    "instruction": "Distribute attention across several states of incompletion rather than one centered hero frame.",
                },
            ],
            "reviewQuestions": [
                "Can a viewer point to visible underpainting or raw ground?",
                "Does unfinishedness read as process rather than blankness?",
            ],
        },
        "witnesses": {
            "version": 1,
            "id": "visual_witness",
            "designation": "Virynism Visual Witness Canon",
            "room": "gallery",
            "archetype": "place_tableau",
            "desiredRoles": [
                "sacred_incompletion",
                "material_hand",
            ],
            "selected": [
                {
                    "id": "gallery_target_01",
                    "title": "Gallery of Unfinished Things — Viryn Target Study",
                    "status": "awaiting_asset",
                    "matchedRoles": [
                        "sacred_incompletion",
                        "material_hand",
                    ],
                    "teach": [
                        "sacred_incompletion",
                        "material_hand",
                    ],
                    "doNotInherit": [
                        "specific frames",
                        "papers",
                        "objects",
                        "layout",
                        "exact light source",
                    ],
                    "asset": None,
                }
            ],
            "approved": [],
            "active": False,
            "fallback": "semantic_virynism_only",
        },
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
                    "worked passage beside raw ground",
                ],
                "painterlyTruth": {
                    "version": 1,
                    "id": "painterly_truth",
                    "designation": "Painterly Truth",
                    "revision": 2,
                    "room": "ceiling_storm",
                    "fixedObjects": [
                        {
                            "id": "old_basin",
                            "name": "old basin"
                        }
                    ],
                },
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

    def test_truth_envelope_records_painterly_truth_revision(self):
        bundle = painter.compile_prompt_bundle(manifest_fixture())
        truth = bundle["truthEnvelope"]

        self.assertEqual(
            truth["painterlyTruth"]["id"],
            "painterly_truth",
        )
        self.assertEqual(
            truth["painterlyTruth"]["revision"],
            2,
        )
        self.assertEqual(
            truth["painterlyTruth"]["fixedObjects"][0]["id"],
            "old_basin",
        )
        self.assertIn(
            "worked passage beside raw ground",
            truth["environment"],
        )

    def test_prompt_bundle_carries_virynism_hand(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertIn("Virynism core", bundle["positive"])
        self.assertIn("preserve meaningful incompletion", bundle["positive"])
        self.assertEqual(bundle["style"]["id"], "virynism")
        self.assertEqual(bundle["style"]["dialect"], "concrete_painterly")

    def test_z_turbo_uses_positive_evidence_and_no_negative_channel(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertIn("VISIBLE EVIDENCE CONTRACT", bundle["positive"])
        self.assertIn("IDENTITY REFRAME", bundle["positive"])
        self.assertIn("raw ground or underpainting", bundle["positive"])
        self.assertIn("empty frame may appear", bundle["positive"])
        self.assertEqual(bundle["negative"], "")
        self.assertFalse(bundle["control"]["negativePromptActive"])
        self.assertEqual(bundle["control"]["role"], "structural_scout")
        self.assertEqual(bundle["budget"]["targetTokens"], 420)
        self.assertTrue(bundle["budget"]["requiredSectionsPreserved"])
        self.assertIsInstance(bundle["budget"]["overTarget"], bool)

    def test_qwen_retains_negative_channel_as_best_effort(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertTrue(bundle["control"]["negativePromptActive"])
        self.assertIn("Virynism rejects", bundle["negative"])
        self.assertIn("VISIBLE EVIDENCE CONTRACT", bundle["positive"])

    def test_witness_brush_fails_without_approved_asset(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="witness-test-attempt",
            )
        )

        self.assertEqual(spec.task, "image_to_image")
        self.assertEqual(spec.model, "Qwen/Qwen-Image-Edit")
        self.assertEqual(spec.attempt_id, "witness-test-attempt")
        self.assertFalse(
            spec.control_contract["seedControl"]["providerSupported"]
        )

        with self.assertRaises(painter.PainterError):
            painter.compile_prompt_bundle(manifest, spec)

    def test_witness_brush_uses_approved_reference_without_changing_asset_identity(self):
        manifest = manifest_fixture()
        manifest["witnesses"]["selected"][0]["status"] = "approved"
        manifest["witnesses"]["selected"][0]["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "deadbeef",
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(manifest["witnesses"]["selected"][0]))
        ]
        manifest["witnesses"]["active"] = True

        spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="witness-test-attempt",
            )
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertIn("VISUAL WITNESS", bundle["positive"])
        self.assertIn("specific frames", bundle["positive"])
        self.assertEqual(
            bundle["witness"]["selected"],
            "gallery_target_01",
        )
        self.assertEqual(
            bundle["witness"]["asset"]["sha256"],
            "deadbeef",
        )

        base_spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        base_bundle = painter.compile_prompt_bundle(manifest, base_spec)

        self.assertEqual(
            manifest["assetKey"],
            "velastra.place_tableau.test",
        )
        self.assertNotEqual(
            painter.candidate_id(manifest, bundle, spec),
            painter.candidate_id(manifest, base_bundle, base_spec),
        )

    def test_candidate_records_visual_witness_provenance(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "cafebabe",
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(approved))
        ]
        manifest["witnesses"]["active"] = True

        spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="witness-test-attempt",
            )
        )
        prompts = painter.compile_prompt_bundle(manifest, spec)
        record = painter.build_candidate_record(
            manifest,
            prompts,
            spec,
            Path(".velastra/candidate.png"),
        )

        self.assertEqual(
            record["source"]["witness"]["selected"],
            "gallery_target_01",
        )
        self.assertEqual(
            record["render"]["task"],
            "image_to_image",
        )
        self.assertEqual(
            record["source"]["witness"]["asset"]["sha256"],
            "cafebabe",
        )
        self.assertEqual(
            record["render"]["attemptId"],
            "witness-test-attempt",
        )
        self.assertEqual(
            record["render"]["controlContract"]["seedReliability"],
            "unsupported",
        )

    def test_evidence_change_changes_candidate_not_asset_identity(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        first_bundle = painter.compile_prompt_bundle(manifest, spec)
        first_id = painter.candidate_id(manifest, first_bundle, spec)

        changed = json.loads(json.dumps(manifest))
        changed["evidence"]["compositionControls"].append({
            "id": "new_control",
            "instruction": "Keep one unfinished work visibly off-center.",
        })
        changed_bundle = painter.compile_prompt_bundle(changed, spec)
        changed_id = painter.candidate_id(changed, changed_bundle, spec)

        self.assertEqual(manifest["assetKey"], changed["assetKey"])
        self.assertNotEqual(first_id, changed_id)

    def test_candidate_records_evidence_control_and_prompt_budget(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        prompts = painter.compile_prompt_bundle(manifest, spec)
        record = painter.build_candidate_record(
            manifest,
            prompts,
            spec,
            Path(".velastra/candidate.png"),
        )

        self.assertEqual(
            record["source"]["evidence"]["id"],
            "visible_evidence",
        )
        self.assertEqual(
            record["source"]["evidence"]["minimumVisible"],
            3,
        )
        self.assertFalse(
            record["render"]["controlContract"]["negativePromptActive"]
        )
        self.assertEqual(
            record["source"]["promptBudget"]["targetTokens"],
            420,
        )

    def test_style_change_changes_candidate_not_asset_identity(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        first_bundle = painter.compile_prompt_bundle(manifest, spec)
        first_id = painter.candidate_id(manifest, first_bundle, spec)

        changed = json.loads(json.dumps(manifest))
        changed["style"]["place"]["directives"].append(
            "Let revision remain visibly unresolved."
        )
        changed_bundle = painter.compile_prompt_bundle(changed, spec)
        changed_id = painter.candidate_id(changed, changed_bundle, spec)

        self.assertEqual(manifest["assetKey"], changed["assetKey"])
        self.assertNotEqual(first_id, changed_id)

    def test_candidate_records_style_and_brush_dialect(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        prompts = painter.compile_prompt_bundle(manifest, spec)
        record = painter.build_candidate_record(
            manifest,
            prompts,
            spec,
            Path(".velastra/candidate.png"),
        )

        self.assertEqual(record["source"]["style"]["id"], "virynism")
        self.assertEqual(record["source"]["style"]["version"], 1)
        self.assertEqual(record["render"]["promptDialect"], "concrete_painterly")

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
            "witness": None,
            "attempt": None,
            "repo_root": ".",
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
        self.assertIsNone(spec.true_cfg_scale)
        self.assertFalse(spec.control_contract["negativePrompt"]["supported"])

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
        self.assertEqual(spec.true_cfg_scale, 4.0)
        self.assertEqual(
            spec.control_contract["guidance"]["diffusersParameter"],
            "true_cfg_scale",
        )

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
