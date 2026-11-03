import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Plus, CheckCircle, XCircle, Inbox,
} from 'lucide-react';
import {
  getTransfers, updateTransfer, getEmergencies,
  getEmergencyById, getHospitalById, getAmbulanceById,
  addTransfer, generateTransferId, addActivity, updateEmergency, updateAmbulance,
} from '../data/store';
import { TRANSFER_STATUSES } from '../data/seedData';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { formatDateTime } from '../utils/helpers';

export default function TransferCoordination() {
  const [transfers, setTransfers] = useState(() => getTransfers());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTransfer, setNewTransfer] = useState({ emergencyId: '', notes: '' });
  const navigate = useNavigate();
  const addToast = useToast();

  const reload = () => setTransfers(getTransfers());

  useEffect(() => {
    const interval = setInterval(reload, 2000);
    return () => clearInterval(interval);
  }, []);

  const emergencies = getEmergencies();
  const eligibleEmergencies = emergencies.filter(
    (e) => e.assignedHospital && !['Completed', 'Cancelled'].includes(e.status)
  );

  let filtered = transfers.filter((t) => {
    const q = search.toLowerCase();
    const match = !q || t.id.toLowerCase().includes(q) || t.emergencyId.toLowerCase().includes(q);
    const matchStatus = !filterStatus || t.status === filterStatus;
    return match && matchStatus;
  });

  const handleCreate = () => {
    if (!newTransfer.emergencyId) {
      addToast('Select an emergency case', 'warning');
      return;
    }
    const em = getEmergencyById(newTransfer.emergencyId);
    if (!em || !em.assignedHospital) {
      addToast('Selected emergency must have an assigned hospital', 'warning');
      return;
    }
    const tId = generateTransferId();
    addTransfer({
      id: tId,
      emergencyId: em.id,
      hospitalId: em.assignedHospital,
      ambulanceId: em.assignedAmbulance,
      status: 'Pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: newTransfer.notes || `Transfer for ${em.id}. Demo record.`,
    });
    addToast(`Transfer ${tId} created`, 'success');
    setShowCreate(false);
    setNewTransfer({ emergencyId: '', notes: '' });
    reload();
  };

  const handleStatusChange = (transferId, newStatus) => {
    updateTransfer(transferId, { status: newStatus });
    addActivity({ type: 'transfer', message: `Transfer ${transferId} status changed to ${newStatus}` });

    // Update related emergency status
    const transfer = getTransfers().find((t) => t.id === transferId);
    if (transfer) {
      if (newStatus === 'Accepted') {
        // Confirmed by hospital
      } else if (newStatus === 'Rejected') {
        // Release assigned ambulance IF it is still assigned to this emergency
        if (transfer.ambulanceId) {
          const currentAmb = getAmbulanceById(transfer.ambulanceId);
          if (currentAmb && currentAmb.assignedEmergency === transfer.emergencyId) {
            updateAmbulance(transfer.ambulanceId, {
              status: 'Available',
              assignedEmergency: null,
            });
            addActivity({
              type: 'ambulance',
              message: `Ambulance ${transfer.ambulanceId} released back to Available (Transfer ${transferId} rejected)`,
            });
          }
        }

        // Return emergency back to Matching Hospital so coordinators can reassign
        const currentEm = getEmergencyById(transfer.emergencyId);
        if (currentEm && currentEm.status !== 'Completed' && currentEm.status !== 'Cancelled') {
          updateEmergency(transfer.emergencyId, {
            status: 'Matching Hospital',
            assignedHospital: null,
            assignedAmbulance: null,
          });
          addActivity({
            type: 'emergency',
            message: `Emergency ${transfer.emergencyId} status returned to Matching Hospital after transfer rejection`,
          });
        }
      } else if (newStatus === 'In Transit') {
        updateEmergency(transfer.emergencyId, { status: 'In Transit' });
        if (transfer.ambulanceId) {
          updateAmbulance(transfer.ambulanceId, { status: 'En Route' });
        }
      } else if (newStatus === 'Arrived') {
        updateEmergency(transfer.emergencyId, { status: 'Reached Hospital' });
      } else if (newStatus === 'Completed') {
        updateEmergency(transfer.emergencyId, { status: 'Completed' });
        if (transfer.ambulanceId) {
          updateAmbulance(transfer.ambulanceId, { status: 'Available', assignedEmergency: null });
        }
      }
    }

    if (newStatus === 'Rejected') {
      addToast(`Transfer ${transferId} was rejected. Ambulance released and emergency returned to matching queue.`, 'warning');
    } else {
      addToast(`Transfer updated to ${newStatus}`, 'success');
    }
    setSelectedTransfer(null);
    reload();
  };

  const getNextStatuses = (current) => {
    const flow = {
      Pending: ['Accepted', 'Rejected'],
      Accepted: ['In Transit'],
      'In Transit': ['Arrived'],
      Arrived: ['Completed'],
    };
    return flow[current] || [];
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Transfer Coordination</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1>Transfer Coordination</h1>
            <p>Manage patient transfers between emergency sites and hospitals</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New Transfer
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input placeholder="Search by transfer ID or emergency ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {TRANSFER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Inbox size={64} className="icon" />
              <h3>No Transfers Found</h3>
              <p>Create a transfer from an emergency case, or click "New Transfer" above.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Emergency</th>
                    <th>Hospital</th>
                    <th>Ambulance</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const hospital = getHospitalById(t.hospitalId);
                    return (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{t.id}</td>
                        <td>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); navigate(`/emergencies/${t.emergencyId}`); }}
                            style={{ fontWeight: 500 }}
                          >
                            {t.emergencyId}
                          </a>
                        </td>
                        <td>{hospital ? hospital.name : t.hospitalId}</td>
                        <td>{t.ambulanceId || '—'}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => setSelectedTransfer(t)}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Transfer</h2>
              <button className="btn-ghost" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Emergency Case <span className="required">*</span></label>
                <select className="form-select" value={newTransfer.emergencyId}
                  onChange={(e) => setNewTransfer({ ...newTransfer, emergencyId: e.target.value })}
                >
                  <option value="">Select an emergency case</option>
                  {eligibleEmergencies.map((e) => (
                    <option key={e.id} value={e.id}>{e.id} — {e.patientName} ({e.category})</option>
                  ))}
                </select>
                {eligibleEmergencies.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', marginTop: 4 }}>
                    No eligible emergencies. Cases must have an assigned hospital and not be completed/cancelled.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} placeholder="Transfer notes…"
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Management Modal */}
      {selectedTransfer && (
        <div className="modal-overlay" onClick={() => setSelectedTransfer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transfer {selectedTransfer.id}</h2>
              <button className="btn-ghost" onClick={() => setSelectedTransfer(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Transfer ID</label><span>{selectedTransfer.id}</span></div>
                <div className="detail-item"><label>Status</label><StatusBadge status={selectedTransfer.status} /></div>
                <div className="detail-item"><label>Emergency</label><span>{selectedTransfer.emergencyId}</span></div>
                <div className="detail-item"><label>Hospital</label><span>{getHospitalById(selectedTransfer.hospitalId)?.name || selectedTransfer.hospitalId}</span></div>
                <div className="detail-item"><label>Ambulance</label><span>{selectedTransfer.ambulanceId || 'Not assigned'}</span></div>
                <div className="detail-item"><label>Created</label><span>{formatDateTime(selectedTransfer.createdAt)}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <p>{selectedTransfer.notes}</p>
                </div>
              </div>

              {/* Status Actions */}
              {getNextStatuses(selectedTransfer.status).length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
                  <label className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Update Transfer Status</label>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {getNextStatuses(selectedTransfer.status).map((ns) => (
                      <button
                        key={ns}
                        className={`btn ${ns === 'Rejected' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleStatusChange(selectedTransfer.id, ns)}
                      >
                        {ns === 'Rejected' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        {ns}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransfer.status === 'Completed' && (
                <p style={{ marginTop: 'var(--space-lg)', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} /> Transfer completed successfully
                </p>
              )}
              {selectedTransfer.status === 'Rejected' && (
                <p style={{ marginTop: 'var(--space-lg)', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={18} /> Transfer was rejected
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
