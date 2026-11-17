#!/usr/bin/env python3
"""Dependency-free integrity test for Velastra Atelier 0001 authored bundle."""

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
events = load("hearth.events.json")

assert scene["protocol"] == PROTOCOL
assert layout["protocol"] == PROTOCOL
assert events["protocol"] == PROTOCOL

layers = {layer["id"] for layer in scene["layers"]}
regions = set(layout["regions"])
objects = {obj["id"]: obj for obj in scene["fixedObjects"]}
event_ids = set()
object_event_counts = {key: 0 for key in objects}

for event in events["events"]:
    assert event["id"] not in event_ids, f"duplicate event id: {event['id']}"
    event_ids.add(event["id"])
    assert event["layer"] in layers, f"unknown layer: {event['layer']}"
    if event.get("region"):
        assert event["region"] in regions, f"unknown region: {event['region']}"
    if event.get("clipRegion"):
        assert event["clipRegion"] in regions, f"unknown clipRegion: {event['clipRegion']}"
    if event.get("objectId"):
        oid = event["objectId"]
        assert oid in objects, f"unknown object: {oid}"
        object_event_counts[oid] += 1

assert len(objects) == 2
assert objects["fire"]["count"] == 1
assert objects["cushion"]["count"] == 1
assert object_event_counts["fire"] > 0
assert object_event_counts["cushion"] > 0

truth = "\n".join(scene["truth"]).lower()
assert "subordinate to the room" in truth
assert "exactly one velvet cushion" in truth
assert "no chairs" in truth

assert "without throne grammar" in layout["regions"]["cushion"]["purpose"]

print("Atelier 0001 core: PASS")
print(f"layers:        {len(layers)}")
print(f"regions:       {len(regions)}")
print(f"fixedObjects:  {len(objects)}")
print(f"events:        {len(events['events'])}")
