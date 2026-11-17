import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("archive_spatial_carrier_0042.py")
SPEC = importlib.util.spec_from_file_location(
    "archive_spatial_carrier_0042_test", MODULE_PATH
)
archive = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(archive)


class Archive0042Tests(unittest.TestCase):
    def test_results_directory_is_under_0042_artifacts(self):
        self.assertEqual(
            archive.RESULTS_DIR.parent.name,
            "hearth-spatial-carrier-0042",
        )

    def test_probe_records_are_distinct(self):
        self.assertNotEqual(
            archive.QWEN_PROBE_RECORD,
            archive.ZIMAGE_PROBE_RECORD,
        )

    def test_trial_record_name_is_0042(self):
        self.assertEqual(
            archive.TRIAL_RECORD.name,
            "hearth-spatial-carrier-0042.json",
        )


if __name__ == "__main__":
    unittest.main()
