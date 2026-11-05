import importlib.util
import unittest
from pathlib import Path


REPLICATION_PATH = Path(__file__).with_name("replication.py")
REP_SPEC = importlib.util.spec_from_file_location(
    "velastra_replication_test",
    REPLICATION_PATH,
)
replication = importlib.util.module_from_spec(REP_SPEC)
assert REP_SPEC.loader is not None
REP_SPEC.loader.exec_module(replication)

GRIP_PATH = Path(__file__).with_name("grip.py")
GRIP_SPEC = importlib.util.spec_from_file_location(
    "velastra_grip_replication_test",
    GRIP_PATH,
)
grip = importlib.util.module_from_spec(GRIP_SPEC)
assert GRIP_SPEC.loader is not None
GRIP_SPEC.loader.exec_module(grip)


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


def handprint_fixture():
    def dist():
        return {
            "count": 3,
            "mean": 0.1,
            "median": 0.1,
            "min": 0.0,
            "max": 0.2,
            "stddev": 0.05,
            "range": 0.2,
        }

    return {
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
        }
    }


def grip_template():
    return {
        "thresholds": {
            "minimumRepeatsPerCondition": 4,
            "minimumBaselineStddev": 0.001,
            "anchorMaxStddevRatio": 0.67,
            "anchorMaxMeanShiftInBaselineStddev": 1.0,
            "freedomMinStddevRatio": 1.5,
            "stableDirectionDeadbandInBaselineStddev": 0.25,
        }
    }


def arm(center, dark, tonal, entropy, edge=0.05):
    return {
        "evaluation": {
            "metrics": {
                "width": 100,
                "height": 100,
                "aspectRatio": 1.0,
                "p10Luminance": 0.1,
                "p90Luminance": 0.7,
                "centerLightDelta": center,
                "centerLuminance": 0.3 + center / 4,
                "peripheryLuminance": 0.2,
                "darkShare": dark,
                "tonalSpan": tonal,
                "grayscaleEntropy": entropy,
                "edgeActivity": edge,
            }
        }
    }


def trial(asset_key, *, witness="gallery_target_01", variant=False):
    if not variant:
        b = [
            arm(0.10, 0.30, 0.30, 0.860),
            arm(0.14, 0.40, 0.31, 0.865),
            arm(0.12, 0.35, 0.29, 0.862),
            arm(0.16, 0.45, 0.32, 0.868),
        ]
        c = [
            arm(0.131, 0.37, 0.27, 0.850),
            arm(0.132, 0.39, 0.35, 0.880),
            arm(0.130, 0.38, 0.25, 0.840),
            arm(0.133, 0.36, 0.38, 0.890),
        ]
    else:
        b = [
            arm(0.20, 0.20, 0.28, 0.840),
            arm(0.24, 0.30, 0.29, 0.845),
            arm(0.22, 0.25, 0.27, 0.842),
            arm(0.26, 0.35, 0.30, 0.848),
        ]
        c = [
            arm(0.231, 0.27, 0.24, 0.825),
            arm(0.232, 0.29, 0.34, 0.875),
            arm(0.230, 0.28, 0.22, 0.815),
            arm(0.233, 0.26, 0.37, 0.895),
        ]

    return {
        "status": "complete",
        "trialId": asset_key + "-trial",
        "assetKey": asset_key,
        "manifestSha256": asset_key + "-manifest",
        "model": "Qwen/Qwen-Image-Edit",
        "brush": "qwen_image_edit",
        "transport": "huggingface",
        "repeatsPerCondition": 4,
        "facetRoles": [
            "compositional_cadence",
            "material_hand",
            "spatial_depth",
        ],
        "frozen": {
            "handprintSha256": "same-handprint",
            "handprintAlgorithmVersion": 2,
            "pressureSchemaVersion": 1,
            "witnessRegistrySha256": "same-witness-registry",
            "witnessId": witness,
            "witnessSha256": "same-witness-hash",
        },
        "conditions": {
            "witness_only": b,
            "governing_translation": c,
        },
    }


class CrossSceneReplicationTests(unittest.TestCase):
    def test_pair_requires_different_scene_with_same_controls(self):
        result = replication.validate_pair(
            trial("gallery"),
            trial("hearth", variant=True),
        )
        self.assertTrue(result["controlsMatch"])

        with self.assertRaises(replication.ReplicationError):
            replication.validate_pair(
                trial("gallery"),
                trial("gallery"),
            )

    def test_changed_witness_fails_closed(self):
        with self.assertRaises(replication.ReplicationError) as caught:
            replication.validate_pair(
                trial("gallery"),
                trial(
                    "hearth",
                    witness="studio_atelier_01",
                    variant=True,
                ),
            )
        self.assertIn(
            "witnessId",
            str(caught.exception),
        )

    def test_replication_preserves_matching_categories_as_observation(self):
        record = replication.build_replication_record(
            baseline_trial=trial("gallery"),
            replication_trial=trial(
                "hearth",
                variant=True,
            ),
            handprint=handprint_fixture(),
            grip_template=grip_template(),
            role_metrics=ROLE_METRICS,
            grip_module=grip,
        )

        comparison = record["comparison"]
        self.assertIn(
            "centerLightDelta",
            comparison["replicated"]["anchor"],
        )
        self.assertIn(
            "tonalSpan",
            comparison["replicated"]["freedom"],
        )
        self.assertTrue(
            record["laws"][
                "crossSceneComparisonCannotActivateGrip"
            ]
        )
        self.assertIn(
            "not global render laws",
            comparison["interpretationBoundary"],
        )

    def test_signature_like_artifacts_remain_human_observation(self):
        record = replication.build_replication_record(
            baseline_trial=trial("gallery"),
            replication_trial=trial(
                "hearth",
                variant=True,
            ),
            handprint=handprint_fixture(),
            grip_template=grip_template(),
            role_metrics=ROLE_METRICS,
            grip_module=grip,
        )

        signature = record["humanObservations"][
            "signatureLikeArtifacts"
        ]
        self.assertEqual(signature["baseline"], [])
        self.assertEqual(signature["replication"], [])
        self.assertIn(
            "not interpreted as authorship",
            signature["note"],
        )
        self.assertTrue(
            record["laws"][
                "humanObservationCannotBecomeMetricWithoutSeparateDesign"
            ]
        )


if __name__ == "__main__":
    unittest.main()
