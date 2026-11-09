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
        "handprint": {
            "version": 1,
            "id": "viryn_handprint",
            "designation": "Virynism Handprint",
            "status": "built",
            "active": True,
            "fallback": None,
            "room": "gallery",
            "archetype": "place_tableau",
            "witnessCount": 3,
            "minimumApprovedWitnesses": 3,
            "desiredRoles": [
                "sacred_incompletion",
                "material_hand",
                "compositional_cadence",
                "edge_behavior",
                "tonal_memory",
            ],
            "consensusRoles": [
                "tonal_memory",
                "material_hand",
                "compositional_cadence",
                "edge_behavior",
                "sacred_incompletion",
                "spatial_depth",
            ],
            "relevantRoleCounts": [
                {"role": "tonal_memory", "count": 3},
                {"role": "material_hand", "count": 2},
            ],
            "metrics": {
                "meanLuminance": 0.42,
                "meanSaturation": 0.31,
                "meanWarmth": 0.08,
                "darkShare": 0.3,
                "highlightShare": 0.07,
                "tonalSpan": 0.68,
                "edgeActivity": 0.16,
                "centerLightDelta": 0.09,
            },
            "interpretation": {
                "tonalRestraint": "restrained saturation with selective chromatic emphasis",
                "warmthBias": "warm-biased overall, with warmth carrying visual emphasis",
                "edgeCharacter": "soft-to-moderate edge activity; resolution is selective rather than uniformly sharp",
                "centerLightBias": "center fields tend to hold more light than the periphery",
                "shadowPresence": "shadow occupies a substantial share of the image field",
                "tonalRange": "broad tonal span from deep shadow to selective highlight",
            },
            "facets": {
                "edge_behavior": {
                    "witnessCount": 2,
                    "witnesses": [
                        "viryn_self_portrait_01",
                        "gallery_target_01",
                    ],
                    "eligibleForRender": True,
                    "support": "cross_portfolio",
                    "metrics": {
                        "edgeActivity": {
                            "count": 2,
                            "mean": 0.0397,
                            "median": 0.0397,
                            "min": 0.0256,
                            "max": 0.0537,
                            "stddev": 0.0141,
                            "range": 0.0281,
                            "variation": "tight",
                        }
                    },
                    "interpretation": {
                        "edgeCharacter": "soft-to-moderate edge activity; resolution is selective rather than uniformly sharp",
                    },
                    "promptSummary": "2 witnesses; soft-to-moderate edge activity; resolution is selective rather than uniformly sharp; edge activity varies tight across the supporting works.",
                },
                "material_hand": {
                    "witnessCount": 2,
                    "witnesses": [
                        "studio_atelier_01",
                        "gallery_target_01",
                    ],
                    "eligibleForRender": True,
                    "support": "cross_portfolio",
                    "metrics": {},
                    "interpretation": {
                        "edgeCharacter": "soft-to-moderate edge activity; resolution is selective rather than uniformly sharp",
                    },
                    "promptSummary": "2 witnesses; surfaces retain handled memory without copying inventory.",
                },
            },
            "facetRoles": [
                "edge_behavior",
                "material_hand",
            ],
            "pressure": {
                "version": 1,
                "defaultProfile": "descriptive_guidance",
                "combinedProfile": "governing_translation",
                "priorityRoleOrder": [
                    "material_hand",
                    "edge_behavior",
                ],
                "profiles": {
                    "descriptive_guidance": {
                        "mode": "descriptive_guidance",
                        "priority": 114,
                        "directives": [
                            "Use eligible Handprint facets as strong painterly guidance."
                        ],
                    },
                    "governing_translation": {
                        "mode": "governing_translation",
                        "priority": 123,
                        "directives": [
                            "Translate every inherited witness tendency through eligible Handprint facets."
                        ],
                        "nonNegotiableRoleLaws": {
                            "material_hand": "Let surfaces retain handled memory rather than copying inventory.",
                            "edge_behavior": "Keep resolution selective; avoid uniformly crisp object boundaries.",
                        },
                        "witnessTranslationLaw": "Use witness content only as provisional visual memory; recompose and repaint the target through Handprint law.",
                    },
                },
            },
            "doNotInherit": [
                "identity",
                "face",
                "objects",
                "layout",
                "architecture",
            ],
            "provenance": {
                "builder": "velastra-painter handprint-build",
                "algorithmVersion": 1,
            },
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

        self.assertNotIn("VISIBLE EVIDENCE CONTRACT", bundle["positive"])
        self.assertNotIn("IDENTITY REFRAME", bundle["positive"])
        self.assertIn("The final image must make at least", bundle["positive"])
        self.assertIn("The scene's identity should read as", bundle["positive"])
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
        self.assertNotIn("VISIBLE EVIDENCE CONTRACT", bundle["positive"])
        self.assertIn("The final image must make at least", bundle["positive"])

    def test_prompt_bundle_carries_portfolio_handprint(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertNotIn("HANDPRINT", bundle["positive"])
        self.assertIn("3 approved source studies", bundle["positive"])
        self.assertIn(
            "warm-biased overall",
            bundle["positive"],
        )
        self.assertTrue(bundle["handprint"]["active"])
        self.assertEqual(bundle["handprint"]["witnessCount"], 3)
        self.assertIn("Relevant visual-treatment facets", bundle["positive"])
        self.assertIn("edge behavior", bundle["positive"])
        self.assertIn(
            "edge_behavior",
            bundle["handprint"]["facetRoles"],
        )
        self.assertEqual(
            bundle["handprintPressure"]["profile"],
            "descriptive_guidance",
        )
        self.assertFalse(bundle["handprintPressure"]["combined"])
        self.assertNotIn(
            "GOVERNING HANDPRINT LAW",
            bundle["positive"],
        )

    def test_control_plane_isolation_blocks_internal_markers_from_positive_prompt(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "a" * 64,
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
                attempt="control-plane-isolation",
                witness_firewall=True,
                firewall_tile_size=32,
                firewall_blur_radius=0.6,
            )
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertTrue(bundle["controlPlaneIsolation"]["active"])
        self.assertEqual(bundle["controlPlaneIsolation"]["leaks"], [])
        lowered = bundle["positive"].lower()
        for marker in painter.MODEL_VISIBLE_CONTROL_MARKERS:
            self.assertNotIn(marker, lowered)

        self.assertIn(
            "Do not render wording, headings, labels, or phrases from these instructions",
            bundle["negative"],
        )

        record = painter.build_candidate_record(
            manifest,
            bundle,
            spec,
            Path(".velastra/control-plane.png"),
        )
        self.assertTrue(
            record["source"]["controlPlaneIsolation"]["active"]
        )

    def test_control_plane_leak_detector_is_fail_closed(self):
        leaks = painter.control_plane_leaks(
            "Please obey the SCENE SOVEREIGNTY GATE."
        )
        self.assertIn("scene sovereignty gate", leaks)

    def test_provisional_grip_remains_silent(self):
        manifest = manifest_fixture()
        manifest["grip"] = {
            "status": "provisional_pending_human_review",
            "renderEligible": False,
            "active": False,
            "dimensions": {
                "anchors": {
                    "centerLightDelta": {
                        "label": "center/periphery light relationship",
                    }
                },
                "freedoms": {
                    "tonalSpan": {
                        "label": "tonal-span breadth",
                    }
                },
                "tendencies": {},
            },
            "roleProjection": {},
            "sourceTrial": {
                "trialId": "gallery-pressure-0030",
            },
        }

        spec = painter.build_render_spec(self.brush_args())
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertFalse(bundle["grip"]["active"])
        self.assertNotIn("HANDPRINT GRIP", bundle["positive"])

    def test_reviewed_grip_remains_observational_and_identity_neutral(self):
        manifest = manifest_fixture()
        manifest["grip"] = {
            "status": "reviewed_observation",
            "renderEligible": False,
            "active": False,
            "observed": True,
            "scope": {
                "rooms": ["gallery"],
            },
            "dimensions": {
                "anchors": {
                    "centerLightDelta": {
                        "label": "center/periphery light relationship",
                        "direction": "higher",
                    }
                },
                "freedoms": {
                    "tonalSpan": {
                        "label": "tonal-span breadth",
                        "direction": "higher",
                    }
                },
                "tendencies": {
                    "edgeActivity": {
                        "label": "edge activity",
                        "direction": "stable",
                    }
                },
            },
            "roleProjection": {},
            "sourceTrial": {
                "trialId": "gallery-pressure-0030",
            },
        }

        spec = painter.build_render_spec(self.brush_args())
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertFalse(bundle["grip"]["active"])
        self.assertTrue(bundle["grip"]["observed"])
        self.assertNotIn("HANDPRINT GRIP", bundle["positive"])

        record = painter.build_candidate_record(
            manifest,
            bundle,
            spec,
            Path(".velastra/candidate.png"),
        )
        self.assertFalse(record["source"]["grip"]["active"])
        self.assertTrue(record["source"]["grip"]["observed"])

        without_grip = json.loads(json.dumps(manifest))
        without_grip.pop("grip", None)
        bundle_without = painter.compile_prompt_bundle(
            without_grip,
            spec,
        )
        self.assertEqual(
            painter.candidate_id(manifest, bundle, spec),
            painter.candidate_id(
                without_grip,
                bundle_without,
                spec,
            ),
            "Observation-only Grip must not alter candidate identity.",
        )

    def test_handprint_change_changes_candidate_not_asset_identity(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        first_bundle = painter.compile_prompt_bundle(manifest, spec)
        first_id = painter.candidate_id(manifest, first_bundle, spec)

        changed = json.loads(json.dumps(manifest))
        changed["handprint"]["interpretation"]["warmthBias"] = (
            "near-balanced warm/cool field"
        )
        changed_bundle = painter.compile_prompt_bundle(changed, spec)
        changed_id = painter.candidate_id(changed, changed_bundle, spec)

        self.assertEqual(manifest["assetKey"], changed["assetKey"])
        self.assertNotEqual(first_id, changed_id)

    def test_candidate_records_handprint_provenance(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(self.brush_args())
        prompts = painter.compile_prompt_bundle(manifest, spec)
        record = painter.build_candidate_record(
            manifest,
            prompts,
            spec,
            Path(".velastra/candidate.png"),
        )

        self.assertTrue(record["source"]["handprint"]["active"])
        self.assertEqual(
            record["source"]["handprint"]["witnessCount"],
            3,
        )
        self.assertIn(
            "tonal_memory",
            record["source"]["handprint"]["consensusRoles"],
        )

    def test_handprint_builder_uses_sealed_approved_pixels(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            asset_dir = root / "assets" / "velastra" / "witnesses"
            asset_dir.mkdir(parents=True)

            entries = {}
            specs = [
                ("one", (60, 35, 20)),
                ("two", (180, 120, 70)),
                ("three", (220, 180, 120)),
            ]

            for witness_id, rgb in specs:
                path = asset_dir / f"{witness_id}.png"
                image = Image.new("RGB", (32, 24), rgb)
                image.save(path, format="PNG")
                entries[witness_id] = {
                    "title": witness_id,
                    "status": "approved",
                    "teach": [
                        "tonal_memory",
                        "material_hand",
                    ],
                    "doNotInherit": ["objects", witness_id],
                    "asset": {
                        "path": str(path.relative_to(root).as_posix()),
                        "sha256": painter.sha256_file(path),
                        "width": 32,
                        "height": 24,
                        "mediaType": "image/png",
                    },
                }

            witness_registry = {
                "entries": entries,
            }
            template = {
                "version": 1,
                "designation": "Virynism Handprint",
                "status": "awaiting_build",
                "minimumApprovedWitnesses": 3,
                "laws": {
                    "pixelMetricsMustRemainAuditable": True,
                },
                "pressure": {
                    "version": 1,
                    "defaultProfile": "descriptive_guidance",
                    "combinedProfile": "governing_translation",
                    "profiles": {
                        "descriptive_guidance": {
                            "mode": "descriptive_guidance",
                        },
                        "governing_translation": {
                            "mode": "governing_translation",
                        },
                    },
                },
            }

            built = painter.build_handprint_registry(
                witness_registry,
                root,
                template,
            )

            self.assertEqual(built["status"], "built")
            self.assertEqual(built["corpus"]["witnessCount"], 3)
            self.assertEqual(
                built["corpus"]["roleCounts"]["tonal_memory"],
                3,
            )
            self.assertEqual(
                len(built["provenance"]["corpusHashes"]),
                3,
            )
            self.assertGreater(
                built["metrics"]["aggregate"]["meanLuminance"],
                0,
            )
            self.assertTrue(
                built["interpretation"]["warmthBias"]
            )
            self.assertEqual(
                built["facets"]["version"],
                1,
            )
            self.assertEqual(
                built["facets"]["minimumWitnesses"],
                2,
            )
            self.assertTrue(
                built["facets"]["byRole"]["tonal_memory"]["eligibleForRender"]
            )
            self.assertEqual(
                built["facets"]["byRole"]["tonal_memory"]["metrics"]["meanWarmth"]["count"],
                3,
            )
            self.assertIn(
                built["facets"]["byRole"]["tonal_memory"]["metrics"]["meanWarmth"]["variation"],
                {"tight", "moderate", "broad"},
            )
            self.assertEqual(
                built["provenance"]["algorithmVersion"],
                2,
            )
            self.assertEqual(
                built["pressure"]["combinedProfile"],
                "governing_translation",
            )

            bad = json.loads(json.dumps(witness_registry))
            bad["entries"]["one"]["asset"]["sha256"] = "wrong"

            with self.assertRaises(painter.PainterError):
                painter.build_handprint_registry(
                    bad,
                    root,
                    template,
                )

    def test_text_first_brush_does_not_claim_visual_witness(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "deadbeef",
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(approved))
        ]
        manifest["witnesses"]["active"] = True

        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertFalse(bundle["witness"]["active"])
        self.assertNotIn("VISUAL WITNESS", bundle["positive"])
        self.assertNotIn("HANDPRINT", bundle["positive"])
        self.assertIn("approved source studies", bundle["positive"])

    def test_handprint_ablation_changes_candidate_without_changing_asset(self):
        manifest = manifest_fixture()
        base_spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        ablated_spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image",
                without_handprint=True,
            )
        )

        base_bundle = painter.compile_prompt_bundle(manifest, base_spec)
        ablated_bundle = painter.compile_prompt_bundle(
            manifest,
            ablated_spec,
        )

        self.assertTrue(base_bundle["handprint"]["active"])
        self.assertFalse(ablated_bundle["handprint"]["active"])
        self.assertEqual(
            ablated_bundle["handprint"]["ablation"],
            "disabled",
        )
        self.assertNotIn("HANDPRINT", ablated_bundle["positive"])
        self.assertEqual(
            manifest["assetKey"],
            "velastra.place_tableau.test",
        )
        self.assertNotEqual(
            painter.candidate_id(manifest, base_bundle, base_spec),
            painter.candidate_id(
                manifest,
                ablated_bundle,
                ablated_spec,
            ),
        )

    def test_witness_required_brush_refuses_witness_ablation(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="ablation-test",
                without_witness=True,
            )
        )

        with self.assertRaises(painter.PainterError):
            painter.compile_prompt_bundle(manifest, spec)

    def test_scene_sovereignty_gate_promotes_fixed_place_truth(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(
            manifest,
            spec,
        )

        self.assertNotIn(
            "SCENE SOVEREIGNTY GATE",
            bundle["positive"],
        )
        self.assertIn(
            "Build the target room from these literal authored place facts",
            bundle["positive"],
        )
        self.assertIn(
            "Fixed target object: old basin",
            bundle["positive"],
        )
        self.assertEqual(
            bundle["truthEnvelope"]["painterlyTruth"][
                "fixedObjects"
            ][0]["name"],
            "old basin",
        )

    def test_hearth_threshold_integrity_and_fixed_object_lock_are_prompt_visible(self):
        manifest = manifest_fixture()
        environment = manifest["scene"]["environment"]
        environment["kind"] = "hearth"
        environment["facts"] = [
            "an intimate room organized around warmth and return",
        ]
        environment["painterlyTruth"] = {
            "version": 1,
            "id": "painterly_truth",
            "revision": 3,
            "room": "hearth",
            "facts": [
                "the hearth is a place of refuge and mutual presence",
            ],
            "fixedObjects": [
                {"id": "low_fire", "name": "low fire"},
                {"id": "velvet_cushion", "name": "velvet cushion"},
            ],
        }

        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertTrue(bundle["thresholdIntegrity"]["active"])
        self.assertEqual(
            bundle["thresholdIntegrity"]["profile"],
            "hearth_hospitality_v1",
        )
        self.assertNotIn("FIXED OBJECT LOCK", bundle["positive"])
        self.assertIn(
            "These authored objects must be clearly visible",
            bundle["positive"],
        )
        self.assertIn(
            "Any authored low fire must remain visibly low and contained.",
            bundle["positive"],
        )
        self.assertIn(
            "Any authored cushion must read as a discrete cushion",
            bundle["positive"],
        )
        self.assertNotIn("THRESHOLD INTEGRITY LAW", bundle["positive"])
        self.assertIn(
            "Movement and access must remain consistent with the authored Hearth",
            bundle["positive"],
        )
        self.assertIn("easy ingress and egress", bundle["positive"])
        self.assertIn(
            "Threshold integrity rejects:",
            bundle["negative"],
        )
        self.assertIn("wrought-iron gates", bundle["negative"])
        self.assertIn("chains", bundle["negative"])

        record = painter.build_candidate_record(
            manifest,
            bundle,
            spec,
            Path(".velastra/hearth.png"),
        )
        self.assertTrue(
            record["source"]["thresholdIntegrity"]["active"]
        )

    def test_explicit_scene_barrier_truth_disables_default_hospitality_override(self):
        manifest = manifest_fixture()
        environment = manifest["scene"]["environment"]
        environment["kind"] = "hearth"
        environment["facts"] = [
            "an iron gate is explicitly required as memorial scene truth",
        ]
        environment["painterlyTruth"] = {
            "version": 1,
            "id": "painterly_truth",
            "revision": 3,
            "room": "hearth",
            "fixedObjects": [
                {"id": "low_fire", "name": "low fire"},
            ],
        }

        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertFalse(bundle["thresholdIntegrity"]["active"])
        self.assertEqual(
            bundle["thresholdIntegrity"]["reason"],
            "explicit_scene_truth_requires_barrier",
        )
        self.assertNotIn("THRESHOLD INTEGRITY LAW", bundle["positive"])
        self.assertNotIn(
            "Threshold integrity rejects:",
            bundle["negative"],
        )

    def test_non_hearth_fixed_object_lock_does_not_introduce_hearth_objects(self):
        manifest = manifest_fixture()
        spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertNotIn("FIXED OBJECT LOCK", bundle["positive"])
        self.assertIn("These authored objects must be clearly visible", bundle["positive"])
        self.assertIn("old basin", bundle["positive"])
        self.assertNotIn("low fire", bundle["positive"])
        self.assertNotIn("cushion", bundle["positive"])
        self.assertFalse(bundle["thresholdIntegrity"]["active"])

    def test_witness_firewall_is_prompt_visible_and_candidate_local(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "a" * 64,
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(approved))
        ]
        manifest["witnesses"]["active"] = True

        base_spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="firewall-base",
            )
        )
        firewall_spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image_edit",
                attempt="firewall-test",
                witness_firewall=True,
                firewall_tile_size=32,
                firewall_blur_radius=0.6,
            )
        )
        base = painter.compile_prompt_bundle(
            manifest,
            base_spec,
        )
        firewalled = painter.compile_prompt_bundle(
            manifest,
            firewall_spec,
        )

        self.assertFalse(
            base["witness"]["firewall"]["active"]
        )
        self.assertTrue(
            firewalled["witness"]["firewall"]["active"]
        )
        self.assertEqual(
            firewalled["witness"]["firewall"]["algorithm"],
            "patch_shuffle_v1",
        )
        self.assertNotIn(
            "WITNESS FIREWALL",
            firewalled["positive"],
        )
        self.assertIn(
            "reference pixels have been locally rearranged",
            firewalled["positive"],
        )
        self.assertIn(
            "original spatial organization is unavailable",
            firewalled["positive"],
        )
        self.assertNotEqual(
            painter.candidate_id(
                manifest,
                base,
                base_spec,
            ),
            painter.candidate_id(
                manifest,
                firewalled,
                firewall_spec,
            ),
        )

    def test_combined_image_edit_uses_governing_handprint_pressure(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "deadbeef",
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
                attempt="pressure-test",
            )
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertEqual(
            bundle["handprintPressure"]["profile"],
            "governing_translation",
        )
        self.assertTrue(bundle["handprintPressure"]["combined"])
        self.assertNotIn("GOVERNING HANDPRINT LAW", bundle["positive"])
        self.assertNotIn("NON-NEGOTIABLE HAND LAWS", bundle["positive"])
        self.assertNotIn("WITNESS TRANSLATION LAW", bundle["positive"])
        self.assertIn(
            "portfolio-derived visual treatment",
            bundle["positive"],
        )
        self.assertIn(
            "Visual treatment constraints:",
            bundle["positive"],
        )
        self.assertIn(
            "reference image",
            bundle["positive"],
        )

        record = painter.build_candidate_record(
            manifest,
            bundle,
            spec,
            Path(".velastra/candidate.png"),
        )
        self.assertEqual(
            record["source"]["handprintPressure"]["profile"],
            "governing_translation",
        )
        self.assertTrue(
            record["source"]["handprintPressure"]["combined"]
        )

    def test_witness_only_ablation_has_no_governing_pressure(self):
        manifest = manifest_fixture()
        approved = manifest["witnesses"]["selected"][0]
        approved["status"] = "approved"
        approved["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "deadbeef",
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
                without_handprint=True,
                attempt="witness-only-pressure-test",
            )
        )
        bundle = painter.compile_prompt_bundle(manifest, spec)

        self.assertFalse(bundle["handprintPressure"]["active"])
        self.assertIsNone(bundle["handprintPressure"]["profile"])
        self.assertNotIn("GOVERNING HANDPRINT LAW", bundle["positive"])
        self.assertNotIn("NON-NEGOTIABLE HAND LAWS", bundle["positive"])

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

        self.assertNotIn("VISUAL WITNESS", bundle["positive"])
        self.assertIn("input reference image accompanies this request", bundle["positive"])
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
            "witness_firewall": False,
            "firewall_tile_size": 32,
            "firewall_blur_radius": 0.6,
            "without_handprint": False,
            "without_witness": False,
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

    def test_style_ablation_is_candidate_local_and_prompt_visible(self):
        manifest = manifest_fixture()
        manifest["style"]["hand"].append({
            "id": "quiet_uncanny",
            "weight": 0.9,
            "directive": (
                "Favor one or two quietly impossible or emotionally "
                "dissonant details over spectacle."
            ),
        })
        manifest["style"]["emphasis"].append("quiet_uncanny")
        manifest["style"]["archetype"]["directives"].append(
            "Let architecture and objects imply histories that are not fully explained."
        )

        baseline_spec = painter.build_render_spec(
            self.brush_args(brush="qwen_image")
        )
        ablated_spec = painter.build_render_spec(
            self.brush_args(
                brush="qwen_image",
                without_style_law=["quiet_uncanny"],
                without_style_phrase=[
                    "inhabited memory-field",
                    "imply histories",
                ],
            )
        )

        baseline = painter.compile_prompt_bundle(
            manifest,
            baseline_spec,
        )
        ablated = painter.compile_prompt_bundle(
            manifest,
            ablated_spec,
        )

        self.assertIn("quietly impossible", baseline["positive"])
        self.assertIn("inhabited memory-field", baseline["positive"])
        self.assertIn("imply histories", baseline["positive"])

        self.assertNotIn("quietly impossible", ablated["positive"])
        self.assertNotIn("inhabited memory-field", ablated["positive"])
        self.assertNotIn("imply histories", ablated["positive"])
        self.assertEqual(
            ablated["style"]["ablations"]["disabledStyleIds"],
            ["quiet_uncanny"],
        )
        self.assertEqual(
            ablated["style"]["ablations"]["disabledPhrases"],
            ["inhabited memory-field", "imply histories"],
        )

        baseline_id = painter.candidate_id(
            manifest,
            baseline,
            baseline_spec,
        )
        ablated_id = painter.candidate_id(
            manifest,
            ablated,
            ablated_spec,
        )
        self.assertNotEqual(baseline_id, ablated_id)

    def test_presence_provenance_trial_plans_balanced_witness_free_factorial(self):
        manifest = manifest_fixture()
        manifest["style"]["hand"].append({
            "id": "quiet_uncanny",
            "weight": 0.9,
            "directive": (
                "Favor one or two quietly impossible or emotionally "
                "dissonant details over spectacle."
            ),
        })
        manifest["style"]["emphasis"].append("quiet_uncanny")
        manifest["style"]["archetype"]["directives"].append(
            "Let architecture and objects imply histories that are not fully explained."
        )

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = root / "hearth.velastra.json"
            handprint_path = root / "handprint.json"
            trial_path = root / "presence.json"
            out_dir = root / "candidates"

            painter.write_json(manifest_path, manifest)
            painter.write_json(
                handprint_path,
                {
                    "version": 1,
                    "status": "built",
                    "provenance": {
                        "algorithmVersion": 2,
                    },
                },
            )

            args = argparse.Namespace(
                manifest=str(manifest_path),
                trial_id="hearth-presence-0036-test",
                repeats=2,
                render=False,
                replace_trial=False,
                repo_root=str(root),
                handprint=str(handprint_path),
                out_dir=str(out_dir),
                output=str(trial_path),
            )

            result = painter.cmd_presence_provenance_trial(
                args
            )
            self.assertEqual(result, 0)

            trial = painter.read_json(trial_path)
            self.assertEqual(trial["status"], "planned")
            self.assertEqual(
                set(trial["conditions"]),
                {
                    "baseline",
                    "without_quiet_uncanny",
                    "without_memory_presence",
                    "without_both",
                },
            )
            for arms in trial["conditions"].values():
                self.assertEqual(len(arms), 2)
                for arm in arms:
                    self.assertFalse(arm["witness"]["active"])

            self.assertEqual(
                trial["executionOrder"],
                [
                    "hearth-presence-0036-test-b-01",
                    "hearth-presence-0036-test-q-01",
                    "hearth-presence-0036-test-m-01",
                    "hearth-presence-0036-test-x-01",
                    "hearth-presence-0036-test-x-02",
                    "hearth-presence-0036-test-m-02",
                    "hearth-presence-0036-test-q-02",
                    "hearth-presence-0036-test-b-02",
                ],
            )
            self.assertFalse(
                list(out_dir.rglob("*.png")),
                "Plan-only presence trial must not execute inference.",
            )

            for repeat_index in (0, 1):
                seeds = {
                    trial["conditions"][condition][repeat_index]["seed"]
                    for condition in trial["conditions"]
                }
                self.assertEqual(len(seeds), 1)

            self.assertEqual(
                trial["conditions"]["without_quiet_uncanny"][0][
                    "styleAblation"
                ]["disabledStyleIds"],
                ["quiet_uncanny"],
            )
            self.assertEqual(
                trial["conditions"]["without_memory_presence"][0][
                    "styleAblation"
                ]["disabledPhrases"],
                ["inhabited memory-field", "imply histories"],
            )
            self.assertTrue(
                trial["laws"]["sameSeedWithinRepeatAcrossConditions"]
            )

    def test_basin_cartography_plans_paired_identical_prompt_seeds(self):
        manifest = manifest_fixture()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = root / "hearth.velastra.json"
            handprint_path = root / "handprint.json"
            trial_path = root / "basin.json"
            out_dir = root / "candidates"

            painter.write_json(manifest_path, manifest)
            painter.write_json(
                handprint_path,
                {
                    "version": 1,
                    "status": "built",
                    "provenance": {
                        "algorithmVersion": 2,
                    },
                },
            )

            args = argparse.Namespace(
                manifest=str(manifest_path),
                trial_id="hearth-basin-0037-test",
                seeds="190920,190921",
                replicates=2,
                render=False,
                replace_trial=False,
                repo_root=str(root),
                handprint=str(handprint_path),
                out_dir=str(out_dir),
                output=str(trial_path),
            )

            result = painter.cmd_basin_cartography_trial(
                args
            )
            self.assertEqual(result, 0)

            trial = painter.read_json(trial_path)
            self.assertEqual(trial["status"], "planned")
            self.assertEqual(trial["seeds"], [190920, 190921])
            self.assertEqual(trial["replicatesPerSeed"], 2)
            self.assertEqual(
                trial["executionOrder"],
                [
                    "hearth-basin-0037-test-s190920-r01",
                    "hearth-basin-0037-test-s190921-r01",
                    "hearth-basin-0037-test-s190921-r02",
                    "hearth-basin-0037-test-s190920-r02",
                ],
            )

            prompt_shas = {
                arm["promptSha256"]
                for arms in trial["conditions"].values()
                for arm in arms
            }
            self.assertEqual(len(prompt_shas), 1)
            self.assertEqual(
                next(iter(prompt_shas)),
                trial["promptSha256"],
            )

            for seed, arms in trial["conditions"].items():
                self.assertEqual(len(arms), 2)
                self.assertNotEqual(
                    arms[0]["candidateId"],
                    arms[1]["candidateId"],
                )
                for arm in arms:
                    self.assertEqual(arm["seed"], int(seed))
                    self.assertFalse(arm["witness"]["active"])
                    self.assertEqual(
                        arm["command"][
                            arm["command"].index("--seed") + 1
                        ],
                        seed,
                    )

            self.assertFalse(
                list(out_dir.rglob("*.png")),
                "Plan-only basin cartography must not execute inference.",
            )
            self.assertTrue(
                trial["laws"]["promptMustRemainByteIdenticalAcrossArms"]
            )

    def test_basin_seed_list_requires_multiple_distinct_seeds(self):
        self.assertEqual(
            painter.parse_seed_list("190920,190921,190920"),
            [190920, 190921],
        )
        with self.assertRaises(painter.PainterError):
            painter.parse_seed_list("190920")

    def test_basin_density_plans_identical_prompt_seed_range(self):
        manifest = manifest_fixture()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = root / "hearth.velastra.json"
            handprint_path = root / "handprint.json"
            trial_path = root / "density.json"
            out_dir = root / "candidates"

            painter.write_json(manifest_path, manifest)
            painter.write_json(
                handprint_path,
                {
                    "version": 1,
                    "status": "built",
                    "provenance": {
                        "algorithmVersion": 2,
                    },
                },
            )

            args = argparse.Namespace(
                manifest=str(manifest_path),
                trial_id="hearth-density-0038-test",
                start_seed=190920,
                end_seed=190923,
                max_seeds=32,
                render=False,
                replace_trial=False,
                repo_root=str(root),
                handprint=str(handprint_path),
                out_dir=str(out_dir),
                output=str(trial_path),
            )

            result = painter.cmd_basin_density_trial(args)
            self.assertEqual(result, 0)

            trial = painter.read_json(trial_path)
            self.assertEqual(trial["status"], "planned")
            self.assertEqual(
                trial["seeds"],
                [190920, 190921, 190922, 190923],
            )
            self.assertEqual(len(trial["arms"]), 4)
            self.assertEqual(
                trial["seedRange"],
                {
                    "start": 190920,
                    "end": 190923,
                    "count": 4,
                },
            )

            prompt_shas = {
                arm["promptSha256"]
                for arm in trial["arms"]
            }
            self.assertEqual(len(prompt_shas), 1)
            self.assertEqual(
                next(iter(prompt_shas)),
                trial["promptSha256"],
            )
            self.assertEqual(
                trial["knownReferenceBasins"]["190920"],
                "smoky_presence",
            )
            self.assertEqual(
                trial["knownReferenceBasins"]["190923"],
                "centered_ceremonial",
            )

            for arm in trial["arms"]:
                self.assertFalse(arm["witness"]["active"])
                self.assertEqual(arm["replicate"], 1)

            self.assertFalse(
                list(out_dir.rglob("*.png")),
                "Plan-only density scan must not execute inference.",
            )
            self.assertTrue(
                trial["laws"]["numericSeedAdjacencyDoesNotImplyLatentAdjacency"]
            )
            self.assertTrue(
                trial["laws"]["novelBasinsRequireReplicationBeforeInterpretation"]
            )

    def test_basin_density_seed_range_has_safety_bounds(self):
        self.assertEqual(
            painter.density_seed_range(10, 13),
            [10, 11, 12, 13],
        )
        with self.assertRaises(painter.PainterError):
            painter.density_seed_range(13, 10)
        with self.assertRaises(painter.PainterError):
            painter.density_seed_range(10, 12)
        with self.assertRaises(painter.PainterError):
            painter.density_seed_range(1, 40, max_seeds=16)

    def test_scene_sovereignty_trial_plans_a_c_d_without_inference(self):
        manifest = manifest_fixture()
        selected = manifest["witnesses"]["selected"][0]
        selected["status"] = "approved"
        selected["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "b" * 64,
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(selected))
        ]
        manifest["witnesses"]["active"] = True

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = root / "hearth.velastra.json"
            handprint_path = root / "handprint.json"
            witnesses_path = root / "witnesses.json"
            trial_path = root / "sovereignty.json"
            out_dir = root / "candidates"

            painter.write_json(manifest_path, manifest)
            painter.write_json(
                handprint_path,
                {
                    "version": 1,
                    "status": "built",
                    "pressure": manifest["handprint"]["pressure"],
                    "provenance": {
                        "algorithmVersion": 2,
                    },
                    "facets": {
                        "byRole": {},
                    },
                },
            )
            painter.write_json(
                witnesses_path,
                {
                    "version": 1,
                    "entries": {
                        "gallery_target_01": {
                            "status": "approved",
                            "asset": selected["asset"],
                        }
                    },
                },
            )

            args = argparse.Namespace(
                manifest=str(manifest_path),
                trial_id="hearth-sovereignty-0033-test",
                repeats=2,
                render=False,
                replace_trial=False,
                repo_root=str(root),
                handprint=str(handprint_path),
                witness_registry=str(witnesses_path),
                out_dir=str(out_dir),
                firewall_tile_size=32,
                firewall_blur_radius=0.6,
                output=str(trial_path),
            )

            result = painter.cmd_scene_sovereignty_trial(
                args
            )
            self.assertEqual(result, 0)

            trial = painter.read_json(trial_path)
            self.assertEqual(trial["status"], "planned")
            self.assertEqual(
                len(trial["conditions"]["handprint_only"]),
                2,
            )
            self.assertEqual(
                len(trial["conditions"]["original_witness_combined"]),
                2,
            )
            self.assertEqual(
                len(trial["conditions"]["firewall_combined"]),
                2,
            )
            self.assertEqual(
                trial["executionOrder"],
                [
                    "hearth-sovereignty-0033-test-a-01",
                    "hearth-sovereignty-0033-test-c-01",
                    "hearth-sovereignty-0033-test-d-01",
                    "hearth-sovereignty-0033-test-d-02",
                    "hearth-sovereignty-0033-test-c-02",
                    "hearth-sovereignty-0033-test-a-02",
                ],
            )
            self.assertFalse(
                list(out_dir.rglob("*.png")),
                "Plan-only sovereignty trial must not execute inference.",
            )
            self.assertTrue(
                trial["conditions"]["firewall_combined"][0][
                    "witness"
                ]["firewall"]["active"]
            )
            self.assertFalse(
                trial["conditions"]["original_witness_combined"][0][
                    "witness"
                ]["firewall"]["active"]
            )
            self.assertEqual(
                trial["humanReview"]["primaryQuestion"],
                "Does the image read first as the target place rather than as the Visual Witness scene?",
            )
            self.assertIn(
                "old basin",
                trial["humanReview"]["requiredFixedObjects"],
            )

    def test_pressure_trial_plans_replication_without_inference(self):
        manifest = manifest_fixture()
        selected = manifest["witnesses"]["selected"][0]
        selected["status"] = "approved"
        selected["asset"] = {
            "path": "assets/velastra/witnesses/gallery_target_01.png",
            "sha256": "sealed-gallery-witness",
            "width": 1536,
            "height": 864,
            "mediaType": "image/png",
        }
        manifest["witnesses"]["approved"] = [
            json.loads(json.dumps(selected))
        ]
        manifest["witnesses"]["active"] = True

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = root / "gallery.velastra.json"
            handprint_path = root / "handprint.json"
            witnesses_path = root / "witnesses.json"
            trial_path = root / "trial.json"
            out_dir = root / "candidates"

            painter.write_json(manifest_path, manifest)
            painter.write_json(
                handprint_path,
                {
                    "version": 1,
                    "status": "built",
                    "pressure": manifest["handprint"]["pressure"],
                    "provenance": {
                        "algorithmVersion": 2,
                    },
                    "facets": {
                        "byRole": {},
                    },
                },
            )
            painter.write_json(
                witnesses_path,
                {
                    "version": 1,
                    "entries": {
                        "gallery_target_01": {
                            "status": "approved",
                            "asset": selected["asset"],
                        }
                    },
                },
            )

            args = argparse.Namespace(
                manifest=str(manifest_path),
                trial_id="gallery-pressure-0030-test",
                repeats=4,
                render=False,
                replace_trial=False,
                repo_root=str(root),
                handprint=str(handprint_path),
                witness_registry=str(witnesses_path),
                out_dir=str(out_dir),
                output=str(trial_path),
            )

            result = painter.cmd_pressure_trial(args)
            self.assertEqual(result, 0)

            trial = painter.read_json(trial_path)
            self.assertEqual(trial["status"], "planned")
            self.assertEqual(
                trial["repeatsPerCondition"],
                4,
            )
            self.assertEqual(
                len(trial["conditions"]["witness_only"]),
                4,
            )
            self.assertEqual(
                len(
                    trial["conditions"][
                        "governing_translation"
                    ]
                ),
                4,
            )
            self.assertEqual(
                trial["executionOrder"][:4],
                [
                    "gallery-pressure-0030-test-b-01",
                    "gallery-pressure-0030-test-c-01",
                    "gallery-pressure-0030-test-c-02",
                    "gallery-pressure-0030-test-b-02",
                ],
            )
            self.assertFalse(
                list(out_dir.rglob("*.png")),
                "Plan-only pressure trial must not execute inference.",
            )
            self.assertTrue(
                trial["laws"][
                    "stochasticTransportRequiresReplication"
                ]
            )
            self.assertEqual(
                trial["frozen"]["witnessSha256"],
                "sealed-gallery-witness",
            )

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
