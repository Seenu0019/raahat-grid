import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search as SearchIcon, Building2, Ambulance as AmbIcon,
  ArrowLeftRight, Clock, MapPin, Phone, User, AlertTriangle,
  CheckCircle, X, ChevronRight,
} from 'lucide-react';
import {
  getEmergencyById, updateEmergency, matchHospitals,
  getHospitalById, getAmbulances, updateAmbulance,
  addTransfer, generateTransferId, getAmbulanceById,
  addActivity, getTransfers,
} from '../data/store';
import { CASE_STATUSES } from '../data/seedData';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { formatDateTime, priorityBadgeClass } from '../utils/helpers';

const WORKFLOW_STEPS = [
  'New',
  'Matching Hospital',
  'Hospital Assigned',
  'Ambulance Assigned',
  'In Transit',
  'Reached Hospital',
  'Completed',
];

export default function EmergencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();

  const [emergency, setEmergency] = useState(() => getEmergencyById(id));
  const [transfers, setTransfers] = useState(() => getTransfers());
  const [matchResults, setMatchResults] = useState(null);
  const [showMatching, setShowMatching] = useState(false);
  const [showAmbulancePicker, setShowAmbulancePicker] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const reload = () => {
    setEmergency(getEmergencyById(id));
    setTransfers(getTransfers());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEmergency(getEmergencyById(id));
      setTransfers(getTransfers());
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (!emergency) {
    return (
      <div>
        <div className="page-header">
          <h1>Emergency Not Found</h1>
          <p>The requested emergency case could not be found.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/emergencies')}>
          <ArrowLeft size={18} /> Back to Cases
        </button>
      </div>
    );
  }

  const assignedHospital = emergency.assignedHospital ? getHospitalById(emergency.assignedHospital) : null;
  const assignedAmbulance = emergency.assignedAmbulance ? getAmbulanceById(emergency.assignedAmbulance) : null;
  const caseTransfers = transfers.filter((t) => t.emergencyId === id);
  const activeTransfer = caseTransfers.find((t) => !['Completed', 'Rejected'].includes(t.status));
  const latestTransfer = caseTransfers[0];

  const handleFindHospitals = () => {
    updateEmergency(id, { status: emergency.status === 'New' ? 'Matching Hospital' : emergency.status });
    const results = matchHospitals(emergency);
    setMatchResults(results);
    setShowMatching(true);
    reload();
  };

  const handleAssignHospital = (hospitalId) => {
    updateEmergency(id, { assignedHospital: hospitalId, status: 'Hospital Assigned' });
    const hospital = getHospitalById(hospitalId);
    addActivity({ type: 'hospital', message: `${hospital.name} assigned to emergency ${id}` });
    addToast(`${hospital.name} assigned to this emergency`, 'success');
    setShowMatching(false);
    setMatchResults(null);
    reload();
  };

  const handleAssignAmbulance = (ambulanceId) => {
    // Release previous ambulance if any
    if (emergency.assignedAmbulance) {
      updateAmbulance(emergency.assignedAmbulance, { status: 'Available', assignedEmergency: null });
    }
    updateAmbulance(ambulanceId, { status: 'Assigned', assignedEmergency: id });
    updateEmergency(id, { assignedAmbulance: ambulanceId, status: 'Ambulance Assigned' });
    addActivity({ type: 'ambulance', message: `Ambulance ${ambulanceId} assigned to emergency ${id}` });
    addToast(`Ambulance ${ambulanceId} assigned`, 'success');
    setShowAmbulancePicker(false);
    reload();
  };

  const handleCreateTransfer = () => {
    if (!emergency.assignedHospital) {
      addToast('Assign a hospital before creating a transfer', 'warning');
      return;
    }
    if (activeTransfer) {
      addToast(`Active transfer ${activeTransfer.id} already exists (${activeTransfer.status})`, 'warning');
      return;
    }
    const tId = generateTransferId();
    addTransfer({
      id: tId,
      emergencyId: id,
      hospitalId: emergency.assignedHospital,
      ambulanceId: emergency.assignedAmbulance,
      status: 'Pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: `Transfer for emergency ${id}. Demo record.`,
    });
    addToast(`Transfer ${tId} created successfully`, 'success');
    reload();
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateEmergency(id, { status: selectedStatus });
    addActivity({ type: 'emergency', message: `Emergency ${id} status updated to ${selectedStatus}` });

    // Release ambulance on completion
    if (selectedStatus === 'Completed' || selectedStatus === 'Cancelled') {
      if (emergency.assignedAmbulance) {
        updateAmbulance(emergency.assignedAmbulance, { status: 'Available', assignedEmergency: null });
        addActivity({ type: 'ambulance', message: `Ambulance ${emergency.assignedAmbulance} released from ${id}` });
      }
    }

    addToast(`Status updated to ${selectedStatus}`, 'success');
    setShowStatusModal(false);
    setSelectedStatus('');
    reload();
  };

  const isTerminal = ['Completed', 'Cancelled'].includes(emergency.status);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/emergencies'); }}>Emergency Cases</a>
          <span className="sep">/</span>
          <span>{emergency.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              {emergency.id}
              <span className={`badge badge-${priorityBadgeClass(emergency.priority)}`}>{emergency.priority}</span>
              <StatusBadge status={emergency.status} />
            </h1>
            <p>{emergency.category} — {emergency.patientName}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {!isTerminal && (
              <button className="btn btn-outline" onClick={() => { setSelectedStatus(emergency.status); setShowStatusModal(true); }}>
                <Clock size={16} /> Update Status
              </button>
            )}
            <button className="btn btn-outline" onClick={() => navigate('/emergencies')}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left — Details */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header"><h2>Patient & Emergency Details</h2></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Patient Name</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {emergency.patientName}</span>
                </div>
                <div className="detail-item">
                  <label>Contact</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {emergency.contactNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Age</label>
                  <span>{emergency.age || '—'}</span>
                </div>
                <div className="detail-item">
                  <label>Category</label>
                  <span>{emergency.category}</span>
                </div>
                <div className="detail-item">
                  <label>Priority</label>
                  <span className={`badge badge-${priorityBadgeClass(emergency.priority)}`}>{emergency.priority}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <StatusBadge status={emergency.status} />
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {emergency.location}</span>
                </div>
                <div className="detail-item">
                  <label>Required Facility</label>
                  <span>{emergency.requiredFacility}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <p>{emergency.notes}</p>
                </div>
                <div className="detail-item">
                  <label>Created</label>
                  <span>{formatDateTime(emergency.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>{formatDateTime(emergency.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><h2>Assigned Resources</h2></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Hospital</label>
                  <span>{assignedHospital ? assignedHospital.name : <em style={{ color: 'var(--color-text-muted)' }}>Not assigned</em>}</span>
                </div>
                <div className="detail-item">
                  <label>Ambulance</label>
                  <span>{assignedAmbulance ? `${assignedAmbulance.id} — ${assignedAmbulance.driverName}` : <em style={{ color: 'var(--color-text-muted)' }}>Not assigned</em>}</span>
                </div>
                <div className="detail-item">
                  <label>Transfer Status</label>
                  <span>
                    {latestTransfer ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); navigate('/transfers'); }}
                          style={{ fontWeight: 600, color: 'var(--color-accent)' }}
                        >
                          {latestTransfer.id}
                        </a>
                        <StatusBadge status={latestTransfer.status} />
                      </div>
                    ) : (
                      <em style={{ color: 'var(--color-text-muted)' }}>No transfer initiated</em>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div>
          {/* Actions Panel */}
          {!isTerminal && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="card-header"><h2>Quick Actions</h2></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <button className="btn btn-primary" onClick={handleFindHospitals} style={{ justifyContent: 'center' }}>
                  <SearchIcon size={18} /> Find Suitable Hospitals
                </button>
                <button className="btn btn-warning" onClick={() => setShowAmbulancePicker(true)} style={{ justifyContent: 'center' }}>
                  <AmbIcon size={18} /> Assign Ambulance
                </button>
                {activeTransfer ? (
                  <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Active Transfer: {activeTransfer.id}</span>
                      <StatusBadge status={activeTransfer.status} />
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate('/transfers')}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <ArrowLeftRight size={14} /> Open in Transfer Coordination
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={handleCreateTransfer}
                    disabled={!emergency.assignedHospital}
                    style={{ justifyContent: 'center' }}
                  >
                    <ArrowLeftRight size={18} /> Create Transfer Request
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Workflow Steps */}
          <div className="card">
            <div className="card-header"><h2>Case Workflow</h2></div>
            <div className="card-body">
              {emergency.status === 'Cancelled' && (
                <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-light)', marginBottom: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <X size={16} /> Case Cancelled
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    This case has been cancelled and is no longer advancing through the emergency care workflow.
                  </p>
                </div>
              )}
              {WORKFLOW_STEPS.map((s, i) => {
                const current = WORKFLOW_STEPS.indexOf(emergency.status);
                const isPast = emergency.status !== 'Cancelled' && current !== -1 && i < current;
                const isCurrent = emergency.status !== 'Cancelled' && s === emergency.status;
                const opacity = emergency.status === 'Cancelled' ? 0.35 : (isPast || isCurrent ? 1 : 0.4);
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '8px 0', opacity }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCurrent ? 'var(--color-accent)' : isPast ? 'var(--color-success)' : 'var(--color-bg)',
                      color: isCurrent || isPast ? 'white' : 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {isPast ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 600 : 400, color: isCurrent ? 'var(--color-accent)' : undefined }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Matching Modal */}
      {showMatching && (
        <div className="modal-overlay" onClick={() => setShowMatching(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hospital Matching Results</h2>
              <button className="btn-ghost" onClick={() => setShowMatching(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Matching hospitals for required facility: <strong>{emergency.requiredFacility}</strong>
                <br /><em style={{ fontSize: '0.75rem' }}>Scores are calculated from demo data. All distances are simulated.</em>
              </p>
              {matchResults && matchResults.length === 0 ? (
                <div className="empty-state">
                  <AlertTriangle size={48} style={{ color: 'var(--color-warning)' }} />
                  <h3>No Suitable Hospitals Found</h3>
                  <p>No hospital currently matches the required facility and availability criteria. Try updating hospital availability in the Hospital Network.</p>
                </div>
              ) : (
                matchResults && matchResults.map((r, idx) => (
                  <div key={r.hospital.id} className={`match-card ${idx === 0 ? 'recommended' : ''}`}>
                    <div className="match-score">{r.score}</div>
                    <div style={{ paddingRight: 60 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                        <Building2 size={18} style={{ color: 'var(--color-accent)' }} />
                        <strong style={{ fontSize: '1rem' }}>{r.hospital.name}</strong>
                        {idx === 0 && <span className="badge badge-success" style={{ marginLeft: 8 }}>Top Recommendation</span>}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '4px 0' }}>{r.hospital.address}</p>
                      <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                        <span>Distance: {r.distance.toFixed(1)} km</span>
                        <span>Beds: {r.hospital.availableBeds}/{r.hospital.totalBeds}</span>
                        <span>ICU: {r.hospital.availableIcuBeds}/{r.hospital.icuBeds}</span>
                      </div>
                      <ul className="match-reasons">
                        {r.reasons.map((reason, ri) => (
                          <li key={ri}>{reason}</li>
                        ))}
                      </ul>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => handleAssignHospital(r.hospital.id)}>
                        Assign This Hospital <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ambulance Picker Modal */}
      {showAmbulancePicker && (
        <AmbulancePicker
          onSelect={handleAssignAmbulance}
          onClose={() => setShowAmbulancePicker(false)}
          currentAmbulance={emergency.assignedAmbulance}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Update Case Status</h2>
              <button className="btn-ghost" onClick={() => setShowStatusModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {(selectedStatus === 'Completed' || selectedStatus === 'Cancelled') && emergency.assignedAmbulance && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-warning)', marginBottom: 'var(--space-md)' }}>
                  ⚠ The assigned ambulance will be released and marked available.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ambulance picker sub-component
function AmbulancePicker({ onSelect, onClose }) {
  const ambulances = getAmbulances();
  const available = ambulances.filter((a) => a.status === 'Available');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Ambulance</h2>
          <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {available.length === 0 ? (
            <div className="empty-state">
              <AmbIcon size={48} style={{ color: 'var(--color-text-muted)' }} />
              <h3>No Ambulances Available</h3>
              <p>All ambulances are currently assigned or offline. Check the Ambulance Fleet for availability.</p>
            </div>
          ) : (
            available.map((a) => (
              <div key={a.id} className="match-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{a.id}</strong> — {a.vehicleType}
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Driver: {a.driverName} • Location: {a.currentLocation}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {a.equipment.map((eq) => <span key={eq} className="tag">{eq}</span>)}
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onSelect(a.id)}>
                  Assign
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
