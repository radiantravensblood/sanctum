import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("grip.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_grip_test",
    MODULE_PATH,
)
grip = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(grip)


ROLE_METRICS = {
    "compositional_cadence": (
        "centerLightDelta",
        "centerLuminance",
        "peripheryLuminance",
    ),
    "material_hand": (
        "edgeActivity",
        "grayscaleEntropy",
        "tonalSpan",
    ),
    "spatial_depth": (
        "darkShare",
        "tonalSpan",
        "centerLightDelta",
    ),
}


def template_fixture():
    return {
        "version": 1,
        "designation": "Virynism Handprint Grip",
        "status": "awaiting_build",
        "renderEligible": False,
        "laws": {
            "pendingHumanReviewCannotDriveRender": True,
        },
        "scope": {
            "mode": "scene_local_until_replicated_elsewhere",
            "rooms": ["gallery"],
            "assetKeys": ["velastra.place_tableau.test"],
        },
        "thresholds": {
            "minimumRepeatsPerCondition": 4,
            "minimumBaselineStddev": 0.001,
            "anchorMaxStddevRatio": 0.67,
            "anchorMaxMeanShiftInBaselineStddev": 1.0,
            "freedomMinStddevRatio": 1.5,
            "stableDirectionDeadbandInBaselineStddev": 0.25,
        },
        "dimensions": {
            "anchors": {},
            "freedoms": {},
            "tendencies": {},
        },
        "roleProjection": {},
        "diagnostics": {},
        "sourceTrial": {
            "path": "trial.json",
            "humanReviewRequiredForRender": True,
        },
        "provenance": {
            "builder": "velastra-painter grip-build",
            "algorithmVersion": 1,
        },
    }


def handprint_fixture():
    def dist():
        return {
            "count": 2,
            "mean": 0.1,
            "median": 0.1,
            "min": 0.0,
            "max": 0.2,
            "stddev": 0.05,
            "range": 0.2,
        }

    return {
        "status": "built",
        "facets": {
            "byRole": {
                "compositional_cadence": {
                    "eligibleForRender": True,
                    "metrics": {
                        "centerLightDelta": dist(),
                        "centerLuminance": dist(),
                        "peripheryLuminance": dist(),
                    },
                },
                "material_hand": {
                    "eligibleForRender": True,
                    "metrics": {
                        "edgeActivity": dist(),
                        "grayscaleEntropy": dist(),
                        "tonalSpan": dist(),
                    },
                },
                "spatial_depth": {
                    "eligibleForRender": True,
                    "metrics": {
                        "darkShare": dist(),
                        "tonalSpan": dist(),
                        "centerLightDelta": dist(),
                    },
                },
            }
        },
    }


def arm(metrics):
    return {
        "evaluation": {
            "metrics": metrics,
        }
    }


def trial_fixture(reviewed=False):
    b_values = [
        {
            "centerLightDelta": 0.10,
            "centerLuminance": 0.30,
            "peripheryLuminance": 0.20,
            "darkShare": 0.30,
            "tonalSpan": 0.30,
            "edgeActivity": 0.05,
            "grayscaleEntropy": 0.86,
        },
        {
            "centerLightDelta": 0.14,
            "centerLuminance": 0.34,
            "peripheryLuminance": 0.18,
            "darkShare": 0.40,
            "tonalSpan": 0.31,
            "edgeActivity": 0.055,
            "grayscaleEntropy": 0.865,
        },
        {
            "centerLightDelta": 0.12,
            "centerLuminance": 0.32,
            "peripheryLuminance": 0.22,
            "darkShare": 0.35,
            "tonalSpan": 0.29,
            "edgeActivity": 0.052,
            "grayscaleEntropy": 0.862,
        },
        {
            "centerLightDelta": 0.16,
            "centerLuminance": 0.36,
            "peripheryLuminance": 0.16,
            "darkShare": 0.45,
            "tonalSpan": 0.32,
            "edgeActivity": 0.058,
            "grayscaleEntropy": 0.868,
        },
    ]
    c_values = [
        {
            "centerLightDelta": 0.131,
            "centerLuminance": 0.315,
            "peripheryLuminance": 0.184,
            "darkShare": 0.37,
            "tonalSpan": 0.27,
            "edgeActivity": 0.053,
            "grayscaleEntropy": 0.85,
        },
        {
            "centerLightDelta": 0.132,
            "centerLuminance": 0.325,
            "peripheryLuminance": 0.193,
            "darkShare": 0.39,
            "tonalSpan": 0.35,
            "edgeActivity": 0.054,
            "grayscaleEntropy": 0.88,
        },
        {
            "centerLightDelta": 0.130,
            "centerLuminance": 0.320,
            "peripheryLuminance": 0.190,
            "darkShare": 0.38,
            "tonalSpan": 0.25,
            "edgeActivity": 0.052,
            "grayscaleEntropy": 0.84,
        },
        {
            "centerLightDelta": 0.133,
            "centerLuminance": 0.330,
            "peripheryLuminance": 0.197,
            "darkShare": 0.36,
            "tonalSpan": 0.38,
            "edgeActivity": 0.055,
            "grayscaleEntropy": 0.89,
        },
    ]

    return {
        "status": "complete",
        "trialId": "gallery-pressure-test",
        "assetKey": "velastra.place_tableau.test",
        "manifestSha256": "manifest-hash",
        "frozen": {
            "handprintSha256": "handprint-hash",
            "witnessRegistrySha256": "witness-registry-hash",
            "witnessId": "gallery_target_01",
            "witnessSha256": "witness-hash",
        },
        "conditions": {
            "witness_only": [arm(row) for row in b_values],
            "governing_translation": [arm(row) for row in c_values],
        },
        "summary": {
            "witnessOnly": {
                "handprintRangeAdherence": {
                    "stddev": 0.01,
                },
                "witnessSpatialSimilarity": {
                    "stddev": 0.02,
                },
            },
            "governingCombined": {
                "handprintRangeAdherence": {
                    "stddev": 0.002,
                },
                "witnessSpatialSimilarity": {
                    "stddev": 0.001,
                },
            },
        },
        "humanReview": {
            "status": "reviewed" if reviewed else "pending",
            "sceneTruthPass": True if reviewed else None,
            "notes": "reviewed fixture" if reviewed else None,
        },
    }


