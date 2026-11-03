import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Inbox } from 'lucide-react';
import { getEmergencies } from '../data/store';
import { EMERGENCY_CATEGORIES, PRIORITY_LEVELS, CASE_STATUSES } from '../data/seedData';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, priorityBadgeClass } from '../utils/helpers';

export default function EmergencyCases() {
  const [emergencies, setEmergencies] = useState(() => getEmergencies());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setEmergencies(getEmergencies()), 2000);
    return () => clearInterval(interval);
  }, []);

  let filtered = emergencies.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.id.toLowerCase().includes(q) || e.patientName.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchesCat = !filterCategory || e.category === filterCategory;
    const matchesPri = !filterPriority || e.priority === filterPriority;
    const matchesStat = !filterStatus || e.status === filterStatus;
    return matchesSearch && matchesCat && matchesPri && matchesStat;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
    if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
    if (sortBy === 'priority') {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    }
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Emergency Cases</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1>Emergency Cases</h1>
            <p>Manage and track all emergency cases ({filtered.length} of {emergencies.length})</p>
          </div>
          <button className="btn btn-danger" onClick={() => navigate('/register')}>
            <Plus size={18} /> New Emergency
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input
            placeholder="Search by ID, patient name, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {EMERGENCY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ minWidth: 140 }}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Inbox size={64} className="icon" />
              <h3>No Emergency Cases Found</h3>
              <p>{search || filterCategory || filterPriority || filterStatus ? 'Try adjusting your filters' : 'Register a new emergency to get started'}</p>
              <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={() => navigate('/register')}>
                <Plus size={18} /> Register Emergency
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emergency ID</th>
                    <th>Patient</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="clickable" onClick={() => navigate(`/emergencies/${e.id}`)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{e.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.patientName}</div>
                        {e.age && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Age: {e.age}</div>}
                      </td>
                      <td>{e.category}</td>
                      <td><span className={`badge badge-${priorityBadgeClass(e.priority)}`}>{e.priority}</span></td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDateTime(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
