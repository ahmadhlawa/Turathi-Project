import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
