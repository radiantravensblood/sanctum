import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("structural_hearth_memory.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_structural_hearth_memory_test",
    MODULE_PATH,
)
structural = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(structural)


class StructuralHearthMemoryTests(unittest.TestCase):
    def _registry(self, root: Path) -> Path:
        path = root / "places.json"
        path.write_text(
            """{
              "profiles": {
                "test_hearth": {
                  "structuralMemory": {
                    "status": "experimental",
                    "nodes": [
                      {"id": "warmth", "role": "shared warmth"},
                      {"id": "threshold", "role": "easy return"}
                    ],
                    "relations": [
                      "distribute visual weight",
                      "keep circulation open"
                    ],
                    "painterFacing": {
                      "directives": [
                        "Build around several non-collinear centers of use.",
                        "Keep an open path through the room."
                      ]
                    },
                    "laws": {
                      "sceneTruthRemainsAuthoritative": true
                    }
                  }
                }
              }
            }""",
            encoding="utf-8",
        )
        return path

    def test_contract_is_deterministic_and_sealed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self._registry(root)
            first = structural.resolve_contract(
                registry_path=path,
                profile_id="test_hearth",
            )
            second = structural.resolve_contract(
                registry_path=path,
                profile_id="test_hearth",
            )
            self.assertEqual(
                first["structuralSha256"],
                second["structuralSha256"],
            )
            self.assertTrue(first["active"])

    def test_augmentation_preserves_original_bundle(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            contract = structural.resolve_contract(
                registry_path=self._registry(root),
                profile_id="test_hearth",
            )
            original = {
                "positive": "Authored room.",
                "negative": "",
                "budget": {"afterTokens": 10},
            }
            augmented = structural.augment_prompt_bundle(
                original,
                contract,
            )

            self.assertEqual(original["positive"], "Authored room.")
            self.assertNotEqual(
                augmented["positive"],
                original["positive"],
            )
            self.assertTrue(
                augmented["structuralMemory"]["active"]
            )
            self.assertIn(
                "Lived-space topology:",
                augmented["positive"],
            )

    def test_internal_labels_do_not_reach_painter_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            contract = structural.resolve_contract(
                registry_path=self._registry(root),
                profile_id="test_hearth",
            )
            section = structural.painter_section(contract)
            lowered = section.lower()
            self.assertNotIn("structural memory", lowered)
            self.assertNotIn("house freedom", lowered)
            self.assertNotIn("test_hearth", lowered)


if __name__ == "__main__":
    unittest.main()
