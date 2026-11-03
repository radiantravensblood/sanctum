import { getRoom } from "../world.js";
import {
  getEntityRecord,
  getEntityTemplate
} from "./entities.js";

export function buildEcologyPacket({
  state,
  world,
  roomId = state.location
}) {
  const recentEvents = (state.ledger || [])
    .filter((event) => String(event.action || "").startsWith("entity_"))
    .slice(-28);

  const inhabitants = (world.entities.entities || []).map((template) => {
    const record = getEntityRecord(state, template.id);

    return {
      id: template.id,
      name: template.name,
      kind: template.kind,
      location: record
        ? describeRoom(world, state, record.location)
        : null,
      status: record && record.status,
      focus: record && record.focus,
      lastActedAt: record && record.lastActedAt,
      lastMovedAt: record && record.lastMovedAt,
      lastObservedAt: record && record.lastObservedAt,
      relations: record ? record.relations || {} : {},
      recentHistory: record
        ? (record.history || []).slice(-12)
        : []
    };
  });

  return {
    version: 1,
    laws: { ...(world.entities.laws || {}) },
    currentRoom: describeRoom(world, state, roomId),
    localInhabitants: inhabitants.filter(
      (entity) => entity.location && entity.location.id === roomId
    ),
    inhabitants,
    storyResidue: recentEvents.map((event) =>
      normalizeEvent(event, world, state)
    )
  };
}

function normalizeEvent(event, world, state) {
  const entity = event.entity
    ? getEntityTemplate(world, event.entity)
    : null;
  const other = event.otherEntity
    ? getEntityTemplate(world, event.otherEntity)
    : null;

  return {
    at: event.at,
    action: event.action,
    entity: entity
      ? { id: entity.id, name: entity.name }
      : event.entity || null,
    otherEntity: other
      ? { id: other.id, name: other.name }
      : event.otherEntity || null,
    room: event.room
      ? describeRoom(world, state, event.room)
      : null,
    from: event.from
      ? describeRoom(world, state, event.from)
      : null,
    to: event.to
      ? describeRoom(world, state, event.to)
      : null,
    object: event.object || null,
    reason: event.reason || null
  };
}

function describeRoom(world, state, roomId) {
  if (!roomId) return null;
  const room = getRoom(world, state, roomId, { fallback: false });

  return {
    id: roomId,
    name: room ? room.name : null
  };
}
