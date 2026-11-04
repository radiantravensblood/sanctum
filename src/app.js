import { loadWorld, getRoom } from "./world.js";
import { loadState, saveState } from "./state.js";
import { performAction } from "./actions.js";
import { render } from "./renderer.js";
import { buildContextPacket } from "./memory/context.js";
import { beginSession, touchSession } from "./time/chronos.js";
import { buildOrientation } from "./time/orientation.js";
import { advanceEntities } from "./entities/behavior.js";
import { buildEcologyPacket } from "./entities/ecology.js";
import { buildRelationPacket } from "./entities/relation.js";
import { buildAccordPacket, getAvailableAffordances, proposeInteraction } from "./interactions/accord.js";
import { buildHymnosPacket, getAvailableHymnosActs, performHymnosAct, endDuet } from "./hymnos/hymnos.js";
import { buildIdentityPacket } from "./hymnos/identity.js";
import { buildCrossRelationPacket } from "./hymnos/relation.js";
import { buildVelastraPacket, composeVelastraMeaning, testVelastraExemplars, composeVelastraScene, testVelastraSceneExemplars, composeVelastraMotifs, testVelastraMotifExemplars, compileVelastraAtelier, testVelastraAtelierExemplars, composeVelastraStudioSurface, composeVelastraStudioDocument, testVelastraStudioExemplars } from "./velastra/index.js";
import { buildCurrentSanctumPainting, composePaintingHandoff } from "./velastra/sanctum-painting.js";
import { downloadPaintingHandoff, installAtelierDock } from "./velastra/authoring.js";

