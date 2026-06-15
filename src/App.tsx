import { useState } from "react";

import styles from "./App.module.css";
import { EditorPanel } from "./components/EditorPanel/EditorPanel";
import { LibraryPanel } from "./components/LibraryPanel/LibraryPanel";
import { MatchImportPanel } from "./components/MatchImportPanel/MatchImportPanel";
import { PitchPanel } from "./components/PitchPanel/PitchPanel";
import { PricingModal } from "./components/PricingModal/PricingModal";
import { TopBar } from "./components/TopBar/TopBar";
import { useLineupBuilder } from "./hooks/useLineupBuilder";
import { useSubscription } from "./subscription";

function App() {
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const subscription = useSubscription();
  const { editorPanelProps, libraryPanelProps, matchImportPanelProps, pitchPanelProps, topBarProps } =
    useLineupBuilder();

  return (
    <main className={styles.appShell}>
      <TopBar
        {...topBarProps}
        hasPremiumAccess={subscription.hasPremiumAccess}
        isLocalhost={subscription.isLocalhost}
        onOpenPricing={() => setIsPricingOpen(true)}
      />

      <section className={styles.workspace}>
        <PitchPanel {...pitchPanelProps} />

        <EditorPanel
          {...editorPanelProps}
          libraryPanel={<LibraryPanel {...libraryPanelProps} />}
          matchImportPanel={
            <MatchImportPanel
              {...matchImportPanelProps}
              hasPremiumAccess={subscription.hasPremiumAccess}
              onOpenPricing={() => setIsPricingOpen(true)}
            />
          }
        />
      </section>

      {isPricingOpen ? (
        <PricingModal
          isLocalhost={subscription.isLocalhost}
          onClose={() => setIsPricingOpen(false)}
          onSelectPlan={subscription.setPlan}
          plan={subscription.plan}
        />
      ) : null}
    </main>
  );
}

export default App;
