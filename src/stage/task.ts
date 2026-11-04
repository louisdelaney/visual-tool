// One task: instructions, practice with feedback, then the adaptive staircase with an easy
// check trial every few trials.
import type { Session, TaskName, TaskRecord, Trial, TrialPhase } from "../app/types";
import { PROTOCOLS, Staircase } from "../core";
import { TASK_LABEL } from "../app/protocol";
import { feedback, stageMessage } from "./stage";
import { waitForPauseDecision } from "./pause";
import { runTrial } from "./trial";
import { text } from "../text";

const t = text.tasks;

function answerPhrase(r: Trial): string {
  if (r.target === "up" || r.target === "down") return t.answer[r.target];
  return r.target === "1" ? t.answer.first : t.answer.second;
}

/**
 * Runs practice and the staircase for one task on the open stage. Resolves the task's record
 * (endedEarly if the participant ended it from the pause box), or null if they went back from
 * the first message.
 */
export async function runTask(s: Session, task: TaskName): Promise<TaskRecord | null> {
  const P = PROTOCOLS[s.testType], S = P.staircase;
  const how = t.how[task];
  const choice = await stageMessage(`<h2>${t.practiceTitle(TASK_LABEL[task])}</h2><p>${t.practiceIntro(S.practiceTrials)}</p><p>${t.recap[task]}</p><p>${how} ${t.guess[task]}</p>`, { go: t.startPractice, alt: text.common.back, altVerb: t.backVerb });
  if (choice !== "go") return null;
  const sc = new Staircase({ start: S.start, factor: S.factor, down: S.down, min: S.min, max: S.max, maxTrials: S.maxTrials, ...P.run });
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
  // Practice can be repeated as often as the participant likes; every round is kept as "practice" trials.
  for (;;) {
    for (let i = 0; i < S.practiceTrials; i++) {
      const r = await attempt(100, "practice");
      if (!r) { rec.endedEarly = true; return rec; }
      await feedback(r.correct, answerPhrase(r));
    }
    const next = await stageMessage(`<h2>${t.practiceDone}</h2><p>${t.recap[task]} ${how}</p><p>${t.nowTheTest}</p><p>${t.practiseAgainPrompt}</p>`, { go: t.startTest, alt: t.practiseAgain, altVerb: t.practiseAgainVerb });
    if (next === "go") break;
  }
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
