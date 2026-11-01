import { Masthead } from "visual-tool";

// Masthead carries the site nav, the title and lede, and — on test steps only —
// the Stepper. The variant axis is `view`: it sets the current nav link and the
// stepper position, and info pages drop the stepper entirely.

/** The home page: nav on "Home", stepper at the first phase. */
export const Home = () => <div className="wrap"><Masthead view="contribute" /></div>;

/** Part-way through calibration. */
export const Calibration = () => <div className="wrap"><Masthead view="screen" /></div>;

/** During the motion task. */
export const DuringATask = () => <div className="wrap"><Masthead view="motion" /></div>;

/** An info page — no stepper, and the matching nav link is marked current. */
export const InfoPage = () => <div className="wrap"><Masthead view="privacy" /></div>;
