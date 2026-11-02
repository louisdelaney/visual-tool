// What each number on the results pages measures, in plain terms. It describes the measures, never
// the person: nothing here ranks a result or reads anything into where it falls.

interface ResultsExplainedProps {
  /** Whether group bars are on the page, so their parts need explaining. */
  groups: boolean;
  /** Whether the page also has the threshold charts, with their middle-80% band. */
  thresholdCharts?: boolean;
}

export function ResultsExplained({ groups, thresholdCharts = false }: ResultsExplainedProps) {
  return (
    <div className="explain" id="results-explained">
      <h3>What the numbers mean</h3>
      <p>
        There's no right or wrong result, and no good or bad score. Each number describes how one run went, on one screen, on one day. It's just for fun.
      </p>
      <div className="explain-grid">
        <section>
          <h4>Threshold</h4>
          <p>
            In both tasks, only some of the dots were organised and the rest were random. After correct answers the test lowered the share of organised dots, and after a mistake it raised it again, until it settled where you were right about four times in five. That share is your threshold. A 10% threshold means that with 10 dots in every 100 organised, you picked the right answer about four times in five.
          </p>
        </section>
        <section>
          <h4>Motion and form</h4>
          <p>
            The motion threshold is how much of the dots had to drift together before you could tell which way they went. The form threshold is how much had to line up into the starburst before you could tell which flash held it. They're two different kinds of seeing, so the two numbers don't have to match.
          </p>
        </section>
        <section>
          <h4>Sensitivity</h4>
          <p>
            Sensitivity turns the threshold around: it's 1 ÷ the threshold in percent. A 10% threshold is a sensitivity of 0.1, and a 5% threshold is 0.2. A smaller threshold and a taller sensitivity bar say the same thing: less organised signal was needed to pick out the pattern.
          </p>
        </section>
        <section>
          <h4>Motion − form</h4>
          <p>
            Your motion sensitivity minus your form sensitivity. Above zero, you needed less organised signal to see the moving dots than the starburst. Below zero, the starburst needed less. Near zero, about the same for both. It compares your two tasks with each other, and it isn't a score.
          </p>
        </section>
        {groups && (
          <section>
            <h4>The group bars</h4>
            <p>
              A group's bar is its median: half the group's results are above it and half below. The line across the bar covers the middle half, leaving out the top and bottom quarter.{thresholdCharts ? " On the threshold charts, the lighter band covers the middle 80%, leaving out the top and bottom tenth." : ""} They show how spread out each group's results are. Nothing is concluded from where yours fall.
            </p>
          </section>
        )}
        <section>
          <h4>Why it varies</h4>
          <p>
            The same person can get quite different numbers on different days. Screens, lighting, distance from the screen, tiredness and attention all change how a run goes, and a single run has some luck in it.
          </p>
        </section>
      </div>
    </div>
  );
}
