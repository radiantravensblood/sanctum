#!/usr/bin/env python3
"""Integrity test for Velastra Atelier 0003 Eye / Hand Loop."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parent
SCENES = ROOT / "scenes"
OBSERVATIONS = ROOT / "observations"


def load_scene(name: str):
    return json.loads((SCENES / name).read_text(encoding="utf-8"))


def load_observation(name: str):
    return json.loads((OBSERVATIONS / name).read_text(encoding="utf-8"))


scene = load_scene("hearth.scene.json")
layout = load_scene("hearth.layout.json")
workflow = load_scene("hearth.workflow.0003.json")
rough = load_scene("hearth.rough-key.0003.json")
breakdown = load_scene("hearth.breakdown.0003.json")
observation = load_observation("hearth-0003-rough-key-review.json")
resolution = load_observation("hearth-0003-rough-key-resolution.json")

assert workflow["protocol"] == "velastra.atelier.eye_hand.v1"
assert rough["protocol"] == "velastra.atelier.raster.v1"
assert breakdown["protocol"] == "velastra.atelier.raster.v1"
assert rough["scene"] == scene["id"]
assert breakdown["scene"] == scene["id"]

stages = workflow["stages"]
assert len(stages) == 7
assert stages[0]["id"] == "01_layout"
assert stages[0]["status"] == "frozen"

rough_stage = stages[1]
breakdown_stage = stages[2]

assert rough_stage["id"] == "02_rough_key"
assert rough_stage["status"] == "reviewed"
assert rough_stage["reviewRequired"] is True
assert rough_stage["reviewResolution"] == "../observations/hearth-0003-rough-key-resolution.json"

assert breakdown_stage["id"] == "03_breakdown"
assert breakdown_stage["status"] == "active"
assert breakdown_stage["source"] == "hearth.breakdown.0003.json"
assert breakdown_stage["reviewRequired"] is True
assert breakdown_stage["observationId"] == "hearth-0003-breakdown-review"

assert all(stage["status"] == "blocked" for stage in stages[3:])
assert workflow["laws"]["laterStagesCannotBePreAuthoredBeforeRequiredReview"] is True
assert workflow["laws"]["nextStageRequiresObservation"] is True

assert observation["review"] == "hearth-0003-rough-key-review"
assert observation["stage"] == "02_rough_key"
assert observation["authoredEvents"] == len(rough["events"])
assert "we need to establish a truly lived in space." in observation["notes"]

assert resolution["review"] == observation["review"]
assert resolution["decision"] == "approved_advance"
assert resolution["nextStage"] == "03_breakdown"
assert resolution["primaryNeed"] == "establish a truly lived in space"

layers = {layer["id"] for layer in scene["layers"]}
regions = set(layout["regions"])
objects = {obj["id"]: obj for obj in scene["fixedObjects"]}
event_ids = set()

for packet_name, packet in (("rough", rough), ("breakdown", breakdown)):
    for event in packet["events"]:
        assert event["id"] not in event_ids, f"duplicate event id across stages: {event['id']}"
        event_ids.add(event["id"])
        assert event["layer"] in layers, f"unknown layer: {event['layer']}"
        if event.get("region"):
            assert event["region"] in regions, f"unknown region: {event['region']}"
        if event.get("clipRegion"):
            assert event["clipRegion"] in regions, f"unknown clipRegion: {event['clipRegion']}"
        if event.get("objectId"):
            assert event["objectId"] in objects, f"unknown object: {event['objectId']}"

        # Fixed forms must remain paint-built through Breakdown.
        if event["op"] == "regionFill":
            assert event.get("region") not in {"fire", "cushion", "threshold"}, (
                f"{packet_name} illegally fills authored form region: {event.get('region')}"
            )

assert any(e.get("objectId") == "fire" for e in rough["events"])
assert any(e.get("objectId") == "cushion" for e in rough["events"])
assert any(e.get("objectId") == "cushion" for e in breakdown["events"])
assert all(obj["count"] == 1 for obj in objects.values())

active_review = workflow["activeReview"]
assert active_review["stage"] == "03_breakdown"
assert active_review["id"] == breakdown_stage["observationId"]
assert len(active_review["questions"]) >= 6

print("Atelier 0003 eye / hand loop: PASS")
print(f"stages:             {len(stages)}")
print(f"roughKeyEvents:     {len(rough['events'])}")
print(f"breakdownEvents:    {len(breakdown['events'])}")
print(f"cumulativeEvents:   {len(rough['events']) + len(breakdown['events'])}")
print(f"reviewQuestions:    {len(active_review['questions'])}")
print("roughKey:           reviewed")
print("breakdown:          active")
print("laterStages:        blocked")
print("fixed forms:        stroke-built, not region-filled")
print("scene/layout:       frozen from 0001")
