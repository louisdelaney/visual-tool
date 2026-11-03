// The test's fixed settings, task order and labels.
import type { TestType } from "../core";
import type { Settings, TaskName } from "./types";

export const PAGE_NAME = "Form–Motion Coherence Test";

export const SETTINGS: Readonly<Settings> = Object.freeze({ protocol: "clinic", motionDisplay: "brief", spiralDots: "flicker", order: "motion-first", run: "published" });

/** A session's settings: the fixed ones, with the run named for its test type. */
export const settingsFor = (testType: TestType): Settings => ({ ...SETTINGS, run: testType === "quick" ? "quick" : "published" });

/** How each test type is named on the page. */
export const TEST_TYPE_LABEL: Record<TestType, string> = { full: "Full test", quick: "Quick test" };

export const TASK_ORDER: readonly [TaskName, TaskName] = ["motion", "form"];

export const TASK_LABEL: Record<TaskName, string> = { motion: "Motion task", form: "Form task" };

export const dpr = (): number => window.devicePixelRatio || 1;
