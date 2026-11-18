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
eye_response = load_scene("hearth.eye-response-0001.0003.json")

rough_observation = load_observation("hearth-0003-rough-key-review.json")
rough_resolution = load_observation("hearth-0003-rough-key-resolution.json")
breakdown_checkpoint = load_observation("hearth-0003-breakdown-eye-checkpoint.json")
eye_decision = load_observation("hearth-0003-eye-response-0001-decision.json")

assert workflow["protocol"] == "velastra.atelier.eye_hand.v1"
assert rough["protocol"] == "velastra.atelier.raster.v1"
assert breakdown["protocol"] == "velastra.atelier.raster.v1"
assert eye_response["protocol"] == "velastra.atelier.raster.v1"

for packet in (rough, breakdown, eye_response):
    assert packet["scene"] == scene["id"]

stages = workflow["stages"]
assert len(stages) == 8

layout_stage = stages[0]
rough_stage = next(stage for stage in stages if stage["id"] == "02_rough_key")
breakdown_stage = next(stage for stage in stages if stage["id"] == "03_breakdown")
eye_stage = next(stage for stage in stages if stage["id"] == "03_eye_response_0001")
second_key_stage = next(stage for stage in stages if stage["id"] == "04_second_key")

assert layout_stage["id"] == "01_layout"
assert layout_stage["status"] == "frozen"

assert rough_stage["status"] == "reviewed"
assert rough_stage["reviewRequired"] is True
assert rough_stage["reviewResolution"] == "../observations/hearth-0003-rough-key-resolution.json"

assert breakdown_stage["status"] == "reviewed"
assert breakdown_stage["reviewKind"] == "eyes"
assert breakdown_stage["reviewEvidence"] == "../observations/hearth-0003-breakdown-eye-checkpoint.json"
assert breakdown_stage["reviewDecision"] == "../observations/hearth-0003-eye-response-0001-decision.json"

assert eye_stage["status"] == "active"
assert eye_stage["source"] == "hearth.eye-response-0001.0003.json"
assert eye_stage["reviewRequired"] is True
assert eye_stage["observationId"] == "hearth-0003-eye-response-0001-review"

assert second_key_stage["status"] == "blocked"
assert second_key_stage["blockedBy"] == "hearth-0003-eye-response-0001-review"
assert all(stage["status"] == "blocked" for stage in stages[4:])

assert workflow["laws"]["laterStagesCannotBePreAuthoredBeforeRequiredReview"] is True
assert workflow["laws"]["nextStageRequiresObservation"] is True

assert rough_observation["review"] == "hearth-0003-rough-key-review"
assert rough_resolution["decision"] == "approved_advance"

assert breakdown_checkpoint["protocol"] == "velastra.atelier.eye.v1"
assert breakdown_checkpoint["stage"] == "03_breakdown"
assert breakdown_checkpoint["checkpointId"] == "hearth-eye-hand-0003--03_breakdown--cdba00c7"

assert eye_decision["protocol"] == "velastra.atelier.eye-decision.v1"
assert eye_decision["decision"] == "insert_eye_response_before_second_key"
assert eye_decision["experiment"]["maxMarks"] == 8

assert len(eye_response["events"]) == 8, "Eye Response 0001 must stay at eight marks"

layers = {layer["id"] for layer in scene["layers"]}
regions = set(layout["regions"])
objects = {obj["id"]: obj for obj in scene["fixedObjects"]}
event_ids = set()

for packet_name, packet in (
    ("rough", rough),
    ("breakdown", breakdown),
    ("eye_response", eye_response),
):
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

        if event["op"] == "regionFill":
            assert event.get("region") not in {"fire", "cushion", "threshold"}, (
                f"{packet_name} illegally fills authored form region: {event.get('region')}"
            )

# Eye Response is a spatial-hinge experiment only.
for event in eye_response["events"]:
    assert event.get("objectId") not in {"fire", "cushion"}
    assert event.get("region") not in {"fire", "cushion"}
    assert event.get("clipRegion") not in {"fire", "cushion"}

assert any(e.get("objectId") == "fire" for e in rough["events"])
assert any(e.get("objectId") == "cushion" for e in rough["events"])
assert any(e.get("objectId") == "cushion" for e in breakdown["events"])
assert all(obj["count"] == 1 for obj in objects.values())

active_review = workflow["activeReview"]
assert active_review["stage"] == "03_eye_response_0001"
assert active_review["id"] == eye_stage["observationId"]
assert len(active_review["questions"]) == 7

cumulative = len(rough["events"]) + len(breakdown["events"]) + len(eye_response["events"])

print("Atelier 0003 eye / hand loop: PASS")
print(f"stages:             {len(stages)}")
print(f"roughKeyEvents:     {len(rough['events'])}")
print(f"breakdownEvents:    {len(breakdown['events'])}")
print(f"eyeResponseEvents:  {len(eye_response['events'])}")
print(f"cumulativeEvents:   {cumulative}")
print(f"reviewQuestions:    {len(active_review['questions'])}")
print("roughKey:           reviewed · witnessed")
print("breakdown:          reviewed · eyes")
print("eyeResponse0001:    active")
print("secondKey+:         blocked")
print("eyeResponse scope:  wall / floor / threshold only")
print("scene/layout:       frozen from 0001")
