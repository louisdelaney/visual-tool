// Entry point: styles, the stage's input handling, and the React app.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts are bundled with the site, so loading the page contacts no other server.
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/atkinson-hyperlegible-next/800.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/atkinson-hyperlegible-mono/500.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/forms.css";
import "./styles/setup.css";
import "./styles/calibration.css";
import "./styles/results.css";
import "./styles/stage.css";
import { Core } from "./core";
import { initStage } from "./stage/stage";
import { initPause } from "./stage/pause";
import { initRouting } from "./app/flow";
import { App } from "./App";

declare global {
  interface Window {
    /** The core, exposed so the end-to-end tests can observe each trial (see core/index.ts). */
    Core: typeof Core;
  }
}
window.Core = Core;

initStage();
initPause();
initRouting();

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing from index.html");
createRoot(root).render(<StrictMode><App /></StrictMode>);
