import { Route, Routes } from 'react-router-dom';

import RoomPanel from './components/RoomPanel';
import CodeEditor from './components/CodeEditor';
import SuggestionPanel from './components/SuggestionPanel';
import StatusBar from './components/StatusBar';
import { useRoomConnection } from './hooks/useRoomConnection';
import { useRoomRouting } from './hooks/useRoomRouting';

const CollaborationSurface = () => {
  useRoomRouting();
  useRoomConnection();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <RoomPanel />
      </aside>
      <main className="editor-surface">
        <CodeEditor />
        <SuggestionPanel />
        <StatusBar />
      </main>
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/" element={<CollaborationSurface />} />
    <Route path="/room/:roomId" element={<CollaborationSurface />} />
  </Routes>
);

export default App;
