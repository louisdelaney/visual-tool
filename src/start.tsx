// Starts the app once main.tsx has settled the language: the stage's input handling, the
// addresses, and the React app.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Core } from "./core";
import { initStage } from "./stage/stage";
import { initPause } from "./stage/pause";
import { initRouting } from "./app/flow";
import { LANGUAGE } from "./app/address";
import { App } from "./App";
import { text } from "./text";

declare global {
  interface Window {
    /** The core, exposed so the end-to-end tests can observe each trial (see core/index.ts). */
    Core: typeof Core;
  }
}
window.Core = Core;

// The built copies of the page already say these (vite.config.ts); the dev server's page is the English one.
document.documentElement.lang = LANGUAGE;
document.title = text.site.title;

initStage();
initPause();
initRouting();

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing from index.html");
createRoot(root).render(<StrictMode><App /></StrictMode>);
