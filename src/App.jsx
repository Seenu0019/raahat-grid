import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmergencyCases from './pages/EmergencyCases';
import EmergencyDetail from './pages/EmergencyDetail';
import RegisterEmergency from './pages/RegisterEmergency';
import HospitalNetwork from './pages/HospitalNetwork';
import AmbulanceFleet from './pages/AmbulanceFleet';
import TransferCoordination from './pages/TransferCoordination';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { initializeData } from './data/store';

export default function App() {
  useEffect(() => {
    // Ensure seed data is initialized into LocalStorage
    initializeData();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/emergencies" element={<EmergencyCases />} />
              <Route path="/emergencies/:id" element={<EmergencyDetail />} />
              <Route path="/register" element={<RegisterEmergency />} />
              <Route path="/hospitals" element={<HospitalNetwork />} />
              <Route path="/ambulances" element={<AmbulanceFleet />} />
              <Route path="/transfers" element={<TransferCoordination />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
