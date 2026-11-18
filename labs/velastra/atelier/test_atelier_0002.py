#!/usr/bin/env python3
"""Integrity test for Velastra Atelier 0002 Painterly Passes."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parent
SCENES = ROOT / "scenes"
PROTOCOL = "velastra.atelier.raster.v1"


def load(name: str):
    return json.loads((SCENES / name).read_text(encoding="utf-8"))


scene = load("hearth.scene.json")
layout = load("hearth.layout.json")
base = load("hearth.events.json")
events = load("hearth.events.0002.json")

assert scene["protocol"] == PROTOCOL
assert layout["protocol"] == PROTOCOL
assert base["protocol"] == PROTOCOL
assert events["protocol"] == PROTOCOL
assert events["scene"] == scene["id"]
assert events["pass"] == "0002"

layers = {layer["id"] for layer in scene["layers"]}
regions = set(layout["regions"])
objects = {obj["id"]: obj for obj in scene["fixedObjects"]}
ids = set()

for event in events["events"]:
    assert event["id"] not in ids, f"duplicate event id: {event['id']}"
    ids.add(event["id"])
    assert event["layer"] in layers, f"unknown layer: {event['layer']}"
    if event.get("region"):
        assert event["region"] in regions, f"unknown region: {event['region']}"
    if event.get("clipRegion"):
        assert event["clipRegion"] in regions, f"unknown clipRegion: {event['clipRegion']}"
    if event.get("objectId"):
        assert event["objectId"] in objects, f"unknown object: {event['objectId']}"

assert len(objects) == 2
assert objects["fire"]["count"] == 1
assert objects["cushion"]["count"] == 1

bristle = [
    event for event in events["events"]
    if event.get("texture") == "bristle"
    or (event.get("brush") or {}).get("texture") == "bristle"
]
wet = [
    event for event in bristle
    if event.get("wetness", (event.get("brush") or {}).get("wetness", 0)) >= 0.38
]
dry = [
    event for event in bristle
    if event.get("wetness", (event.get("brush") or {}).get("wetness", 1)) <= 0.06
]
edge = [event for event in events["events"] if event["op"] == "regionEdge"]

assert len(events["events"]) > len(base["events"])
assert len(bristle) >= 20
assert len(wet) >= 2
assert len(dry) >= 6
assert {event["region"] for event in edge} >= {"fire", "cushion", "threshold"}

print("Atelier 0002 painterly passes: PASS")
print(f"baselineEvents: {len(base['events'])}")
print(f"events:         {len(events['events'])}")
print(f"bristle:        {len(bristle)}")
print(f"wet:            {len(wet)}")
print(f"dry:            {len(dry)}")
print(f"regionEdge:     {len(edge)}")
print("scene/layout:   frozen from 0001")
