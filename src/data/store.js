// ============================================================
// RAAHAT GRID — LocalStorage Data Store
// Provides CRUD operations for all modules with LocalStorage
// persistence. All demo data is clearly fictional.
// ============================================================

import {
  seedHospitals,
  seedAmbulances,
  seedEmergencies,
  seedTransfers,
  seedActivities,
} from './seedData';

const STORAGE_KEYS = {
  hospitals: 'raahatgrid_hospitals',
  ambulances: 'raahatgrid_ambulances',
  emergencies: 'raahatgrid_emergencies',
  transfers: 'raahatgrid_transfers',
  activities: 'raahatgrid_activities',
  initialized: 'raahatgrid_initialized',
};

// --- Helpers ---
function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Initialization ---
export function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
    write(STORAGE_KEYS.hospitals, seedHospitals);
    write(STORAGE_KEYS.ambulances, seedAmbulances);
    write(STORAGE_KEYS.emergencies, seedEmergencies);
    write(STORAGE_KEYS.transfers, seedTransfers);
    write(STORAGE_KEYS.activities, seedActivities);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
    return;
  }

  // Reconcile existing stored demo data if AMB-103 was previously initialized as unassigned
  try {
    const ambulances = getAmbulances();
    const amb103 = ambulances.find((a) => a.id === 'AMB-103');
    if (amb103 && amb103.status === 'Available' && !amb103.assignedEmergency) {
      const emergencies = getEmergencies();
      const em2 = emergencies.find((e) => e.id === 'EM-20261102-002');
      if (em2 && em2.assignedAmbulance === 'AMB-103' && em2.status === 'In Transit') {
        updateAmbulance('AMB-103', {
          status: 'En Route',
          assignedEmergency: 'EM-20261102-002',
        });
      }
    }
  } catch {
    // Non-blocking fallback
  }
}

export function resetAllData() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  initializeData();
}

// ========== HOSPITALS ==========
export function getHospitals() {
  return read(STORAGE_KEYS.hospitals) || [];
}
export function getHospitalById(id) {
  return getHospitals().find((h) => h.id === id) || null;
}
export function updateHospital(id, updates) {
  const list = getHospitals().map((h) => (h.id === id ? { ...h, ...updates } : h));
  write(STORAGE_KEYS.hospitals, list);
  return list.find((h) => h.id === id);
}

// ========== AMBULANCES ==========
export function getAmbulances() {
  return read(STORAGE_KEYS.ambulances) || [];
}
export function getAmbulanceById(id) {
  return getAmbulances().find((a) => a.id === id) || null;
}
export function updateAmbulance(id, updates) {
  const list = getAmbulances().map((a) => (a.id === id ? { ...a, ...updates } : a));
  write(STORAGE_KEYS.ambulances, list);
  return list.find((a) => a.id === id);
}

// ========== EMERGENCIES ==========
export function getEmergencies() {
  return read(STORAGE_KEYS.emergencies) || [];
}
export function getEmergencyById(id) {
  return getEmergencies().find((e) => e.id === id) || null;
}
export function addEmergency(data) {
  const list = getEmergencies();
  list.unshift(data);
  write(STORAGE_KEYS.emergencies, list);
  addActivity({
    type: 'emergency',
    message: `Emergency ${data.id} registered — ${data.category} (${data.priority})`,
  });
  return data;
}
export function updateEmergency(id, updates) {
  const list = getEmergencies().map((e) => (e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e));
  write(STORAGE_KEYS.emergencies, list);
  return list.find((e) => e.id === id);
}
export function generateEmergencyId() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const existing = getEmergencies().filter((e) => e.id.includes(dateStr));
  const seq = String(existing.length + 1).padStart(3, '0');
  return `EM-${dateStr}-${seq}`;
}

// ========== TRANSFERS ==========
export function getTransfers() {
  return read(STORAGE_KEYS.transfers) || [];
}
export function getTransferById(id) {
  return getTransfers().find((t) => t.id === id) || null;
}
export function addTransfer(data) {
  const list = getTransfers();
  list.unshift(data);
  write(STORAGE_KEYS.transfers, list);
  addActivity({
    type: 'transfer',
    message: `Transfer ${data.id} created for emergency ${data.emergencyId}`,
  });
  return data;
}
export function updateTransfer(id, updates) {
  const list = getTransfers().map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t));
  write(STORAGE_KEYS.transfers, list);
  return list.find((t) => t.id === id);
}
export function generateTransferId() {
  const list = getTransfers();
  const seq = String(list.length + 1).padStart(3, '0');
  return `TRF-${seq}`;
}

