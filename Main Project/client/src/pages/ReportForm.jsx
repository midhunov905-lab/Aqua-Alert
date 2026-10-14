import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, CheckCircle2, MapPin, Save, ShieldCheck, UploadCloud, X } from 'lucide-react';
import api, { getErrorMessage } from '../api.js';
import MapView from '../components/MapView.jsx';

const emptyForm = { title: '', issueType: 'Water Shortage', description: '', locationText: '', latitude: null, longitude: null };

export default function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!photo) { setPreviewUrl(null); return undefined; }
    const url = URL.createObjectURL(photo); setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!editing) return;
    api.get('/reports').then(({ data }) => {
      const report = data.reports.find((item) => String(item.id) === String(id));
      if (!report) { setError('We could not find that report in your account.'); return; }
      if (report.status !== 'New') { setError('This report can no longer be edited because it has left the New status.'); return; }
      setForm({ title: report.title, issueType: report.issueType, description: report.description, locationText: report.locationText, latitude: report.latitude, longitude: report.longitude });
      setExistingPhoto(report.photoUrl);
    }).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, [editing, id]);

  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setFieldErrors((current) => ({ ...current, [field]: undefined })); };
  const choosePhoto = (file) => {
    setError('');
    if (!file) { setPhoto(null); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Please choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Your photo must be 5 MB or smaller.'); return; }
    setPhoto(file);
  };

  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess(''); setFieldErrors({});
    if (form.latitude === null || form.longitude === null) { setError('Choose the issue location by clicking on the map.'); return; }
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== undefined) formData.append(key, String(value)); });
    if (photo) formData.append('photo', photo);
    setSubmitting(true);
    try {
      const response = editing ? await api.put(`/reports/${id}`, formData) : await api.post('/reports', formData);
      setSuccess(response.data.message || 'Report saved successfully.');
      navigate('/dashboard', { state: { flash: response.data.message || 'Your report has been saved.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this report.'));
      setFieldErrors(err?.response?.data?.errors || {});
    } finally { setSubmitting(false); }
  };

  if (loading) return <main className="page-main"><div className="container loading-state">Loading your report…</div></main>;
  const coordinateText = form.latitude === null ? 'No location selected yet' : `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`;
  return (
    <main className="page-main report-page">
      <section className="page-hero report-page-hero"><div className="container"><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Back to my reports</Link><div className="eyebrow"><span className="live-dot" /> COMMUNITY WATER WATCH</div><h1>{editing ? 'Update your ' : 'Make water issues '}<em>{editing ? 'report.' : 'visible.'}</em></h1><p>{editing ? 'Keep the details clear and accurate. You can edit a report while its status is New.' : 'Share what you observed. Clear details and a useful map location can help your community understand the issue.'}</p></div></section>
      <section className="container report-form-layout">
        <form className="report-form-card" onSubmit={submit}>
          <div className="form-card-header"><div><span className="overline">REPORT DETAILS</span><h2>What is happening?</h2></div><span className="required-note">* Required</span></div>
          {error && <div className="notice notice-error"><AlertTriangle size={17} /> <span>{error}</span></div>}
          {success && <div className="notice notice-success"><CheckCircle2 size={17} /> {success}</div>}
          <div className="form-stack">
            <label className="form-label">Report title <span className="required-star">*</span><input className={`text-input ${fieldErrors.title ? 'input-invalid' : ''}`} required minLength={5} maxLength={120} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. No water supply on Green Street" />{fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}</label>
            <label className="form-label">Issue type <span className="required-star">*</span><select className="text-input" value={form.issueType} onChange={(e) => update('issueType', e.target.value)}><option>Water Shortage</option><option>Contamination</option><option>Infrastructure Damage</option></select><span className="field-help">Choose the category that best describes the issue.</span></label>
            <label className="form-label">Description <span className="required-star">*</span><textarea className={`text-input text-area ${fieldErrors.description ? 'input-invalid' : ''}`} required minLength={20} maxLength={3000} rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What did you observe? When did it start? Is it affecting nearby households or a public water source?" />{fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}<span className="field-help">Include what you observed and when. Avoid sharing personal or sensitive information.</span></label>
            <div className="form-divider" />
            <div><span className="form-label form-label-block">Issue location <span className="required-star">*</span></span><p className="field-help field-help-top">Click on the map to place a pin. Then add a street, landmark, ward, or public facility name.</p></div>
            <label className="form-label">Location description <span className="required-star">*</span><input className={`text-input ${fieldErrors.locationText ? 'input-invalid' : ''}`} required minLength={3} maxLength={180} value={form.locationText} onChange={(e) => update('locationText', e.target.value)} placeholder="Ward / locality / nearest public landmark" />{fieldErrors.locationText && <span className="field-error">{fieldErrors.locationText}</span>}</label>
            <MapView selectedPosition={form.latitude === null ? null : { latitude: form.latitude, longitude: form.longitude }} onSelect={(coords) => { update('latitude', coords.latitude); update('longitude', coords.longitude); }} height="330px" zoom={5} />
            <div className={`coordinate-readout ${form.latitude !== null ? 'coordinate-readout-selected' : ''}`}><MapPin size={17} /><div><strong>{form.latitude === null ? 'Select a point on the map' : 'Location pin selected'}</strong><span>{coordinateText}</span></div>{form.latitude !== null && <CheckCircle2 size={17} />}</div>
            <div className="form-divider" />
            <div><span className="form-label form-label-block">Photo evidence <span className="optional-note">Optional</span></span><p className="field-help field-help-top">A photo can add context. JPG, PNG, or WebP, maximum 5 MB.</p></div>
            <label className="upload-zone">{previewUrl || existingPhoto ? <div className="photo-preview"><img src={previewUrl || existingPhoto} alt="Selected evidence preview" /><span><Camera size={16} /> {photo?.name || 'Existing evidence photo'}</span></div> : <><span className="upload-icon"><UploadCloud size={24} /></span><strong>Choose an image to upload</strong><span>or drag a photo into this area</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choosePhoto(e.target.files?.[0])} /><small>Only upload images you have permission to share.</small></label>
            {photo && <button className="remove-photo" type="button" onClick={() => setPhoto(null)}><X size={14} /> Remove selected photo</button>}
          </div>
          <div className="form-submit-row"><span><ShieldCheck size={16} /> Your account is attached to this report.</span><button type="submit" className="button button-primary" disabled={submitting}>{submitting ? 'Saving report…' : editing ? 'Save changes' : 'Submit report'} {editing ? <Save size={17} /> : <ArrowRight size={17} />}</button></div>
        </form>
        <aside className="report-aside"><div className="report-tip-card"><div className="tip-icon"><MapPin size={22} /></div><h3>A useful location helps.</h3><p>Place your pin near a public landmark or the affected water source. Please don't pin private homes unless it's essential and safe to do so.</p><div className="tip-map-mini"><MapPin size={21} /><span /><i /><b /></div></div><div className="report-process-card"><span className="overline">WHAT HAPPENS NEXT?</span><div className="process-step"><span>01</span><div><strong>Report received</strong><p>Your submission is stored for follow-up.</p></div></div><div className="process-step"><span>02</span><div><strong>Administrative review</strong><p>An administrator can review the details and change its status.</p></div></div><div className="process-step"><span>03</span><div><strong>Status tracked</strong><p>Check your dashboard for the latest status.</p></div></div></div><div className="report-disclaimer"><AlertTriangle size={17} /><p><strong>Urgent danger?</strong> AquaAlert is a reporting tool, not an emergency service. Contact the appropriate local authority directly for urgent health or safety risks.</p></div></aside>
      </section>
    </main>
  );
}
