import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("spatial_carrier_qwen_probe.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_spatial_carrier_qwen_probe_test", MODULE_PATH
)
probe = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(probe)


class SpatialCarrierQwenProbeTests(unittest.TestCase):
    def test_prompt_is_control_plane_clean(self):
        probe.validate_prompt()

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

    def test_model_is_qwen_edit(self):
        self.assertEqual(probe.MODEL, "Qwen/Qwen-Image-Edit")


if __name__ == "__main__":
    unittest.main()
