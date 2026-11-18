#!/usr/bin/env python3
"""Integrity test for Velastra Atelier 0003 Eye / Hand Loop."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parent
SCENES = ROOT / "scenes"


def load(name: str):
    return json.loads((SCENES / name).read_text(encoding="utf-8"))


scene = load("hearth.scene.json")
layout = load("hearth.layout.json")
workflow = load("hearth.workflow.0003.json")
rough = load("hearth.rough-key.0003.json")

assert workflow["protocol"] == "velastra.atelier.eye_hand.v1"
assert rough["protocol"] == "velastra.atelier.raster.v1"
assert rough["scene"] == scene["id"]

stages = workflow["stages"]
assert len(stages) == 7
assert stages[0]["id"] == "01_layout"
assert stages[0]["status"] == "frozen"
assert stages[1]["id"] == "02_rough_key"
assert stages[1]["status"] == "active"
assert stages[1]["reviewRequired"] is True
assert all(stage["status"] == "blocked" for stage in stages[2:])
assert workflow["laws"]["laterStagesCannotBePreAuthoredBeforeRequiredReview"] is True
assert workflow["laws"]["nextStageRequiresObservation"] is True

layers = {layer["id"] for layer in scene["layers"]}
regions = set(layout["regions"])
objects = {obj["id"]: obj for obj in scene["fixedObjects"]}
event_ids = set()

for event in rough["events"]:
    assert event["id"] not in event_ids, f"duplicate event id: {event['id']}"
    event_ids.add(event["id"])
    assert event["layer"] in layers, f"unknown layer: {event['layer']}"
    if event.get("region"):
        assert event["region"] in regions, f"unknown region: {event['region']}"
    if event.get("clipRegion"):
        assert event["clipRegion"] in regions, f"unknown clipRegion: {event['clipRegion']}"
    if event.get("objectId"):
        assert event["objectId"] in objects, f"unknown object: {event['objectId']}"

# Fixed forms must emerge through paint in Rough Key, not filled silhouettes.
for event in rough["events"]:
    if event["op"] == "regionFill":
        assert event.get("region") not in {"fire", "cushion", "threshold"}, (
            f"rough key illegally fills authored form region: {event.get('region')}"
        )

assert any(e.get("objectId") == "fire" for e in rough["events"])
assert any(e.get("objectId") == "cushion" for e in rough["events"])
assert all(obj["count"] == 1 for obj in objects.values())

active_review = workflow["activeReview"]
assert active_review["stage"] == "02_rough_key"
assert active_review["id"] == stages[1]["observationId"]
assert len(active_review["questions"]) >= 6

print("Atelier 0003 eye / hand loop: PASS")
print(f"stages:          {len(stages)}")
print(f"roughKeyEvents:  {len(rough['events'])}")
print(f"reviewQuestions: {len(active_review['questions'])}")
print("laterStages:     blocked")
print("fixed forms:     stroke-built, not region-filled")
print("scene/layout:    frozen from 0001")
