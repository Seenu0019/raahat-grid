import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FilePlus,
  Building2,
  Ambulance,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardStats } from '../data/store';

const navItems = [
  { label: 'Command Center', section: true },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { label: 'Operations & Triage', section: true },
  { to: '/emergencies', icon: AlertTriangle, label: 'Emergency Cases', badgeKey: 'activeEmergencies', badgeColor: 'red' },
  { to: '/register', icon: FilePlus, label: 'Register Emergency' },
  { to: '/hospitals', icon: Building2, label: 'Hospital Network' },
  { to: '/ambulances', icon: Ambulance, label: 'Ambulance Fleet' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfer Coordination', badgeKey: 'activeTransfers', badgeColor: 'blue' },
  { label: 'Intelligence', section: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics & Insights' },
  { label: 'Platform', section: true },
  { to: '/settings', icon: Settings, label: 'Settings & Demo' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(() => getDashboardStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDashboardStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open Navigation">
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">RG</div>
          <div>
            <h1>RAAHAT GRID</h1>
            <span>Command & Dispatch</span>
          </div>
          {mobileOpen && (
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Live System Status Beacon */}
        <div className="sidebar-status-banner">
          <span className="pulse-dot-green" />
          <span>LIVE GRID ACTIVE</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className="sidebar-section-label">
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon;
            const badgeCount = item.badgeKey ? stats[item.badgeKey] : null;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="icon" size={19} />
                <span>{item.label}</span>
                {badgeCount !== null && badgeCount > 0 && (
                  <span className={`nav-count-badge ${item.badgeColor || 'blue'}`}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <ShieldAlert size={12} style={{ color: '#0d9488' }} />
            <span>RAAHAT GRID Prototype</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Simulated demo data • Not a live system</span>
        </div>
      </aside>
    </>
  );
}
