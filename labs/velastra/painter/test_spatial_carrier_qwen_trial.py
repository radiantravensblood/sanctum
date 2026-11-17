import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("spatial_carrier_qwen_trial.py")
SPEC = importlib.util.spec_from_file_location(
    "velastra_spatial_carrier_qwen_trial_test", MODULE_PATH
)
trial = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(trial)


class SpatialCarrierQwenTrialTests(unittest.TestCase):
    def test_execution_order_is_s_d_s_d(self):
        self.assertEqual(
            [
                trial.attempt_id("structured", 1),
                *[
                    trial.attempt_id(condition, repeat)
                    for condition, repeat in trial.EXECUTION_ORDER
                ],
            ],
            [
                "hearth-spatial-carrier-0042-structured-r01",
                "hearth-spatial-carrier-0042-destroyed-r01",
                "hearth-spatial-carrier-0042-structured-r02",
                "hearth-spatial-carrier-0042-destroyed-r02",
            ],
        )

    def test_only_three_new_requests_are_planned(self):
        self.assertEqual(len(trial.EXECUTION_ORDER), 3)

    def test_prompt_is_exact_probe_prompt(self):
        self.assertEqual(trial.PROMPT, trial.probe.PROMPT)


if __name__ == "__main__":
    unittest.main()
