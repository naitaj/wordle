import React from 'react';
import { WordleBoard } from './components/WordleBoard';
import { useWordleAutoSolver } from './hooks/useAutoSolver';

const App: React.FC = () => {
  const [state, actions] = useWordleAutoSolver();

  return (
    <WordleBoard
      state={state}
      onStart={actions.start}
      onReset={actions.reset}
      onUpdateConfig={actions.updateConfig}
    />
  );
};

export default App;
