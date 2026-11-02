import { loadWorld, getRoom } from "./world.js";
import { loadState, saveState } from "./state.js";
import { performAction } from "./actions.js";
import { render } from "./renderer.js";

async function ignite() {
  const world = await loadWorld();
  let state = loadState(world);
  let message = getRoom(world, state.location).description;

  const dispatch = (verb, target = null) => {
    const outcome = performAction({
      verb,
      target,
      state,
      world
    });

    state = outcome.state;
    message = outcome.message;
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
    '<p class="room-description">Serve this repository over HTTP so the world files can be read. The house is intact; the doorway simply needs a proper threshold.</p>',
    '</main>'
  ].join("");
});