class GripContractTests(unittest.TestCase):
    def test_anchor_is_reduced_variance_not_fixed_value(self):
        category, record = grip.classify_metric(
            metric="centerLightDelta",
            witness_only=[0.10, 0.14, 0.12, 0.16],
            governing=[0.131, 0.132, 0.130, 0.133],
            thresholds=template_fixture()["thresholds"],
            roles=["compositional_cadence"],
        )

        self.assertEqual(category, "anchors")
        self.assertLess(
            record["stddevRatioCombinedOverWitnessOnly"],
            0.67,
        )
        self.assertIn(
            "do not freeze an exact numeric value",
            record["interpretation"],
        )

    def test_freedom_is_variance_permission_not_randomness(self):
        category, record = grip.classify_metric(
            metric="tonalSpan",
            witness_only=[0.30, 0.31, 0.29, 0.32],
            governing=[0.27, 0.35, 0.25, 0.38],
            thresholds=template_fixture()["thresholds"],
            roles=["material_hand"],
        )

        self.assertEqual(category, "freedoms")
        self.assertGreater(
            record["stddevRatioCombinedOverWitnessOnly"],
            1.5,
        )
        self.assertIn(
            "Permit exploration",
            record["interpretation"],
        )

    def test_tiny_baseline_variance_cannot_fake_freedom(self):
        category, record = grip.classify_metric(
            metric="highlightShare",
            witness_only=[0.0060, 0.0062, 0.0061, 0.0063],
            governing=[0.0050, 0.0065, 0.0054, 0.0068],
            thresholds=template_fixture()["thresholds"],
            roles=[],
        )

        self.assertEqual(category, "tendencies")
        self.assertFalse(record["baselineVarianceReliable"])

    def test_pending_human_review_builds_provisional_grip(self):
        built = grip.derive_grip(
            trial=trial_fixture(reviewed=False),
            handprint=handprint_fixture(),
            template=template_fixture(),
            role_metrics=ROLE_METRICS,
        )

        self.assertEqual(
            built["status"],
            "provisional_pending_human_review",
        )
        self.assertFalse(built["renderEligible"])
        self.assertIn(
            "centerLightDelta",
            built["dimensions"]["anchors"],
        )
        self.assertIn(
            "tonalSpan",
            built["dimensions"]["freedoms"],
        )

    def test_reviewed_scene_truth_validates_observation_without_render_activation(self):
        built = grip.derive_grip(
            trial=trial_fixture(reviewed=True),
            handprint=handprint_fixture(),
            template=template_fixture(),
            role_metrics=ROLE_METRICS,
        )

        self.assertEqual(
            built["status"],
            "reviewed_observation",
        )
        self.assertFalse(built["renderEligible"])
        self.assertEqual(
            built["sourceTrial"]["humanReview"]["sceneTruthPass"],
            True,
        )
        self.assertIn(
            "compositional_cadence",
            built["roleProjection"],
        )
        self.assertIn(
            "centerLightDelta",
            built["roleProjection"][
                "compositional_cadence"
            ]["anchors"],
        )


if __name__ == "__main__":
    unittest.main()
