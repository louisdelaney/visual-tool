// The page: title and steps, the current step's page, and the footer.
import { useAppState } from "./app/store";
import { Masthead } from "./components/Masthead";
import { Footer } from "./components/Footer";
import { ContributePage } from "./pages/ContributePage";
import { SetupPage } from "./pages/SetupPage";
import { ScreenPage } from "./pages/ScreenPage";
import { DistancePage } from "./pages/DistancePage";
import { TaskIntroPage } from "./pages/TaskIntroPage";
import { ResultsPage } from "./pages/ResultsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ReferencesPage } from "./pages/ReferencesPage";
import { DataPage } from "./pages/DataPage";

function CurrentPage() {
  const { view, calib, distance, session, historyPseudonym } = useAppState();
  switch (view) {
    // One element for both pages of step 1, so its draft answers carry over between them.
    case "contribute":
    case "questions": return <ContributePage part={view} />;
    case "setup": return <SetupPage />;
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
  const { view, flash } = useAppState();
  return (
    <>
      <Masthead view={view} />
      <main id="main" className="view-stack">
        {flash && <p className="flash" id="flash" role="status">{flash}</p>}
        <CurrentPage />
      </main>
      <Footer />
    </>
  );
}