async function ignite() {
  const world = await loadWorld();
  let state = loadState(world);
  beginSession(state);
  advanceEntities({ state, world });
  let message = getRoom(world, state, state.location).description;
  let atelierDock = null;

  const currentPainting = () =>
    buildCurrentSanctumPainting({
      state,
      world
    });

  const dispatch = (verb, target = null) => {
    const outcome = performAction({
      verb,
      target,
      state,
      world
    });

    state = outcome.state;
    message = outcome.message;
    touchSession(state);
    advanceEntities({ state, world });
    saveState(state);

    render({
      state,
      world,
      message,
      dispatch
    });

    if (atelierDock) {
      atelierDock.refresh();
    }
  };

  document.querySelectorAll("[data-fixed-verb]").forEach((button) => {
    button.addEventListener("click", () => {
      dispatch(button.dataset.fixedVerb);
    });
  });

  window.Sanctum = Object.freeze({
    context: () =>
      buildContextPacket({
        state,
        world,
        roomId: state.location
      }),
    orientation: () =>
      buildOrientation({
        state,
        world
      }),
    ecology: () =>
      buildEcologyPacket({
        state,
        world
      }),
    relations: () =>
      buildRelationPacket({
        state,
        world
      }),
    accord: (actorId = "siege") =>
      buildAccordPacket({
        state,
        world,
        actorId
      }),
    affordances: (targetId, actorId = "siege") =>
      getAvailableAffordances({
        state,
        world,
        actorId,
        targetId
      }),
    hymnos: (actorId = "siege") =>
      buildHymnosPacket({
        state,
        world,
        actorId
      }),
    hymnosActs: (targetId, actorId = "siege") =>
      getAvailableHymnosActs({
        state,
        world,
        actorId,
        targetId
      }),
    identity: (actorId) =>
      buildIdentityPacket({
        state,
        world,
        actorId
      }),
    crossRelations: () =>
      buildCrossRelationPacket({
        state,
        world
      }),
    velastra: ({
      roomId = state.location,
      role = roomId === "threshold" ? "threshold" : "place",
      family = "sanctum",
      overrides = {}
    } = {}) =>
      buildVelastraPacket({
        state,
        world,
        roomId,
        role,
        family,
        overrides,
        apply: false
      }),
    visualize: (
      meaning = {},
      family = "sanctum"
    ) =>
      composeVelastraMeaning({
        world,
        meaning,
        family
      }),
    velastraTests: () =>
      testVelastraExemplars(world),
    scene: (spec = {}) =>
      composeVelastraScene({
        world,
        ...spec
      }),
    sceneTests: () =>
      testVelastraSceneExemplars(world),
    motifs: (spec = {}) =>
      composeVelastraMotifs({
        world,
        ...spec
      }),
    motifTests: () =>
      testVelastraMotifExemplars(world),
    atelier: (spec = {}) =>
      compileVelastraAtelier({
        world,
        ...spec
      }),
    atelierTests: () =>
      testVelastraAtelierExemplars(world),
    paintingHandoff: () =>
      composePaintingHandoff(
        currentPainting()
      ),
    exportPainting: () =>
      downloadPaintingHandoff(
        currentPainting()
      ),
    brushes: () =>
      JSON.parse(
        JSON.stringify(world.velastraBrushes)
      ),
    style: () =>
      JSON.parse(
        JSON.stringify(world.velastraStyle)
      ),
    painterlyTruth: () =>
      JSON.parse(
        JSON.stringify(world.velastraPainterlyTruth)
      ),
    studio: (surfaceId, frameworkId = null) =>
      composeVelastraStudioSurface({
        world,
        surfaceId,
        frameworkId
      }),
    studioDocument: () =>
      composeVelastraStudioDocument(world),
    studioTests: () =>
      testVelastraStudioExemplars(world),
    sing: ({
      actorId = "siege",
      targetId,
      act
    } = {}) => {
      const outcome = performHymnosAct({
        state,
        world,
        actorId,
        targetId,
        act
      });

      message = outcome.message;
      touchSession(state);
      advanceEntities({ state, world });
      saveState(state);

      render({
        state,
        world,
        message,
        dispatch
      });

      return outcome;
    },
    releaseDuet: ({
      actorId = "siege",
      targetId
    } = {}) => {
      const outcome = endDuet({
        state,
        world,
        actorId,
        targetId
      });

      message = outcome.message;
      touchSession(state);
      saveState(state);

      render({
        state,
        world,
        message,
        dispatch
      });

      return outcome;
    },
    propose: ({
      actorId = "siege",
      targetId,
      affordance,
      objectId = null
    } = {}) => {
      const outcome = proposeInteraction({
        state,
        world,
        actorId,
        targetId,
        affordance,
        objectId
      });

      message = outcome.message;
      touchSession(state);
      advanceEntities({ state, world });
      saveState(state);

      render({
        state,
        world,
        message,
        dispatch
      });

      return outcome;
    }
  });

  window.Velastra = Object.freeze({
    compose: (
      meaning = {},
      family = "sanctum"
    ) =>
      composeVelastraMeaning({
        world,
        meaning,
        family
      }),
    exemplars: () =>
      testVelastraExemplars(world),
    scene: (spec = {}) =>
      composeVelastraScene({
        world,
        ...spec
      }),
    sceneExemplars: () =>
      testVelastraSceneExemplars(world),
    motifs: (spec = {}) =>
      composeVelastraMotifs({
        world,
        ...spec
      }),
    motifExemplars: () =>
      testVelastraMotifExemplars(world),
    atelier: (spec = {}) =>
      compileVelastraAtelier({
        world,
        ...spec
      }),
    atelierExemplars: () =>
      testVelastraAtelierExemplars(world),
    sanctumPainting: () =>
      composePaintingHandoff(
        currentPainting()
      ),
    exportSanctumPainting: () =>
      downloadPaintingHandoff(
        currentPainting()
      ),
    studio: (surfaceId, frameworkId = null) =>
      composeVelastraStudioSurface({
        world,
        surfaceId,
        frameworkId
      }),
    studioDocument: () =>
      composeVelastraStudioDocument(world),
    studioExemplars: () =>
      testVelastraStudioExemplars(world),
    grammar: () =>
      JSON.parse(JSON.stringify(world.velastra)),
    sceneGrammar: () =>
      JSON.parse(JSON.stringify(world.velastraScene)),
    motifAtlas: () =>
      JSON.parse(JSON.stringify(world.velastraMotifs)),
    atelierGrammar: () =>
      JSON.parse(JSON.stringify(world.velastraAtelier)),
    assetRegistry: () =>
      JSON.parse(JSON.stringify(world.velastraAssets)),
    brushes: () =>
      JSON.parse(JSON.stringify(world.velastraBrushes)),
    style: () =>
      JSON.parse(JSON.stringify(world.velastraStyle)),
    painterlyTruth: () =>
      JSON.parse(JSON.stringify(world.velastraPainterlyTruth)),
    studioGrammar: () =>
      JSON.parse(JSON.stringify(world.velastraStudio))
  });

  atelierDock = installAtelierDock({
    getPainting: currentPainting,
    brushCabinet: world.velastraBrushes
  });

  window.addEventListener("beforeunload", () => {
    touchSession(state);
    saveState(state);
  });

  window.setInterval(() => {
    if (document.visibilityState !== "visible") return;

    const changes = advanceEntities({
      state,
      world
    });

    if (changes.length) {
      saveState(state);
    }

    render({
      state,
      world,
      message,
      dispatch
    });

    if (atelierDock) {
      atelierDock.refresh();
    }
  }, 60000);

  saveState(state);

  render({
    state,
    world,
    message,
    dispatch
  });
}

ignite().catch((error) => {
  console.error(error);
  document.body.innerHTML = [
    '<main class="sanctum-shell">',
    '<p class="kicker">Threshold fault</p>',
    '<h1>The Sanctum could not ignite.</h1>',
    '<p class="room-description">The house is intact, but one of its laws could not be read.</p>',
    '</main>'
  ].join("");
});
