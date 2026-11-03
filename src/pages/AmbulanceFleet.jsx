import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Ambulance as AmbIcon, MapPin, User, X, Inbox } from 'lucide-react';
import { getAmbulances, updateAmbulance, addActivity } from '../data/store';
import { AMBULANCE_STATUSES } from '../data/seedData';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export default function AmbulanceFleet() {
  const [ambulances, setAmbulances] = useState(() => getAmbulances());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedAmb, setSelectedAmb] = useState(null);
  const [editAmb, setEditAmb] = useState(null);
  const navigate = useNavigate();
  const addToast = useToast();

  useEffect(() => {
    const interval = setInterval(() => setAmbulances(getAmbulances()), 2000);
    return () => clearInterval(interval);
  }, []);

  let filtered = ambulances.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.id.toLowerCase().includes(q) || a.driverName.toLowerCase().includes(q) || a.vehicleNumber.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = ambulances.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const handleStatusUpdate = () => {
    if (!editAmb) return;
    updateAmbulance(editAmb.id, { status: editAmb.status });
    addActivity({ type: 'ambulance', message: `Ambulance ${editAmb.id} status changed to ${editAmb.status}` });
    addToast(`Ambulance ${editAmb.id} updated`, 'success');
    setEditAmb(null);
    setAmbulances(getAmbulances());
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Ambulance Fleet</span>
        </div>
        <h1>Ambulance Fleet</h1>
        <p>Manage fictional demo ambulance units. All data is simulated.</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        {AMBULANCE_STATUSES.map((s) => (
          <div className="stat-card" key={s}>
            <div className={`stat-icon ${s === 'Available' ? 'green' : s === 'Offline' ? 'red' : 'amber'}`}>
              <AmbIcon size={22} />
            </div>
            <div className="stat-info">
              <h3>{statusCounts[s] || 0}</h3>
              <p>{s}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input placeholder="Search by ID, driver name, or vehicle number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {AMBULANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Inbox size={64} className="icon" />
              <h3>No Ambulances Found</h3>
              <p>Adjust your search or filters</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ambulance ID</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Driver</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.id}</td>
                      <td>{a.vehicleNumber}</td>
                      <td>{a.vehicleType}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {a.driverName}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {a.currentLocation}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>{a.assignedEmergency || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => setSelectedAmb(a)}>View</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setEditAmb({ ...a })}>Status</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAmb && (
        <div className="modal-overlay" onClick={() => setSelectedAmb(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ambulance {selectedAmb.id}</h2>
              <button className="btn-ghost" onClick={() => setSelectedAmb(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Vehicle Number</label><span>{selectedAmb.vehicleNumber}</span></div>
                <div className="detail-item"><label>Vehicle Type</label><span>{selectedAmb.vehicleType}</span></div>
                <div className="detail-item"><label>Driver Name</label><span>{selectedAmb.driverName}</span></div>
                <div className="detail-item"><label>Driver Contact</label><span>{selectedAmb.driverContact}</span></div>
                <div className="detail-item"><label>Current Location</label><span>{selectedAmb.currentLocation}</span></div>
                <div className="detail-item"><label>Status</label><StatusBadge status={selectedAmb.status} /></div>
                <div className="detail-item"><label>Assigned Emergency</label><span>{selectedAmb.assignedEmergency || 'None'}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Equipment</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {selectedAmb.equipment.map((eq) => <span key={eq} className="tag">{eq}</span>)}
                  </div>
                </div>
              </div>
              <p style={{ marginTop: 'var(--space-md)', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                All ambulance data is fictional and for demonstration purposes only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {editAmb && (
        <div className="modal-overlay" onClick={() => setEditAmb(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Update {editAmb.id} Status</h2>
              <button className="btn-ghost" onClick={() => setEditAmb(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editAmb.status}
                  onChange={(e) => setEditAmb({ ...editAmb, status: e.target.value })}
                >
                  {AMBULANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditAmb(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
