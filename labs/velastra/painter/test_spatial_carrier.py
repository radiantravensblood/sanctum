import importlib.util
import tempfile
import unittest
from pathlib import Path

from PIL import Image


MODULE_PATH = Path(__file__).with_name("spatial_carrier.py")
SPEC = importlib.util.spec_from_file_location("velastra_spatial_carrier_test", MODULE_PATH)
carrier = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(carrier)


class SpatialCarrierTests(unittest.TestCase):
    def test_pair_is_deterministic_and_pixel_matched(self):
        with tempfile.TemporaryDirectory() as tmp:
            first = carrier.save_pair(Path(tmp) / "a")
            second = carrier.save_pair(Path(tmp) / "b")

            self.assertEqual(
                first["structured"]["sha256"],
                second["structured"]["sha256"],
            )
            self.assertEqual(
                first["destroyed"]["sha256"],
                second["destroyed"]["sha256"],
            )
            self.assertEqual(
                first["structured"]["pixelHistogramSha256"],
                first["destroyed"]["pixelHistogramSha256"],
            )
            self.assertNotEqual(
                first["structured"]["sha256"],
                first["destroyed"]["sha256"],
            )

    def test_dimensions_and_tile_contract(self):
        image = carrier.build_structured()
        self.assertEqual(image.size, (1536, 864))
        self.assertEqual(1536 % carrier.TILE, 0)
        self.assertEqual(864 % carrier.TILE, 0)

    def test_control_preserves_exact_histogram(self):
        structured = carrier.build_structured()
        destroyed = carrier.destroy_global_layout(structured)
        self.assertEqual(
            carrier.histogram_sha(structured),
            carrier.histogram_sha(destroyed),
        )


if __name__ == "__main__":
    unittest.main()
