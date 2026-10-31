// The test's fixed settings, task order and labels.
import type { Settings, TaskName } from "./types";

export const PAGE_NAME = "Form–Motion Coherence Test";

export const SETTINGS: Readonly<Settings> = Object.freeze({ protocol: "clinic", motionDisplay: "brief", spiralDots: "flicker", order: "motion-first", run: "published" });

export const TASK_ORDER: readonly [TaskName, TaskName] = ["motion", "form"];

export const TASK_LABEL: Record<TaskName, string> = { motion: "Motion task", form: "Form task" };

export const dpr = (): number => window.devicePixelRatio || 1;
