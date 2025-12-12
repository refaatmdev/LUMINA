import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Player = lazy(() => import('./pages/Player'));
const Connect = lazy(() => import('./pages/Connect'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/connect" replace />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/player/:screenId" element={<Player />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
