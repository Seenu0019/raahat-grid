import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Download,
  Upload,
  Zap,
  Info,
  Database,
  ShieldAlert,
} from 'lucide-react';
import {
  resetAllData,
  getHospitals,
  getAmbulances,
  getEmergencies,
  getTransfers,
  getActivities,
  addEmergency,
  generateEmergencyId,
  updateHospital,
  addActivity,
} from '../data/store';
import { useToast } from '../components/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

function getStorageStats() {
  const hospitals = getHospitals();
  const ambulances = getAmbulances();
  const emergencies = getEmergencies();
  const transfers = getTransfers();
  const activities = getActivities();

  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('raahatgrid_')) {
        bytes += (localStorage.getItem(key) || '').length * 2;
      }
    }
  } catch {
    bytes = 0;
  }

  return {
    hospitals: hospitals.length,
    ambulances: ambulances.length,
    emergencies: emergencies.length,
    transfers: transfers.length,
    activities: activities.length,
    approxBytes: bytes,
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [storageStats, setStorageStats] = useState(getStorageStats);

  const loadStats = () => {
    setStorageStats(getStorageStats());
  };

  const handleResetData = () => {
    resetAllData();
    setShowResetConfirm(false);
    loadStats();
    addToast('All demo data has been reset to defaults.', 'success');
  };

  const handleSimulateSurge = () => {
    const mockSurges = [
      {
        patientName: 'Devansh Verma (Simulated)',
        contactNumber: '9876543210',
        age: 38,
        category: 'Cardiac Emergency',
        priority: 'Critical',
        location: 'Ring Road Junction, Sector 14',
        requiredFacility: 'Cardiac Care Unit',
        notes: 'Simulated acute chest pain, suspected myocardial infarction, immediate catheterization and cardiac care needed.',
      },
      {
        patientName: 'Simran Kaur (Simulated)',
        contactNumber: '9812345678',
        age: 26,
        category: 'Trauma',
        priority: 'Critical',
        location: 'Metro Flyover Underpass, Outer Ring',
        requiredFacility: 'Trauma Center',
        notes: 'Simulated multi-vehicle collision with severe blunt chest and abdominal trauma, urgent surgical triage.',
      },
      {
        patientName: 'Kishore Patel (Simulated)',
        contactNumber: '9823456789',
        age: 62,
        category: 'Neurological Emergency',
        priority: 'Critical',
        location: 'Tech Park Tower B, Cyber Enclave',
        requiredFacility: 'Neurology',
        notes: 'Simulated sudden onset right-sided hemiparesis and aphasia, onset within 45 mins.',
      },
    ];

    mockSurges.forEach((mock) => {
      const id = generateEmergencyId();
      addEmergency({
        id,
        ...mock,
        status: 'New',
        assignedHospital: null,
        assignedAmbulance: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    addActivity({
      type: 'emergency',
      message: 'SIMULATION: Emergency surge triggered (3 Critical cases registered)',
    });

    loadStats();
    addToast('Simulation: 3 Critical emergency cases injected!', 'warning');
  };

  const handleSimulateCapacityCrunch = () => {
    const hospitals = getHospitals();
    let updatedCount = 0;
    hospitals.forEach((h) => {
      if (h.availableBeds > 5) {
        updateHospital(h.id, {
          availableBeds: Math.max(1, Math.floor(h.availableBeds * 0.2)),
          availableIcuBeds: Math.max(0, Math.floor(h.availableIcuBeds * 0.1)),
        });
        updatedCount++;
      }
    });

    addActivity({
      type: 'hospital',
      message: `SIMULATION: Bed capacity surge simulated across ${updatedCount} hospitals`,
    });

    loadStats();
    addToast(`Hospital capacity stress simulated on ${updatedCount} hospitals.`, 'info');
  };

  const handleExportData = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      hospitals: getHospitals(),
      ambulances: getAmbulances(),
      emergencies: getEmergencies(),
      transfers: getTransfers(),
      activities: getActivities(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raahat-grid-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Demo data exported successfully.', 'success');
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.hospitals && parsed.emergencies) {
          localStorage.setItem('raahatgrid_hospitals', JSON.stringify(parsed.hospitals));
          localStorage.setItem('raahatgrid_ambulances', JSON.stringify(parsed.ambulances || []));
          localStorage.setItem('raahatgrid_emergencies', JSON.stringify(parsed.emergencies));
          localStorage.setItem('raahatgrid_transfers', JSON.stringify(parsed.transfers || []));
          localStorage.setItem('raahatgrid_activities', JSON.stringify(parsed.activities || []));
          loadStats();
          addToast('Data snapshot imported successfully!', 'success');
        } else {
          addToast('Invalid data format. Missing required collections.', 'error');
        }
      } catch {
        addToast('Failed to parse uploaded JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Settings</span>
        </div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <SettingsIcon size={28} /> System Settings & Demo Controls
        </h1>
        <p>Manage simulation scenarios, LocalStorage persistence, and demo environment configuration.</p>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
        <ShieldAlert size={24} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: '1rem', display: 'block', marginBottom: 4 }}>Hackathon Demo Notice</strong>
          <span>
            RAAHAT GRID is a functioning coordination prototype running in client mode with browser LocalStorage persistence.
            All hospitals, addresses, emergency cases, ambulance units, phone numbers, and coordinates are purely fictional demo data.
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Simulation Controls */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
              <Zap size={20} style={{ color: 'var(--color-warning)' }} />
              Hackathon Simulation Triggers
            </h2>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Quickly trigger emergency scenarios during judge evaluations to show how the matching algorithm, live stats, and ambulance assignment react dynamically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>Simulate Emergency Surge</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Injects 3 new high-severity Critical cases (Cardiac, Trauma, Stroke).
                  </p>
                </div>
                <button className="btn btn-danger" onClick={handleSimulateSurge}>
                  Trigger Surge
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>Simulate ICU / Bed Crunch</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Artificially lowers hospital bed availability to test score redistribution.
                  </p>
                </div>
                <button className="btn btn-warning" onClick={handleSimulateCapacityCrunch}>
                  Simulate Crunch
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>Reset Demo to Clean State</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Restores all fictional seed data for fresh walkthroughs.
                  </p>
                </div>
                <button className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw size={16} /> Reset All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LocalStorage & Data Management */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
              <Database size={20} style={{ color: 'var(--color-accent)' }} />
              LocalStorage Data Persistence
            </h2>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              All actions are persisted in browser LocalStorage. Data survives page refreshes and browser reloads.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Hospitals Stored</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{storageStats.hospitals}</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Ambulances Stored</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{storageStats.ambulances}</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Emergencies Stored</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{storageStats.emergencies}</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Transfers Stored</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{storageStats.transfers}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={handleExportData}>
                <Download size={16} /> Export State JSON
              </button>
              <label className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={16} /> Import State JSON
                <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Algorithm Information Card */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
            <Info size={20} style={{ color: 'var(--color-accent)' }} />
            Hospital Matching Algorithm Architecture
          </h2>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
            The RAAHAT GRID deterministic matching algorithm computes an objective compatibility score (0–100 points) based on five multi-factor criteria:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>1. Facility Match (40 pts)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Hard requirement check: verifies presence of specialized facilities (Cath Lab, Stroke Center, Trauma, Burn ICU, etc.).
              </p>
            </div>
            <div style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>2. Bed Capacity (25 pts)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Calculated proportional to available beds over total capacity to favor hospitals with adequate reception bandwidth.
              </p>
            </div>
            <div style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-warning)' }}>3. ICU Availability (15 pts)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Critical care buffer: prioritized scoring for hospitals with operational ICU beds ready for patient intake.
              </p>
            </div>
            <div style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>4. ED Readiness (10 pts)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Active emergency department status flag indicating 24/7 immediate triage triage staffing.
              </p>
            </div>
            <div style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: '#8b5cf6' }}>5. Proximity (10 pts)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Haversine geodesic distance calculation weighting response radius and estimated ambulance transit time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset All Demo Data?"
          message="This will restore all hospitals, ambulances, emergency cases, and transfer logs back to default fictional seed data. Any custom cases you created will be deleted."
          confirmLabel="Reset Everything"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleResetData}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
