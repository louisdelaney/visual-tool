// The page: title and steps, and the current step's page.
import { useAppState } from "./app/store";
import type { View } from "./app/types";
import { thisDevice } from "./app/device";
import { Masthead } from "./components/Masthead";
import { FunNotice } from "./components/FunNotice";
import { ContributePage } from "./pages/ContributePage";
import { SetupPage } from "./pages/SetupPage";
import { ScreenPage } from "./pages/ScreenPage";
import { DistancePage } from "./pages/DistancePage";
import { TaskIntroPage } from "./pages/TaskIntroPage";
import { ResultsNotice, ResultsPage } from "./pages/ResultsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ReferencesPage } from "./pages/ReferencesPage";
import { DataPage } from "./pages/DataPage";

/** The steps that lead into the tasks. A phone never reaches them: it stays on the home page, which says why. */
const TEST_STEPS: readonly View[] = ["questions", "setup", "screen", "distance", "motion", "form"];

/** Whether the home page is showing: step 1's first page, or a phone sent back to it from a later step. */
const onHome = (view: View): boolean => view === "contribute" || (TEST_STEPS.includes(view) && thisDevice() === "phone");

function CurrentPage() {
  const { view, calib, distance, session, historyPseudonym, testType } = useAppState();
  if (view !== "contribute" && onHome(view)) return <ContributePage part="contribute" />;
  switch (view) {
    // One element for both pages of step 1, so its draft answers carry over between them.
    case "contribute":
    case "questions": return <ContributePage part={view} />;
    case "setup": return <SetupPage testType={testType} session={session} />;
    case "screen": return <ScreenPage calib={calib} />;
    case "distance": return <DistancePage calib={calib} distance={distance} />;
    case "motion":
    case "form": return <TaskIntroPage key={view} task={view} session={session} />;
    case "results": return <ResultsPage key={session?.startedAt} session={session} />;
    case "history": return <HistoryPage key={historyPseudonym} initialPseudonym={historyPseudonym} />;
    case "privacy": return <PrivacyPage />;
    case "references": return <ReferencesPage />;
    case "data": return <DataPage />;
  }
}

export function App() {
  const { view, flash, session } = useAppState();
  return (
    <>
      <Masthead view={view} notice={view === "results" && session?.results ? <ResultsNotice session={session} /> : onHome(view) ? <FunNotice /> : null} />
      <main id="main" className="view-stack">
        {flash && <p className="flash" id="flash" role="status">{flash}</p>}
        <CurrentPage />
      </main>
    </>
  );
}
