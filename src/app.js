import { loadWorld, getRoom } from "./world.js";
import { loadState, saveState } from "./state.js";
import { performAction } from "./actions.js";
import { render } from "./renderer.js";
import { buildContextPacket } from "./memory/context.js";
import { beginSession, touchSession } from "./time/chronos.js";
import { buildOrientation } from "./time/orientation.js";
import { advanceEntities } from "./entities/behavior.js";
import { buildEcologyPacket } from "./entities/ecology.js";

async function ignite() {
  const world = await loadWorld();
  let state = loadState(world);
  beginSession(state);
  advanceEntities({ state, world });
  let message = getRoom(world, state, state.location).description;

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
      })
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
