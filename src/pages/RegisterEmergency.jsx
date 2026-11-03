import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { EMERGENCY_CATEGORIES, PRIORITY_LEVELS, MEDICAL_FACILITIES } from '../data/seedData';
import { addEmergency, generateEmergencyId } from '../data/store';
import { isValidPhone } from '../utils/helpers';
import { useToast } from '../components/ToastContext';

const initialForm = {
  patientName: '',
  contactNumber: '',
  age: '',
  category: '',
  priority: '',
  location: '',
  requiredFacility: '',
  notes: '',
};

export default function RegisterEmergency() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const navigate = useNavigate();
  const addToast = useToast();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.patientName.trim()) errs.patientName = 'Patient name is required';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (!isValidPhone(form.contactNumber)) errs.contactNumber = 'Enter a valid 10-digit phone number';
    if (!form.category) errs.category = 'Select an emergency category';
    if (!form.priority) errs.priority = 'Select a priority level';
    if (!form.location.trim()) errs.location = 'Current location is required';
    if (!form.requiredFacility) errs.requiredFacility = 'Select a required medical facility';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const id = generateEmergencyId();
    const emergency = {
      id,
      patientName: form.patientName.trim(),
      contactNumber: form.contactNumber.trim(),
      age: form.age ? parseInt(form.age, 10) : null,
      category: form.category,
      priority: form.priority,
      location: form.location.trim(),
      requiredFacility: form.requiredFacility,
      notes: form.notes.trim() || 'No additional notes. Demo case.',
      status: 'New',
      assignedHospital: null,
      assignedAmbulance: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addEmergency(emergency);
    setCreatedId(id);
    setSubmitted(true);
    addToast('Emergency registered successfully!', 'success');
  };

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <div className="breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
            <span className="sep">/</span>
            <span>Register Emergency</span>
          </div>
          <h1>Emergency Registered</h1>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="success-screen">
              <div className="checkmark">
                <CheckCircle size={40} />
              </div>
              <h2>Emergency Case Created Successfully</h2>
              <p>The emergency has been registered and assigned a unique ID. Coordinators can now proceed to find a suitable hospital and assign resources.</p>
              <div className="emergency-id">{createdId}</div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/emergencies/${createdId}`)}>
                  Open Case Details <ArrowRight size={18} />
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/emergencies')}>
                  View All Cases
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => { setSubmitted(false); setForm(initialForm); setErrors({}); }}>
                  Register Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
          <span className="sep">/</span>
          <span>Register Emergency</span>
        </div>
        <h1>Register New Emergency</h1>
        <p>Fill in the details below to create a new emergency case. All fields marked with * are required.</p>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilePlus size={20} />
            Emergency Registration Form
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient Name <span className="required">*</span></label>
                <input
                  className={`form-input ${errors.patientName ? 'error' : ''}`}
                  placeholder="Enter patient full name"
                  value={form.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                />
                {errors.patientName && <div className="form-error">{errors.patientName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number <span className="required">*</span></label>
                <input
                  className={`form-input ${errors.contactNumber ? 'error' : ''}`}
                  placeholder="+91 XXXXX XXXXX"
                  value={form.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                />
                {errors.contactNumber && <div className="form-error">{errors.contactNumber}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age (optional)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="150"
                  placeholder="Patient age"
                  value={form.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Category <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.category ? 'error' : ''}`}
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  {EMERGENCY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority Level <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.priority ? 'error' : ''}`}
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="">Select priority</option>
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.priority && <div className="form-error">{errors.priority}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Required Medical Facility <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.requiredFacility ? 'error' : ''}`}
                  value={form.requiredFacility}
                  onChange={(e) => handleChange('requiredFacility', e.target.value)}
                >
                  <option value="">Select facility</option>
                  {MEDICAL_FACILITIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                {errors.requiredFacility && <div className="form-error">{errors.requiredFacility}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Current Location <span className="required">*</span></label>
              <input
                className={`form-input ${errors.location ? 'error' : ''}`}
                placeholder="e.g., MG Road near Central Park"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
              {errors.location && <div className="form-error">{errors.location}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Any additional information about the emergency…"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', paddingTop: 'var(--space-md)' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setForm(initialForm); setErrors({}); }}>
                Reset Form
              </button>
              <button type="submit" className="btn btn-danger btn-lg">
                <AlertTriangle size={18} />
                Register Emergency
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
