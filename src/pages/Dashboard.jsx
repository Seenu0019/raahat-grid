import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  BedDouble,
  Ambulance as AmbIcon,
  ArrowLeftRight,
  Activity,
  Clock,
  TrendingUp,
  Plus,
  ShieldAlert,
  MapPin,
  ChevronRight,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  getDashboardStats,
  getEmergencies,
  getActivities,
  getHospitals,
  getAmbulances,
  getTransfers,
} from '../data/store';
import StatusBadge from '../components/StatusBadge';
import { timeAgo } from '../utils/helpers';

const PIE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#0d9488', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => getDashboardStats());
  const [emergencies, setEmergencies] = useState(() => getEmergencies());
  const [activities, setActivities] = useState(() => getActivities());
  const [hospitals, setHospitals] = useState(() => getHospitals());
  const [ambulances, setAmbulances] = useState(() => getAmbulances());
  const [transfers, setTransfers] = useState(() => getTransfers());
  const [tableFilter, setTableFilter] = useState('all'); // 'all', 'active', 'critical'
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh data every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDashboardStats());
      setEmergencies(getEmergencies());
      setActivities(getActivities());
      setHospitals(getHospitals());
      setAmbulances(getAmbulances());
      setTransfers(getTransfers());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Priority counts
  const criticalCount = emergencies.filter((e) => e.priority === 'Critical').length;
  const highCount = emergencies.filter((e) => e.priority === 'High').length;
  const activeEmergenciesList = emergencies.filter((e) =>
    ['New', 'Matching Hospital', 'Hospital Assigned', 'Ambulance Assigned', 'In Transit', 'Reached Hospital'].includes(e.status)
  );

  // Critical cases requiring immediate attention
  const urgentQueue = emergencies.filter(
    (e) => e.priority === 'Critical' && ['New', 'Matching Hospital'].includes(e.status)
  );

  // Hospital calculations
  const totalIcuBedsAvailable = hospitals.reduce((sum, h) => sum + (h.availableIcuBeds || 0), 0);
  const edAvailableCount = hospitals.filter((h) => h.emergencyDeptAvailable).length;

  // Ambulance fleet calculations
  const fleetAvailable = ambulances.filter((a) => a.status === 'Available').length;
  const fleetEnRoute = ambulances.filter((a) => a.status === 'En Route').length;
  const fleetAssigned = ambulances.filter((a) => a.status === 'Assigned').length;
  const fleetOffline = ambulances.filter((a) => a.status === 'Offline' || a.status === 'Busy').length;
  const totalFleet = ambulances.length || 1;

  // Filtered emergency cases for table
  const displayedEmergencies = emergencies.filter((e) => {
    if (tableFilter === 'active') return activeEmergenciesList.some((ae) => ae.id === e.id);
    if (tableFilter === 'critical') return e.priority === 'Critical';
    return true;
  }).slice(0, 6);

  // Chart data
  const categoryData = emergencies.reduce((acc, e) => {
    const cat = e.category || 'Other';
    const existing = acc.find((a) => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const statusData = emergencies.reduce((acc, e) => {
    const s = e.status || 'Unknown';
    const existing = acc.find((a) => a.name === s);
    if (existing) existing.value++;
    else acc.push({ name: s, value: 1 });
    return acc;
  }, []);

  // Priority badge styling
  const renderPriorityPill = (priority) => {
    const pClass = (priority || '').toLowerCase();
    return (
      <span className={`priority-pill ${pClass}`}>
        <span className="priority-dot" />
        {priority}
      </span>
    );
  };

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div>
      {/* ============================================================ */}
      {/* 1. COMMAND CENTER HEADER & WELCOME */}
      {/* ============================================================ */}
      <div className="command-header">
        <div>
          <div className="command-badge">
            <span className="pulse-dot-green" />
            <span>NATIONAL HEALTHCARE EMERGENCY COMMAND GRID • ACTIVE MONITORING</span>
          </div>
          <h1 className="command-title">Emergency Healthcare Command Center</h1>
          <p className="command-subtitle">
            Situational awareness across <strong>{hospitals.length} Regional Hospitals</strong>, <strong>{ambulances.length} Emergency Ambulances</strong>, and active patient triage queues.
          </p>
        </div>

        <div className="command-header-actions">
          <div className="live-clock-card">
            <div className="clock-time">{formattedTime}</div>
            <div className="clock-label">
              <Clock size={12} /> {formattedDate} (IST)
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ padding: '10px 18px' }}>
            <Plus size={18} /> Register Emergency
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CRITICAL TRIAGE ATTENTION BANNER */}
      {/* ============================================================ */}
      {urgentQueue.length > 0 && (
        <div className="emergency-alert-banner">
          <div className="alert-banner-left">
            <span className="pulse-dot-red" />
            <ShieldAlert size={22} style={{ color: '#ef4444' }} />
            <div>
              <div className="alert-banner-text">
                IMMEDIATE TRIAGE REQUIRED: {urgentQueue.length} Critical emergency {urgentQueue.length > 1 ? 'cases are' : 'case is'} awaiting hospital match or ambulance assignment.
              </div>
              <div className="alert-banner-meta">
                Patients: {urgentQueue.map((u) => `${u.patientName} (${u.category})`).join(' • ')}
              </div>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => navigate('/emergencies')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Review Queue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. INTERACTIVE COMMAND KPI STATISTICS CARDS */}
      {/* ============================================================ */}
      <div className="command-stats-grid">
        {/* KPI 1: Active Emergencies */}
        <div className="command-stat-card accent-red" onClick={() => navigate('/emergencies')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Active Triage</span>
            <div className="stat-icon-wrapper red">
              <Activity size={18} />
            </div>
          </div>
          <div className="command-stat-value">{stats.activeEmergencies}</div>
          <div className="command-stat-micro" style={{ color: '#dc2626', fontWeight: 600 }}>
            {criticalCount} Critical • {highCount} High
          </div>
        </div>

        {/* KPI 2: Total Emergencies */}
        <div className="command-stat-card accent-navy" onClick={() => navigate('/emergencies')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Total Cases</span>
            <div className="stat-icon-wrapper navy">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="command-stat-value">{stats.totalEmergencies}</div>
          <div className="command-stat-micro">
            {stats.completedCases} Resolved • {stats.cancelledCases} Cancelled
          </div>
        </div>

        {/* KPI 3: Hospitals Available */}
        <div className="command-stat-card accent-teal" onClick={() => navigate('/hospitals')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Hospitals Ready</span>
            <div className="stat-icon-wrapper teal">
              <Building2 size={18} />
            </div>
          </div>
          <div className="command-stat-value">
            {stats.hospitalsAvailable} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {hospitals.length}</span>
          </div>
          <div className="command-stat-micro" style={{ color: '#0d9488', fontWeight: 600 }}>
            {edAvailableCount} Emergency Depts Open
          </div>
        </div>

        {/* KPI 4: Available Bed Capacity */}
        <div className="command-stat-card accent-green" onClick={() => navigate('/hospitals')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Available Beds</span>
            <div className="stat-icon-wrapper green">
              <BedDouble size={18} />
            </div>
          </div>
          <div className="command-stat-value">{stats.totalBeds}</div>
          <div className="command-stat-micro" style={{ color: '#059669', fontWeight: 600 }}>
            {totalIcuBedsAvailable} ICU Critical Care Beds
          </div>
        </div>

        {/* KPI 5: Ambulance Fleet */}
        <div className="command-stat-card accent-amber" onClick={() => navigate('/ambulances')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Ambulances Ready</span>
            <div className="stat-icon-wrapper amber">
              <AmbIcon size={18} />
            </div>
          </div>
          <div className="command-stat-value">
            {stats.ambulancesOnDuty} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {ambulances.length}</span>
          </div>
          <div className="command-stat-micro" style={{ color: '#d97706', fontWeight: 600 }}>
            {fleetEnRoute} En Route • {fleetAvailable} Standby
          </div>
        </div>

        {/* KPI 6: Active Transfers */}
        <div className="command-stat-card accent-blue" onClick={() => navigate('/transfers')}>
          <div className="stat-header-row">
            <span className="command-stat-label">Active Transfers</span>
            <div className="stat-icon-wrapper blue">
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div className="command-stat-value">{stats.activeTransfers}</div>
          <div className="command-stat-micro">
            {transfers.filter((t) => t.status === 'In Transit').length} In Transit • {transfers.filter((t) => t.status === 'Pending').length} Pending
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN COMMAND CENTER GRID (7fr / 5fr) */}
      {/* ============================================================ */}
      <div className="command-main-grid">
        {/* ============================================================ */}
        {/* LEFT COLUMN: ACTIVE EMERGENCY QUEUE & ANALYTICS CHARTS */}
        {/* ============================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Active Emergency Queue Table */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', margin: 0 }}>
                  <Activity size={18} style={{ color: '#ef4444' }} />
                  Emergency Dispatch & Triage Queue
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Showing latest cases requiring medical facility matching or transport
                </p>
              </div>

              {/* Table Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className={`btn btn-sm ${tableFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTableFilter('all')}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  All ({emergencies.length})
                </button>
                <button
                  className={`btn btn-sm ${tableFilter === 'active' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTableFilter('active')}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  Active ({activeEmergenciesList.length})
                </button>
                <button
                  className={`btn btn-sm ${tableFilter === 'critical' ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => setTableFilter('critical')}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  Critical ({criticalCount})
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => navigate('/emergencies')}
                  style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#0284c7' }}
                >
                  View All &rarr;
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Patient</th>
                      <th>Category & Required Care</th>
                      <th>Priority</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEmergencies.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '36px 16px' }}>
                          No emergencies matching current filter.
                        </td>
                      </tr>
                    ) : (
                      displayedEmergencies.map((e) => {
                        const initials = (e.patientName || 'P')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={e.id} className="clickable" onClick={() => navigate(`/emergencies/${e.id}`)}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                              {e.id}
                            </td>
                            <td>
                              <div className="patient-cell">
                                <div className="patient-avatar">{initials}</div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{e.patientName}</div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                    {e.age ? `${e.age} yrs` : 'Age: —'} • {timeAgo(e.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{e.category}</div>
                              <div style={{ fontSize: '0.75rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Stethoscope size={12} /> {e.requiredFacility}
                              </div>
                            </td>
                            <td>{renderPriorityPill(e.priority)}</td>
                            <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: '#475569' }}>
                                <MapPin size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                                {e.location}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={e.status} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                             <button
                             className="btn-coordinate"
                            onClick={(evt) => {
                             evt.stopPropagation();
                              navigate(`/emergencies/${e.id}`);
                           }}
                            >
                            {['Completed', 'Cancelled'].includes(e.status) ? 'View' : 'Coordinate'} <ChevronRight size={13} />
                       </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Analytics Charts Row */}
          <div className="grid-2">
            {/* Category Breakdown Donut */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700 }}>Triage Category Volume</h2>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>Distribution across medical conditions</p>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: 240, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.8rem',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Visual Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', justifyContent: 'center', marginTop: 8 }}>
                  {categoryData.slice(0, 5).map((item, idx) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#475569' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span>{item.name}: <strong>{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifecycle Volume Bar Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700 }}>Workflow Lifecycle Volume</h2>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>Case volume across coordination stages</p>
                </div>
                <TrendingUp size={16} style={{ color: '#0284c7' }} />
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} name="Cases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: HOSPITAL READINESS, FLEET & ACTIVITY STREAM */}
        {/* ============================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Hospital Readiness Monitor Widget */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.02rem', margin: 0 }}>
                  <Building2 size={18} style={{ color: '#0d9488' }} />
                  Hospital Capacity Monitor
                </h2>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>Live bed availability across regional hospitals</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/hospitals')}
                style={{ color: '#0d9488', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
              >
                All Hospitals &rarr;
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {hospitals.slice(0, 4).map((h) => {
                const total = h.totalBeds || 1;
                const pct = Math.round(((h.availableBeds || 0) / total) * 100);
                const fillClass = pct > 25 ? 'high' : pct > 10 ? 'medium' : 'low';

                return (
                  <div key={h.id} className="hospital-row-item">
                    <div className="hospital-header-line">
                      <div className="hospital-name-text">
                        <span>{h.name}</span>
                      </div>
                      <span className={`ed-indicator-tag ${h.emergencyDeptAvailable ? 'active' : 'inactive'}`}>
                        {h.emergencyDeptAvailable ? '24/7 ED Active' : 'ED Unavailable'}
                      </span>
                    </div>

                    <div className="hospital-bar-wrap">
                      <div className={`hospital-bar-fill ${fillClass}`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                    </div>

                    <div className="hospital-meta-line">
                      <span><strong>{h.availableBeds}</strong> free of {h.totalBeds} beds ({pct}%)</span>
                      <span style={{ color: h.availableIcuBeds > 0 ? '#0f766e' : '#dc2626', fontWeight: 600 }}>
                        {h.availableIcuBeds} ICU ready
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ambulance Fleet Readiness Widget */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.02rem', margin: 0 }}>
                  <AmbIcon size={18} style={{ color: '#f59e0b' }} />
                  Ambulance Fleet Status
                </h2>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>Readiness breakdown of registered units</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/ambulances')}
                style={{ color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
              >
                Fleet &rarr;
              </button>
            </div>
            <div className="card-body">
              {/* Stacked Bar */}
              <div className="fleet-stacked-bar">
                <div className="fleet-seg available" style={{ width: `${(fleetAvailable / totalFleet) * 100}%` }} title={`Available: ${fleetAvailable}`} />
                <div className="fleet-seg en-route" style={{ width: `${(fleetEnRoute / totalFleet) * 100}%` }} title={`En Route: ${fleetEnRoute}`} />
                <div className="fleet-seg assigned" style={{ width: `${(fleetAssigned / totalFleet) * 100}%` }} title={`Assigned: ${fleetAssigned}`} />
                <div className="fleet-seg offline" style={{ width: `${(fleetOffline / totalFleet) * 100}%` }} title={`Offline: ${fleetOffline}`} />
              </div>

              {/* Status Grid */}
              <div className="fleet-pill-grid">
                <div className="fleet-stat-box" style={{ borderTop: '2px solid #10b981' }}>
                  <div className="fleet-stat-count" style={{ color: '#059669' }}>{fleetAvailable}</div>
                  <div className="fleet-stat-label">Available</div>
                </div>
                <div className="fleet-stat-box" style={{ borderTop: '2px solid #f59e0b' }}>
                  <div className="fleet-stat-count" style={{ color: '#d97706' }}>{fleetEnRoute}</div>
                  <div className="fleet-stat-label">En Route</div>
                </div>
                <div className="fleet-stat-box" style={{ borderTop: '2px solid #0284c7' }}>
                  <div className="fleet-stat-count" style={{ color: '#0284c7' }}>{fleetAssigned}</div>
                  <div className="fleet-stat-label">Assigned</div>
                </div>
                <div className="fleet-stat-box" style={{ borderTop: '2px solid #94a3b8' }}>
                  <div className="fleet-stat-count" style={{ color: '#64748b' }}>{fleetOffline}</div>
                  <div className="fleet-stat-label">Offline</div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Command Activity Feed */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.02rem', margin: 0 }}>
                  <Clock size={18} style={{ color: '#64748b' }} />
                  Live Coordination Log
                </h2>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>Real-time audit log of platform operations</p>
              </div>
            </div>
            <div className="card-body">
              {activities.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 8px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No activity logged yet.</p>
                </div>
              ) : (
                <div className="activity-rail">
                  {activities.slice(0, 6).map((a) => {
                    let IconNode = Activity;
                    if (a.type === 'hospital') IconNode = Building2;
                    else if (a.type === 'ambulance') IconNode = AmbIcon;
                    else if (a.type === 'transfer') IconNode = ArrowLeftRight;

                    return (
                      <div className="activity-rail-item" key={a.id}>
                        <div className={`activity-node ${a.type || 'emergency'}`}>
                          <IconNode size={14} />
                        </div>
                        <div className="activity-detail-col">
                          <div className="activity-message-text">{a.message}</div>
                          <div className="activity-time-text">{timeAgo(a.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
