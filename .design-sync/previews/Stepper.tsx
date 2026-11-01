import { Stepper } from "visual-tool";

// The stepper names four phases and, under the current one, the step you are on.
// Sweeping `view` across the phases is the variant axis that changes appearance.

/** First phase — filling in the contribute form. */
export const BeforeYouStart = () => <div className="wrap"><Stepper view="contribute" /></div>;

/** Second phase, measuring the screen. */
export const Calibration = () => <div className="wrap"><Stepper view="screen" /></div>;

/** Third phase, part-way through the two tasks. */
export const Tasks = () => <div className="wrap"><Stepper view="motion" /></div>;

/** Final phase — every earlier phase marked done. */
export const Results = () => <div className="wrap"><Stepper view="results" /></div>;