// ========== ACTIVITIES ==========
export function getActivities() {
  return read(STORAGE_KEYS.activities) || [];
}
export function addActivity({ type, message }) {
  const list = getActivities();
  const id = `ACT-${Date.now()}`;
  list.unshift({ id, type, message, timestamp: Date.now() });
  if (list.length > 100) list.length = 100; // cap
  write(STORAGE_KEYS.activities, list);
}

// ========== HOSPITAL MATCHING ENGINE ==========
/**
 * Finds and ranks hospitals suitable for a given emergency.
 * Scoring is transparent:
 *  - facilityMatch: 40 pts if hospital has the required facility
 *  - bedAvailability: up to 25 pts based on available beds
 *  - icuAvailability: up to 15 pts
 *  - emergencyDept: 10 pts if ED is available
 *  - distance: up to 10 pts (closer = higher, simulated)
 *
 * Returns [] if no suitable hospital is found.
 */
export function matchHospitals(emergency) {
  const hospitals = getHospitals();
  const required = emergency.requiredFacility;

  // Reference point for distance (fictional demo coordinates)
  const refLat = 28.6139;
  const refLng = 77.2090;

  const results = [];

  for (const h of hospitals) {
    // Exclude unavailable hospitals
    if (h.status === 'Unavailable') continue;

    // Must have the required facility
    const hasFacility = h.facilities.includes(required);
    if (!hasFacility) continue;

    // Must have at least one available bed
    if (h.availableBeds <= 0) continue;

    // Score calculation
    let score = 0;
    const reasons = [];

    // Facility match — 40 pts
    score += 40;
    reasons.push(`Has required facility: ${required} (+40)`);

    // Bed availability — up to 25 pts
    const bedScore = Math.min(25, Math.round((h.availableBeds / h.totalBeds) * 25));
    score += bedScore;
    reasons.push(`Bed availability: ${h.availableBeds}/${h.totalBeds} (+${bedScore})`);

    // ICU availability — up to 15 pts
    if (h.availableIcuBeds > 0) {
      const icuScore = Math.min(15, Math.round((h.availableIcuBeds / h.icuBeds) * 15));
      score += icuScore;
      reasons.push(`ICU beds available: ${h.availableIcuBeds}/${h.icuBeds} (+${icuScore})`);
    }

    // Emergency dept — 10 pts
    if (h.emergencyDeptAvailable) {
      score += 10;
      reasons.push('Emergency department available (+10)');
    }

    // Distance — up to 10 pts (simulated)
    const dist = haversineDistance(refLat, refLng, h.lat, h.lng);
    const distScore = Math.max(0, Math.round(10 - dist * 0.5));
    score += distScore;
    reasons.push(`Estimated distance: ${dist.toFixed(1)} km (+${distScore})`);

    results.push({
      hospital: h,
      score,
      distance: dist,
      reasons,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ========== DASHBOARD STATS ==========
export function getDashboardStats() {
  const emergencies = getEmergencies();
  const hospitals = getHospitals();
  const ambulances = getAmbulances();
  const transfers = getTransfers();

  const activeStatuses = ['New', 'Matching Hospital', 'Hospital Assigned', 'Ambulance Assigned', 'In Transit', 'Reached Hospital'];

  return {
    totalEmergencies: emergencies.length,
    activeEmergencies: emergencies.filter((e) => activeStatuses.includes(e.status)).length,
    hospitalsAvailable: hospitals.filter((h) => h.status === 'Available').length,
    totalBeds: hospitals.reduce((s, h) => s + h.availableBeds, 0),
    ambulancesOnDuty: ambulances.filter((a) => a.status !== 'Offline').length,
    activeTransfers: transfers.filter((t) => !['Completed', 'Rejected'].includes(t.status)).length,
    completedCases: emergencies.filter((e) => e.status === 'Completed').length,
    cancelledCases: emergencies.filter((e) => e.status === 'Cancelled').length,
  };
}
