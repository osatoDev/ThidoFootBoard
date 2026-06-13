import styles from "./App.module.css";
import { EditorPanel } from "./components/EditorPanel/EditorPanel";
import { LibraryPanel } from "./components/LibraryPanel/LibraryPanel";
import { MatchImportPanel } from "./components/MatchImportPanel/MatchImportPanel";
import { PitchPanel } from "./components/PitchPanel/PitchPanel";
import { TopBar } from "./components/TopBar/TopBar";
import { useLineupBuilder } from "./hooks/useLineupBuilder";

function App() {
  const { editorPanelProps, libraryPanelProps, matchImportPanelProps, pitchPanelProps, topBarProps } =
    useLineupBuilder();

  return (
    <main className={styles.appShell}>
      <TopBar {...topBarProps} />

      <section className={styles.workspace}>
        <PitchPanel {...pitchPanelProps} />

        <EditorPanel
          {...editorPanelProps}
          libraryPanel={<LibraryPanel {...libraryPanelProps} />}
          matchImportPanel={<MatchImportPanel {...matchImportPanelProps} />}
        />
      </section>
    </main>
  );
}

export default App;
