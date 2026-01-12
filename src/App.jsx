import { Scene } from './components/Scene';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Scene />
    </ErrorBoundary>
  );
}

export default App;
