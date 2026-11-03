import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, X, Edit3, Inbox } from 'lucide-react';
import { getHospitals, updateHospital } from '../data/store';
import { MEDICAL_FACILITIES } from '../data/seedData';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export default function HospitalNetwork() {
  const [hospitals, setHospitals] = useState(() => getHospitals());
  const [search, setSearch] = useState('');
  const [filterFacility, setFilterFacility] = useState('');
  const [filterAvail, setFilterAvail] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [editHospital, setEditHospital] = useState(null);
  const navigate = useNavigate();
  const addToast = useToast();

  useEffect(() => {
    const interval = setInterval(() => setHospitals(getHospitals()), 2000);
    return () => clearInterval(interval);
  }, []);

  let filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || h.name.toLowerCase().includes(q) || h.area.toLowerCase().includes(q);
    const matchesFac = !filterFacility || h.facilities.includes(filterFacility);
    const matchesAvail = !filterAvail || (filterAvail === 'available' ? h.status === 'Available' : h.status === 'Unavailable');
    return matchesSearch && matchesFac && matchesAvail;
  });

  const handleSaveEdit = () => {
    if (!editHospital) return;
    updateHospital(editHospital.id, {
      availableBeds: parseInt(editHospital.availableBeds, 10) || 0,
      availableIcuBeds: parseInt(editHospital.availableIcuBeds, 10) || 0,
      status: editHospital.status,
      emergencyDeptAvailable: editHospital.emergencyDeptAvailable,
    });
    addToast(`${editHospital.name} updated successfully`, 'success');
    setEditHospital(null);
    setHospitals(getHospitals());
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Hospital Network</span>
        </div>
        <h1>Hospital Network</h1>
        <p>Directory of fictional demo hospitals. {filtered.length} hospitals shown.</p>
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input placeholder="Search by hospital name or area…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterFacility} onChange={(e) => setFilterFacility(e.target.value)}>
          <option value="">All Facilities</option>
          {MEDICAL_FACILITIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="filter-select" value={filterAvail} onChange={(e) => setFilterAvail(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Inbox size={64} className="icon" />
              <h3>No Hospitals Found</h3>
              <p>Adjust your search or filters</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-md)' }}>
          {filtered.map((h) => (
            <div className="card" key={h.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedHospital(h)}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={18} style={{ color: 'var(--color-accent)' }} />
                      {h.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{h.address}</p>
                  </div>
                  <StatusBadge status={h.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <div style={{ textAlign: 'center', padding: '8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: h.availableBeds > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{h.availableBeds}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Beds</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: h.availableIcuBeds > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{h.availableIcuBeds}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>ICU</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: h.emergencyDeptAvailable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {h.emergencyDeptAvailable ? 'Yes' : 'No'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>ED</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {h.facilities.slice(0, 4).map((f) => <span key={f} className="tag">{f}</span>)}
                  {h.facilities.length > 4 && <span className="tag">+{h.facilities.length - 4} more</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <div className="modal-overlay" onClick={() => setSelectedHospital(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedHospital.name}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setEditHospital({ ...selectedHospital }); setSelectedHospital(null); }}>
                  <Edit3 size={14} /> Edit
                </button>
                <button className="btn-ghost" onClick={() => setSelectedHospital(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Hospital ID</label><span>{selectedHospital.id}</span></div>
                <div className="detail-item"><label>Area</label><span>{selectedHospital.area}</span></div>
                <div className="detail-item"><label>Address</label><span>{selectedHospital.address}</span></div>
                <div className="detail-item"><label>Status</label><StatusBadge status={selectedHospital.status} /></div>
                <div className="detail-item"><label>Total Beds</label><span>{selectedHospital.totalBeds}</span></div>
                <div className="detail-item"><label>Available Beds</label><span>{selectedHospital.availableBeds}</span></div>
                <div className="detail-item"><label>ICU Beds</label><span>{selectedHospital.icuBeds}</span></div>
                <div className="detail-item"><label>Available ICU</label><span>{selectedHospital.availableIcuBeds}</span></div>
                <div className="detail-item"><label>Emergency Dept</label><span>{selectedHospital.emergencyDeptAvailable ? 'Available' : 'Unavailable'}</span></div>
                <div className="detail-item"><label>Contact</label><span>{selectedHospital.contact}</span></div>
                <div className="detail-item"><label>Email</label><span>{selectedHospital.email}</span></div>
                <div className="detail-item"><label>Rating</label><span>{'⭐'.repeat(Math.round(selectedHospital.rating))} ({selectedHospital.rating})</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Facilities</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {selectedHospital.facilities.map((f) => <span key={f} className="tag">{f}</span>)}
                  </div>
                </div>
              </div>
              <p style={{ marginTop: 'var(--space-md)', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                All hospital data is fictional and for demonstration purposes only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hospital Modal */}
      {editHospital && (
        <div className="modal-overlay" onClick={() => setEditHospital(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {editHospital.name}</h2>
              <button className="btn-ghost" onClick={() => setEditHospital(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Available Beds</label>
                <input type="number" className="form-input" min="0" max={editHospital.totalBeds}
                  value={editHospital.availableBeds}
                  onChange={(e) => setEditHospital({ ...editHospital, availableBeds: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Available ICU Beds</label>
                <input type="number" className="form-input" min="0" max={editHospital.icuBeds}
                  value={editHospital.availableIcuBeds}
                  onChange={(e) => setEditHospital({ ...editHospital, availableIcuBeds: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editHospital.status}
                  onChange={(e) => setEditHospital({ ...editHospital, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={editHospital.emergencyDeptAvailable}
                    onChange={(e) => setEditHospital({ ...editHospital, emergencyDeptAvailable: e.target.checked })}
                  />
                  Emergency Department Available
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditHospital(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
