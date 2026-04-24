/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import ExplorePage from './pages/ExplorePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ProverbsPage from './pages/ProverbsPage';
import Footer from './components/Footer';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell flex flex-col">
        <Navbar />
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/:id" element={<ItemDetailsPage />} />
            <Route path="/proverbs" element={<ProverbsPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
