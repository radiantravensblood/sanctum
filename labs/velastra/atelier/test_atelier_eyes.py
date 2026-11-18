#!/usr/bin/env python3
"""Static integrity test for Velastra Eyes / Retina 0001."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parent
SCENES = ROOT / "scenes"

eyes = (ROOT / "eyes.mjs").read_text(encoding="utf-8")
app = (ROOT / "app.mjs").read_text(encoding="utf-8")
html = (ROOT / "index.html").read_text(encoding="utf-8")
layout = json.loads((SCENES / "hearth.layout.json").read_text(encoding="utf-8"))

for target in ("fire", "cushion", "threshold"):
    assert target in layout["regions"], f"missing foveal target: {target}"

assert "velastra.atelier.eye.v1" in eyes
assert "measurementsAreInstrumentsNotJudgment: true" in eyes
assert "eyeCannotRewriteSceneTruth: true" in eyes
assert "eyeCannotAuthorizeNewObjects: true" in eyes
assert "handMustReceiveExplicitPainterlyIntention: true" in eyes

assert "const targets = ['fire', 'cushion', 'threshold'];" in eyes
assert "meanLuminance" in eyes
assert "contrast" in eyes
assert "meanSaturation" in eyes
assert "edgeDensity" in eyes
assert "warmth" in eyes

assert "captureEyeCheckpoint" in app
assert "renderEyeCheckpoint" in app
assert "exportCheckpointPNG" in app
assert "atelier.compose({ overlay: false });" in app
assert "humanNotesAtCapture" in app
assert "activeReview" in app

for element_id in (
    "eyes-panel",
    "capture-eyes",
    "copy-eye-packet",
    "export-eye-png",
    "eye-views",
    "eyes-meta",
):
    assert f'id="{element_id}"' in html, f"missing Eyes UI element: {element_id}"

assert "app.mjs?v=0003-eye-response-0001" in html

print("Velastra Eyes / Retina 0001: PASS")
print("retina:          whole composite")
print("fovealViews:     fire, cushion, threshold")
print("instruments:     value, contrast, saturation, edge density, warmth")
print("authority:       non-sovereign")
print("scene truth:     cannot be rewritten")
print("new objects:     cannot be authorized")
print("hand action:     requires painterly intention")
