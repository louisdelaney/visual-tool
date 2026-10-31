// One task: instructions, practice with feedback, then the adaptive staircase with an easy
// check trial every few trials.
import type { Session, TaskName, TaskRecord, Trial, TrialPhase } from "../app/types";
import { PROTOCOL, Staircase } from "../core";
import { TASK_LABEL } from "../app/protocol";
import { feedback, stageMessage } from "./stage";
import { waitForPauseDecision } from "./pause";
import { runTrial } from "./trial";

function answerPhrase(t: Trial): string {
  if (t.target === "up" || t.target === "down") return `The dots were drifting ${t.target}.`;
  return `The spiral was in the ${t.target === "1" ? "first" : "second"} flash.`;
}

/**
 * Runs practice and the staircase for one task on the open stage. Resolves the task's record
 * (endedEarly if the participant ended it from the pause box), or null if they went back from
 * the first message.
 */
export async function runTask(s: Session, task: TaskName): Promise<TaskRecord | null> {
  const S = PROTOCOL.staircase;
  const how = task === "motion"
      ? "Answer with <kbd>↑</kbd> or <kbd>↓</kbd>, or click the top or bottom half of the screen."
      : "Each trial is two quick flashes. Then press <kbd>1</kbd> or <kbd>2</kbd> (or <kbd>←</kbd> or <kbd>→</kbd>) for the flash that had the spiral.";
  const choice = await stageMessage(`<h2>${TASK_LABEL[task]}: practice</h2><p>${S.practiceTrials} easy examples first, with feedback. ${how}</p>`, { go: "Start practice", alt: "Back", altVerb: "go back" });
  if (choice !== "go") return null;
  const sc = new Staircase({ start: S.start, factor: S.factor, down: S.down, min: S.min, max: S.max, maxTrials: S.maxTrials, ...PROTOCOL.run });
  const rec: TaskRecord = { task, staircase: sc, trials: [], endedEarly: false };
  // Redoing a task (after going back to it) replaces its earlier run.
  s.trials = s.trials.filter(t => t.task !== task);
  s.tasks[task] = rec;
  let trialNo = 0;
  // Runs a trial, restarting it after each pause; null if the participant ends the task.
  const attempt = async (level: number, phase: TrialPhase): Promise<Trial | null> => {
    for (;;) {
      const r = await runTrial(s, task, level, phase, trialNo + 1);
      if (!("aborted" in r)) { trialNo += 1; rec.trials.push(r); s.trials.push(r); return r; }
      if ((await waitForPauseDecision()) === "end") return null;
    }
  };
  for (let i = 0; i < S.practiceTrials; i++) {
    const r = await attempt(100, "practice");
    if (!r) { rec.endedEarly = true; return rec; }
    await feedback(r.correct, answerPhrase(r));
  }
  await stageMessage("<h2>Practice done</h2><p>Now the test. It gets harder until it's hard to tell. That's expected: answer every time, and guess when you're unsure. An easy one appears every few trials.</p><p>Press <kbd>Esc</kbd> to pause.</p>", { go: "Start the test" });
  let sinceCatch = 0;
  while (!sc.done) {
    const isCatch = sinceCatch === S.catchEvery;
    const r = await attempt(isCatch ? 100 : sc.level, isCatch ? "catch" : "test");
    if (!r) { rec.endedEarly = true; break; }
    if (isCatch) { sinceCatch = 0; continue; }
    r.reversal = sc.record(r.correct).reversal;
    sinceCatch += 1;
  }
  return rec;
}
