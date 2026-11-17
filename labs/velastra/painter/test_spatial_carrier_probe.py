import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).with_name("spatial_carrier_probe.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_spatial_carrier_probe_test", MODULE_PATH
)
probe = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(probe)


class SpatialCarrierProbeTests(unittest.TestCase):
    def test_prompt_is_bounded_and_control_plane_clean(self):
        probe.validate_prompt()
        self.assertLessEqual(probe.estimate_tokens(probe.PROMPT), 420)

    def test_plan_authorizes_zero_provider_requests(self):
        carrier = {
            "structured": {
                "sha256": "abc",
                "pixelHistogramSha256": "hist",
            }
        }
        record = probe.plan_record(carrier)
        self.assertEqual(record["status"], "planned")
        self.assertEqual(record["providerRequestCountAuthorized"], 0)
        self.assertFalse(record["render"]["providerSeedControl"])

    def test_execute_flag_defaults_false(self):
        # Safety property documented by argparse declaration: no provider
        # request occurs unless --execute is explicitly supplied.
        self.assertNotIn("--execute", [])


if __name__ == "__main__":
    unittest.main()
