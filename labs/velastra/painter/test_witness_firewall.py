import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("witness_firewall.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_witness_firewall_test",
    MODULE_PATH,
)
firewall = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(firewall)


class WitnessFirewallTests(unittest.TestCase):
    def test_descriptor_is_deterministic_and_source_bound(self):
        first = firewall.descriptor(
            "a" * 64,
            tile_size=32,
            blur_radius=0.6,
        )
        second = firewall.descriptor(
            "a" * 64,
            tile_size=32,
            blur_radius=0.6,
        )
        other = firewall.descriptor(
            "b" * 64,
            tile_size=32,
            blur_radius=0.6,
        )

        self.assertEqual(first, second)
        self.assertNotEqual(
            first["carrierId"],
            other["carrierId"],
        )
        self.assertEqual(
            first["algorithm"],
            "patch_shuffle_v1",
        )

    def test_carrier_preserves_global_color_while_destroying_layout(self):
        from PIL import Image, ImageStat

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.png"
            carrier_path = root / "carrier.png"

            image = Image.new("RGB", (256, 128))
            pixels = image.load()
            for y in range(128):
                for x in range(256):
                    if x < 128:
                        pixels[x, y] = (220, 80, 30)
                    else:
                        pixels[x, y] = (20, 60, 180)
            image.save(source)

            config = firewall.descriptor(
                "c" * 64,
                tile_size=16,
                blur_radius=0.4,
            )
            result = firewall.build_carrier(
                source,
                carrier_path,
                config,
            )

            with Image.open(source) as src:
                src = src.convert("RGB")
                src_mean = ImageStat.Stat(src).mean
                src_left = ImageStat.Stat(
                    src.crop((0, 0, 128, 128))
                ).mean
                src_right = ImageStat.Stat(
                    src.crop((128, 0, 256, 128))
                ).mean

            with Image.open(carrier_path) as car:
                car = car.convert("RGB")
                car_mean = ImageStat.Stat(car).mean
                car_left = ImageStat.Stat(
                    car.crop((0, 0, 128, 128))
                ).mean
                car_right = ImageStat.Stat(
                    car.crop((128, 0, 256, 128))
                ).mean

            for a, b in zip(src_mean, car_mean):
                self.assertLess(abs(a - b), 3.0)

            source_split = sum(
                abs(a - b)
                for a, b in zip(src_left, src_right)
            )
            carrier_split = sum(
                abs(a - b)
                for a, b in zip(car_left, car_right)
            )
            self.assertLess(
                carrier_split,
                source_split * 0.35,
            )
            self.assertTrue(
                result["semanticLayoutDestroyed"]
            )
            self.assertTrue(
                result["localPixelEvidencePreserved"]
            )

    def test_same_descriptor_produces_same_carrier_bytes(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.png"
            first = root / "first.png"
            second = root / "second.png"

            image = Image.new(
                "RGB",
                (128, 128),
                (120, 80, 40),
            )
            image.save(source)

            config = firewall.descriptor(
                "d" * 64,
                tile_size=16,
                blur_radius=0.2,
            )
            firewall.build_carrier(source, first, config)
            firewall.build_carrier(source, second, config)

            self.assertEqual(
                first.read_bytes(),
                second.read_bytes(),
            )


if __name__ == "__main__":
    unittest.main()
