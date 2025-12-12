import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Connect from './pages/Connect';
import Player from './pages/Player';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/connect" element={<Connect />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/" element={<Navigate to="/connect" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
