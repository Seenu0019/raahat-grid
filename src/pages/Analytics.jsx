import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, AlertTriangle, Building2, Ambulance as AmbIcon, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getEmergencies, getHospitals, getAmbulances, getDashboardStats } from '../data/store';
import { EMERGENCY_CATEGORIES, PRIORITY_LEVELS, CASE_STATUSES, AMBULANCE_STATUSES } from '../data/seedData';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function Analytics() {
  const [stats, setStats] = useState(getDashboardStats());
  const [emergencies, setEmergencies] = useState(getEmergencies());
  const [hospitals, setHospitals] = useState(getHospitals());
  const [ambulances, setAmbulances] = useState(getAmbulances());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDashboardStats());
      setEmergencies(getEmergencies());
      setHospitals(getHospitals());
      setAmbulances(getAmbulances());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Category Distribution
  const catData = EMERGENCY_CATEGORIES.map((cat) => ({
    name: cat,
    value: emergencies.filter((e) => e.category === cat).length,
  })).filter((d) => d.value > 0);

  // Priority Distribution
  const priData = PRIORITY_LEVELS.map((p) => ({
    name: p,
    value: emergencies.filter((e) => e.priority === p).length,
  })).filter((d) => d.value > 0);

  // Status Distribution
  const statusData = CASE_STATUSES.map((s) => ({
    name: s,
    value: emergencies.filter((e) => e.status === s).length,
  })).filter((d) => d.value > 0);

  // Hospital Availability
  const hospAvailData = hospitals.map((h) => ({
    name: h.name.length > 16 ? h.name.substring(0, 16) + '…' : h.name,
    available: h.availableBeds,
    total: h.totalBeds,
    utilization: h.totalBeds > 0 ? Math.round(((h.totalBeds - h.availableBeds) / h.totalBeds) * 100) : 0,
  }));

  // Ambulance Utilization
  const ambData = AMBULANCE_STATUSES.map((s) => ({
    name: s,
    value: ambulances.filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0);

  // Completed vs Active
  const completedActive = [
    { name: 'Active', value: stats.activeEmergencies, fill: '#3b82f6' },
    { name: 'Completed', value: stats.completedCases, fill: '#10b981' },
    { name: 'Cancelled', value: stats.cancelledCases, fill: '#94a3b8' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Analytics</span>
        </div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <BarChart3 size={28} /> Analytics & Reports
        </h1>
        <p>Insights from fictional demo data. All statistics are calculated from stored demo records.</p>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info"><h3>{stats.totalEmergencies}</h3><p>Total Emergencies</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Building2 size={24} /></div>
          <div className="stat-info"><h3>{stats.hospitalsAvailable}</h3><p>Hospitals Available</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><AmbIcon size={24} /></div>
          <div className="stat-info"><h3>{stats.ambulancesOnDuty}</h3><p>Ambulances On Duty</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={24} /></div>
          <div className="stat-info"><h3>{stats.completedCases}</h3><p>Completed Cases</p></div>
        </div>
      </div>

      {/* Charts — Row 1 */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div className="card-header"><h2>Emergency Category Distribution</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Cases by Priority</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Cases">
                    {priData.map((entry, i) => {
                      const colorMap = { Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#10b981' };
                      return <Cell key={i} fill={colorMap[entry.name] || '#6366f1'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts — Row 2 */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div className="card-header"><h2>Cases by Status</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Completed vs Active Cases</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completedActive} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {completedActive.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts — Row 3 */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2>Hospital Bed Availability</h2></div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hospAvailData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="available" fill="#10b981" radius={[0, 4, 4, 0]} name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Ambulance Utilization</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ambData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {ambData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        All analytics are derived from fictional demo data. This is a hackathon prototype.
      </div>
    </div>
  );
}
