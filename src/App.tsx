import { useState } from "react";

import styles from "./App.module.css";
import { ConfirmDialog } from "./components/ConfirmDialog/ConfirmDialog";
import { EditorPanel } from "./components/EditorPanel/EditorPanel";
import { HowItWorksModal } from "./components/HowItWorksModal/HowItWorksModal";
import { LibraryPanel } from "./components/LibraryPanel/LibraryPanel";
import { LineupImportModal, type LineupImportMethod } from "./components/LineupImportModal/LineupImportModal";
import { LineupStarter } from "./components/LineupStarter/LineupStarter";
import { ImportSourceModal } from "./components/ImportSourceModal/ImportSourceModal";
import { PitchPanel } from "./components/PitchPanel/PitchPanel";
import { PricingModal } from "./components/PricingModal/PricingModal";
import { TopBar } from "./components/TopBar/TopBar";
import { useLineupBuilder } from "./hooks/useLineupBuilder";
import { useSubscription } from "./subscription";

function App() {
  const [importMethod, setImportMethod] = useState<LineupImportMethod | null>(null);
  const [isImportSourceOpen, setIsImportSourceOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [pendingDeleteLineupId, setPendingDeleteLineupId] = useState<string | null>(null);
  const [starterDismissed, setStarterDismissed] = useState(
    () => window.localStorage.getItem("thido-lineup-starter-complete") === "true",
  );
  const subscription = useSubscription();
  const {
    editorPanelProps,
    hasLineupContent,
    importManualLineup,
    libraryPanelProps,
    pitchPanelProps,
    saveState,
    topBarProps,
    workspaceStatus,
  } = useLineupBuilder();

  function completeStarter() {
    window.localStorage.setItem("thido-lineup-starter-complete", "true");
    setStarterDismissed(true);
  }

  function selectImportMethod(nextMethod: LineupImportMethod) {
    if ((nextMethod === "match" || nextMethod === "screenshot") && !subscription.hasPremiumAccess) {
      setIsImportSourceOpen(false);
      setIsPricingOpen(true);
      return;
    }
    setIsImportSourceOpen(false);
    setImportMethod(nextMethod);
  }

  function applyImportedLineup(lineup: Parameters<typeof importManualLineup>[0]) {
    importManualLineup(lineup);
    completeStarter();
  }

  const pendingDeleteLineup = libraryPanelProps.savedLineups.find(
    (lineup) => lineup.id === pendingDeleteLineupId,
  );
  const workspaceStarted = starterDismissed || hasLineupContent;

  return (
    <main className={styles.appShell}>
      <TopBar
        {...topBarProps}
        onClearLineup={() => setIsClearConfirmOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      <section className={`${styles.workspace} ${!workspaceStarted ? styles.workspaceEmpty : ""}`}>
        <PitchPanel
          {...pitchPanelProps}
          starterOverlay={
            !workspaceStarted ? (
              <LineupStarter onOpenImport={() => setIsImportSourceOpen(true)} onStartBlank={completeStarter} />
            ) : null
          }
        />

        {workspaceStarted ? (
          <EditorPanel
            {...editorPanelProps}
            libraryPanel={
              <LibraryPanel
                {...libraryPanelProps}
                onDeleteLineup={(id) => setPendingDeleteLineupId(id)}
              />
            }
            onOpenImport={() => setIsImportSourceOpen(true)}
          />
        ) : null}
      </section>

      {workspaceStarted ? (
        <div className={styles.workspaceStatus} role="status" title="Changes are stored in this browser">
          <span aria-hidden="true" />
          <strong>{workspaceStatus || saveState}</strong>
        </div>
      ) : null}

      {isImportSourceOpen ? (
        <ImportSourceModal
          hasPremiumAccess={subscription.hasPremiumAccess}
          onClose={() => setIsImportSourceOpen(false)}
          onSelectMethod={selectImportMethod}
        />
      ) : null}

      {isPricingOpen ? (
        <PricingModal
          isLocalhost={subscription.isLocalhost}
          onClose={() => setIsPricingOpen(false)}
          onSelectPlan={subscription.setPlan}
          plan={subscription.plan}
        />
      ) : null}

      {isHowItWorksOpen ? <HowItWorksModal onClose={() => setIsHowItWorksOpen(false)} /> : null}

      {importMethod ? (
        <LineupImportModal
          method={importMethod}
          onClose={() => setImportMethod(null)}
          onImportLineup={applyImportedLineup}
        />
      ) : null}

      {isClearConfirmOpen ? (
        <ConfirmDialog
          confirmLabel="Clear lineup"
          description="This removes all starters, substitutes, and arrows from the current pitch. Saved library lineups are not affected."
          onCancel={() => setIsClearConfirmOpen(false)}
          onConfirm={() => {
            topBarProps.onClearLineup();
            setIsClearConfirmOpen(false);
          }}
          title="Clear the current lineup?"
        />
      ) : null}

      {pendingDeleteLineup ? (
        <ConfirmDialog
          confirmLabel="Delete lineup"
          description={`“${pendingDeleteLineup.name}” will be removed from this browser. This cannot be undone.`}
          onCancel={() => setPendingDeleteLineupId(null)}
          onConfirm={() => {
            libraryPanelProps.onDeleteLineup(pendingDeleteLineup.id);
            setPendingDeleteLineupId(null);
          }}
          title="Delete this saved lineup?"
        />
      ) : null}
    </main>
  );
}

export default App;
