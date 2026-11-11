import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("visual_place_memory.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_visual_place_memory_test",
    MODULE_PATH,
)
visual = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(visual)


class VisualPlaceMemoryTests(unittest.TestCase):
    def test_pair_is_deterministic_and_condition_bound(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "first.png"
            second = root / "second.png"

            image_a = Image.new("RGB", (192, 192))
            image_b = Image.new("RGB", (192, 192))
            pixels_a = image_a.load()
            pixels_b = image_b.load()
            for y in range(192):
                for x in range(192):
                    pixels_a[x, y] = (
                        180 if x < 96 else 30,
                        70 if y < 96 else 140,
                        45,
                    )
                    pixels_b[x, y] = (
                        40,
                        160 if x < 96 else 60,
                        190 if y < 96 else 55,
                    )
            image_a.save(first)
            image_b.save(second)

            sources = [
                {
                    "id": "a",
                    "title": "A",
                    "path": first,
                    "pathRelative": "first.png",
                    "sha256": visual.sha256_file(first),
                },
                {
                    "id": "b",
                    "title": "B",
                    "path": second,
                    "pathRelative": "second.png",
                    "sha256": visual.sha256_file(second),
                },
            ]
            config = {
                "width": 384,
                "height": 192,
                "microTileSize": 32,
                "neighborhoodSize": 96,
                "blurRadius": 0.2,
                "controlAlgorithm": "micro_scrub_v1",
                "experimentalAlgorithm": "neighborhood_quilt_v1",
            }

            pair_one = visual.build_pair(
                sources=sources,
                output_dir=root / "one",
                config=config,
            )
            pair_two = visual.build_pair(
                sources=sources,
                output_dir=root / "two",
                config=config,
            )

            self.assertEqual(pair_one["pairId"], pair_two["pairId"])
            self.assertEqual(
                pair_one["corpusPixelSha256"],
                pair_two["corpusPixelSha256"],
            )
            self.assertEqual(
                pair_one["conditions"]["micro_scrub_control"]["carrierSha256"],
                pair_two["conditions"]["micro_scrub_control"]["carrierSha256"],
            )
            self.assertEqual(
                pair_one["conditions"]["visual_place_memory"]["carrierSha256"],
                pair_two["conditions"]["visual_place_memory"]["carrierSha256"],
            )
            self.assertNotEqual(
                pair_one["conditions"]["micro_scrub_control"]["carrierSha256"],
                pair_one["conditions"]["visual_place_memory"]["carrierSha256"],
            )

    def test_memory_preserves_more_local_adjacency_than_control(self):
        from PIL import Image, ImageStat

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.png"

            image = Image.new("RGB", (384, 192))
            pixels = image.load()
            for y in range(192):
                for x in range(384):
                    block_x = (x // 96) % 4
                    block_y = (y // 96) % 2
                    pixels[x, y] = (
                        40 + block_x * 45,
                        40 + block_y * 120,
                        180 - block_x * 30,
                    )
            image.save(source)

            sources = [{
                "id": "source",
                "title": "Source",
                "path": source,
                "pathRelative": "source.png",
                "sha256": visual.sha256_file(source),
            }]
            config = {
                "width": 384,
                "height": 192,
                "microTileSize": 32,
                "neighborhoodSize": 96,
                "blurRadius": 0.0,
            }
            pair = visual.build_pair(
                sources=sources,
                output_dir=root / "pair",
                config=config,
            )

            with Image.open(
                pair["conditions"]["micro_scrub_control"]["path"]
            ) as control:
                control = control.convert("RGB")
                control_blocks = [
                    ImageStat.Stat(
                        control.crop((x, y, x + 96, y + 96))
                    ).mean
                    for y in (0, 96)
                    for x in (0, 96, 192, 288)
                ]

            with Image.open(
                pair["conditions"]["visual_place_memory"]["path"]
            ) as memory:
                memory = memory.convert("RGB")
                memory_blocks = [
                    ImageStat.Stat(
                        memory.crop((x, y, x + 96, y + 96))
                    ).mean
                    for y in (0, 96)
                    for x in (0, 96, 192, 288)
                ]

            def spread(blocks):
                return sum(
                    abs(channel - 96)
                    for block in blocks
                    for channel in block
                )

            self.assertGreater(
                spread(memory_blocks),
                spread(control_blocks),
            )
            self.assertFalse(
                pair["conditions"]["micro_scrub_control"][
                    "mesoSpatialAdjacencyPreserved"
                ]
            )
            self.assertTrue(
                pair["conditions"]["visual_place_memory"][
                    "mesoSpatialAdjacencyPreserved"
                ]
            )

    def test_profile_config_rejects_non_divisible_geometry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            registry = root / "places.json"
            registry.write_text(
                """{
                  "profiles": {
                    "test": {
                      "visualMemory": {
                        "sourceWitnessIds": ["a"],
                        "carrier": {
                          "width": 385,
                          "height": 192,
                          "microTileSize": 32,
                          "neighborhoodSize": 96
                        }
                      }
                    }
                  }
                }""",
                encoding="utf-8",
            )
            with self.assertRaises(visual.VisualPlaceMemoryError):
                visual.profile_visual_config(
                    place_registry_path=registry,
                    profile_id="test",
                )


if __name__ == "__main__":
    unittest.main()
