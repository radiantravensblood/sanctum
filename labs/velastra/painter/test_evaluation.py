import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("evaluation.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_evaluation_test",
    MODULE_PATH,
)
evaluation = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(evaluation)


class EvaluationContractTests(unittest.TestCase):
    def handprint_fixture(self):
        distribution = {
            "count": 2,
            "mean": 0.1,
            "median": 0.1,
            "min": 0.05,
            "max": 0.15,
            "stddev": 0.05,
            "range": 0.1,
            "variation": "moderate",
        }
        return {
            "facets": {
                "byRole": {
                    "edge_behavior": {
                        "eligibleForRender": True,
                        "witnessCount": 2,
                        "support": "cross_portfolio",
                        "metrics": {
                            "edgeActivity": dict(distribution),
                        },
                    },
                    "tonal_memory": {
                        "eligibleForRender": True,
                        "witnessCount": 3,
                        "support": "cross_portfolio",
                        "metrics": {
                            "meanWarmth": {
                                **distribution,
                                "min": -0.1,
                                "max": 0.2,
                                "median": 0.05,
                            },
                            "meanSaturation": {
                                **distribution,
                                "min": 0.0,
                                "max": 0.8,
                                "median": 0.4,
                            },
                            "tonalSpan": {
                                **distribution,
                                "min": 0.0,
                                "max": 0.8,
                                "median": 0.4,
                            },
                            "highlightShare": {
                                **distribution,
                                "min": 0.0,
                                "max": 0.2,
                                "median": 0.05,
                            },
                        },
                    },
                }
            }
        }

    def test_range_adherence_preserves_valid_range(self):
        inside = evaluation.range_adherence(
            0.14,
            {
                "min": 0.05,
                "max": 0.15,
                "median": 0.1,
                "stddev": 0.05,
            },
        )
        outside = evaluation.range_adherence(
            0.3,
            {
                "min": 0.05,
                "max": 0.15,
                "median": 0.1,
                "stddev": 0.05,
            },
        )

        self.assertTrue(inside["withinObservedRange"])
        self.assertEqual(inside["rangeAdherence"], 1.0)
        self.assertFalse(outside["withinObservedRange"])
        self.assertLess(outside["rangeAdherence"], 1.0)

    def test_handprint_adherence_is_descriptive_not_aesthetic(self):
        result = evaluation.evaluate_handprint_adherence(
            {
                "edgeActivity": 0.1,
                "meanWarmth": 0.05,
                "meanSaturation": 0.4,
                "tonalSpan": 0.4,
                "highlightShare": 0.05,
            },
            self.handprint_fixture(),
            roles=["edge_behavior", "tonal_memory"],
        )

        self.assertEqual(result["rangeAdherence"], 1.0)
        self.assertEqual(result["inRangeRate"], 1.0)
        self.assertIn("not an aesthetic score", result["law"])
        self.assertEqual(
            result["rolesEvaluated"],
            ["edge_behavior", "tonal_memory"],
        )

    def test_identical_images_have_full_coarse_similarity(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "first.png"
            second = root / "second.png"
            image = Image.new("RGB", (64, 48), (120, 80, 40))
            image.save(first)
            image.save(second)

            result = evaluation.witness_spatial_similarity(
                first,
                second,
            )

            self.assertEqual(result["score"], 1.0)
            self.assertEqual(
                result["coarseRgbSimilarity"],
                1.0,
            )
            self.assertIn(
                "does not establish semantic copying",
                result["law"],
            )

    def test_candidate_evaluation_records_boundaries(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            witness_dir = root / "assets" / "velastra" / "witnesses"
            witness_dir.mkdir(parents=True)
            witness_path = witness_dir / "gallery_target_01.png"
            candidate_path = root / "candidate.png"

            Image.new(
                "RGB",
                (64, 48),
                (120, 80, 40),
            ).save(witness_path)
            Image.new(
                "RGB",
                (64, 48),
                (110, 75, 35),
            ).save(candidate_path)

            candidate = {
                "candidateId": "candidate-test",
                "assetKey": "velastra.place_tableau.test",
                "source": {
                    "witness": {
                        "selected": "gallery_target_01",
                    },
                    "handprintPressure": {
                        "active": True,
                        "profile": "governing_translation",
                        "mode": "governing_translation",
                        "combined": True,
                    },
                },
                "render": {
                    "attemptId": "trial-c-01",
                    "ablation": {
                        "withoutHandprint": False,
                        "withoutWitness": False,
                    },
                },
            }
            registry = {
                "entries": {
                    "gallery_target_01": {
                        "status": "approved",
                        "asset": {
                            "path": "assets/velastra/witnesses/gallery_target_01.png",
                        },
                    }
                }
            }

            result = evaluation.evaluate_candidate(
                image_path=candidate_path,
                candidate_record=candidate,
                handprint=self.handprint_fixture(),
                witness_registry=registry,
                repo_root=root,
                roles=["edge_behavior", "tonal_memory"],
            )

            self.assertEqual(
                result["candidateId"],
                "candidate-test",
            )
            self.assertEqual(
                result["witnessId"],
                "gallery_target_01",
            )
            self.assertTrue(
                result["laws"][
                    "metricScoreCannotReplaceHumanReview"
                ]
            )
            self.assertTrue(
                result["witnessSpatialSimilarity"]["score"] > 0.9
            )

    def test_trial_summary_reports_directional_delta(self):
        witness_only = [
            {
                "handprintAdherence": {
                    "rangeAdherence": 0.6,
                    "inRangeRate": 0.5,
                },
                "witnessSpatialSimilarity": {
                    "score": 0.9,
                },
            },
            {
                "handprintAdherence": {
                    "rangeAdherence": 0.7,
                    "inRangeRate": 0.6,
                },
                "witnessSpatialSimilarity": {
                    "score": 0.8,
                },
            },
        ]
        combined = [
            {
                "handprintAdherence": {
                    "rangeAdherence": 0.8,
                    "inRangeRate": 0.7,
                },
                "witnessSpatialSimilarity": {
                    "score": 0.7,
                },
            },
            {
                "handprintAdherence": {
                    "rangeAdherence": 0.9,
                    "inRangeRate": 0.8,
                },
                "witnessSpatialSimilarity": {
                    "score": 0.6,
                },
            },
        ]

        summary = evaluation.summarize_trial(
            witness_only,
            combined,
        )
        delta = summary["deltaCombinedMinusWitnessOnly"]

        self.assertAlmostEqual(
            delta["handprintRangeAdherence"],
            0.2,
        )
        self.assertAlmostEqual(
            delta["witnessSpatialSimilarity"],
            -0.2,
        )
        self.assertIn(
            "not a significance test",
            summary["interpretationBoundary"],
        )


if __name__ == "__main__":
    unittest.main()
