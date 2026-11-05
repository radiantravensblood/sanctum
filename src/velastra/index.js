import { buildExpressionContext } from "./context.js";
import {
  composeMeaning,
  composeVisualIntent,
  evaluateExemplars
} from "./compose.js";
import { applySanctumIntent } from "./sanctum.js";
import { composeScenePacket, evaluateSceneExemplars } from "./scene-packet.js";
import { selectMotifs, evaluateMotifExemplars } from "./motifs.js";
import { compileAtelierManifest, evaluateAtelierExemplars } from "./atelier.js";
import { compileVirynismHand } from "./hand.js";
import { compilePainterlyTruth } from "./painterly-truth.js";
import { compileVisibleEvidence } from "./evidence.js";
import { compileVisualWitness } from "./witness.js";
import { compileHandprint } from "./handprint.js";
import { compileGrip } from "./grip.js";
import { composeStudioSurface, composeStudioDocument, evaluateStudioExemplars } from "./studio.js";

export function buildVelastraPacket({
  state,
  world,
  roomId = state.location,
  role = "place",
  family = "sanctum",
  now = new Date(),
  overrides = {},
  apply = false
}) {
  const context = buildExpressionContext({
    state,
    world,
    roomId,
    role,
    now,
    overrides
  });

  const intent = composeVisualIntent({
    grammar: world.velastra,
    context,
    family
  });

  const adapter = apply
    ? applySanctumIntent({ intent })
    : null;

  return {
    version: 1,
    engine: "Velastra",
    laboratory: "Viryn Labs",
    context,
    intent,
    adapter
  };
}

export function composeVelastraMeaning({
  world,
  meaning,
  family = "sanctum"
}) {
  return composeMeaning({
    grammar: world.velastra,
    meaning,
    family
  });
}

export function testVelastraExemplars(world) {
  return evaluateExemplars(world.velastra);
}

export function composeVelastraScene({
  world,
  meaning = {},
  family = "sanctum",
  archetype = null,
  subjects = [],
  relation = null,
  environment = null,
  seed = "velastra-scene",
  provenance = {}
}) {
  const visualIntent = composeMeaning({
    grammar: world.velastra,
    meaning,
    family
  });

  return composeScenePacket({
    sceneGrammar: world.velastraScene,
    visualIntent,
    archetype,
    subjects,
    relation,
    environment,
    seed,
    provenance
  });
}

export function testVelastraSceneExemplars(world) {
  return evaluateSceneExemplars({
    sceneGrammar: world.velastraScene,
    composeVisualIntent: (meaning, family) =>
      composeMeaning({
        grammar: world.velastra,
        meaning,
        family
      })
  });
}

export function composeVelastraMotifs({
  world,
  scene = {},
  limit = 7,
  seed = "velastra-motifs"
}) {
  const scenePacket = composeVelastraScene({
    world,
    ...scene
  });

  return {
    scene: scenePacket,
    selection: selectMotifs({
      atlas: world.velastraMotifs,
      scenePacket,
      limit,
      seed
    })
  };
}

export function testVelastraMotifExemplars(world) {
  const scenePackets = Object.fromEntries(
    Object.entries(world.velastraScene.exemplars || {}).map(
      ([id, exemplar]) => [
        id,
        composeVelastraScene({
          world,
          meaning: exemplar.meaning || {},
          family: exemplar.family || "sanctum",
          archetype: exemplar.archetype,
          subjects: exemplar.subjects || [],
          relation: exemplar.relation || null,
          environment: exemplar.environment || null,
          seed: "motif-test-scene:" + id,
          provenance: {
            source: "motif_exemplar_scene",
            exemplar: id
          }
        })
      ]
    )
  );

  return evaluateMotifExemplars({
    atlas: world.velastraMotifs,
    scenePackets
  });
}

export function compileVelastraAtelier({
  world,
  scene = {},
  limit = 7,
  seed = "velastra-atelier"
}) {
  const composed = composeVelastraMotifs({
    world,
    scene,
    limit,
    seed: seed + ":motifs"
  });

  return {
    scene: composed.scene,
    motifs: composed.selection,
    manifest: compileAtelierManifest({
      atelierGrammar: world.velastraAtelier,
      assetRegistry: world.velastraAssets,
      styleGrammar: world.velastraStyle,
      witnessGrammar: world.velastraWitnesses,
      handprintGrammar: world.velastraHandprint,
      gripGrammar: world.velastraGrip,
      scenePacket: composed.scene,
      motifSelection: composed.selection,
      seed
    })
  };
}

export function testVelastraAtelierExemplars(world) {
  const scenePackets = {};
  const motifSelections = {};

  Object.entries(world.velastraScene.exemplars || {}).forEach(
    ([id, exemplar]) => {
      const scenePacket = composeVelastraScene({
        world,
        meaning: exemplar.meaning || {},
        family: exemplar.family || "sanctum",
        archetype: exemplar.archetype,
        subjects: exemplar.subjects || [],
        relation: exemplar.relation || null,
        environment: exemplar.environment || null,
        seed: "atelier-test-scene:" + id,
        provenance: {
          source: "atelier_exemplar_scene",
          exemplar: id
        }
      });

      scenePackets[id] = scenePacket;
      motifSelections[id] = selectMotifs({
        atlas: world.velastraMotifs,
        scenePacket,
        limit: 8,
        seed: "atelier-test-motif:" + id
      });
    }
  );

  return evaluateAtelierExemplars({
    atelierGrammar: world.velastraAtelier,
    assetRegistry: world.velastraAssets,
    styleGrammar: world.velastraStyle,
    witnessGrammar: world.velastraWitnesses,
    handprintGrammar: world.velastraHandprint,
    gripGrammar: world.velastraGrip,
    scenePackets,
    motifSelections
  });
}

export function composeVelastraStudioSurface({
  world,
  surfaceId,
  frameworkId = null
}) {
  return composeStudioSurface({
    grammar: world.velastra,
    studioGrammar: world.velastraStudio,
    surfaceId,
    frameworkId
  });
}

export function composeVelastraStudioDocument(world) {
  return composeStudioDocument({
    grammar: world.velastra,
    studioGrammar: world.velastraStudio
  });
}

export function testVelastraStudioExemplars(world) {
  return evaluateStudioExemplars({
    grammar: world.velastra,
    studioGrammar: world.velastraStudio
  });
}

export {
  applySanctumIntent,
  composeScenePacket,
  selectMotifs,
  compileAtelierManifest,
  compileVirynismHand,
  compilePainterlyTruth,
  compileVisibleEvidence,
  compileVisualWitness,
  compileHandprint,
  compileGrip,
  composeStudioSurface,
  composeStudioDocument
};
