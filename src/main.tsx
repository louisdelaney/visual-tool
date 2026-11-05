// Entry point: the styles, then the language the address asks for, then the app (start.tsx).
// Fonts are bundled with the site, so loading the page contacts no other server.
import "@fontsource/atkinson-hyperlegible-next/300.css";
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
import { LANGUAGE } from "./app/address";
import { loadLanguage } from "./text";

// The app's modules read their words as they load, so the language is settled before any of them
// is imported. If another language's words can't be fetched, the page still works, in English.
void loadLanguage(LANGUAGE)
  .catch((err: unknown) => console.error(err))
  .then(() => import("./start"));
